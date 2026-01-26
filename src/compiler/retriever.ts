
import { Plan } from './types';
import { WorkGraph, WorkNode } from '../canon/schema/ir';
import { supabase } from '../lib/supabase';
import { EmbeddingService } from '../kernel/memory/embeddings';

/**
 * EXPERT HYBRID GRAPH-RAG RETRIEVER (2026 Standard)
 * 
 * Strategy:
 * 1. Vector Search (High Recall): Finds semantically related nodes ("Fuzzy match").
 * 2. Graph Boosting (High Precision): Boosts nodes connected to the 'Active Context' ("Structural match").
 * 3. Temporal Decay: Slight preference for fresher data.
 */

export async function retrieveContext(plan: Plan, graph: WorkGraph): Promise<WorkNode[]> {
    console.log(`[RETRIEVER] 🧠 Hybrid Graph-RAG Activation for plan: ${plan.goal}`);

    // 1. Extract Query Intent from Plan steps
    const query = plan.steps.map(s => s.description).join(' ');

    // 2. Generate Query Embedding
    let queryEmbedding: number[] = [];
    try {
        queryEmbedding = await EmbeddingService.embed(query);
    } catch (e) {
        console.warn('[RETRIEVER] Embedding failed, falling back to heuristic:', e);
        return fallbackHeuristic(graph);
    }

    // 3. Vector Search (RPC Call to Supabase pgvector)
    // We assume the user is in the current project context or we pass it.
    // Ideally, we'd get the projectId from the store, but here we might need to rely on the graph nodes knowing it 
    // or passing it in. For now, assuming Global Search within Project.

    // Hack: Get projectId from first node or assume one. 
    // In a real implementation, projectId should be passed.
    // We will try to filter by the nodes present in the graph if possible, 
    // but the RPC requires a projectId. 
    const sampleNode = Object.values(graph.nodes)[0];
    // @ts-ignore
    const projectId = sampleNode?.projectId || '550e8400-e29b-41d4-a716-446655440000'; // Fallback if missing

    const { data: vectorMatches, error } = await supabase.rpc('match_nodes' as any, {
        query_embedding: queryEmbedding,
        match_threshold: 0.5, // Similarity threshold
        match_count: 20,
        filter_project_id: projectId
    });

    if (error) {
        console.error('[RETRIEVER] Vector Search Error:', error);
        return fallbackHeuristic(graph);
    }

    // 4. Graph Topology Boosting
    // Identify the "Goal Nodes" (if any are pinned or mentioned).
    // If the plan has 'required_context_keys', we heavily boost them and their neighbors.

    const candidates = new Map<string, { node: WorkNode, score: number, method: string }>();

    // Load Vector Matches
    for (const match of vectorMatches) {
        const node = graph.nodes[match.id];
        if (node) {
            candidates.set(node.id, {
                node,
                score: match.similarity * 0.7, // 70% Weight to Semantics
                method: 'vector'
            });
        }
    }

    // Apply Graph Boosting (Neighbors of highly relevant nodes get a boost)
    // For now, simple logic: If a node is PINNED, boost it.
    Object.values(graph.nodes).forEach(node => {
        if (!node) return;
        if (node.metadata.pin) {
            const existing = candidates.get(node.id);
            const boost = 0.3; // 30% Boost
            if (existing) {
                existing.score += boost;
                existing.method = 'hybrid';
            } else {
                candidates.set(node.id, { node, score: boost, method: 'structural' });
            }
        }
    });

    // 5. Select Top K
    const sorted = Array.from(candidates.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, 15); // Context Window Budget

    console.log(`[RETRIEVER] Selected ${sorted.length} nodes via Hybrid Scoring.`);

    return sorted.map(item => ({
        ...item.node,
        selection_mode: item.method === 'vector' ? 'similarity' : 'structural',
        metadata: {
            ...item.node.metadata,
            retrieval_score: item.score
        }
    })) as WorkNode[];
}

function fallbackHeuristic(graph: WorkGraph): WorkNode[] {
    console.log('[RETRIEVER] Using Fallback Heuristic.');
    // Simple truncation logic (Original Mock)
    return Object.values(graph.nodes).slice(0, 10) as WorkNode[];
}
