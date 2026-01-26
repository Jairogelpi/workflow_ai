/**
 * THE OMNI-INGESTOR WORKER
 * --------------------------
 * Runs in the background (e.g. via `ts-node` or Docker).
 * Polls Supabase for 'pending' ingestion jobs and processes them.
 * 
 * Usage: npx ts-node src/workers/ingestion_worker.ts
 */

import { createClient } from '@supabase/supabase-js';
import { digestFile } from '../lib/ingest'; // We reuse the core logic
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Worker needs SERVICE_ROLE key to bypass RLS for processing all jobs
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseServiceKey) {
    console.error("❌ CRITICAL: SUPABASE_SERVICE_ROLE_KEY is required for the worker.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function workLoop() {
    console.log("[Worker] 🚜 Omni-Ingestor Online. Polling queue...");

    while (true) {
        try {
            // 1. Fetch next job (FIFO)
            const { data: jobs, error } = await supabase
                .from('ingestion_jobs')
                .select('*')
                .eq('status', 'pending')
                .order('created_at', { ascending: true })
                .limit(1);

            if (error) throw error;

            if (jobs && jobs.length > 0) {
                const job = jobs[0];
                console.log(`[Worker] 📥 Processing Job ${job.id} (Project: ${job.project_id})`);

                // 2. Lock Job
                await supabase.from('ingestion_jobs').update({
                    status: 'processing',
                    started_at: new Date().toISOString(),
                    attempts: job.attempts + 1
                }).eq('id', job.id);

                // 3. Process
                // We need to fetch the file from Storage to process it.
                // The `digestFile` function expects a File/Blob object usually.
                // We might need to modify digestFile to accept a 'nodeId' and fetch content itself,
                // OR we download it here.

                // For this implementation, we assume `digestFile` can handle the heavy lifting
                // But wait, `digestFile` in previous turns accepts (nodeId, file, projectId, jobId).
                // We need to DOWNLOAD the file content from Supabase Storage first.

                // Fetch Source Node to get storage path
                const { data: node } = await supabase.from('work_nodes').select('metadata').eq('id', job.node_id).single();
                const storagePath = node?.metadata?.storage_path;

                if (!storagePath) throw new Error("Source node missing storage path");

                const { data: fileData, error: downloadError } = await supabase.storage.from('artifacts').download(storagePath);

                if (downloadError) throw downloadError;

                // Mock a File object (Node.js doesn't have File native in all versions, using Blob)
                const fileBlob = new Blob([fileData], { type: node.metadata.mimeType || 'application/octet-stream' });
                // We fake the 'name' property
                (fileBlob as any).name = node.metadata.source_title;

                await digestFile(job.node_id, fileBlob as any, job.project_id, job.id);

                console.log(`[Worker] ✅ Job ${job.id} Completed.`);
            } else {
                // Sleep if empty
                await new Promise(r => setTimeout(r, 5000));
            }

        } catch (err) {
            console.error("[Worker] ⚠️ Error in loop:", err);
            await new Promise(r => setTimeout(r, 5000));
        }
    }
}

// Start
workLoop().catch(e => console.error("Worker died:", e));
