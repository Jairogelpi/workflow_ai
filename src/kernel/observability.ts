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


// --- Dynamic Pricing Engine (OpenRouter) ---

interface ModelPrice {
    prompt: number;
    completion: number;
}

class PriceRegistry {
    private static instance: PriceRegistry;
    private prices: Map<string, ModelPrice> = new Map();
    private lastSync: number = 0;
    private readonly SYNC_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

    // Fallback Pricing (Static)
    private readonly FALLBACKS: Record<string, ModelPrice> = {
        'gpt-4o': { prompt: 5.00 / 1e6, completion: 15.00 / 1e6 },
        'gpt-3.5-turbo': { prompt: 0.50 / 1e6, completion: 1.50 / 1e6 },
        'claude-3-5-sonnet': { prompt: 3.00 / 1e6, completion: 15.00 / 1e6 },
    };

    private constructor() {
        // Hydrate with fallbacks initially
        Object.entries(this.FALLBACKS).forEach(([k, v]) => this.prices.set(k, v));
    }

    public static getInstance(): PriceRegistry {
        if (!PriceRegistry.instance) {
            PriceRegistry.instance = new PriceRegistry();
        }
        return PriceRegistry.instance;
    }

    /**
     * Non-blocking sync with OpenRouter API to get real-time market rates.
     */
    public async syncWithMarket(): Promise<void> {
        if (Date.now() - this.lastSync < this.SYNC_INTERVAL) return;

        try {
            console.log('[PriceRegistry] Syncing with OpenRouter API...');
            const response = await fetch('https://openrouter.ai/api/v1/models');
            if (!response.ok) throw new Error('Failed to fetch prices');

            const data = await response.json();
            // Expected format: { data: [ { id: 'openai/gpt-4o', pricing: { prompt: '0.00..', completion: '...' } } ] }

            let count = 0;
            if (data && Array.isArray(data.data)) {
                data.data.forEach((model: any) => {
                    const price: ModelPrice = {
                        prompt: parseFloat(model.pricing.prompt) || 0,
                        completion: parseFloat(model.pricing.completion) || 0
                    };
                    // Normalize ID: remove 'openai/' prefix if user just asks for 'gpt-4o'
                    const shortId = model.id.split('/').pop();

                    if (model.id) this.prices.set(model.id, price);
                    if (shortId) this.prices.set(shortId, price);

                    count++;
                });
            }

            this.lastSync = Date.now();
            console.log(`[PriceRegistry] Synced ${count} models successfully.`);

        } catch (err) {
            console.warn('[PriceRegistry] Sync failed, using cached/fallback rates.', err);
        }
    }

    public getPrice(model: string): ModelPrice {
        // Try strict match
        const exact = this.prices.get(model);
        if (exact) return exact;

        // Try loose match (case insensitive)
        const lower = model.toLowerCase();
        for (const [key, val] of this.prices.entries()) {
            if (key.toLowerCase() === lower) return val;
        }

        // Return GPT-4o pricing as safe default (high estimate)
        return this.FALLBACKS['gpt-4o']!;
    }
}


// --- Audit & Public Metrics System (Hito 4.5) ---

interface AuditMetric {
    jobId: string;
    stepId: string;
    model: string;
    tokens: { input: number; output: number };
    latency_ms: number;
    cost_usd: number;
    timestamp: string;
}

class AuditStore {
    private static instance: AuditStore;
    private metrics: AuditMetric[] = [];

    private constructor() { }

    public static getInstance() {
        if (!AuditStore.instance) AuditStore.instance = new AuditStore();
        return AuditStore.instance;
    }

    public recordMetric(metric: AuditMetric) {
        this.metrics.push(metric);
        console.log(`[Audit] Recorded metric for job ${metric.jobId}, step ${metric.stepId}`);
    }

    public getJobMetrics(jobId: string): AuditMetric[] {
        return this.metrics.filter(m => m.jobId === jobId);
    }

    public getStepMetric(jobId: string, stepId: string): AuditMetric | undefined {
        return this.metrics.find(m => m.jobId === jobId && m.stepId === stepId);
    }
}

export const auditStore = AuditStore.getInstance();

/**
 * Calculates generic cost based on token counts.
 * Uses PriceRegistry for real-time rates.
 */
export async function measureCost(inputTokens: number, outputTokens: number, model: string = 'gpt-4o'): Promise<number> {
    const registry = PriceRegistry.getInstance();
    await registry.syncWithMarket().catch(e => console.error(e));
    const rates = registry.getPrice(model);
    return (inputTokens * rates.prompt) + (outputTokens * rates.completion);
}
