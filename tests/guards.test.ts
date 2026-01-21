
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { v4 as uuidv4 } from 'uuid';
import { canModifyNode, canDeleteNode } from '../src/kernel/guards';
import { WorkNode, WorkGraph, WorkEdge } from '../src/canon/schema/ir';
import { createVersion } from '../src/kernel/versioning';

// Mocks related
const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

// Helpers
const createNode = (pinned: boolean = false): WorkNode => {
    const node: WorkNode = {
        id: uuidv4() as any,
        type: 'note',
        content: 'Guard Test',
        metadata: {
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            origin: 'human',
            confidence: 1.0,
            validated: false,
            pin: pinned,
            version_hash: '' as any
        }
    };
    node.metadata = createVersion(node); // Hash it proper
    return node;
};

const createEdge = (sourceId: string, targetId: string): WorkEdge => ({
    id: uuidv4() as any,
    source: sourceId as any,
    target: targetId as any,
    relation: 'relates_to',
    metadata: {
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        origin: 'human',
        version_hash: '' as any,
        confidence: 1.0,
        validated: false,
        pin: false
    }
});

describe('Kernel: Guards (PIN & Safety)', () => {

    beforeEach(() => {
        consoleSpy.mockClear();
    });

    afterEach(() => {
        // consoleSpy.mockRestore(); // keep mocked to avoid noise
    });

    describe('canModifyNode', () => {
        it('should ALLOW modification if node is NOT pinned', () => {
            const node = createNode(false);
            const result = canModifyNode(node, 'tester');
            expect(result.allowed).toBe(true);
            expect(consoleSpy).not.toHaveBeenCalled();
        });

        it('should DENY modification if node IS pinned', () => {
            const node = createNode(true); // PINNED
            const result = canModifyNode(node, 'tester');

            expect(result.allowed).toBe(false);
            expect(result.reason).toContain('PINNED');
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[KERNEL_GUARD] [BLOCK]'));
        });
    });

    describe('canDeleteNode', () => {
        const nodeTarget = createNode(false);
        const nodeSource = createNode(false);
        const pinnedNode = createNode(true);

        const edge = createEdge(nodeSource.id, nodeTarget.id);

        const graph: WorkGraph = {
            nodes: {
                [nodeTarget.id]: nodeTarget,
                [nodeSource.id]: nodeSource,
                [pinnedNode.id]: pinnedNode
            },
            edges: {
                [edge.id]: edge
            }
        };

        it('should ALLOW deletion of free node', () => {
            // nodeSource has no incoming edges (it is a source)
            const result = canDeleteNode(nodeSource, graph, 'tester');
            expect(result.allowed).toBe(true);
        });

        it('should DENY deletion if node IS pinned', () => {
            const result = canDeleteNode(pinnedNode, graph, 'tester');
            expect(result.allowed).toBe(false);
            expect(result.reason).toContain('PINNED');
            expect(consoleSpy).toHaveBeenCalled();
        });

        it('should DENY deletion if node has DEPENDENTS (incoming edges)', () => {
            // nodeTarget IS targeted by edge from nodeSource
            const result = canDeleteNode(nodeTarget, graph, 'tester');

            expect(result.allowed).toBe(false);
            expect(result.reason).toContain('Dependency Safety Violation');
            expect(result.reason).toContain(nodeSource.id); // Validates traceability in error
            expect(consoleSpy).toHaveBeenCalled();
        });
    });

});
