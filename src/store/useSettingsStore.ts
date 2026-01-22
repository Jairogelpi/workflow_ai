import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ModelConfig {
    provider: 'openai' | 'gemini' | 'anthropic';
    modelId: string;
    apiKey: string;
}

export interface DualModelConfig {
    reasoningModel: ModelConfig;
    efficiencyModel: ModelConfig;
}

interface SettingsState {
    modelConfig: DualModelConfig;
    setModelConfig: (updates: Partial<DualModelConfig | { reasoningModel: Partial<ModelConfig>, efficiencyModel: Partial<ModelConfig> }>) => void;
    availableModels: Array<{ id: string; name: string; provider: string }>;
    updateReasoning: (update: Partial<ModelConfig>) => void;
    updateEfficiency: (update: Partial<ModelConfig>) => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            modelConfig: {
                reasoningModel: { provider: 'openai', modelId: 'gpt-4o', apiKey: '' },
                efficiencyModel: { provider: 'gemini', modelId: 'gemini-1.5-flash', apiKey: '' }
            },
            availableModels: [
                { id: 'gpt-4o', name: 'GPT-4o (Omni)', provider: 'openai' },
                { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openai' }, // Legacy reasoning
                { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'gemini' },
                { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'gemini' },
                { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'anthropic' },
            ],
            setModelConfig: (updates) => set((state) => ({ modelConfig: { ...state.modelConfig, ...updates } as any })),
            updateReasoning: (update) => set((state) => ({
                modelConfig: { ...state.modelConfig, reasoningModel: { ...state.modelConfig.reasoningModel, ...update } }
            })),
            updateEfficiency: (update) => set((state) => ({
                modelConfig: { ...state.modelConfig, efficiencyModel: { ...state.modelConfig.efficiencyModel, ...update } }
            })),
        }),
        { name: 'workgraph-settings' }
    )
);
