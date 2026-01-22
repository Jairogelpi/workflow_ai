import { useSettingsStore, ModelConfig } from '../../store/useSettingsStore';
import { verifyEndpoint } from '../../kernel/llm/gateway';
import { useState } from 'react';
import { Check, X, Shield, Activity, Globe } from 'lucide-react';

export function ModelSelector() {
    const { modelConfig, availableModels } = useSettingsStore();
    const [verifying, setVerifying] = useState<{ reasoning: boolean; efficiency: boolean }>({ reasoning: false, efficiency: false });
    const [verifResult, setVerifResult] = useState<{ reasoning: string | null; efficiency: string | null }>({ reasoning: null, efficiency: null });

    const handleVerify = async (tier: 'reasoning' | 'efficiency') => {
        const config = tier === 'reasoning' ? modelConfig.reasoningModel : modelConfig.efficiencyModel;
        if (!config.baseUrl) return;

        setVerifying(prev => ({ ...prev, [tier]: true }));
        setVerifResult(prev => ({ ...prev, [tier]: null }));

        const result = await verifyEndpoint(config.baseUrl, config.apiKey);

        setVerifResult(prev => ({ ...prev, [tier]: result.success ? 'OK' : result.message }));
        setVerifying(prev => ({ ...prev, [tier]: false }));
    };

    const renderModelConfig = (tier: 'reasoning' | 'efficiency', title: string, model: ModelConfig, updateFn: (u: Partial<ModelConfig>) => void) => (
        <div className="space-y-2 pt-2">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">{title}</h4>
            <div className="grid gap-2">
                <select
                    value={model.modelId}
                    onChange={(e) => {
                        const m = availableModels.find(opt => opt.id === e.target.value);
                        if (m) updateFn({ modelId: m.id, provider: m.provider as any });
                    }}
                    className="w-full p-2 text-sm border rounded bg-white"
                >
                    {availableModels.map(m => (
                        <option key={m.id} value={m.id}>{m.provider === 'openai' ? '🤖' : m.provider === 'local' ? '🏠' : '✨'} {m.name}</option>
                    ))}
                </select>

                {model.provider === 'local' && (
                    <div className="space-y-1">
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Globe className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="http://localhost:11434/v1"
                                    value={model.baseUrl || ''}
                                    onChange={(e) => updateFn({ baseUrl: e.target.value })}
                                    className="w-full pl-8 p-2 text-xs border rounded bg-white font-mono"
                                />
                            </div>
                            <button
                                onClick={() => handleVerify(tier)}
                                disabled={verifying[tier] || !model.baseUrl}
                                className="px-3 py-1 bg-blue-50 text-blue-600 rounded border border-blue-100 text-[10px] font-bold hover:bg-blue-100 disabled:opacity-50"
                            >
                                {verifying[tier] ? <Activity className="h-3 w-3 animate-spin" /> : 'Verificar'}
                            </button>
                        </div>
                        {verifResult[tier] && (
                            <p className={`text-[9px] flex items-center gap-1 ${verifResult[tier] === 'OK' ? 'text-green-600' : 'text-red-500'}`}>
                                {verifResult[tier] === 'OK' ? <Check className="h-2.5 w-2.5" /> : <X className="h-2.5 w-2.5" />}
                                {verifResult[tier] === 'OK' ? 'Estándar OpenAI verificado' : verifResult[tier]}
                            </p>
                        )}
                    </div>
                )}

                <input
                    type="password"
                    placeholder={model.provider === 'local' ? "API Key (opcional en local)..." : `API Key (${model.provider})...`}
                    value={model.apiKey}
                    onChange={(e) => updateFn({ apiKey: e.target.value })}
                    className="w-full p-2 text-sm border rounded bg-white font-mono"
                />
            </div>
        </div>
    );

    return (
        <div className="p-4 bg-gray-50 border rounded-lg space-y-3 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                🏠 Motor Híbrido / Local (Privacy Mode)
            </h3>

            {renderModelConfig('reasoning', 'Reasoning Engine (High IQ)', modelConfig.reasoningModel, useSettingsStore.getState().updateReasoning)}

            <div className="border-t border-dashed mt-4" />

            {renderModelConfig('efficiency', 'Efficiency Engine (Low Cost)', modelConfig.efficiencyModel, useSettingsStore.getState().updateEfficiency)}

            {/* QUALITY MODE TOGGLE */}
            <div className="space-y-2 pt-4 border-t border-dashed">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest text-center flex items-center justify-center gap-1">
                    <Shield className="h-3 w-3" /> Nivel de Fidelidad (RLM)
                </h4>
                <div className="flex p-1 bg-gray-200 rounded-lg">
                    <button
                        onClick={() => useSettingsStore.getState().setQualityMode('hybrid')}
                        className={`flex-1 py-1 text-[10px] font-bold rounded-md transition ${modelConfig.qualityMode === 'hybrid' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
                    >
                        Híbrido (Optimizado)
                    </button>
                    <button
                        onClick={() => useSettingsStore.getState().setQualityMode('high-fidelity')}
                        className={`flex-1 py-1 text-[10px] font-bold rounded-md transition ${modelConfig.qualityMode === 'high-fidelity' ? 'bg-white shadow text-purple-600' : 'text-gray-500'}`}
                    >
                        Privacidad / Calidad Máxima
                    </button>
                </div>
            </div>

            <p className="text-[10px] text-gray-400 pt-2 text-center">
                Tus datos nunca salen de tu máquina si usas un modelo local. BYOK + BYOE.
            </p>
        </div>
    );
}
