# PREFLIGHT CHECKLIST: HITO-2.1 The Wiring (Type Integration)

> **STATUS**: APPROVED
> **HITO**: 2.1
> **MODE**: EXECUTION

## 1. Context Synchronization
- [x] **Rule Zero**: I have read `PROJECT_CHARTER.md`.
- [x] **The Law**: I have read `canon/03_invariants.md`.
- [x] **The Path**: This task maps directly to `ROADMAP.yml` Hito 2.1.
- [x] **The Stack**: I am strictly using `canon/01_stack.md` (TS Strict + Zustand).

## 2. Objective & Scope
**Goal**: Eliminar `any` del frontend. El estado de Zustand y React Flow debe estar estrictamente tipado usando los esquemas de `src/canon/schema/ir.ts`.

**Scope**:
- [ ] **Type Integration**: Importar `WorkNode` y `WorkEdge` al Store.
- [ ] **State Schema**: Definir `AppNode` (Node & { data: WorkNode }) y `AppEdge`.
- [ ] **Adapters**: Implementar funciones de transformación entre el formato del grafo y el IR del Kernel.
- [ ] **Editor Sync**: Conectar TipTap con el nodo seleccionado en el store.

## 3. Implementation Plan
### 3.1 Proposed Changes
- **[MODIFY]** `src/store/useGraphStore.ts`: Replace `any` with strict types. Add actions for node selection and content updates.
- **[NEW]** `src/lib/adapters.ts`: Logic to translate between React Flow and Kernel IR.
- **[MODIFY]** `src/components/editor/NodeEditor.tsx`: Integrate with `useGraphStore`.
- **[MODIFY]** `src/components/graph/GraphCanvas.tsx`: Ensure types are respected in React Flow props.

### 3.2 Technical Constraints (Stack)
- [ ] No `any`.
- [ ] Strict TypeScript properties for nodes.
- [ ] Zod validation during adapter transformation (optional but recommended).

## 4. Verification Plan (The Gate)
### 4.1 Automated Tests
- [ ] `npm run build` (Next.js build checks types).
- [ ] `tsc --noEmit` on the project root.

### 4.2 Manual Verification
- [ ] Change a node's content in the editor and verify it persists in the graph view.
- [ ] Verify that adding an invalid node type (non-claim/evidence/etc) causes a TS error.

## 5. Definition of Done (Final Filter)
- [ ] **Invariant Compliance**: Checked against `canon/03_invariants.md`.
- [ ] **No Any**: Final check for `any` usage in edited files.
- [ ] **Closure**: Update Hito 2.1 in Roadmap.
