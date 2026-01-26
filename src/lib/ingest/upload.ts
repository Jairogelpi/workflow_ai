'use server';

import { createClient } from '../supabase-server';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import zlib from 'zlib';
import { promisify } from 'util';

const gzip = promisify(zlib.gzip);

/**
 * Phase 1: Upload (Lossless Storage)
 * Zero dependencies on parsing libraries.
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
