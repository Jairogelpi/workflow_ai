# Hito 4.9: Smart Routing & Price Registry 2026

## Resumen
Sistema de **enrutamiento inteligente** que selecciona automáticamente el modelo LLM óptimo según la complejidad de la tarea, optimizando costes mediante un registro de precios proyectado a 2026.

## Componentes Implementados

### Price Registry
- **src/kernel/observability.ts**: `PRICE_REGISTRY_2026` con costes por millón de tokens para GPT-5.2, Claude 4.5, Gemini 3 Flash, DeepSeek v3, y modelos locales.

### Smart Router
- **src/kernel/llm/gateway.ts**: `SmartRouter` que analiza `TaskComplexity` (LOW/MEDIUM/HIGH) y selecciona el modelo más eficiente.

### Budget Circuit Breaker
- **src/store/useSettingsStore.ts**: `maxCostPerTask` configurable.
- **src/kernel/collaboration/MediatorAgent.ts**: Integración de `performInferenceTask` con predicción de costes.

## Gate de Verificación
✅ SmartRouter selecciona modelo óptimo y el Gateway estima costes antes de las llamadas.

## Evidencia
- `src/kernel/observability.ts`
- `src/kernel/llm/gateway.ts`
