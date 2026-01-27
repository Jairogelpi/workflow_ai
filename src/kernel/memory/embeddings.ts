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
        // [Fix] Do not default to the protected endpoint unless we are sure we have credentials or environment is set.
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const isProduction = process.env.NODE_ENV === 'production';

        if (backendUrl && (isProduction || (modelConfig.efficiencyModel.provider as string) === 'openai' || (modelConfig.efficiencyModel.provider as string) === 'openrouter')) {
            try {
                // [Fix] Dynamic Auth & Routing
                let token = '';
                try {
                    const { supabase } = await import('../../lib/supabase');
                    const { data } = await supabase.auth.getSession();
                    token = data.session?.access_token || '';
                } catch (e) { console.warn('[EmbeddingService] Failed to get session:', e); }

                // Detect Schema: Cloud API (OpenAI style) vs Local RLM (Custom RPC)
                const isCloud = backendUrl.includes('api.getagentshield.com') || backendUrl.includes('/v1');
                const endpoint = isCloud ? `${backendUrl}/v1/embeddings` : `${backendUrl}/embed`;

                // AgentShield API requires Authorization header
                const headers: Record<string, string> = {
                    'Content-Type': 'application/json',
                };
                if (token) headers['Authorization'] = `Bearer ${token}`;

                // Select Payload Format
                const payload = isCloud
                    ? { input: text, model: 'text-embedding-3-small' }
                    : { texts: [text], model: 'nomic-embed-text' };

                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    console.warn(`[EmbeddingService] Backend failed (${response.status}) at ${endpoint}`);
                    // If Cloud failed, maybe we are local but misconfigured? 
                    // We throw to trigger the outer catch (which might fallback to Ollama if configured)
                    throw new Error(`Backend Error: ${response.status}`);
                }

                const data = await response.json();

                // Normalize Response
                if (isCloud && data.data && data.data[0]) {
                    return data.data[0].embedding;
                } else if (data.embeddings) {
                    return data.embeddings[0];
                }

                return data; // Fallback return

            } catch (error) {
                console.error('[EmbeddingService] Backend Error:', error);
                // [Fix] Never block execution on Backend Error if we have a fallback strategy.
                // Only re-throw if NO fallback is possible (i.e. if we really wanted the cloud result).
                // For now, let's allow falling through to Local/Ollama.
            }
        }

        // [LOCAL FALLBACK] Direct Ollama
        const baseUrl = modelConfig.ollamaBaseUrl || 'http://localhost:11434';

        // Prevent production from trying to hit localhost blindly
        if (process.env.NODE_ENV === 'production' && baseUrl.includes('localhost')) {
            console.warn('[EmbeddingService] Skipped: Cannot reach localhost in production.');
            return new Array(768).fill(0); // Return zero-vector or null
        }

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
