// ... Imports
import { traceSpan, measureCost, estimateCallCost, getModelTier, auditStore } from '../observability';
import { useSettingsStore } from '../../store/useSettingsStore';
import { Vault } from '../../lib/security/vault';
import { sanitizeLogs } from '../guards';
import { PriceRegistry, TaskTier as EconomyTier } from '../economy/PriceRegistry';

// ... (Existing Imports)

// ... (Existing Functions until generateText)

export async function generateText(
    systemPrompt: string,
    userPrompt: string,
    tier: TaskTier = 'REASONING',
    tools?: any[],
    images?: string[],
    projectId: string = 'global-system' // Context-aware default, effectively "System Overhead"
): Promise<{ content: string; toolCalls?: any[] }> {
    const { modelConfig } = useSettingsStore.getState();

    // [PRICE REGISTRY] Dynamic Model Selection override if enabled
    // For now, we respect the User Settings, but we could enforce Registry here.
    // Let's use Registry for Cost Tracking primarily.

    // Smart Routing Logic
    const activeConfig = tier === 'REASONING'
        ? modelConfig.reasoningModel
        : modelConfig.efficiencyModel;

    // ... (Auth Checks)
    if (!activeConfig.apiKey) {
        throw new Error(`⚠️ API Key no configurada para el motor de ${tier}. Ve a ajustes.`);
    }

    // PRE-FLIGHT COST ESTIMATION (Legacy)
    const estimatedCost = predictCost(systemPrompt, userPrompt, activeConfig.modelId);

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

        // --- REAL COST TRACKING VIA PRICE REGISTRY ---
        // Dynamically attributed to the active project
        await PriceRegistry.trackTransaction({
            projectId,
            operation: `generate_${tier.toLowerCase()}`,
            model: activeConfig.modelId,
            inputTokens: response.usage.inputTokens,
            outputTokens: response.usage.outputTokens,
            metadata: { provider: activeConfig.provider }
        });

        const logMsg = `[LLM GATEWAY] Call Completed | Model: ${activeConfig.modelId} | In/Out: ${response.usage.inputTokens}/${response.usage.outputTokens} | Project: ${projectId}`;
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
