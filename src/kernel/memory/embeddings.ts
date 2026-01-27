/**
 * Embedding Service (Hybrid Graph-RAG)
 * Wraps Local Ollama (nomic-embed-text) for sovereign semantic vectors.
 */

import { useSettingsStore } from '../../store/useSettingsStore';
import { Vault } from '../../lib/security/vault';

export class EmbeddingService {

    /**
     * Generates a vector embedding for a given text.
     * Dimensions: 768 (nomic-embed-text)
     */
    static async embed(text: string): Promise<number[]> {
        const { modelConfig, masterSecret } = useSettingsStore.getState();

        // [PRODUCTION] Route to RLM Core (Backend) if configured
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.getagentshield.com'; // Default to prod if env missing
        const isProduction = process.env.NODE_ENV === 'production';

        if (isProduction || (modelConfig.efficiencyModel.provider as string) === 'openai' || (modelConfig.efficiencyModel.provider as string) === 'openrouter') {
            try {
                // Use the RLM-Core /embed endpoint which handles Cloud/Local routing
                const response = await fetch(`${backendUrl}/embed`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        // Optional: Add Auth header if needed, but RLM might be public or use a shared secret
                    },
                    body: JSON.stringify({
                        texts: [text],
                        model: 'nomic-embed-text' // RLM handles the actual model mapping
                    })
                });

                if (!response.ok) {
                    // Fallback to local if backend fails (e.g. invalid URL)
                    console.warn(`[EmbeddingService] Backend failed (${response.status}), trying fallback...`);
                    throw new Error(response.statusText);
                }

                const data = await response.json();
                return data.embeddings[0]; // RLM returns { embeddings: [[...]] }

            } catch (error) {
                console.error('[EmbeddingService] Backend Error:', error);
                // If strictly production, re-throw. If dev, fall through to localhost attempt.
                if (isProduction) throw error;
            }
        }

        // [LOCAL FALLBACK] Direct Ollama
        const baseUrl = modelConfig.ollamaBaseUrl || 'http://localhost:11434';

        try {
            const response = await fetch(`${baseUrl}/api/embeddings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'nomic-embed-text',
                    prompt: text
                })
            });

            if (!response.ok) {
                throw new Error(`Ollama Embedding Error: ${response.statusText}`);
            }

            const data = await response.json();
            return data.embedding;

        } catch (error) {
            console.error('[EmbeddingService] Local Failed:', error);
            throw error;
        }
    }
}
