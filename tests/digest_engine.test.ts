import { describe, it, expect, vi } from 'vitest';
import { WorkNode, WorkEdge } from '../src/canon/schema/ir';

// Mock Supabase to prevent env validation error
vi.mock('../src/lib/supabase', () => ({
    createClient: () => ({ from: () => ({ select: () => ({ eq: () => ({}) }) }) })
}));

// Now import the module under test
import { serializeBranchForLLM } from '../src/kernel/digest_engine';

/**
 * Gate 7 Verification Suite
 */
describe('Gate 7 Digest Engine', () => {

    const mockClaim: WorkNode = {
        id: 'claim-1' as any,
        type: 'claim',
        content: { statement: 'The engine must be verifiable', verification_status: 'verified' },
        // Hoisted properties for Digest Engine
        statement: 'The engine must be verifiable',
        verification_status: 'verified',
        metadata: { pin: true, validated: true, confidence: 1.0, version_hash: '1', created_at: '', updated_at: '', origin: 'human' }
    } as any;

    const mockDecision: WorkNode = {
        id: 'decision-1' as any,
        type: 'decision',
        content: { chosen_option: 'Use Vitest', rationale: 'It is fast', alternatives: ['Jest'] },
        // Hoisted properties for Digest Engine
        chosen_option: 'Use Vitest',
        rationale: 'It is fast',
        alternatives: ['Jest'],
        metadata: { pin: false, validated: true, confidence: 0.9, version_hash: '1', created_at: '', updated_at: '', origin: 'human' }
    } as any;

    const mockLowConfEvidence: WorkNode = {
        id: 'evidence-1' as any,
        type: 'evidence',
        content: "Some rumor on Twitter",
        metadata: { pin: false, validated: false, confidence: 0.3, version_hash: '1', created_at: '', updated_at: '', origin: 'human' }
    } as any;

    it('should enforce PIN_INVARIANT tag for pinned nodes', () => {
        const output = serializeBranchForLLM([mockClaim], []);
        expect(output).toContain('PIN_INVARIANT');
        expect(output).toContain('claim-1');
    });

    it('should correctly serialize Polymorphic Node Types', () => {
        const output = serializeBranchForLLM([mockClaim, mockDecision], []);

        // Claim Check
        expect(output).toContain('STATEMENT: The engine must be verifiable');

        // Decision Check (Complex JSON Flattening)
        expect(output).toContain('CHOSEN: Use Vitest');
        expect(output).toContain('RATIONALE: It is fast');
        expect(output).toContain('Alternatives: Jest');
    });

    it('should flag Low Confidence nodes for the Verifier', () => {
        const output = serializeBranchForLLM([mockLowConfEvidence], []);
        expect(output).toContain('LOW_CONFIDENCE(0.3)');
    });

    it('should represent graph structure (Edges)', () => {
        const edge: WorkEdge = {
            id: 'e1' as any,
            source: 'decision-1' as any,
            target: 'claim-1' as any,
            relation: 'validates' as any,
            metadata: { created_at: '', updated_at: '' } as any
        };

        const output = serializeBranchForLLM([mockClaim, mockDecision], [edge]);
        expect(output).toContain('decision-1 --[VALIDATES]--> claim-1');
    });

});
