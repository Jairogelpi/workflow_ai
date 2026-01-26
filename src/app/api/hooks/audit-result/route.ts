import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase-server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { node_id, project_id, audit } = body;

        if (!node_id || !project_id || !audit) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        const supabase = await createClient();

        // 1. Fetch current node for metadata reference
        const { data: node, error: fetchError } = await supabase
            .from('work_nodes')
            .select('metadata')
            .eq('id', node_id)
            .single();

        if (fetchError || !node) {
            console.error('[AuditThreshold] Node not found:', node_id);
            return NextResponse.json({ error: 'Node not found' }, { status: 404 });
        }

        // 2. Fusion audit into original node metadata
        const updatedMetadata = {
            ...node.metadata,
            audit: audit,
            updated_at: new Date().toISOString()
        };

        await supabase
            .from('work_nodes')
            .update({ metadata: updatedMetadata })
            .eq('id', node_id);

        // 3. GOD MODE: Active Self-Healing
        // If the sycophancy_score is critical (> 0.85), automatically create a correction
        let healed = false;
        if (audit.sycophancy_score > 0.85) {
            console.log(`[AuditShadow] CRITICAL SYCOPHANCY DETECTED (${audit.sycophancy_score}). Triggering Self-Healing...`);

            // I. Insert Correction Node
            const { data: correctionNode, error: nodeError } = await supabase
                .from('work_nodes')
                .insert({
                    project_id,
                    type: 'evidence', // Axiomatic Green in UI
                    content: {
                        content: `⚠️ AUTO-CORRECCIÓN: ${audit.antithesis}`,
                        rationale: 'Generado automáticamente por el protocolo Abogado del Diablo tras detectar complacencia crítica.'
                    },
                    origin: 'ai_generated',
                    confidence: 1.0,
                    metadata: {
                        system_auto_heal: true,
                        refers_to: node_id,
                        audit_source: audit.model_auditor,
                        pin: true
                    }
                })
                .select()
                .single();

            if (correctionNode && !nodeError) {
                // II. Insert Contradicts Edge (Triggers physical tension)
                await supabase
                    .from('work_edges')
                    .insert({
                        project_id,
                        source_node_id: correctionNode.id,
                        target_node_id: node_id,
                        relation: 'contradicts',
                        metadata: { automated_correction: true }
                    });

                healed = true;
                console.log(`[AuditShadow] Self-Healing complete for node ${node_id}. Correction: ${correctionNode.id}`);
            }
        }

        return NextResponse.json({ success: true, healed });

    } catch (err) {
        console.error('[AuditWebhook] Critical Error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
