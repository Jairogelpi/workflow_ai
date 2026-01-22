# Hito 3.7: The Brain Transplant (Real LLM & Smart Routing)

## 1. Visión General
En este hito hemos transformado WorkGraph OS de un prototipo teórico a un **Sistema Neuro-Simbólico Vivo**. Hemos reemplazado los "stubs" deterministas con una integración real de LLMs, pero aplicando una arquitectura estricta de **Smart Routing** para viabilidad económica.

## 2. Arquitectura de 3 Capas
Para cumplir con la regla de "Observabilidad Obligatoria", hemos diseñado el sistema en tres capas estancas:

### Capa 1: Configuración (Store)
- **Archivo**: `src/store/useSettingsStore.ts`
- **Responsabilidad**: Gestión segura de secretos (BYOK).
- **Persistencia**: LocalStorage (navegador). Las claves NUNCA tocan nuestro backend, van directo del cliente al proveedor (OpenAI/Gemini).
- **Dual Engine**: Configuración separada para:
    - **Reasoning Engine**: Modelos de alto IQ (GPT-4o, Claude 3.5).
    - **Efficiency Engine**: Modelos rápidos/baratos (Gemini Flash).

### Capa 2: Gateway (Kernel)
- **Archivo**: `src/kernel/llm/gateway.ts`
- **Responsabilidad**: "Aduana" de inteligencia.
- **Función Clave**: `generateText(system, user, tier)`
- **Observabilidad**: Envuelve CADA llamada en:
    - `traceSpan`: Medición de latencia y éxito/error.
    - `measureCost`: Cálculo en tiempo real del gasto ($) basado en tokens.

### Capa 3: Aplicación (Compiler)
- **Archivo**: `src/compiler/planner.ts` & `src/compiler/assembler.ts`
- **Responsabilidad**: Lógica de negocio pura.
- **Abstracción**: El compilador NO sabe qué modelo usa ni cuánto cuesta. Solo pide "pensar" o "resumir".

## 3. Smart Routing & RLM (Recursive Language Modeling)

### La Estrategia "TOON" Económica
Para generar documentos infinitos sin quebrar la banca, usamos un bucle recursivo:

1.  **Generación (Reasoning Tier)**: Gasto alto. Se usa para escribir la sección actual con máxima calidad.
2.  **Compresión (Efficiency Tier)**: Gasto mínimo (1/20 del coste). Se usa para crear un "Digest" (resumen denso) de lo escrito.
3.  **Recursión**: El paso N+1 recibe solo el Digest del paso N, manteniendo la ventana de contexto limpia constantemente.

**Código Clave (`assembler.ts`):**
```typescript
for (const step of plan.steps) {
    // 1. Escribir con cerebro caro
    const content = await generateText(..., 'REASONING');
    
    // 2. Resumir con cerebro barato
    const digest = await generateText(..., 'EFFICIENCY');
    
    // 3. Continuar
    previousDigest = digest;
}
```

## 5. Optimizaciones de Sinceridad Técnica

### TOON (Topology Optimized Object Navigation)
Para evitar alucinaciones, hemos reemplazado la selección arbitraria de nodos por un algoritmo de **Filtrado Topológico**:
- El Assembler analiza los `required_context_keys` del Plan.
- Solo los nodos que contienen esas palabras clave en su contenido (Claim, Rationale, Evidence, etc.) son inyectados en el prompt.
- Esto garantiza que la IA siempre vea la información relevante, independientemente de su posición en el grafo.

### Control de Calidad (Fidelity Mode)
Para mitigar el efecto **"Teléfono Escacharrado"** o **"Amnesia de Alta Calidad"** en documentos extremadamente largos:
- **Modo Híbrido**: "Un Ferrari (GPT-4) conducido por un profesional, pero con un copiloto que ha perdido las gafas (Gemini Flash) leyendo el mapa". Máximo ahorro. La sutileza puede perderse en los resúmenes acumulados.
- **Modo Fidelidad Máxima**: "Dos pilotos expertos controlando cada metro de la pista". Máxima coherencia. Usa el motor potente para el 100% de la cadena RLM, asegurando que ni un solo matiz se pierda en la recursión.

> [!WARNING]
> En el Modo Híbrido, si el modelo eficiente no captura el matiz de una genialidad escrita por el modelo de razonamiento, esa información se pierde para los pasos posteriores del plan. Úsalo solo cuando la coherencia tonal absoluta no sea crítica.

---
*Este hito cierra el ciclo de Gate 9, dotando a WorkGraph OS de autonomía cognitiva, eficiencia económica y estabilidad topológica.*
