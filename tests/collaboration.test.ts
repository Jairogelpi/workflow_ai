/**
 * Gate 9: Collaboration & RBAC Verification Suite
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// 1. Mock the specific Supabase Libraries 
vi.mock('@supabase/ssr', () => ({ createServerClient: vi.fn() }));
vi.mock('@supabase/supabase-js', () => ({ createClient: vi.fn() }));

// 2. Mock our local supabase lib entirely
const { mockSupabase } = vi.hoisted(() => ({
    mockSupabase: {
        auth: { getUser: vi.fn() },
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn(),
        update: vi.fn().mockReturnThis(),
        rpc: vi.fn()
    }
}));

vi.mock('../src/lib/supabase', () => ({
    createClient: async () => mockSupabase,
    supabaseAdmin: mockSupabase
}));

import { MergeEngine } from '../src/kernel/collaboration/MergeEngine';

describe('Gate 9: Semantic Governance & Collaboration', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('MergeEngine: Semantic Preflight', () => {

        it('should detect conflicts if the same node is modified in source and target', async () => {
            const mockCrId = 'cr-1';

            mockSupabase.single.mockResolvedValueOnce({
                data: { id: mockCrId, source_branch_id: 's-1', target_branch_id: 't-1' },
                error: null
            });

            const sourceNode = { id: 'n1', content: { val: 'new' }, metadata: {} };
            const targetNode = { id: 'n1', content: { val: 'old' }, metadata: {} };

            // Explicitly mock the chain to return a promise that resolves to { data: nodes }
            mockSupabase.from.mockReturnValue({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockImplementation((col, val) => {
                    if (val === 's-1') return Promise.resolve({ data: [sourceNode] });
                    if (val === 't-1') return Promise.resolve({ data: [targetNode] });
                    return Promise.resolve({ data: [] });
                })
            } as any);

            // Update CR mock
            mockSupabase.update.mockReturnValue({ eq: () => Promise.resolve({ error: null }) } as any);

            const result = await MergeEngine.preflightCheck(mockCrId);

            expect(result.safe).toBe(false);
            expect(result.conflicts).toHaveLength(1);
        });

        it('should block merge if it violates a PIN invariant in the target', async () => {
            const mockCrId = 'cr-2';

            mockSupabase.single.mockResolvedValueOnce({
                data: { id: mockCrId, source_branch_id: 's-2', target_branch_id: 't-2' },
                error: null
            });

            const targetNode = { id: 'pinned-1', content: { status: 'locked' }, metadata: { pin: true } };
            const sourceNode = { id: 'pinned-1', content: { status: 'unlocked' }, metadata: { pin: true } };

            mockSupabase.from.mockReturnValue({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockImplementation((col, val) => {
                    if (val === 's-2') return Promise.resolve({ data: [sourceNode] });
                    if (val === 't-2') return Promise.resolve({ data: [targetNode] });
                    return Promise.resolve({ data: [] });
                })
            } as any);

            mockSupabase.update.mockReturnValue({ eq: () => Promise.resolve({ error: null }) } as any);

            const result = await MergeEngine.preflightCheck(mockCrId);

            expect(result.safe).toBe(false);
            expect(result.brokenInvariants).toHaveLength(1);
        });

        it('should allow merge if there are no conflicts or broken invariants', async () => {
            const mockCrId = 'cr-3';

            mockSupabase.single.mockResolvedValueOnce({
                data: { id: mockCrId, source_branch_id: 's-3', target_branch_id: 't-3' },
                error: null
            });

            const targetNode = { id: 'n1', content: { val: 'fixed' }, metadata: { pin: false } };
            const sourceNode = { id: 'n2', content: { val: 'new' }, metadata: {} };

            mockSupabase.from.mockReturnValue({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockImplementation((col, val) => {
                    if (val === 's-3') return Promise.resolve({ data: [sourceNode] });
                    if (val === 't-3') return Promise.resolve({ data: [targetNode] });
                    return Promise.resolve({ data: [] });
                })
            } as any);

            mockSupabase.update.mockReturnValue({ eq: () => Promise.resolve({ error: null }) } as any);

            const result = await MergeEngine.preflightCheck(mockCrId);

            expect(result.safe).toBe(true);
        });
    });
});
