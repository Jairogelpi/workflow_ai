import { WorkNode, WorkGraph, NodeId, UserRole } from '../canon/schema/ir';

// RBAC Role Hierarchy (Higher is more powerful)
const ROLE_HIERARCHY: Record<UserRole, number> = {
    'viewer': 1,
    'editor': 2,
    'admin': 3
};

/**
 * Validates if a user role satisfies the required role.
 */
export function hasRequiredRole(userRole: UserRole, requiredRole: UserRole): boolean {
    return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Validates if an action can be performed by a user on a node.
 */
export function canPerformAction(
    node: WorkNode,
    userRole: UserRole,
    userId: string,
    action: 'MODIFY' | 'DELETE' | 'PIN' | 'UNPIN'
): boolean {
    const { access_control } = node.metadata;
    const requiredRole = access_control?.role_required || 'editor';

    // Owners or Admins always have bypass (unless PIN enforcement applies later)
    if (userRole === 'admin' || access_control?.owner_id === userId) {
        return true;
    }

    if (!hasRequiredRole(userRole, requiredRole)) {
        logBlock(action, node.id, `INSUFFICIENT_ROLE (Required: ${requiredRole}, Have: ${userRole})`);
        return false;
    }

    return true;
}

// Simple Observability (Audit Log stub)
const logBlock = (action: string, nodeId: string, reason: string) => {
    console.warn(`[KERNEL_BLOCK] Action: ${action} | Node: ${nodeId} | Reason: ${reason}`);
};

/**
 * Validates if a node can be modified.
 * Rule 1: RBAC check (role and ownership).
 * Rule 2: PIN nodes are immutable unless explicitly unpinned.
 */
export function canModifyNode(node: WorkNode, userRole: UserRole, userId: string): boolean {
    if (!canPerformAction(node, userRole, userId, 'MODIFY')) return false;

    if (node.metadata.pin) {
        logBlock('MODIFY', node.id, 'Node is PINNED (Invariant Violation)');
        return false;
    }
    return true;
}

/**
 * Validates if a node can be deleted.
 * Rule 1: RBAC check.
 * Rule 2: Cannot delete PIN nodes.
 * Rule 3: Cannot delete nodes with active dependents (Incoming Edges).
 */
export function canDeleteNode(node: WorkNode, graph: WorkGraph, userRole: UserRole, userId: string): boolean {
    if (!canPerformAction(node, userRole, userId, 'DELETE')) return false;

    if (node.metadata.pin) {
        logBlock('DELETE', node.id, 'Node is PINNED');
        return false;
    }

    const hasDependents = Object.values(graph.edges).some(
        (edge) => edge && edge.target === node.id
    );

    if (hasDependents) {
        logBlock('DELETE', node.id, 'Node has ACTIVE DEPENDENTS');
        return false;
    }

    return true;
}

/**
 * Validates if a new edge (relation) violates an invariant.
 * Rule: Cannot add a 'contradicts' relation to a PIN node without explicit override.
 */
export function canAddRelation(source: WorkNode, target: WorkNode, relation: string): boolean {
    if (relation === 'contradicts' && target.metadata.pin) {
        logBlock('RELATION', target.id, 'Cannot contradict a PINNED node (Canonical Invariant)');
        return false;
    }
    return true;
}

/**
 * Staleness Detection (Hito 5.1)
 * Checks if a node should be considered "stale" based on time or external source flags.
 */
export function checkNodeStaleness(node: WorkNode): { isStale: boolean; reason?: string } {
    const STALENESS_THRESHOLD_DAYS = 30;
    const now = new Date();
    const updated = new Date(node.metadata.updated_at);

    const diffDays = (now.getTime() - updated.getTime()) / (1000 * 3600 * 24);

    if (diffDays > STALENESS_THRESHOLD_DAYS) {
        return { isStale: true, reason: `Node has not been updated in ${Math.floor(diffDays)} days.` };
    }

    // Future: Add real URL check here for 'source' nodes
    return { isStale: false };
}

// --- Log Sanitization (Hito 3.5: Vault) ---

// Patterns for common LLM API Keys
const SENSITIVE_PATTERNS = [
    /sk-[a-zA-Z0-9]{32,}/g,           // OpenAI
    /xkeys-[a-zA-Z0-9]{64,}/g,        // Anthropic / Generic
    /AIza[0-9A-Za-z-_]{35}/g,         // Google Gemini
];

/**
 * Scans text and redacts sensitive patterns.
 * Injected into audit trails and observability exports.
 */
export function sanitizeLogs(text: string): string {
    if (!text) return text;

    let sanitized = text;
    for (const pattern of SENSITIVE_PATTERNS) {
        sanitized = sanitized.replace(pattern, (match) => {
            // Keep first 3 and last 3 chars for debugging context, redact the rest
            if (match.length > 10) {
                return `${match.slice(0, 3)}...[REDACTED]...${match.slice(-3)}`;
            }
            return "[REDACTED]";
        });
    }

    return sanitized;
}

/**
 * Higher-order utility to wrap console logging in dev mode.
 */
export const secureLog = (message: string, ...optionalParams: any[]) => {
    const logBatch = [message, ...optionalParams].map(p =>
        typeof p === 'string' ? sanitizeLogs(p) : p
    );
    console.log(...logBatch);
};
