'use server';

import { createClient } from '../../lib/supabase';
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
    projectId: string = '00000000-0000-0000-0000-000000000000'
) {
    const supabase = createClient();
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
    projectId: string = '00000000-0000-0000-0000-000000000000'
) {
    const supabase = createClient();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const now = new Date().toISOString();
    const fileName = (file as any).name || 'artifact';

    // 1. Extract
    let extractedContent = '';
    const mimeType = file.type || 'application/octet-stream';

    try {
        if (mimeType === 'application/pdf') {
            extractedContent = await extractTextFromPDF(buffer);
        } else if (mimeType.includes('word')) {
            extractedContent = await extractTextFromDocx(buffer);
        } else if (mimeType.includes('sheet')) {
            extractedContent = await extractTextFromXlsx(buffer);
        } else {
            extractedContent = await extractTextFromGeneric(buffer);
        }
    } catch (e) {
        extractedContent = `[Extraction Failed for ${fileName}]`;
    }

    // 2. Chunk & Vectorize
    if (extractedContent && extractedContent.length > 500) {
        const chunks = chunkText(extractedContent);
        if (!chunks) return { success: true, processed: false };

        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            if (typeof chunk !== 'string') continue;

            const excerptId = uuidv4();

            await supabase.from('work_nodes').upsert({
                id: excerptId,
                project_id: projectId,
                type: 'excerpt',
                content: { id: excerptId, type: 'excerpt', content: chunk, parent_id: nodeId, index: i },
                metadata: { source_id: nodeId, created_at: now, updated_at: now, origin: 'ai_generated' as const },
                updated_at: now
            });

            await supabase.from('work_edges').upsert({
                source_node_id: excerptId,
                target_node_id: nodeId,
                relation: 'part_of',
                project_id: projectId
            });

            const embedding = await generateEmbedding(chunk);
            await saveNodeEmbedding(excerptId, embedding);
        }
    }

    return { success: true, chunks: (extractedContent.length > 500) ? 1 : 0 };
}
