
import { describe, it, expect } from 'vitest';
import { v4 as uuidv4 } from 'uuid';
import { computeNodeHash, verifyIntegrity, createVersion } from '../src/kernel/versioning';
import { WorkNode } from '../src/canon/schema/ir';

// Helper for a valid base node
const createTestNode = (content: string): WorkNode => ({
    id: uuidv4() as any, // Cast for branded type in test
    type: 'note',
    content,
    metadata: {
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        origin: 'human',
        confidence: 1.0,
        validated: false,
        pin: false,
        version_hash: 'placeholder' as any
    }
});

describe('Kernel: Versioning Engine', () => {

    it('should be deterministic (Same Content = Same Hash)', () => {
        const nodeA = createTestNode('Hello World');
        const nodeB = JSON.parse(JSON.stringify(nodeA)); // Deep clone

        const hashA = computeNodeHash(nodeA);
        const hashB = computeNodeHash(nodeB);

        expect(hashA).toBe(hashB);
        expect(hashA).toMatch(/^[a-f0-9]{64}$/); // SHA-256 format
    });

    it('should show Avalanche Effect (Small Change = Different Hash)', () => {
        const nodeA = createTestNode('Hello World');
        const nodeB = JSON.parse(JSON.stringify(nodeA));
        nodeB.content = 'Hello World!'; // Small change

        const hashA = computeNodeHash(nodeA);
        const hashB = computeNodeHash(nodeB);

        expect(hashA).not.toBe(hashB);
    });

    it('should detect when integrity is valid', () => {
        const node = createTestNode('Integrity Test');
        const hash = computeNodeHash(node);

        // Stamp the node
        node.metadata.version_hash = hash;

        expect(verifyIntegrity(node)).toBe(true);
    });

    it('should detect tampering', () => {
        const node = createTestNode('Integrity Test');
        const hash = computeNodeHash(node);

        // Stamp valid hash
        node.metadata.version_hash = hash;

        // Tamper
        node.metadata.confidence = 0.5; // Changed metadata field

        expect(verifyIntegrity(node)).toBe(false);
    });

    it('createVersion should generate valid, verifiable metadata', () => {
        const node = createTestNode('Factory Test');
        // Strip metadata to simulate a "new" node content
        const rawNode = { ...node, metadata: undefined } as any;

        const meta = createVersion(rawNode);

        expect(meta.version_hash).toBeTruthy();
        expect(meta.created_at).toBeTruthy();

        // Verify the generated meta works with the node
        const stampedNode = { ...rawNode, metadata: meta };
        expect(verifyIntegrity(stampedNode)).toBe(true);
    });

});
