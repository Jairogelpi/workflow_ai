
import { Plan } from './types';
import { WorkGraph, WorkNode } from '../canon/schema/ir';

/**
 * The Retriever fetches relevant nodes from the graph to support the Plan.
 * Currently a stub that scans the in-memory graph.
 */
export async function retrieveContext(plan: Plan, graph: WorkGraph): Promise<WorkNode[]> {
    console.log(`[RETRIEVER] Fetching context for plan with ${plan.steps.length} steps...`);

    // Stub: Return all nodes in the graph for now, or a subset.
    // In a real system, this would use vector search / graph traversal.
    const allNodes = Object.values(graph.nodes).filter((n): n is WorkNode => n !== undefined);

    console.log(`[RETRIEVER] Found ${allNodes.length} nodes in context.`);
    return allNodes;
}
