
import { describe, it, expect } from 'vitest';
import { verifyArtifact } from '../src/compiler/verifier';
import { WorkNode } from '../src/canon/schema/ir';
import { NodeId } from '../src/canon/schema/primitives';
import { v4 as uuidv4 } from 'uuid';

describe('Hito 1.4: The Verifier Logic', () => {

    const createMockContext = (confidence = 0.9): WorkNode[] => {
        const claim: WorkNode = {
            id: uuidv4() as NodeId,
            type: 'claim',
            statement: 'Test Claim',
            verification_status: 'verified',
            metadata: {
                origin: 'human',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                version_hash: '0000000000000000000000000000000000000000000000000000000000000000',
                confidence: confidence,
                validated: true,
                pin: false
            }
        };
        return [claim];
    };

    const createArtifactWithReceipt = (goal: string, context: WorkNode[]) => {
        const inputHash = JSON.stringify({
            goal: goal,
            contextIds: context.map(n => n.id).sort()
        });

        return {
            id: uuidv4(),
            type: 'artifact' as const,
            name: 'Test Artifact',
            uri: 'mem://test',
            metadata: {
                confidence: 1.0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                version_hash: '0000000000000000000000000000000000000000000000000000000000000000',
                origin: 'human' as const
            },
            receipt: {
                job_id: uuidv4(),
                compiled_at: new Date().toISOString(),
                input_hash: inputHash,
                assertion_map: { [context[0]!.id]: context[0]!.id }
            }
        };
    };

    it('should PASS verification for valid artifact', () => {
        const goal = 'Test Goal';
        const context = createMockContext(0.9);
        const artifact = createArtifactWithReceipt(goal, context);

        const report = verifyArtifact(artifact as any, { goal, retrieved_nodes: context });

        expect(report.passed).toBe(true);
        expect(report.score).toBe(1.0);
        expect(report.issues).toBeUndefined();
    });

    it('should FAIL integration check if hash does not match', () => {
        const goal = 'Test Goal';
        const context = createMockContext(0.9);
        const artifact: any = createArtifactWithReceipt(goal, context);

        // TAMPERING: Change the receipt hash
        artifact.receipt!.input_hash = 'TAMPERED_HASH';

        const report = verifyArtifact(artifact, { goal, retrieved_nodes: context });

        expect(report.passed).toBe(false);
        expect(report.score).toBe(0);
        expect(report.issues![0]!.code).toBe('INTEGRITY_FAIL');
    });

    it('should WARN if context has low confidence', () => {
        const goal = 'Test Goal';
        const context = createMockContext(0.2);
        const artifact = createArtifactWithReceipt(goal, context);

        const report = verifyArtifact(artifact as any, { goal, retrieved_nodes: context });

        expect(report.passed).toBe(true);
        expect(report.score).toBeLessThan(1.0);
        expect(report.issues![0]!.code).toBe('LOW_CONFIDENCE');
    });

});
