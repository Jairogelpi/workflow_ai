import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { retrieveContext } from '@/kernel/digest_engine'; // Using Kernel
import { EmbeddingService } from '@/kernel/memory/embeddings';
import { supabase } from '@/lib/supabase';

/**
 * [PHASE 3] Active Recall API
 * Allows the extension to ask: "What do we know about this text?"
 */
export async function POST(req: NextRequest) {
    try {
        const { query, projectId } = await req.json();

        // 1. Vector Search for related nodes
        const embedding = await EmbeddingService.embed(query);

        // Use RPC to match nodes (Direct Vector Search)
        const { data: nodes, error } = await supabase.rpc('match_nodes', {
            query_embedding: embedding,
            match_threshold: 0.5,
            match_count: 5,
            filter_project_id: projectId
        });

        if (error) throw error;

        // 2. Format for Extension
        const recallData = (nodes || []).map((n: any) => ({
            id: n.id,
            content: n.content, // Text or JSON
            similarity: n.similarity,
            type: n.type
        }));

        return NextResponse.json({ success: true, nodes: recallData });

    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
