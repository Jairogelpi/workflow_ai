/**
 * Embedding Service (Hybrid Graph-RAG)
 * Wraps OpenAI's text-embedding-3-large for high-fidelity semantic vectors.
 */

import { useSettingsStore } from '../../store/useSettingsStore';
import { Vault } from '../../lib/security/vault';

export class EmbeddingService {

    /**
     * Generates a vector embedding for a given text.
     * Dimensions: 3072 (text-embedding-3-large)
     */
    static async embed(text: string): Promise<number[]> {
        const { modelConfig, encryptedKeys, masterSecret } = useSettingsStore.getState();

        // Strategy: Use the reasoning model's key (usually OpenAI) for embeddings
        // or specifically configure an embedding key if needed. 
        // For now, we reuse the OpenAI Main Key.

        const config = modelConfig.reasoningModel;
        if (config.provider !== 'openai') {
            // Fallback warning or alternate provider logic
            console.warn('[Embedding] Main provider is not OpenAI. Graph-RAG requires OpenAI Embeddings for now.');
            // Ideally we'd throw, but we can try to proceed if user has key.
        }

        const apiKeyEncrypted = encryptedKeys[config.modelId];
        const apiKey = apiKeyEncrypted
            ? await Vault.decryptKey(apiKeyEncrypted, masterSecret)
            : config.apiKey;

        if (!apiKey) throw new Error("Graph-RAG: No OpenAI API Key found for embeddings.");

        try {
            const response = await fetch('https://api.openai.com/v1/embeddings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    input: text.replace(/\n/g, ' '), // Normalize
                    model: 'text-embedding-3-large',
                    dimensions: 3072 // Max fidelity
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(`Embedding API Error: ${error.error?.message || response.statusText}`);
            }

            const data = await response.json();
            return data.data[0].embedding;

        } catch (error) {
            console.error('[EmbeddingService] Failed:', error);
            throw error;
        }
    }
}
