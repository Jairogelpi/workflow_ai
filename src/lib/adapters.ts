import { AppNode } from '../store/useGraphStore';
import { WorkNode } from '../canon/schema/ir';

/**
 * Transforms a Kernel IR WorkNode into a React Flow Node (AppNode).
 */
export function backendToFlow(node: WorkNode, position = { x: 0, y: 0 }): AppNode {
    return {
        id: node.id,
        type: node.type,
        data: node,
        position,
    };
}

/**
 * Extracts the WorkNode from a Flow Node.
 */
export function flowToBackend(node: AppNode): WorkNode {
    return node.data;
}
