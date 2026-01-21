# PREFLIGHT CHECKLIST: HITO-2.2 The Deep Editor

> **STATUS**: APPROVED
> **HITO**: 2.2
> **MODE**: EXECUTION

## 1. Objective
**Goal**: Completar la sincronización bidireccional entre `NodeEditor` (TipTap) y `useGraphStore`. Añadir debounce, observabilidad (`updated_at`), y UX mejorada (header con tipo de nodo).

## 2. Canon Compliance Check
- [x] Stack: Next.js 15, React 19, TypeScript Strict, Zod ✓
- [x] Invariants: Immutable state updates, no direct AI calls ✓
- [x] Sequential: Hito 2.1 completed ✓

## 3. Scope Analysis (Already Implemented in 2.1)
| Feature | Status |
|---------|--------|
| `updateNodeContent` action | ✅ Done |
| `selectedNodeId` tracking | ✅ Done |
| Editor reads from selected node | ✅ Done |
| Editor writes to store on update | ✅ Done |
| Placeholder when no node | ✅ Done |

## 4. Implementation Plan (Remaining Work)

### 4.1 Add Debounce to Editor Updates
**File**: `src/components/editor/NodeEditor.tsx`
- Add `useMemo`-based debounce (300ms) to prevent store saturation during typing
- Use lodash-es debounce or custom hook

### 4.2 Update `metadata.updated_at` on Content Change
**File**: `src/store/useGraphStore.ts`
- Modify `updateNodeContent` to set `metadata.updated_at = new Date().toISOString()`
- Ensures traceability per Canon requirements

### 4.3 UX: Show Node Type in Editor Header
**File**: `src/components/editor/NodeEditor.tsx`
- Display badge with node type (Claim, Evidence, Note, etc.)
- Capitalize and style appropriately

## 5. Verification Plan

### 5.1 Manual Verification
1. Run `npm run dev`
2. Click on a node in the graph -> Editor loads content ✓
3. Type in editor -> Wait 300ms -> Check console/DevTools for store update
4. Switch nodes -> Editor content changes instantly
5. Verify header shows correct node type badge

### 5.2 Build Verification
```bash
npm run typecheck  # Must pass
npm run build      # Must pass
```

## 6. Definition of Done
- [x] Debounce prevents rapid-fire store updates
- [x] `metadata.updated_at` auto-updates on edit
- [x] Node type badge visible in editor header
- [x] All verification steps pass
