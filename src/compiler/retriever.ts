
import { Plan } from './types';
import { WorkGraph, WorkNode } from '../canon/schema/ir';

/**
 * Enhanced Selective Retriever
 * Extracts "Raw" content for high-precision nodes (Claims, Evidence)
 * and "Digests" for other nodes to save token costs.
 */
export async function retrieveContext(plan: Plan, graph: WorkGraph): Promise<WorkNode[]> {
    console.log(`[RETRIEVER] Fetching context for plan with ${plan.steps.length} steps...`);

    const allNodes = Object.values(graph.nodes).filter((n): n is WorkNode => n !== undefined);

    // Apply Selective Logic: 
    // We enhance the nodes with a 'digest' field if it doesn't exist, 
    // and keep 'content' only for high-priority types or when precision is needed.
    const optimizedNodes = allNodes.map(node => {
        const rawContent = (node as any).content || (node as any).statement || (node as any).rationale || "";

        // Simple Digest logic: First 300 chars or summary if available
        const digest = (node as any).summary || (node as any).metadata?.digest ||
            (typeof rawContent === 'string' ? rawContent.substring(0, 300) + '...' : '[Complex Data]');

        // Decisión: ¿Necesitamos el RAW?
        // Priorizar RAW para Evidencia, Claims y Decisiones si están marcadas como PIN
        const needsRaw = node.type === 'evidence' || node.type === 'claim' || node.metadata.pin;

        return {
            ...node,
            digest,
            // Attach raw content only if strictly necessary
            raw: needsRaw ? rawContent : undefined,
            selection_mode: needsRaw ? 'raw' : 'digest'
        };
    });

    console.log(`[RETRIEVER] Found ${optimizedNodes.length} nodes. Optimized for token savings.`);
    return optimizedNodes as unknown as WorkNode[];
}
