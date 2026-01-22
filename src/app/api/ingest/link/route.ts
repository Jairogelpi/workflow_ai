import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { generateEmbedding, saveNodeEmbedding } from '@/lib/ingest/vectorizer';
import { chunkText } from '@/lib/ingest/chunking';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

// Validation Schema
const IngestSchema = z.object({
    url: z.string().url(),
    title: z.string(),
    content: z.string(),      // Plain text for vectorization
    html: z.string().optional(), // Sanitized HTML for rendering
    images: z.array(z.string()).optional(),
    projectId: z.string().uuid().default('00000000-0000-0000-0000-000000000000')
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const validated = IngestSchema.parse(body);
        const { url, title, content, html, images, projectId } = validated;

        const supabase = await createClient();

        // 1. Verify Authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const nodeId = uuidv4();
        const now = new Date().toISOString();

        // 2. Create the Source Node
        // RLS will check if project_id belongs to the 'user'
        const { error: nodeError } = await supabase

            .from('work_nodes')
            .insert({
                id: nodeId,
                project_id: projectId,
                type: 'source',
                content: {
                    id: nodeId,
                    type: 'source',
                    title: title,
                    url: url,
                    text_preview: content.substring(0, 500),
                    images: images || []
                },
                metadata: {
                    source_url: url,
                    ingested_at: now,
                    origin: 'ai_generated',
                    browser_captured: true
                }
            });

        if (nodeError) throw nodeError;

        // 2. Materialize Content (Save full text/html to storage if needed, or metadata)
        // For now, we'll rely on the 'content' JSON and trigger vectorization

        // 3. Vectorization & Chunking (Neural Connection)
        // We apply the same logic as the file ingestor for deep searchability
        if (content && content.length > 200) {
            const chunks = chunkText(content);
            if (chunks && chunks.length > 0) {
                for (const chunk of chunks) {
                    if (!chunk) continue;
                    const excerptId = uuidv4();

                    await supabase.from('work_nodes').insert({
                        id: excerptId,
                        project_id: projectId,
                        type: 'excerpt',
                        content: { id: excerptId, type: 'excerpt', content: chunk, parent_id: nodeId, index: chunks.indexOf(chunk) },
                        metadata: { source_id: nodeId, created_at: now, origin: 'ai_generated' as const },
                        updated_at: now
                    });

                    await supabase.from('work_edges').insert({
                        source_node_id: excerptId,
                        target_node_id: nodeId,
                        relation: 'part_of',
                        project_id: projectId
                    });

                    const embedding = await generateEmbedding(chunk);
                    await saveNodeEmbedding(excerptId, embedding);
                }
            }
        }

        return NextResponse.json({
            success: true,
            nodeId: nodeId,
            message: 'Knowledge materialized and vectorized successfully.'
        });

    } catch (error: any) {
        console.error('[API Ingest] Error:', error);
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
            'Access-Control-Allow-Origin': '*', // In production, restrict this to specific origins if possible
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
