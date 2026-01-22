# Hito 4.11: Forensic Audit View

## Resumen
**Consola de Auditoría en Vivo** integrada en el SidePanel de la extensión. Muestra en tiempo real cada operación del sistema, incluyendo latencia, coste y motor utilizado.

## Componentes Implementados

### Extension SidePanel
- **extension/src/hooks/useAuditStream.ts**: Hook que se suscribe al GraphStore y mantiene un historial de logs.
- **extension/src/components/SidePanelAuditView.tsx**: UI tipo "Black Box" con métricas en tiempo real.
- **extension/src/sidepanel/SidePanelViewer.tsx**: Pestañas "Knowledge" y "Forensic Audit".

### Kernel Observability
- **src/kernel/observability.ts**: `traceSpan` ahora emite a `useGraphStore.recordAudit` para alimentar la UI.
- **src/store/useGraphStore.ts**: `lastAuditRecord` y `recordAudit` action.

### OTel Refinado
- **otel-config.yaml**: Configuración con `memory_limiter`, endpoints definidos, y exportador a Jaeger.

## Gate de Verificación
✅ El usuario puede ver cada `traceSpan` en la pestaña "Forensic Audit".

## Evidencia
- `otel-config.yaml`
- `extension/src/hooks/useAuditStream.ts`
- `extension/src/components/SidePanelAuditView.tsx`
- `src/kernel/observability.ts`
