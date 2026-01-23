# Hito 7.8: Self-Healing Engine & Alignment Protocol

## Descripción
El motor de auto-curación (Self-Healing Engine) combina el solucionador SAT de Rust con el enjambre RLM para detectar y reparar inconsistencias estructurales y semánticas en el grafo de conocimiento.

## Componentes Implementados

### Kernel
- **`alignment_engine.ts`**: Orquestador de alineación híbrida (SAT + RLM).
- **`guards.ts`**: Validación de PINs e invariantes con nuevo soporte para `AUTOCOMPLETE`.

### UI
- **`AlignmentOverlay.tsx`**: HUD forense mostrando el estado de alineación y "Ghost Nodes".
- **`AlignmentTunnels.tsx`**: Visualización de conexiones latentes entre nodos proyectados.

### Store
- **`useGraphStore.ts`**: Nuevo estado `alignmentReport`, `ghostNodes`, y acción `materializeGhost`.

## Flujo de Operación
1. El usuario dispara una auditoría de alineación (`performAlignmentCheck`).
2. El SAT Solver de Rust verifica la consistencia de PINs.
3. El RLM analiza la cobertura semántica de los Digests.
4. Los "gaps" se proyectan como Ghost Nodes (nodos ámbar parpadeantes).
5. El usuario puede "materializar" un Ghost Node con un clic, firmándolo criptográficamente.

## Tecnologías
- **Rust (logic-engine)**: SAT Solver para detección de contradicciones lógicas.
- **RLM Core**: Análisis semántico de deriva entre ramas.
- **Ed25519 (signer-core)**: Firma de autoridad para nodos materializados.

## Verificación
- [x] Detección de gaps por violación de PIN.
- [x] Proyección visual de Ghost Nodes.
- [x] Materialización firmada con trazabilidad forense.
