/**
 * Enrichment Engine: Vectorizer
 * Semantic indexing capabilities for the WorkGraph OS.
 */

import { createClient } from '../supabase-server';

/**
 * Generates a vector embedding for the given text using OpenAI.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        console.warn('[Vectorizer] OPENAI_API_KEY not found. Falling back to random vector (STRUCTURAL MOCK).');
        return Array.from({ length: 1536 }, () => Math.random() - 0.5);
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
                input: text
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(`OpenAI Embedding Error: ${err.error?.message || response.statusText}`);
        }

        const data = await response.json();
        return data.data[0].embedding;

    } catch (err) {
        console.error('[Vectorizer] Failed to generate embedding:', err);
        throw err; // Fail fast in production
    }
}

/**
 * Saves a node's embedding to the vector store.
 */
export async function saveNodeEmbedding(nodeId: string, embedding: number[]) {
    const supabase = await createClient();

    // We expect a table named 'node_embeddings' with 'node_id' and 'embedding' (vector) columns
    const { error } = await supabase
        .from('node_embeddings')
        .upsert({
            node_id: nodeId,
            embedding: embedding
        });

    if (error) {
        console.error('Vector Store Error:', error);
        // We don't throw here to avoid failing the entire ingest if indexing is slow
        return false;
    }

    return true;
}
