import { NextRequest, NextResponse } from 'next/server';
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

        const projectId = '00000000-0000-0000-0000-000000000000'; // Default project

        console.log(`[API] Ingesting file from ${platform}: ${file.name} (${file.size} bytes)`);

        // 2. Upload to storage
        const uploadResult = await uploadFile(file, file.name, projectId);

        if (!uploadResult.success) {
            throw new Error('Upload failed');
        }

        // 3. Trigger digestion (chunking + vectorization)
        await digestFile(uploadResult.nodeId, file, projectId);

        return NextResponse.json({
            success: true,
            nodeId: uploadResult.nodeId,
            fileName: file.name,
            message: 'File ingested successfully'
        });

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
