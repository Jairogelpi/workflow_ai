import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { v4 as uuidv4 } from 'uuid';
import { createVersion } from '@/kernel/versioning';

/**
 * Quick Node Creation Endpoint
 * For rapid node creation from dropped text or lightweight captures
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { content, source_url, type = 'note', title } = body;

        if (!content || typeof content !== 'string') {
            return NextResponse.json({ success: false, error: 'Content is required' }, { status: 400 });
        }

        const supabase = await createClient();

        // Verify Authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const projectId = body.projectId;
        if (!projectId) {
            return NextResponse.json({ success: false, error: 'Project ID is required' }, { status: 400 });
        }
        const nodeId = uuidv4();
        const now = new Date().toISOString();

        // Create node based on type
        let nodeData: any = {
            id: nodeId,
            project_id: projectId,
            type,
            metadata: {
                created_at: now,
                updated_at: now,
                origin: 'human',
                confidence: 1.0,
                validated: false,
                pin: false,
                version_hash: '',
                source: source_url,
            }
        };

        // Type-specific content
        if (type === 'note') {
            nodeData.content = { id: nodeId, type: 'note', content };
        } else if (type === 'idea') {
            nodeData.content = { id: nodeId, type: 'idea', summary: title || content.substring(0, 100), details: content };
        } else if (type === 'excerpt') {
            nodeData.content = { id: nodeId, type: 'excerpt', content, parent_id: null, index: 0 };
        }

        // Apply versioning
        nodeData.metadata = createVersion(nodeData);

        // Insert node
        const { error: insertError } = await supabase
            .from('work_nodes')
            .insert(nodeData);

        if (insertError) throw insertError;

        console.log(`[API Quick Node] Created ${type} node from drop:`, nodeId);

        return NextResponse.json({
            success: true,
            nodeId,
            type,
            message: 'Node created successfully'
        });

    } catch (error: any) {
        console.error('[API Quick Node] Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || String(error)
        }, { status: 500 });
    }
}
