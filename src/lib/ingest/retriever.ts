/**
 * Retrieval Engine: Secure Vector Search
 * Precision retrieval with multi-tenant isolation for the WorkGraph OS.
 */

import { createClient } from '../supabase';
import { generateEmbedding } from './vectorizer';

interface SearchResult {
    id: string;
    project_id: string;
    content: any;
    type: string;
    similarity: number;
    owner_id: string;
}

/**
 * Performs a semantic search within a specific project.
 * Uses the RPC function 'match_node_embeddings' to ensure 
 * hard isolation at the database level.
 */
export async function secureSearch(
    query: string,
    projectId: string,
    matchThreshold: number = 0.5,
    matchCount: number = 10
): Promise<SearchResult[]> {
    const supabase = await createClient();

    // 1. Generate Query Vector
    const queryEmbedding = await generateEmbedding(query);

    // 2. Execute RPC with strict Project ID filter
    // This is the 'Perfect 2026' pattern: RLS + Manual Filter Join
    const { data, error } = await supabase.rpc('match_node_embeddings', {
        query_embedding: queryEmbedding,
        match_threshold: matchThreshold,
        match_count: matchCount,
        target_project_id: projectId
    });

    if (error) {
        console.error('[Retriever] Search failed:', error);
        return [];
    }

    return (data as SearchResult[]) || [];
}
