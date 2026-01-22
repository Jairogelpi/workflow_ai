# REPORTE DE EJECUCIÓN: ENHANCEMENTS FASE 2 (FOUNDATIONS)

> **Fecha**: 2026-01-22
> **Estado**: COMPLETADO (Technical Core operational)
> **Resumen**: Se han consolidado los pilares de la Fase 2, asegurando que la captura sea fluida, la visualización útil y la seguridad robusta (BYOK).

## 1. El "Wedge" de Captura (Hito 3.4+)
Se ha evolucionado la extensión de Chrome para eliminar la fricción de entrada.
*   **Captura por Selección**: Soporte para `selectionContext` permitiendo enviar fragmentos de texto directamente al Side Panel.
*   **Source Metadata**: Extracción automática de `url`, `title` y `timestamp` para asegurar la trazabilidad.
*   **Archivos**: `extension/src/background/index.ts`, `extension/src/sidepanel/SidePanelViewer.tsx`.

## 2. Gestión Visual (Hito 2.0+)
El grafo ahora es una herramienta de pensamiento, no solo visual.
*   **VisualGraph**: Implementación con ReactFlow permitiendo ver dependencias (`part_of`, `evidence_for`).
*   **Filtros de Estado**: Componente `GraphFilters` para aislar nodos `PIN`, `Validated` o tipos específicos.
*   **Promoción de Nodos**: Lógica en `promoter.ts` para transiciones `Idea -> Decision -> Task`.
*   **Archivos**: `src/components/VisualGraph.tsx`, `src/components/GraphFilters.tsx`, `src/lib/workflow/promoter.ts`.

## 3. Compilación Recursiva (Hito 3.7+)
El pipeline de RLM ahora soporta subdivisiones automáticas.
*   **Planner Recursivo**: Capacidad de subdividir pasos marcados como `complex` hasta 3 niveles de profundidad.
*   **Retriever Selectivo**: Optimización de costos usando `Digests` (resúmenes) para contexto general y `Raw` solo para evidencias críticas o nodos `PIN`.
*   **Archivos**: `src/compiler/planner.ts`, `src/compiler/retriever.ts`, `src/compiler/assembler.ts`.

## 4. BYOK & Seguridad (Hito 2.9)
Gestión soberana de claves de modelos.
*   **Bóveda de Secretos (Vault)**: Cifrado cliente-side (AES-GCM) para `localStorage`. Las claves nunca viajan planas.
*   **Rate Limiting**: Infraestructura `RateLimiter` para gestionar cuotas por usuario.
*   **Archivos**: `src/lib/security/vault.ts`, `src/kernel/security/rate-limiter.ts`.

## 5. El Canon y la Gestión de Invariantes (Hito 0.3+)
Refuerzo de la integridad del Kernel.
*   **Protección de Contradicciones**: El sistema impide activamente establecer relaciones de `contradicción` contra nodos `PIN`.
*   **Staleness Alerts**: Lógica base para detectar nodos obsoletos por tiempo.
*   **Archivos**: `src/kernel/guards.ts`.

---
*Estatus Final: El sistema WorkGraph posee ahora el "Alto Techo" técnico necesario para la siguiente fase de Escalabilidad.*
