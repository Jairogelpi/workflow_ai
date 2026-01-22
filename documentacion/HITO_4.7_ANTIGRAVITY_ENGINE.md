# Hito 4.7: Antigravity Engine (Rust/WASM)

## Resumen
Motor de física de alto rendimiento escrito en **Rust** y compilado a **WebAssembly** para ejecutar cálculos vectoriales de grafos a 60 FPS sin bloquear el hilo principal de JavaScript.

## Componentes Implementados

### antigravity-engine/
- **src/lib.rs**: Implementación de `apply_forces` usando `wasm-bindgen` y `glam` para aritmética vectorial.
- **Cargo.toml**: Dependencias de Rust para WASM.

### Main App
- **src/hooks/useAntigravityEngine.ts**: Hook de React que inicializa el módulo WASM y aplica fuerzas al grafo.
- **src/types/antigravity-engine.d.ts**: Declaraciones de tipo para el módulo WASM.

## Gate de Verificación
✅ Las fuerzas del grafo se calculan en WASM sin bloquear el hilo de UI.

## Evidencia
- `antigravity-engine/src/lib.rs`
- `src/hooks/useAntigravityEngine.ts`
- `src/types/antigravity-engine.d.ts`
