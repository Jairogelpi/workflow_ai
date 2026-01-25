
import { supabase } from '../lib/supabase';
import { generateEmbedding } from '../lib/ingest/vectorizer';

/**
 * THE NEURAL SHADOW [2026]
 * 
 * Captures user behavior patterns to create a personalized AI style.
 * "The system learns from what you do, not just what you ask."
 */
export class UserContext {

    /**
     * Ingests a user action (e.g., editing a node thought, accepting a suggestion)
     * into the behavioral vector store.
     */
    static async ingestBehavior(userId: string, actionType: 'EDIT' | 'ACCEPT' | 'REJECT', content: string) {
        // [REAL] Generate embedding using our centralized vectorizer
        const vector = await generateEmbedding(content);

        // [REAL] Persist to Supabase
        const { error } = await supabase.from('user_patterns').insert({
            user_id: userId,
            action_type: actionType,
            content_snippet: content.slice(0, 500),
            embedding: vector,
            created_at: new Date().toISOString()
        });

        if (error) {
            console.error('[Neural Shadow] Failed to ingest behavior:', error);
        } else {
            console.log(`[Neural Shadow] Memorized behavior by ${userId}: ${actionType}`);
        }
    }

    /**
     * Retrieves relevant style guidelines or past preferred structures
     * based on the current user intent.
     */
    static async getStyleContext(userId: string, currentIntent: string): Promise<string> {
        // [REAL] Check for valid user
        if (!userId || userId === 'current-user') {
            // Fallback to anonymous profile if auth is not yet hydrated in this context
            return "[User Style]: Standard Professional.";
        }

        const queryVector = await generateEmbedding(currentIntent);

        // [REAL] Vector Search via RPC
        const { data: patterns, error } = await supabase.rpc('match_user_patterns', {
            query_embedding: queryVector,
            match_threshold: 0.7,
            match_count: 5,
            p_user_id: userId
        });

        if (error || !patterns || patterns.length === 0) {
            return "[User Style]: Standard Professional (No historical patterns found).";
        }

        const insights = patterns.map((p: any) => `- Observed ${p.action_type} on: "${p.content_snippet}"`).join('\n');

        return `
        [LEARNED USER PREFERENCES]:
        ${insights}
        `;
    }
}
