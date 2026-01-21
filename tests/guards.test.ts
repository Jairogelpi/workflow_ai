
import { describe, it, expect, vi } from 'vitest';
import { canModifyNode, canDeleteNode } from '../src/kernel/guards';
import { WorkNode, WorkGraph } from '../src/canon/schema/ir';
import { v4 as uuidv4 } from 'uuid';

// Helper to create a minimal graph state
const createMockGraph = (targetNode: WorkNode, hasDependent: boolean): WorkGraph => {
    const dependentId = uuidv4() as any;
    const edgeId = uuidv4() as any;

    return {
        nodes: { [targetNode.id]: targetNode },
        edges: hasDependent ? {
            [edgeId]: {
                id: edgeId,
                source: dependentId,
                target: targetNode.id, // Points TO our node
                relation: 'relates_to',
                metadata: {} as any
            }
        } : {}
    };
};

describe('Kernel: Guards (Hito 0.3)', () => {
    // Helper Node Factory
    const createNode = (pin: boolean): WorkNode => ({
        id: uuidv4() as any,
        type: 'note',
        content: 'test',
        metadata: {
            pin,
            created_at: '', updated_at: '', origin: 'human', version_hash: '' as any
        }
    } as WorkNode);

    it('should BLOCK modification of PIN nodes', () => {
        const pinnedNode = createNode(true);
        expect(canModifyNode(pinnedNode)).toBe(false);
    });

    it('should ALLOW modification of non-PIN nodes', () => {
        const standardNode = createNode(false);
        expect(canModifyNode(standardNode)).toBe(true);
    });

    it('should BLOCK deletion of PIN nodes', () => {
        const pinnedNode = createNode(true);
        const graph = createMockGraph(pinnedNode, false);
        expect(canDeleteNode(pinnedNode, graph)).toBe(false);
    });

    it('should BLOCK deletion of nodes with DEPENDENTS', () => {
        const node = createNode(false);
        const graph = createMockGraph(node, true); // Has incoming edge
        expect(canDeleteNode(node, graph)).toBe(false);
    });

    it('should ALLOW deletion of free nodes', () => {
        const node = createNode(false);
        const graph = createMockGraph(node, false); // No edges
        expect(canDeleteNode(node, graph)).toBe(true);
    });
});
