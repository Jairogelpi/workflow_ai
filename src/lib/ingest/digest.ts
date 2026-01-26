'use server';

import { createClient } from '../supabase-server';
import { v4 as uuidv4 } from 'uuid';
import {
    extractTextFromDocx,
    extractTextFromXlsx,
    extractTextFromGeneric,
    processHeavyFile
} from './parsers';
import { chunkText } from './chunking';
import { generateEmbedding, saveNodeEmbedding } from './vectorizer';

/**
 * Phase 2: Digestion (Chunking & Vectorization)
 * Heavy dependencies (parsers, vectorizer) loaded here.
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
