
import { describe, it, expect } from 'vitest';
import { runPipeline } from '../src/compiler/index';
import { WorkGraph, ArtifactNodeSchema } from '../src/canon/schema/ir';
import { createVersion } from '../src/kernel/versioning';
import { v4 as uuidv4 } from 'uuid';

describe('Hito 1.3: Proof-Carrying Deliverables', () => {

    const createMockGraph = (): WorkGraph => {
        const claim: any = {
            id: uuidv4(),
            type: 'claim',
            statement: 'Sky is blue',
            verification_status: 'verified',
            metadata: {
                origin: 'human',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                version_hash: ''
            }
        };
        claim.metadata = createVersion(claim);

        return {
            nodes: { [claim.id]: claim },
            edges: {}
        };
    };

    it('should attach a CompilationReceipt to the Artifact', async () => {
        const graph = createMockGraph();
        const goal = 'Verify Sky Color';

        const artifact: any = await runPipeline(goal, graph);

        // 1. Check Receipt Existence
        expect(artifact.receipt).toBeDefined();

        // 2. Check Structure
        expect(artifact.receipt.job_id).toBeTruthy();
        expect(artifact.receipt.compiled_at).toBeTruthy();
        expect(artifact.receipt.input_hash).toBeTruthy();

        // 3. Check Assertion Stub (Since we added a mock claim)
        // Assembler stub puts context nodes in assertion map if they are claims
        // Let's verify our stub logic
        // context.forEach(node => ... assertionMap[node.id] = node.id)
        const claimId = Object.keys(graph.nodes)[0];
        if (!claimId) throw new Error('Graph must have at least one node');
        expect(artifact.receipt.assertion_map).toHaveProperty(claimId);

        // 4. Validate output against Schema
        const result = ArtifactNodeSchema.safeParse(artifact);
        expect(result.success).toBe(true);
    });

});
