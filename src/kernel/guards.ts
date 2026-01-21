
import { WorkNode, WorkGraph } from '../canon/schema/ir';

export interface OperationResult {
    allowed: boolean;
    reason?: string;
}

/**
 * Simple Kernel Logger for Observability.
 * In production, this would stream to a structured logging service.
 */
const KernelLogger = {
    block: (operation: string, nodeId: string, actor: string, reason: string) => {
        console.error(`[KERNEL_GUARD] [BLOCK] Operation '${operation}' denied on Node '${nodeId}' by Actor '${actor}'. Reason: ${reason}`);
    },
    allow: (operation: string, nodeId: string, actor: string) => {
        // console.log(`[KERNEL_GUARD] [ALLOW] Operation '${operation}' allowed on Node '${nodeId}' by Actor '${actor}'.`);
    }
};

/**
 * Guard: Can the actor modify this node?
 * Rule 1: Immutable PINs. A pinned node cannot be modified.
 */
export function canModifyNode(node: WorkNode, actor: string = 'system'): OperationResult {
    // Check PIN
    if (node.metadata.pin === true) {
        const reason = 'Node is PINNED (Invariant). Unpin strictly required before modification.';
        KernelLogger.block('MODIFY', node.id, actor, reason);
        return { allowed: false, reason };
    }

    KernelLogger.allow('MODIFY', node.id, actor);
    return { allowed: true };
}

/**
 * Guard: Can the actor delete this node?
 * Rule 1: Immutable PINs.
 * Rule 2: Dependency Safety. Cannot delete if edges point TO this node.
 */
export function canDeleteNode(node: WorkNode, graph: WorkGraph, actor: string = 'system'): OperationResult {
    // 1. Check PIN
    if (node.metadata.pin === true) {
        const reason = 'Node is PINNED (Invariant). Cannot delete pinned node.';
        KernelLogger.block('DELETE', node.id, actor, reason);
        return { allowed: false, reason };
    }

    // 2. Check Dependencies (Incoming Edges)
    // We scan the graph for edges where target === node.id
    // This is O(E). For huge graphs, we would need an index. For now, it's correct.
    const dependencies = Object.values(graph.edges)
        .filter((e): e is import('../canon/schema/ir').WorkEdge => e !== undefined)
        .filter(edge => edge.target === node.id);

    if (dependencies.length > 0) {
        const depIds = dependencies.map(e => e.source).join(', ');
        const reason = `Dependency Safety Violation. Node is required by: [${depIds}]`;
        KernelLogger.block('DELETE', node.id, actor, reason);
        return { allowed: false, reason };
    }

    KernelLogger.allow('DELETE', node.id, actor);
    return { allowed: true };
}
