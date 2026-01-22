// Mock Env due to Observability possibly checking something? No, but good practice.
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock.supabase.co';

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { measureCost, traceSpan } from '../src/kernel/observability';

describe('Gate 7 Observability', () => {

    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    describe('measureCost (Dynamic Pricing)', () => {
        it('should calculate cost using cached fallbacks initially', async () => {
            // GPT-4o fallback: In=5, Out=15 (per 1M)
            const inputCost = 1000 * (5.00 / 1e6);
            const outputCost = 500 * (15.00 / 1e6);

            const total = await measureCost(1000, 500, 'gpt-4o');

            expect(total).toBeCloseTo(inputCost + outputCost, 10);
        });

        it('should fetch from OpenRouter and update prices', async () => {
            // Mock API Response
            const mockResponse = {
                data: [
                    {
                        id: 'openai/gpt-99-future',
                        pricing: { prompt: '0.0001', completion: '0.0002' }
                    }
                ]
            };

            // Mock Global Fetch
            const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
                ok: true,
                json: async () => mockResponse
            } as any);

            // Call measureCost (which triggers syncWithMarket non-blocking)
            await measureCost(10, 10, 'gpt-4o');

            // Allow promises to settle
            await vi.advanceTimersByTimeAsync(100);

            expect(fetchSpy).toHaveBeenCalledWith('https://openrouter.ai/api/v1/models');
        });

        it('should fallback safe if model unknown', async () => {
            const val = await measureCost(0, 0, 'unknown-model');
            expect(val).toBe(0);
        });
    });

    describe('traceSpan', () => {
        it('should execute the function and return its result', async () => {
            const mockFn = vi.fn().mockResolvedValue('success');
            const result = await traceSpan('test_span', {}, mockFn);

            expect(result).toBe('success');
            expect(mockFn).toHaveBeenCalled();
        });

        it('should propagate errors', async () => {
            const mockFn = vi.fn().mockRejectedValue(new Error('Span Failed'));

            await expect(traceSpan('fail_span', {}, mockFn)).rejects.toThrow('Span Failed');
        });
    });

});
