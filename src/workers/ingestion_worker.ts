/**
 * THE OMNI-INGESTOR WORKER
 * --------------------------
 * Runs in the background (e.g. via `ts-node` or Docker).
 * Polls Supabase for 'pending' ingestion jobs and processes them.
 * 
 * Usage: npx ts-node src/workers/ingestion_worker.ts
 */

import { createClient } from '@supabase/supabase-js';
import { digestFile } from '../lib/ingest/digest'; // Heavy lifting module

// [Type Definitions]
interface IngestionJob {
    id: string;
    project_id: string;
    node_id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    attempts: number;
    created_at: string;
    started_at?: string;
    metadata?: any;
}

interface WorkNode {
    id: string;
    metadata: {
        storage_path?: string;
        mimeType?: string;
        source_title?: string;
        [key: string]: any;
    };
}

// Environment State
let config: {
    NEXT_PUBLIC_SUPABASE_URL: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
} | null = null;

let supabase: ReturnType<typeof createClient> | null = null;

// [Universal] Init Logic
const init = async (cfg: typeof config) => {
    if (!cfg?.NEXT_PUBLIC_SUPABASE_URL || !cfg?.SUPABASE_SERVICE_ROLE_KEY) {
        console.error("❌ Worker Missing Config:", cfg);
        return;
    }
    config = cfg;
    supabase = createClient(config.NEXT_PUBLIC_SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);
    console.log("[Worker] 🚀 Initialized with config.");
    workLoop().catch(e => console.error("Worker died:", e));
};

// [Node.js Support] Auto-load .env if running standalone
if (typeof process !== 'undefined' && !self.name) {
    // Check if we are in a Node environment (not browser worker)
    if (typeof window === 'undefined') {
        // Dynamic import to avoid bundling dotenv in browser
        // @ts-ignore
        import('dotenv').then(dotenv => {
            dotenv.config({ path: '.env.local' });

            if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
                init({
                    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
                    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
                });
            }
        }).catch(err => console.warn("[Worker] Could not load dotenv (expected in browser)", err));
    }
}

// [Browser/Worker Support] Listen for Config Injection
self.onmessage = (e: MessageEvent) => {
    if (e.data.type === 'INIT_WORKER') {
        init(e.data.config);
    }
};


// [Metadata Cache]
const metaCache = new Map<string, any>();
const getCachedNode = async (id: string) => {
    if (metaCache.has(id)) return metaCache.get(id);
    const { data } = await supabase!
        .from('work_nodes')
        .select('metadata')
        .eq('id', id)
        .single();
    if (data) metaCache.set(id, data);
    return data;
};

async function workLoop() {
    console.log("[Worker] 🚜 Omni-Ingestor Online. Polling queue...");

    while (true) {
        if (!supabase) {
            // Wait for init
            await new Promise(r => setTimeout(r, 1000));
            continue;
        }

        try {
            // 1. Fetch next job (FIFO)
            const { data: jobs, error } = await supabase
                .from('ingestion_jobs')
                .select('*')
                .eq('status', 'pending')
                .order('created_at', { ascending: true })
                .limit(5)
                .returns<IngestionJob[]>();

            if (error) throw error;

            if (jobs && jobs.length > 0) {
                console.log(`[Worker] 🏎️ Processing ${jobs.length} jobs concurrently.`);

                // 2. Batch Lock Jobs
                const jobIds = jobs.map(j => j.id);
                await (supabase!.from('ingestion_jobs') as any).update({
                    status: 'processing',
                    started_at: new Date().toISOString()
                }).in('id', jobIds);

                await Promise.allSettled(jobs.map(async (job) => {
                    try {
                        // 3. Process
                        const node = await getCachedNode(job.node_id) as WorkNode | null;

                        if (!node) throw new Error("Source node not found");
                        const storagePath = node.metadata?.storage_path;
                        if (!storagePath) throw new Error("Source node missing storage path");

                        const { data: fileData, error: downloadError } = await supabase!.storage.from('artifacts').download(storagePath);
                        if (downloadError) throw downloadError;

                        const fileBlob = new Blob([fileData], { type: node.metadata?.mimeType || 'application/octet-stream' });
                        (fileBlob as any).name = node.metadata?.source_title || 'production_artifact';

                        if ((job as any).type === 'digest_branch') {
                            const { processHierarchicalDigest } = await import('../kernel/digest_engine');
                            await processHierarchicalDigest(job.id, job.node_id, job.project_id);
                        } else {
                            await digestFile(job.node_id, fileBlob as any, job.project_id, job.id);
                        }

                        console.log(`[Worker] ✅ Job ${job.id} Completed.`);
                    } catch (jobErr) {
                        console.error(`[Worker] ❌ Failed Job ${job.id}:`, jobErr);
                        await (supabase!.from('ingestion_jobs') as any).update({
                            status: 'failed',
                            metadata: { error: String(jobErr) }
                        }).eq('id', job.id);
                    }
                }));
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
