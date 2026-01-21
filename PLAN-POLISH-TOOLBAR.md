# PREFLIGHT CHECKLIST: POLISH-NODE-TOOLBAR

> **STATUS**: PENDING
> **HITO**: 2.3/2.4 Polish
> **MODE**: PLANNING

## 1. Context Synchronization
- [x] **Rule Zero**: I have read `PROJECT_CHARTER.md`.
- [x] **The Law**: I have read `canon/03_invariants.md`.
- [x] **The Path**: This polish fulfills the "Conversión de Tipos" requirement from `00_idea.md`.

## 2. Objective & Scope
**Goal**: Implement a floating toolbar that appears above a selected node. This toolbar allows the user to instantly mutate the node's type (e.g., from Note to Claim or Decision) without having to move their attention to the side editor.

**Scope**:
- [x] **UI**: A small, glassmorphism-styled floating bar.
- [x] **Interactions**: Buttons for key node types (Note, Claim, Evidence, Decision, Idea).
- [x] **Logic**: Wiring to `mutateNodeType` in `useGraphStore`.

## 3. Implementation Plan
### 3.1 Proposed Changes
- **[MODIFY]** `src/components/graph/GraphCanvas.tsx`
    - Use React Flow's `<NodeToolbar />` component (or a custom absolute container).
    - Render icons/buttons for each type.
    - Style with dark-mode aesthetic (slate/glass).
- **[MODIFY]** `src/store/useGraphStore.ts`
    - Ensure `mutateNodeType` is robust and exports properly. (Already done in 2.3).

## 4. Verification Plan
### 4.1 Manual Verification
- [x] Select a node.
- [x] Click the "Claim" icon in the floating toolbar.
- [x] **Expected**: Node badge in Sidebar and Editor changes immediately, and node color/icon in Graph reflects the new type.

## 5. Definition of Done
- [x] Toolbar appears/disappears on selection.
- [x] Buttons trigger re-hashed type mutation.
- [x] UI remains under 100ms latency budget.
