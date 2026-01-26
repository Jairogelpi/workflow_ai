/**
 * Enrichment Engine: Vectorizer
 * Semantic indexing capabilities for the WorkGraph OS.
 */

import { supabase } from '../supabase';

/**
 * Generates vector embeddings for one or many strings using OpenAI.
 * Optimized to prevent N+1 API calls.
 */
export async function generateEmbedding(input: string | string[]): Promise<number[][]> {
    const apiKey = process.env.OPENAI_API_KEY;
    const inputs = Array.isArray(input) ? input : [input];

    if (!apiKey) {
        throw new Error('[Vectorizer] OPENAI_API_KEY is missing. Cannot generate real embeddings.');
    }

    try {
        const response = await fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'text-embedding-3-small',
                input: inputs
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(`OpenAI Embedding Error: ${err.error?.message || response.statusText}`);
        }

        const data = await response.json();
        return data.data.map((item: any) => item.embedding);

    } catch (err) {
        console.error('[Vectorizer] Failed to generate embedding:', err);
        throw err;
    }
}

/**
 * Saves one or many node embeddings to the vector store in bulk.
 */
export async function saveNodeEmbedding(nodeIds: string | string[], embeddings: number[] | number[][]) {
    const ids = Array.isArray(nodeIds) ? nodeIds : [nodeIds];
    const embs = Array.isArray(embeddings[0]) ? embeddings as number[][] : [embeddings as number[]];

    const payload = ids.map((id, i) => ({
        node_id: id,
        embedding: embs[i]
    }));

    const { error } = await supabase
        .from('node_embeddings')
        .upsert(payload);

    if (error) {
        console.error('[Vectorizer] Bulk Save Error:', error);
        return false;
    }

    return true;
}
