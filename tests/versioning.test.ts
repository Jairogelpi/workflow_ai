
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

        expect(meta).toBeDefined();
        expect(meta.version_hash).toBeDefined();
        expect(meta.version_hash).toMatch(/^[a-f0-9]{64}$/);

        // Verify integrity by attaching meta to node
        const stampedNode = { ...rawNode, metadata: meta };
        expect(verifyIntegrity(stampedNode)).toBe(true);
    });

    it('should create a valid cryptographic chain', () => {
        // v1
        const nodeV1 = createTestNode('Version 1');
        // We simulate that this node has been versioned
        const metaV1 = createVersion(nodeV1);
        nodeV1.metadata = metaV1;

        // v2 (derived from v1)
        // Note: we must cast or handle types carefully as createVersion expects a Node 
        // that matches WorkNodeSchema, and we are mutating it.
        const nodeV2 = { ...nodeV1, content: 'Version 2' } as WorkNode;

        // Create version linking to V1
        const metaV2 = createVersion(nodeV2, metaV1.version_hash);
        nodeV2.metadata = metaV2;

        expect(nodeV2.metadata.previous_version_hash).toBe(metaV1.version_hash);
        expect(verifyIntegrity(nodeV2)).toBe(true);
        expect(nodeV2.metadata.version_hash).not.toBe(nodeV1.metadata.version_hash);
    });

});
