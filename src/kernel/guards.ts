
import { WorkNode, WorkGraph, NodeId } from '../canon/schema/ir';

// Simple Observability (Audit Log stub)
const logBlock = (action: string, nodeId: string, reason: string) => {
    console.warn(`[KERNEL_BLOCK] Action: ${action} | Node: ${nodeId} | Reason: ${reason}`);
};

/**
 * Validates if a node can be modified.
 * Rule: PIN nodes are immutable unless explicitly unpinned (which is a separate privileged action).
 */
export function canModifyNode(node: WorkNode): boolean {
    if (node.metadata.pin) {
        logBlock('MODIFY', node.id, 'Node is PINNED (Invariant Violation)');
        return false;
    }
    return true;
}

/**
 * Validates if a node can be deleted.
 * Rule 1: Cannot delete PIN nodes.
 * Rule 2: Cannot delete nodes with active dependents (Incoming Edges).
 */
export function canDeleteNode(node: WorkNode, graph: WorkGraph): boolean {
    // 1. PIN Check
    if (node.metadata.pin) {
        logBlock('DELETE', node.id, 'Node is PINNED');
        return false;
    }

    // 2. Dependency Check (Referential Integrity)
    // We look for edges where this node is the TARGET.
    // If ANY edge points TO this node, it cannot be deleted.
    // Note: We filter for edges that exist (not undefined) to satisfy TS strict checks if array contains holes, 
    // though Object.values usually doesn't.
    const hasDependents = Object.values(graph.edges).some(
        (edge) => edge && edge.target === node.id
    );

    if (hasDependents) {
        logBlock('DELETE', node.id, 'Node has ACTIVE DEPENDENTS (Referential Integrity)');
        return false;
    }

    return true;
}
