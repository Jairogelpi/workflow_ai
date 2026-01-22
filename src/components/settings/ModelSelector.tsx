import { useSettingsStore } from '../../store/useSettingsStore';

export function ModelSelector() {
    const { modelConfig, setModelConfig, availableModels } = useSettingsStore();

    return (
        <div className="p-4 bg-gray-50 border rounded-lg space-y-3 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                🧠 Motor Dual (TOON Architecture)
            </h3>

            {/* REASONING ENGINE */}
            <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Reasoning Engine (High IQ)</h4>
                <div className="grid gap-2">
                    <select
                        value={modelConfig.reasoningModel.modelId}
                        onChange={(e) => {
                            const model = availableModels.find(m => m.id === e.target.value);
                            if (model) useSettingsStore.getState().updateReasoning({ modelId: model.id, provider: model.provider as any });
                        }}
                        className="w-full p-2 text-sm border rounded bg-white"
                    >
                        {availableModels.map(m => (
                            <option key={m.id} value={m.id}>{m.provider === 'openai' ? '🤖' : '✨'} {m.name}</option>
                        ))}
                    </select>
                    <input
                        type="password"
                        placeholder="API Key (Reasoning)..."
                        value={modelConfig.reasoningModel.apiKey}
                        onChange={(e) => useSettingsStore.getState().updateReasoning({ apiKey: e.target.value })}
                        className="w-full p-2 text-sm border rounded bg-white font-mono"
                    />
                </div>
            </div>

            {/* EFFICIENCY ENGINE */}
            <div className="space-y-2 pt-4 border-t border-dashed">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Efficiency Engine (Low Cost)</h4>
                <div className="grid gap-2">
                    <select
                        value={modelConfig.efficiencyModel.modelId}
                        onChange={(e) => {
                            const model = availableModels.find(m => m.id === e.target.value);
                            if (model) useSettingsStore.getState().updateEfficiency({ modelId: model.id, provider: model.provider as any });
                        }}
                        className="w-full p-2 text-sm border rounded bg-white"
                    >
                        {availableModels.map(m => (
                            <option key={m.id} value={m.id}>{m.provider === 'openai' ? '🤖' : '✨'} {m.name}</option>
                        ))}
                    </select>
                    <input
                        type="password"
                        placeholder="API Key (Efficiency)..."
                        value={modelConfig.efficiencyModel.apiKey}
                        onChange={(e) => useSettingsStore.getState().updateEfficiency({ apiKey: e.target.value })}
                        className="w-full p-2 text-sm border rounded bg-white font-mono"
                    />
                </div>
            </div>

            {/* QUALITY MODE TOGGLE */}
            <div className="space-y-2 pt-4 border-t border-dashed">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Nivel de Fidelidad (RLM)</h4>
                <div className="flex p-1 bg-gray-200 rounded-lg">
                    <button
                        onClick={() => useSettingsStore.getState().setQualityMode('hybrid')}
                        className={`flex-1 py-1 text-[10px] font-bold rounded-md transition ${modelConfig.qualityMode === 'hybrid' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
                    >
                        Híbrido (Económico)
                    </button>
                    <button
                        onClick={() => useSettingsStore.getState().setQualityMode('high-fidelity')}
                        className={`flex-1 py-1 text-[10px] font-bold rounded-md transition ${modelConfig.qualityMode === 'high-fidelity' ? 'bg-white shadow text-purple-600' : 'text-gray-500'}`}
                    >
                        Fidelidad Máxima
                    </button>
                </div>
                <p className="text-[9px] text-gray-400 italic">
                    {modelConfig.qualityMode === 'hybrid'
                        ? 'Usa el motor eficiente para resúmenes (Ahorro del 80%).'
                        : 'Usa el motor de razonamiento para TODO. Evita el efecto "teléfono escacharrado".'}
                </p>
            </div>

            <p className="text-[10px] text-gray-400 pt-2">
                Tu clave se guarda localmente (BYOK). El sistema usará el motor eficiente para el 80% de las tareas si eliges "Híbrido".
            </p>
        </div>
    );
}
