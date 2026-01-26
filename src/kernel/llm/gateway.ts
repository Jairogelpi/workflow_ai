import { traceSpan, measureCost, estimateCallCost, getModelTier, auditStore } from '../observability';
import { useSettingsStore } from '../../store/useSettingsStore';
import { Vault } from '../../lib/security/vault';
import { sanitizeLogs } from '../guards';
// import { getServerJWT } from '../../lib/auth-util'; // Removed static import to avoid Client Bundle poisoning

interface LLMResponse {
    content: string;
    usage: { inputTokens: number; outputTokens: number };
    toolCalls?: any[];
}

// RLM Core (Python) client configuration
const RLM_CORE_URL = process.env.RLM_CORE_URL || 'http://localhost:8080';

/**
 * Calls the local Python RLM Core for verification tasks.
 * Uses local SLMs (Phi-3, Llama 3.2) for 80% of verification tasks at zero cost.
 */
export async function verifyWithLocalModel(
    claim: string,
    context: any[],
    pinNodes: any[]
): Promise<{ consistent: boolean; confidence: number; reasoning: string }> {
    try {
        // Dynamic import to support Client-side execution without bundling server modules
        let jwt = null;
        if (typeof window === 'undefined') {
            const { getServerJWT } = await import('../../lib/auth-util');
            jwt = await getServerJWT();
        }

        const response = await fetch(`${RLM_CORE_URL}/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-trace-id': `trace-${Date.now()}`,
                ...(jwt ? { 'Authorization': `Bearer ${jwt}` } : {})
            },
            body: JSON.stringify({
                claim,
                context,
                pin_nodes: pinNodes,
                task_complexity: 'LOW'
            })
        });

        if (!response.ok) throw new Error(`RLM Core error: ${response.status}`);
        return await response.json();
    } catch (err) {
        console.warn('[Gateway] RLM Core not available:', err);
        throw new Error('Verification Service Unavailable. RLM Core required.');
    }
}

/**
 * Asks the Python SmartRouter whether to use local or cloud model.
 */
export async function shouldUseLocalModel(
    taskType: 'verification' | 'generation' | 'embedding' | 'planning',
    inputTokens: number,
    complexity: 'LOW' | 'MEDIUM' | 'HIGH',
    requireHighQuality: boolean = false
): Promise<{ useLocal: boolean; recommendedModel: string; estimatedCost: number }> {
    try {
        let jwt = null;
        if (typeof window === 'undefined') {
            const { getServerJWT } = await import('../../lib/auth-util');
            jwt = await getServerJWT();
        }

        const response = await fetch(`${RLM_CORE_URL}/route`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(jwt ? { 'Authorization': `Bearer ${jwt}` } : {})
            },
            body: JSON.stringify({
                task_type: taskType,
                input_tokens: inputTokens,
                complexity,
                require_high_quality: requireHighQuality
            })
        });

        if (!response.ok) throw new Error(`RLM Core error: ${response.status}`);
        const data = await response.json();
        return {
            useLocal: data.use_local,
            recommendedModel: data.recommended_model,
            estimatedCost: data.estimated_cost_usd
        };
    } catch (err) {
        console.warn('[Gateway] RLM Core SmartRouter unavailable:', err);
        throw new Error('Routing Service Unavailable. Cannot determine optimal model.');
    }
}

/**
 * Gateway unificado para llamadas a LLMs.
 * - Gestiona la autenticación (BYOK).
 * - Estandariza la respuesta.
 * - INYECTA OBSERVABILIDAD AUTOMÁTICA.
 */
export type TaskTier = 'REASONING' | 'EFFICIENCY';

export enum TaskComplexity {
    LOW = 'MECHANICAL',    // Formateo, limpieza, resúmenes simples
    MEDIUM = 'ANALYSIS',   // Detección de evidencias, extracción de claims
    HIGH = 'REASONING'     // Verificación de invariantes (PIN), resolución de contradicciones
}

export class SmartRouter {
    /**
     * Elige el modelo óptimo basado en complejidad y coste.
     * [Phase 9] Now considers local models via RLM Core.
     */
    static getOptimalModel(complexity: TaskComplexity): string {
        const { modelConfig } = useSettingsStore.getState();

        switch (complexity) {
            case TaskComplexity.LOW:
                // Prioridad absoluta: Ahorro (Local via RLM Core o DeepSeek)
                return 'local/phi3:mini'; // RLM Core handles this
            case TaskComplexity.MEDIUM:
                // Prioridad: Ventana de contexto amplia (Gemini Flash)
                return 'google/gemini-3-flash';
            case TaskComplexity.HIGH:
                // Prioridad: Inteligencia máxima (GPT-5 o Claude Opus)
                return modelConfig.reasoningModel.modelId || 'openai/gpt-5.2';
            default:
                return 'google/gemini-3-flash';
        }
    }
}

/**
 * PRE-FLIGHT COST PREDICTION (Hito 3.3 & Gate 7)
 * Estimates the cost of a call before execution.
 */
export function predictCost(system: string, user: string, modelId: string): number {
    // Local models are free
    if (modelId.startsWith('local/')) return 0;

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
    tier: TaskTier = 'REASONING',
    tools?: any[],
    images?: string[] // Base64 or URIs
): Promise<{ content: string; toolCalls?: any[] }> {
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
        console.warn(sanitizeLogs(`[GATEWAY] HIGH COST OPERATION: Estimated $${estimatedCost.toFixed(4)} for ${tier} call. Session total: $${sessionSpend.toFixed(4)}`));
    }

    return traceSpan(`llm.generate.${tier.toLowerCase()}`, { model: activeConfig.modelId, provider: activeConfig.provider }, async () => {
        let response: LLMResponse;

        // Router de proveedores
        if (activeConfig.provider === 'openai') {
            response = await callOpenAI(activeConfig, systemPrompt, userPrompt, tools, images);
        } else if (activeConfig.provider === 'gemini') {
            response = await callGemini(activeConfig, systemPrompt, userPrompt);
        } else if (activeConfig.provider === 'local') {
            response = await callCustomOpenAI(activeConfig, systemPrompt, userPrompt, tools);
        } else {
            throw new Error(`Proveedor ${activeConfig.provider} no implementado aún.`);
        }

        // --- OBSERVABILIDAD OBLIGATORIA CON SANITIZACIÓN ---
        const cost = await measureCost(
            response.usage.inputTokens,
            response.usage.outputTokens,
            activeConfig.modelId
        );

        const logMsg = `[LLM GATEWAY] Coste estimado (${tier}): $${cost.toFixed(6)} | Tokens: ${response.usage.inputTokens}in/${response.usage.outputTokens}out`;
        console.log(sanitizeLogs(logMsg));

        return {
            content: response.content,
            toolCalls: (response as any).toolCalls
        };
    });
}

// --- Adaptadores Específicos (Minimalistas para no depender de SDKs pesados) ---

async function callOpenAI(config: any, system: string, user: string, tools?: any[], images?: string[]): Promise<LLMResponse> {
    const { encryptedKeys, masterSecret } = useSettingsStore.getState();
    const apiKeyEncrypted = encryptedKeys[config.modelId];

    // Decrypt JIT
    const apiKey = apiKeyEncrypted
        ? await Vault.decryptKey(apiKeyEncrypted, masterSecret)
        : config.apiKey; // Fallback to plain if not migrated

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
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
    const message = data.choices[0].message;

    return {
        content: message.content || "",
        toolCalls: message.tool_calls,
        usage: {
            inputTokens: data.usage.prompt_tokens,
            outputTokens: data.usage.completion_tokens
        }
    };
}

async function callGemini(config: any, system: string, user: string, images?: string[]): Promise<LLMResponse> {
    const { encryptedKeys, masterSecret } = useSettingsStore.getState();
    const apiKeyEncrypted = encryptedKeys[config.modelId];

    // Decrypt JIT
    const apiKey = apiKeyEncrypted
        ? await Vault.decryptKey(apiKeyEncrypted, masterSecret)
        : config.apiKey;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.modelId}:generateContent?key=${apiKey}`;

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{
                parts: [
                    { text: `${system}\n\nUser Task: ${user}` },
                    ...(images || []).map(img => ({
                        inline_data: {
                            mime_type: "image/jpeg", // Assume JPEG or detect from URI
                            data: img.split(',')[1] || img // Simple base64 extraction
                        }
                    }))
                ]
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
async function callCustomOpenAI(config: any, system: string, user: string, tools?: any[], images?: string[]): Promise<LLMResponse> {
    const { encryptedKeys, masterSecret } = useSettingsStore.getState();
    const apiKeyEncrypted = encryptedKeys[config.modelId];

    const apiKey = apiKeyEncrypted
        ? await Vault.decryptKey(apiKeyEncrypted, masterSecret)
        : (config.apiKey || 'no-key');

    const baseUrl = config.baseUrl?.replace(/\/+$/, '') || 'http://localhost:11434/v1';

    const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: config.modelId === 'local-model' ? 'default' : config.modelId,
            messages: [
                { role: 'system', content: system },
                {
                    role: 'user',
                    content: images?.length
                        ? [
                            { type: 'text', text: user },
                            ...images.map(img => ({ type: 'image_url', image_url: { url: img } }))
                        ] as any
                        : user
                }
            ],
            tools: tools?.length ? tools.map(t => ({ type: 'function', function: t })) : undefined,
            temperature: 0.7
        })
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
        throw new Error(`Custom Endpoint Error: ${err.error?.message || res.statusText}`);
    }

    const data = await res.json();
    const message = data.choices[0].message;

    return {
        content: message.content || "",
        toolCalls: message.tool_calls,
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
