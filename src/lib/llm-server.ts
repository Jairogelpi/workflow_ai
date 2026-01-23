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
 * Direct call to Google Gemini via Server-side Key.
 */
async function callGeminiServer(messages: LLMMessage[], options: LLMOptions): Promise<string> {
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
    return data.candidates[0].content.parts[0].text;
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
 */
export async function generateTextServer(
    messages: LLMMessage[],
    options: LLMOptions = {}
): Promise<string> {
    const model = options.model || 'gpt-4o-mini';

    try {
        if (model.includes('gemini')) {
            return await callGeminiServer(messages, options);
        } else {
            return await callOpenAIServer(messages, options);
        }
    } catch (err) {
        console.error('[LLM Server] Generation failed:', err);
        // NO MOCK FALLBACK in production mode. Fail fast so user knows keys are missing.
        throw err;
    }
}

/**
 * Convenience method for simple system/user prompts.
 */
export async function askAIServer(system: string, user: string, model?: string): Promise<string> {
    return generateTextServer([
        { role: 'system', content: system },
        { role: 'user', content: user }
    ], { model });
}
