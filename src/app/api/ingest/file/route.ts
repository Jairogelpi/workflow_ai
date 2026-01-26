import { NextRequest, NextResponse, after } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { uploadFile, digestFile } from '@/lib/ingest';

/**
 * File Ingestion Endpoint
 * Receives files from browser extension and processes them
 */
export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const platform = formData.get('platform') as string;

        if (!file) {
            return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
        }

        const supabase = await createClient();

        // 1. Verify Authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const projectId = formData.get('projectId') as string;

        if (!projectId) {
            return NextResponse.json({ success: false, error: 'Target Project ID is required' }, { status: 400 });
        }

        console.log(`[API] Ingesting file from ${platform}: ${file.name} (${file.size} bytes)`);

        // 2. Upload to storage (Synchronous phase - fast)
        const uploadResult = await uploadFile(file, file.name, projectId);

        if (!uploadResult.success) {
            throw new Error('Upload failed');
        }

        // 3. Create Ingestion Job for Asynchronous Processing
        const { data: job, error: jobError } = await supabase
            .from('ingestion_jobs')
            .insert({
                project_id: projectId,
                node_id: uploadResult.nodeId,
                status: 'pending'
            })
            .select()
            .single();

        if (jobError) throw new Error(`Job creation failed: ${jobError.message}`);

        // 4. Trigger digestion in background (Don't await to avoid timeout)
        // [Next.js 15] Use 'after' to ensure background tasks complete without blocking response
        after(async () => {
            try {
                await digestFile(uploadResult.nodeId, file, projectId, job.id);
            } catch (err) {
                console.error('[API Background] Digestion failed:', err);
            }
        });

        return NextResponse.json({
            success: true,
            jobId: job.id,
            nodeId: uploadResult.nodeId,
            status: 'ACCEPTED',
            message: 'File upload successful. Processing started in background.'
        }, { status: 202 });

    } catch (error: any) {
        console.error('[API File Ingest] Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || String(error)
        }, { status: 500 });
    }
}

// OPTIONS for CORS (necessary for browser extension)
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}
