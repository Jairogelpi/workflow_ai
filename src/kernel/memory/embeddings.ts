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
        const { modelConfig } = useSettingsStore.getState();
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
