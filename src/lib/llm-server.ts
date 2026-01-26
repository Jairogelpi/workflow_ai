/**
 * SERVER-SIDE LLM GATEWAY v1.1
 * 
 * Provides an interface for server-side environments (API Routes, Background Jobs)
 * to call LLMs using environment variables, independent of client-side state.
 */

interface LLMMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface LLMOptions {
    temperature?: number;
    max_tokens?: number;
    model?: string | undefined; // e.g., 'gpt-4o', 'gemini-1.5-flash'
}

/**
 * PRODUCTION-GRADE CIRCUIT BREAKER v1.0
 * Prevents "Double Latency" penalty during provider outages.
 */
class CircuitBreaker {
    private static failures: Record<string, number> = {};
    private static circuitOpenUntil: Record<string, number> = {};
    private static THRESHOLD = 3;
    private static TIMEOUT_MS = 1000 * 60 * 5; // 5 minutes

    static isOpen(provider: string): boolean {
        const openUntil = this.circuitOpenUntil[provider] || 0;
        if (Date.now() < openUntil) return true;
        return false;
    }

    static recordFailure(provider: string) {
        this.failures[provider] = (this.failures[provider] || 0) + 1;
        if (this.failures[provider] >= this.THRESHOLD) {
            console.warn(`[CIRCUIT BREAKER] Opening circuit for ${provider} for 5 minutes.`);
            this.circuitOpenUntil[provider] = Date.now() + this.TIMEOUT_MS;
        }
    }

    static recordSuccess(provider: string) {
        this.failures[provider] = 0;
        this.circuitOpenUntil[provider] = 0;
    }
}

/**
 * Direct call to Google Gemini via Server-side Key.
 */
async function callGeminiServer(messages: LLMMessage[], options: LLMOptions): Promise<string | null> {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) throw new Error('[LLM Server] GOOGLE_GENERATIVE_AI_API_KEY not configured.');

    const modelId = options.model || 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

    const systemPrompt = messages.find(m => m.role === 'system')?.content || "";
    const userPrompt = messages.find(m => m.role === 'user')?.content || "";

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{
                parts: [{ text: `${systemPrompt}\n\nTask: ${userPrompt}` }]
            }],
            generationConfig: {
                temperature: options.temperature ?? 0.7,
                maxOutputTokens: options.max_tokens
            }
        })
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(`Gemini Server Error: ${err.error?.message || response.statusText}`);
    }


    const data = await response.json();
    const candidate = data.candidates?.[0];

    // [TIERED EXECUTION] Quality Check
    // If Gemini refuses (finishReason != STOP) or returns empty content, trigger escalation.
    if (!candidate?.content?.parts?.[0]?.text || candidate?.finishReason !== 'STOP') {
        console.warn(`[LLM Server] Gemini Low Confidence (Reason: ${candidate?.finishReason}). Escalating...`);
        return null; // Signal to escalate
    }

    return candidate.content.parts[0].text;
}

/**
 * Direct call to OpenAI via Server-side Key.
 */
async function callOpenAIServer(messages: LLMMessage[], options: LLMOptions): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('[LLM Server] OPENAI_API_KEY not configured.');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: options.model || 'gpt-4o-mini',
            messages,
            temperature: options.temperature ?? 0.7,
            max_tokens: options.max_tokens
        })
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(`OpenAI Server Error: ${err.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content || "";
}


/**
 * Universal server-side text generation.
 * Multi-provider support (OpenAI / Gemini) based on model ID.
 * 
 * SMART ROUTER (Cost Optimization):
 * Defaults to 'gemini-1.5-flash' for high speed and low cost.
 */
export async function generateTextServer(
    messages: LLMMessage[],
    options: LLMOptions = {}
): Promise<string> {
    // [MODEL ROUTING AGENT] Choose model based on complexity and health
    const isComplex = messages.some(m => m.content.length > 1000) ||
        messages.some(m => m.content.toLowerCase().includes('razona') || m.content.toLowerCase().includes('analiza'));

    let model = options.model || (isComplex ? 'gemini-1.5-pro' : 'gemini-1.5-flash');

    // [CIRCUIT BREAKER] Immediate Failover
    const provider = model.includes('gemini') ? 'gemini' : 'openai';
    if (provider === 'gemini' && CircuitBreaker.isOpen('gemini')) {
        console.warn('[LLM Server] Circuit Open for Gemini. Routing directly to OpenAI.');
        return await callOpenAIServer(messages, { ...options, model: 'gpt-4o-mini' });
    }

    try {
        if (model.includes('gemini')) {
            const result = await callGeminiServer(messages, { ...options, model });
            if (result) {
                CircuitBreaker.recordSuccess('gemini');
                return result;
            }

            // Escalation (not necessarily a failure, just low confidence)
            return await callOpenAIServer(messages, { ...options, model: 'gpt-4o-mini' });
        } else {
            const result = await callOpenAIServer(messages, options);
            CircuitBreaker.recordSuccess('openai');
            return result;
        }
    } catch (err) {
        console.error('[LLM Server] Generation failed:', err);
        CircuitBreaker.recordFailure(provider);

        // Failover Strategy: Only if we have another provider ready
        if (provider === 'gemini' && process.env.OPENAI_API_KEY) {
            return await callOpenAIServer(messages, { ...options, model: 'gpt-4o-mini' });
        }
        throw err;
    }
}

/**
 * Convenience method for simple system/user prompts.
 * Uses Smart Router default (Gemini 1.5 Flash).
 */
export async function askAIServer(system: string, user: string, model?: string): Promise<string> {
    return generateTextServer([
        { role: 'system', content: system },
        { role: 'user', content: user }
    ], { model }); // undefined model triggers default 'gemini-1.5-flash'
}
