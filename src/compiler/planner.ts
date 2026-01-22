
import { Plan } from './types';

/**
 * The Planner decomposes a high-level goal into a structured Plan.
 * Currently a deterministic stub for Hito 1.1 validation.
 */
import { traceSpan } from '../kernel/observability';

/**
 * The Planner decomposes a high-level goal into a structured Plan.
 * Currently a deterministic stub for Hito 1.1 validation.
 */
export async function createPlan(goal: string): Promise<Plan> {
    return traceSpan('planner.create_plan', { goal }, async () => {
        // Deterministic Stub Logic
        return {
            goal,
            steps: [
                { id: 'step-1', description: 'Analyze constraints', required_context_keys: [] },
                { id: 'step-2', description: 'Retrieve context', required_context_keys: ['relevant_nodes'] },
                { id: 'step-3', description: 'Draft content', required_context_keys: [] }
            ]
        };
    });
}
