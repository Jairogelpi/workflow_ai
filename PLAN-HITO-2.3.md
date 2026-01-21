# PREFLIGHT CHECKLIST: HITO-2.3 The Graph Topology

> **STATUS**: PENDING
> **HITO**: 2.3
> **MODE**: PLANNING

## 1. Context Synchronization
- [x] **Rule Zero**: I have read `PROJECT_CHARTER.md`.
- [x] **The Law**: I have read `canon/03_invariants.md`.
- [x] **The Path**: This task maps directly to `ROADMAP.yml` Hito 2.3.
- [x] **The Stack**: I am strictly using `canon/01_stack.md`.

## 2. Objective & Scope
**Goal**: Implement the core graph interactivity: creating new nodes, connecting them with edges, and mutating their types while maintaining cryptographic integrity and strict typing.

**Scope**:
- [x] **Nodes**: Dynamic creation of `Note` nodes. Type mutation (Note -> Claim, Evidence, Decision, etc.).
- [x] **Edges**: Creation of `relates_to` edges via React Flow connections.
- [x] **Logic**: Integration with `src/kernel/versioning.ts` for hash generation on creation and mutation.

## 3. Implementation Plan
### 3.1 Proposed Changes
- **[MODIFY]** `src/store/useGraphStore.ts`
    - Add `addNode(type: WorkNode['type']): void` action.
    - Update `onConnect` to create a fully typed `WorkEdge`.
    - Add `mutateNodeType(id: string, newType: WorkNode['type']): void` action.
- **[MODIFY]** `src/components/graph/GraphCanvas.tsx`
    - Add a floating mini-menu or button to trigger `addNode`.
    - Ensure `onConnect` is properly wired to the store action.
- **[MODIFY]** `src/components/editor/NodeEditor.tsx`
    - Add a type selector in the header to trigger `mutateNodeType`.

### 3.2 Technical Constraints (Stack)
- [x] Use `createVersion` from `versioning.ts` for all node updates.
- [x] Strict Zod validation of new nodes before adding to state.
- [x] UI/IR Adapters must be used for all store-to-flow conversions.

## 4. Verification Plan (The Gate)
### 4.1 Automated Tests
- [x] `npm run typecheck`
- [x] `npm run build`
- [x] Logic test: Verify that `mutateNodeType` updates the `version_hash`.

### 4.2 Manual Verification
- [x] **Step 1**: Click "Add Node" button.
- [x] **Expected**: A new node appears at the center with a valid UUID and 'Note' type.
- [x] **Step 2**: Drag an edge from the new node to an existing node.
- [x] **Expected**: A persistent edge is created in the store.
- [x] **Step 3**: Change the node type from 'Note' to 'Claim' via the editor header.
- [x] **Expected**: The badge color changes, the store reflects the new 'claim' type, and the `version_hash` is recalculated.

## 5. Definition of Done (Final Filter)
- [x] **Invariant Compliance**: Checked against `canon/03_invariants.md`.
- [x] **Traceability**: All actions generate logs or update metadata.
- [x] **Evidence**: Summary report and ROADMAP update.

---
**Approvals**:
- [ ] **Human Review**: 
