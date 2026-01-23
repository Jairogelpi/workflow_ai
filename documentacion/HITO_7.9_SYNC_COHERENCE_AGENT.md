# Hito 7.9: Sync Coherence Agent (SyncGuardian)

## Descripción
El Agente de Coherencia de Sincronización (`SyncGuardian`) actúa como el sistema inmunológico del grafo. Intercepta cada mutación y la valida contra el SAT Solver antes de permitir su persistencia en el Canon.

## Componentes Implementados

### Kernel
- **`SyncGuardian.ts`**: Guardián de mutaciones que orquesta validación SAT y auditoría RLM.

### UI
- **`SensoryRipple.tsx`**: Overlay de pantalla completa para feedback sensorial (Error: Rojo, OK: Cian).

### Store
- **`useGraphStore.ts`**: 
  - Nuevo estado `currentRipple` para feedback visual.
  - Acción `triggerRipple` para disparar ondas sensoriales.
  - Hooks de `SyncGuardian` en `updateNodeContent`, `onConnect`, y `mutateNodeType`.

## Flujo de Operación
1. Una mutación de nodo/edge dispara `SyncGuardian.handleMutation()`.
2. Se aplica el delta CRDT (sincronización multi-usuario).
3. Se ejecuta validación SAT para detectar colisiones lógicas.
4. Si hay conflicto: `triggerRipple('error')` → Onda roja en pantalla.
5. Si el cambio es significativo: RLM Shadow Audit en segundo plano.

## Feedback Sensorial
- **Atmospheric Pulse (Cian)**: Sincronización CRDT exitosa.
- **Neural Ripple (Rojo)**: Violación de invariante PIN.
- **Amber Pulse**: Deriva semántica detectada (requiere revisión).

## Tecnologías
- **CRDT (crdt-sync)**: Consistencia eventual sin conflictos.
- **SAT Solver (logic-engine)**: Verificación de invariantes en tiempo real.
- **CSS Animations**: Ondas de expansión para feedback táctil.

## Verificación
- [x] Mutaciones rechazadas si contradicen PINs.
- [x] Feedback visual instantáneo en conflictos.
- [x] Auditoría semántica no bloqueante para cambios significativos.
