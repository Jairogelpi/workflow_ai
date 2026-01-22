/**
 * Observability Module (Gate 7)
 * 
 * Provides instrumentation for the Kernel using OpenTelemetry semantics.
 * Ensures every AI operation is audited with cost and performance metrics.
 */

export interface SpanAttributes {
    input_tokens?: number;
    output_tokens?: number;
    model?: string;
    strategy?: 'RAW' | 'DIGEST';
    decision_reason?: string;
    latency_ms?: number;
    cost_usd?: number;
    [key: string]: any;
}

export type TraceSpan<T> = (name: string, attributes: SpanAttributes, fn: () => Promise<T>) => Promise<T>;

/**
 * Mocks the OpenTelemetry tracer for now, but enforces the interface.
 * In a real implementation, this would import @opentelemetry/api
 */
export async function traceSpan<T>(
    name: string,
    attributes: SpanAttributes,
    fn: () => Promise<T>
): Promise<T> {
    const start = performance.now();
    try {
        const result = await fn();
        const end = performance.now();

        // Log to console for dev visibility (Mocking the Span export)
        console.log(`[OTel] Span: ${name}`, {
            ...attributes,
            latency_ms: Math.round(end - start),
            status: 'OK'
        });

        return result;
    } catch (error) {
        const end = performance.now();
        console.error(`[OTel] Span: ${name} FAILED`, {
            ...attributes,
            latency_ms: Math.round(end - start),
            status: 'ERROR',
            error
        });
        throw error;
    }
}

/**
 * Calculates generic cost based on token counts (Approximation)
 */
export function measureCost(inputTokens: number, outputTokens: number, model: string = 'gpt-4o'): number {
    // Standard pricing rates (Example)
    const PRICING: Record<string, { in: number, out: number }> = {
        'gpt-4o': { in: 5.00 / 1e6, out: 15.00 / 1e6 },
        'gpt-3.5-turbo': { in: 0.50 / 1e6, out: 1.50 / 1e6 },
    };

    const rates = PRICING[model] || PRICING['gpt-4o'];
    if (!rates) return 0; // Fallback safety
    return (inputTokens * rates.in) + (outputTokens * rates.out);
}
