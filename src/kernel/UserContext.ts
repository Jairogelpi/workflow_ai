
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
        const vector = await generateEmbedding(content);

        // Mock DB interaction (Assumes 'user_patterns' table exists)
        // In production: await supabase.from('user_patterns').insert(...)
        console.log(`[Neural Shadow] Memorizing behavior: ${actionType} on "${content.slice(0, 20)}..."`);
    }

    /**
     * Retrieves relevant style guidelines or past preferred structures
     * based on the current user intent.
     */
    static async getStyleContext(userId: string, currentIntent: string): Promise<string> {
        // [SIMULATION]
        // In real impl: Vector search on 'user_patterns'

        // Mocking a learned preference based on user persona
        return `
        [LEARNED USER PREFERENCES]:
        - Prefers concise, bullet-pointed task nodes.
        - Often creates 'Decision' nodes for architectural choices.
        - Dislikes verbose rationale.
        `;
    }
}
