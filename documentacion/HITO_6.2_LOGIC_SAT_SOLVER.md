# Hito 6.2: Logic SAT Solver

## Resumen
Motor de **resolución de restricciones SAT** para verificar la consistencia lógica de PINs en grafos masivos. Detecta contradicciones y dependencias rotas en milisegundos.

## Arquitectura

### logic-engine/
- **Cargo.toml**: Dependencias `varisat` (SAT solver), `wasm-bindgen`.
- **src/lib.rs**: Implementación del solver SAT.

### Lógica de Verificación

El motor convierte las **relaciones del grafo** en **cláusulas SAT**:

| Relación | Cláusula SAT | Significado |
|----------|-------------|-------------|
| `supports` | ¬A ∨ B | Si A es verdadero, B debe serlo |
| `contradicts` | ¬A ∨ ¬B | A y B no pueden ser ambos verdaderos |
| `blocks` | A → ¬B | Si A es verdadero, B debe ser falso |
| `depends_on` | ¬A ∨ B | A requiere que B sea verdadero |

Los **nodos PIN** se fuerzan como verdaderos (invariantes del sistema).

### Función Principal

```typescript
import init, { check_pin_consistency } from 'logic-engine';

await init();

const graph = JSON.stringify({
  nodes: [{ id: 'n1', is_pin: true }, { id: 'n2', is_pin: false }],
  edges: [{ source: 'n2', target: 'n1', relation: 'contradicts' }]
});

const result = JSON.parse(check_pin_consistency(graph));
// { consistent: false, violations: ["CRITICAL: Node 'n2' contradicts PIN node 'n1'"], checked_constraints: 2 }
```

## Gate de Verificación
✅ `check_pin_consistency` detecta contradicciones conocidas.

## Evidencia
- `logic-engine/src/lib.rs`
- `src/types/logic-engine.d.ts`
