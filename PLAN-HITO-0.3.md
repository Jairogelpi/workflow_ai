# PREFLIGHT CHECKLIST: HITO-0.3 PIN Enforcement

> **STATUS**: APPROVED
> **HITO**: 0.3
> **MODE**: EXECUTION

## 1. Context Synchronization
- [x] **Rule Zero**: I have read `PROJECT_CHARTER.md`.
- [x] **The Law**: I have read `canon/03_invariants.md`.
- [x] **The Path**: This task maps directly to `ROADMAP.yml` Hito 0.3.
- [x] **The Stack**: I am strictly using `canon/01_stack.md`.

## 2. Objective & Scope
**Goal**: Implementar la capa de "Guardias" del Kernel. Esta capa intercepta cualquier intento de escritura (modificar/borrar) y rechaza la operación si viola un invariante (PIN) o la integridad referencial.

**Scope**:
- [ ] **Protection Logic**: Crear `src/kernel/guards.ts`.
- [ ] **Invariant Rules**:
    1.  **Immutable PINs**: No se puede editar/borrar un nodo con `metadata.pin: true` sin desmarcarlo primero explícitamente.
    2.  **Dependency Safety**: No se puede borrar un nodo si otros nodos dependen de él (edges entrantes).
- [ ] **Observability**: **MANDATORY**. Cada rechazo (Block) debe emitir un log estructurado (Audit Event).

## 3. Implementation Plan
### 3.1 Proposed Changes
#### [NEW] `src/kernel/guards.ts`
- **Purpose**: Central Authority for modification permissions.
- **Functions**:
    - `canModifyNode(node: WorkNode, actor: string): { allowed: boolean; reason?: string }`
    - `canDeleteNode(node: WorkNode, graph: WorkGraph, actor: string): { allowed: boolean; reason?: string }`
- **Observability**:
    - Implementar un `KernelLogger` simple (console wrapper por ahora, pero estructurado).
    - Loggear cada chequeo fallido: `[BLOCK] Attempt to modify PIN node ${id} by ${actor}`.

#### [MODIFY] `src/kernel/index.ts`
- Exportar las nuevas guardias.

### 3.2 Technical Constraints
- [ ] **Fail-Safe**: Ante la duda, la operación se deniega (`false`).
- [ ] **Performance**: La verificación de dependencias debe ser eficiente (O(1) o O(N) local, no recorrer todo el historial).

## 4. Verification Plan (The Gate)
### 4.1 Automated Tests
- [ ] `tests/guards.test.ts`:
    - Intentar modificar un nodo PIN -> Debe fallar.
    - Intentar borrar un nodo con dependencias -> Debe fallar.
    - Intentar borrar un nodo libre -> Debe pasar.
    - Verificar que los logs de "BLOCK" se emiten (spyOn console).

## 5. Definition of Done
- [ ] **Gate**: DB/Kernel constraints preventing contradiction of PIN nodes.
- [ ] **Evidence**: Tests de "Guardia" pasando.
- [ ] **Observability**: Logs visibles en los tests.
