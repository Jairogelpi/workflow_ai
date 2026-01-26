import { supabase } from '@/lib/supabase';

// Initial fallback pricing (will be overwritten by dynamic fetch)
let DYNAMIC_PRICING: Record<string, { input: number, output: number }> = {
    'gpt-4o': { input: 2.50, output: 10.00 },
    'gpt-4o-mini': { input: 0.15, output: 0.60 },
    'claude-3-5-sonnet': { input: 3.00, output: 15.00 },
    'claude-3-haiku': { input: 0.25, output: 1.25 }
};

export type ModelID = string;

export enum TaskTier {
    REFLEX = 'REFLEX',   // Fast, simple (Summaries, Classification) -> Mini/Haiku
    REASON = 'REASON',   // Complex logic, Coding, Architecture -> GPT-4o
    CREATIVE = 'CREATIVE', // Writing, Personas -> Sonnet
}

export class PriceRegistry {

    /**
     * Connects to OpenRouter Market to get Real-Time Pricing.
     * Call this on system boot.
     */
    static async refreshPricing() {
        try {
            console.log('[PriceRegistry] Connecting to OpenRouter Market...');
            const response = await fetch('https://openrouter.ai/api/v1/models');
            const result = await response.json();

            if (result.data) {
                result.data.forEach((model: any) => {
                    // OpenRouter returns pricing string per token. We convert to per 1M tokens.
                    const inputPrice = parseFloat(model.pricing.prompt) * 1_000_000;
                    const outputPrice = parseFloat(model.pricing.completion) * 1_000_000;

                    if (!isNaN(inputPrice) && !isNaN(outputPrice)) {
                        DYNAMIC_PRICING[model.id] = { input: inputPrice, output: outputPrice };
                    }
                });
                console.log('[PriceRegistry] Market Prices Synced.', Object.keys(DYNAMIC_PRICING).length, 'models.');
            }
        } catch (e) {
            console.warn('[PriceRegistry] Market Sync Failed, using cached rates:', e);
        }
    }

    /**
     * Selects the most cost-effective model for the task tier.
     */
    static selectModel(tier: TaskTier): ModelID {
        // We could also dynamically select the cheapest in class, but for now stick to known reliable models
        // mapped to OpenRouter IDs
        switch (tier) {
            case TaskTier.REFLEX:
                return 'openai/gpt-4o-mini'; // specific OpenRouter ID
            case TaskTier.REASON:
                return 'openai/gpt-4o';
            case TaskTier.CREATIVE:
                return 'anthropic/claude-3.5-sonnet';
            default:
                return 'openai/gpt-4o-mini';
        }
    }

    /**
     * Calculates cost based on tokens and model.
     */
    static calculateCost(model: ModelID, inputTokens: number, outputTokens: number): number {
        // Handle "openai/gpt-4o" vs "gpt-4o"
        const cleanModel = model.replace('openai/', '').replace('anthropic/', '');

        let rates = DYNAMIC_PRICING[model] || DYNAMIC_PRICING[cleanModel];

        if (!rates) {
            // Fallback: Try to find by partial match or default to gpt-4o
            rates = DYNAMIC_PRICING['gpt-4o'];
            console.warn(`[PriceRegistry] Unknown model ${model}, using fallback pricing.`);
        }

        // Safety check if fallback also fails (should not happen given init logic)
        if (!rates) return 0;

        const inputCost = (inputTokens / 1_000_000) * rates.input;
        const outputCost = (outputTokens / 1_000_000) * rates.output;
        return inputCost + outputCost;
    }

    /**
     * Tracks usage in Real DB (token_ledger).
     * Automatically calculates "Savings" against the Reference Model (GPT-4o).
     */
    static async trackTransaction(params: {
        projectId: string;
        operation: string;
        model: ModelID;
        inputTokens: number;
        outputTokens: number;
        metadata?: any;
    }) {
        const cost = this.calculateCost(params.model, params.inputTokens, params.outputTokens);

        // Savings Calculation: How much did we save compared to always using GPT-4o?
        // Note: If we used GPT-4o, savings is 0.
        const referenceCost = this.calculateCost('openai/gpt-4o', params.inputTokens, params.outputTokens);
        const savings = Math.max(0, referenceCost - cost);

        try {
            // [REAL] Database Insert
            const { error } = await supabase.from('token_ledger').insert({
                project_id: params.projectId,
                operation: params.operation,
                model: params.model,
                input_tokens: params.inputTokens,
                output_tokens: params.outputTokens,
                cost_usd: cost,
                savings_usd: savings,
                metadata: params.metadata
            });

            if (error) console.error('[PriceRegistry] Failed to log ledger:', error);

            return { cost, savings };

        } catch (e) {
            console.error('[PriceRegistry] Ledger Error:', e);
            return { cost: 0, savings: 0 };
        }
    }
}
