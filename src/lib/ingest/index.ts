'use server';

import { createClient } from '../supabase-server';
import { v4 as uuidv4 } from 'uuid';
import {
    extractTextFromPDF,
    extractTextFromDocx,
    extractTextFromXlsx,
    extractTextFromGeneric
} from './parsers';
import { chunkText } from './chunking';
import { generateEmbedding, saveNodeEmbedding } from './vectorizer';
import crypto from 'crypto';
import zlib from 'zlib';
import { promisify } from 'util';
import { processHeavyFile } from './parsers';

const gzip = promisify(zlib.gzip);

/**
 * Ingest Service (Omni-Ingestor Core)
 * Handles the end-to-end ingestion flow from binary to WorkNode.
 */

/**
 * Phase 1: Upload (Lossless Storage)
 */
export async function uploadFile(
    file: File | Blob,
    fileName: string,
    projectId: string
) {
    const supabase = await createClient();
    const nodeId = uuidv4();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const now = new Date().toISOString();

    // 1. Optimization: Calculate Hash & Compress
    const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');
    const compressedBuffer = buffer.length > 1024 ? await gzip(buffer) : buffer;
    const isCompressed = buffer.length > 1024;
    const mimeType = file.type || 'application/octet-stream';

    // 2. Check for Deduplication
    const { data: existingNode } = await supabase
        .from('work_nodes')
        .select('content, id')
        .eq('project_id', projectId)
        .filter('metadata->>file_hash', 'eq', fileHash)
        .maybeSingle();

    if (existingNode) {
        return { success: true, nodeId: existingNode.id, fileName, deduplicated: true };
    }

    // 3. Upload to The Vault
    const storagePath = `${projectId}/${nodeId}-${fileName}${isCompressed ? '.gz' : ''}`;
    const { error: storageError } = await supabase.storage
        .from('artifacts')
        .upload(storagePath, compressedBuffer, {
            contentType: isCompressed ? 'application/gzip' : mimeType,
            upsert: true
        });

    if (storageError) throw new Error(`Vault Error: ${storageError.message}`);

    // 4. Create Source Node (Lossless Record)
    const metadata = {
        created_at: now,
        updated_at: now,
        accessed_at: now,
        origin: 'human' as const,
        source: 'upload',
        source_title: fileName,
        file_hash: fileHash,
        is_compressed: isCompressed,
        storage_path: storagePath,
        original_size: buffer.length
    };

    const dbRecord = {
        id: nodeId,
        project_id: projectId,
        type: 'source',
        content: { id: nodeId, type: 'source', name: fileName, uri: storagePath },
        metadata,
        updated_at: now
    };

    await supabase.from('work_nodes').upsert(dbRecord);

    return { success: true, nodeId, fileName, deduplicated: false };
}

/**
 * Phase 2: Digestion (Chunking & Vectorization)
 */
export async function digestFile(
    nodeId: string,
    file: File | Blob,
    projectId: string,
    jobId?: string
) {
    const supabase = await createClient();

    const fileName = (file as any).name || 'artifact';
    let effectiveJobId = jobId;

    // 1. Military Grade Logic: Ensure Job Existence
    if (!effectiveJobId) {
        const { data: job } = await supabase.from('ingestion_jobs').insert({
            project_id: projectId,
            node_id: nodeId,
            status: 'processing',
            metadata: { source_title: fileName },
            progress: 0.0
        }).select().single();
        if (job) effectiveJobId = job.id;
    } else {
        await supabase.from('ingestion_jobs').update({ status: 'processing', updated_at: new Date().toISOString() }).eq('id', effectiveJobId);
    }
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const now = new Date().toISOString();

    // 1. Determine local vs heavy (Rust)
    let extractedChunks: string[] = [];
    const mimeType = file.type || 'application/octet-stream';
    const isHeavy = (file.size > 1024 * 1024) || mimeType === 'application/pdf'; // >1MB or PDF

    try {
        if (isHeavy) {
            const heavyResult = await processHeavyFile(buffer, mimeType === 'application/pdf' ? 'pdf' : 'html' as any);
            extractedChunks = heavyResult.map(r => r.data.content);
        } else {
            let text = '';
            if (mimeType.includes('word')) text = await extractTextFromDocx(buffer);
            else if (mimeType.includes('sheet')) text = await extractTextFromXlsx(buffer);
            else text = await extractTextFromGeneric(buffer);

            extractedChunks = chunkText(text) || [];
        }
    } catch (e) {
        console.error('[Digestion] Extraction failed:', e);
        if (effectiveJobId) await supabase.from('ingestion_jobs').update({ status: 'failed', error_message: 'Extraction failed' }).eq('id', effectiveJobId);
        return { success: false, error: 'Extraction failed' };
    }

    // 2. Bulk Persistence (Solve N+1)
    if (extractedChunks.length > 0) {
        const nodesToUpsert: any[] = [];
        const edgesToUpsert: any[] = [];

        extractedChunks.forEach((chunk, i) => {
            const excerptId = uuidv4();
            nodesToUpsert.push({
                id: excerptId,
                project_id: projectId,
                type: 'excerpt',
                content: { id: excerptId, type: 'excerpt', content: chunk, parent_id: nodeId, index: i },
                metadata: { source_id: nodeId, created_at: now, updated_at: now, origin: 'ai_generated' as const },
                updated_at: now
            });

            edgesToUpsert.push({
                source_node_id: excerptId,
                target_node_id: nodeId,
                relation: 'part_of',
                project_id: projectId
            });
        });

        // Parallel Bulk Upsert
        await Promise.all([
            supabase.from('work_nodes').upsert(nodesToUpsert),
            supabase.from('work_edges').upsert(edgesToUpsert)
        ]);

        // 3. Batched Vectorization (Prevent Timeouts & Track Progress)
        const BATCH_SIZE = 20;
        for (let i = 0; i < nodesToUpsert.length; i += BATCH_SIZE) {
            const batchNodes = nodesToUpsert.slice(i, i + BATCH_SIZE);
            const batchChunks = extractedChunks.slice(i, i + BATCH_SIZE);

            try {
                const embeddings = await generateEmbedding(batchChunks);
                await saveNodeEmbedding(batchNodes.map(n => n.id), embeddings);

                // Update progress in job (Military Grade: Using dedicated column)
                if (effectiveJobId) {
                    const progress = (i + batchNodes.length) / nodesToUpsert.length;
                    await supabase.from('ingestion_jobs').update({
                        progress,
                        updated_at: new Date().toISOString()
                    }).eq('id', effectiveJobId);
                }
            } catch (err) {
                console.error(`[Digestion] Vectorization failed at batch ${i}:`, err);
                // We don't fail the whole job if some chunks are missing embeddings,
                // but we log it. In a stricter system, we might want to retry.
            }
        }
    }

    if (effectiveJobId) {
        await supabase.from('ingestion_jobs').update({ status: 'completed', updated_at: new Date().toISOString() }).eq('id', effectiveJobId);
    }

    return { success: true, chunks: extractedChunks.length };
}
