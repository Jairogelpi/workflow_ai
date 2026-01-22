import { traceSpan, measureCost, estimateCallCost, getModelTier } from '../observability';
import { useSettingsStore } from '../../store/useSettingsStore';
import { auditStore } from '../observability';

interface LLMResponse {
    content: string;
    usage: { inputTokens: number; outputTokens: number };
}

/**
 * Gateway unificado para llamadas a LLMs.
 * - Gestiona la autenticación (BYOK).
 * - Estandariza la respuesta.
 * - INYECTA OBSERVABILIDAD AUTOMÁTICA.
 */
export type TaskTier = 'REASONING' | 'EFFICIENCY';

/**
 * PRE-FLIGHT COST PREDICTION (Hito 3.3 & Gate 7)
 * Estimates the cost of a call before execution.
 */
export function predictCost(system: string, user: string, modelId: string): number {
    // Approximate tokens (chars / 4 is standard for 2026 models)
    const inputTokens = (system.length + user.length) / 4;
    const expectedOutput = 1000; // Standard buffer for RLM Compiler responses

    return estimateCallCost(inputTokens, expectedOutput, modelId);
}

/**
 * Gateway unificado para llamadas a LLMs.
 * - Gestiona la autenticación (BYOK).
 * - Estandariza la respuesta.
 * - INYECTA OBSERVABILIDAD AUTOMÁTICA.
 * - PRE-FLIGHT COST ESTIMATION.
 */
export async function generateText(
    systemPrompt: string,
    userPrompt: string,
    tier: TaskTier = 'REASONING'
): Promise<string> {
    const { modelConfig } = useSettingsStore.getState();

    // Smart Routing Logic
    const activeConfig = tier === 'REASONING'
        ? modelConfig.reasoningModel
        : modelConfig.efficiencyModel;

    if (!activeConfig.apiKey) {
        throw new Error(`⚠️ API Key no configurada para el motor de ${tier}. Ve a ajustes.`);
    }

    // PRE-FLIGHT COST ESTIMATION
    const estimatedCost = predictCost(systemPrompt, userPrompt, activeConfig.modelId);
    const sessionSpend = auditStore.getSessionSpend();

    // Budget threshold warning (>$0.10 for single operation)
    if (estimatedCost > 0.10) {
        console.warn(`[GATEWAY] HIGH COST OPERATION: Estimated $${estimatedCost.toFixed(4)} for ${tier} call. Session total: $${sessionSpend.toFixed(4)}`);
        // In production, this would trigger a UI confirmation dialog
    }

    return traceSpan(`llm.generate.${tier.toLowerCase()}`, { model: activeConfig.modelId, provider: activeConfig.provider }, async () => {
        let response: LLMResponse;

        // Router de proveedores
        if (activeConfig.provider === 'openai') {
            response = await callOpenAI(activeConfig, systemPrompt, userPrompt);
        } else if (activeConfig.provider === 'gemini') {
            response = await callGemini(activeConfig, systemPrompt, userPrompt);
        } else if (activeConfig.provider === 'local') {
            response = await callCustomOpenAI(activeConfig, systemPrompt, userPrompt);
        } else {
            throw new Error(`Proveedor ${activeConfig.provider} no implementado aún.`);
        }

        // --- OBSERVABILIDAD OBLIGATORIA ---
        const cost = await measureCost(
            activeConfig.provider === 'openai' ? response.usage.inputTokens : response.usage.inputTokens, // Simplification
            response.usage.outputTokens,
            activeConfig.modelId
        );

        console.log(`[LLM GATEWAY] Coste estimado (${tier}): $${cost.toFixed(6)} | Tokens: ${response.usage.inputTokens}in/${response.usage.outputTokens}out`);

        return response.content;
    });
}

// --- Adaptadores Específicos (Minimalistas para no depender de SDKs pesados) ---

async function callOpenAI(config: any, system: string, user: string): Promise<LLMResponse> {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
            model: config.modelId,
            messages: [
                { role: 'system', content: system },
                { role: 'user', content: user }
            ],
            temperature: 0.7
        })
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(`OpenAI Error: ${err.error?.message || res.statusText}`);
    }

    const data = await res.json();
    return {
        content: data.choices[0].message.content,
        usage: {
            inputTokens: data.usage.prompt_tokens,
            outputTokens: data.usage.completion_tokens
        }
    };
}

async function callGemini(config: any, system: string, user: string): Promise<LLMResponse> {
    // Nota: Gemini usa una estructura diferente. Ajustar endpoint según versión.
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.modelId}:generateContent?key=${config.apiKey}`;

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{
                parts: [{ text: `${system}\n\nUser Task: ${user}` }] // Gemini System Prompts son diferentes, simplificamos concatenando
            }]
        })
    });

    if (!res.ok) throw new Error(`Gemini Error: ${res.statusText}`);

    const data = await res.json();
    return {
        content: data.candidates[0].content.parts[0].text,
        usage: {
            // Gemini a veces no devuelve uso exacto en la respuesta estándar, usamos estimación si falta
            inputTokens: data.usageMetadata?.promptTokenCount || (system.length + user.length) / 4,
            outputTokens: data.usageMetadata?.candidatesTokenCount || 100
        }
    };
}

/**
 * Adaptador Universal para cualquier endpoint compatible con OpenAI (Ollama, vLLM, etc.)
 */
async function callCustomOpenAI(config: any, system: string, user: string): Promise<LLMResponse> {
    const baseUrl = config.baseUrl?.replace(/\/+$/, '') || 'http://localhost:11434/v1';

    const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey || 'no-key'}`
        },
        body: JSON.stringify({
            model: config.modelId === 'local-model' ? 'default' : config.modelId,
            messages: [
                { role: 'system', content: system },
                { role: 'user', content: user }
            ],
            temperature: 0.7
        })
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
        throw new Error(`Custom Endpoint Error: ${err.error?.message || res.statusText}`);
    }

    const data = await res.json();
    return {
        content: data.choices[0].message.content,
        usage: {
            inputTokens: data.usage?.prompt_tokens || 0,
            outputTokens: data.usage?.completion_tokens || 0
        }
    };
}

/**
 * Verifica si un endpoint sigue el estándar de OpenAI
 */
export async function verifyEndpoint(baseUrl: string, apiKey: string): Promise<{ success: boolean; message: string }> {
    try {
        const cleanUrl = baseUrl.replace(/\/+$/, '');
        // Probamos una llamada mínima al endpoint de modelos para ver si responde
        const res = await fetch(`${cleanUrl}/models`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey || 'no-key'}`
            }
        });

        if (res.ok) {
            return { success: true, message: "Endpoint verificado: Compatible con estándar OpenAI." };
        } else {
            return { success: false, message: `Error de verificación: El servidor respondió con status ${res.status}.` };
        }
    } catch (err) {
        return { success: false, message: `Error de conexión: No se pudo contactar con el endpoint. Detalle: ${err instanceof Error ? err.message : String(err)}` };
    }
}
