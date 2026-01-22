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

## 4. Gestión de Entorno (.env)

**¿Qué necesito configurar en mi .env?**
**NADA para las API Keys.**

Al adoptar un modelo **BYOK (Bring Your Own Key)** Client-Side:
1.  Las claves se guardan en el navegador del usuario (`localStorage`).
2.  No necesitas `OPENAI_API_KEY` ni `GEMINI_API_KEY` en tu servidor.
3.  Esto reduce el riesgo de seguridad y el coste operativo del despliegue.

Solo asegúrate de que tu `VITE_SERVER_URL` esté correcto si despliegas en producción.
