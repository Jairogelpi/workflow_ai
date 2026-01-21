# PREFLIGHT CHECKLIST: HITO-2.4 The Browser & Discovery

> **STATUS**: PENDING
> **HITO**: 2.4
> **MODE**: PLANNING

## 1. Context Synchronization
- [x] **Rule Zero**: I have read `PROJECT_CHARTER.md`.
- [x] **The Law**: I have read `canon/03_invariants.md`. Enforcing **IR First** and **Traceability**.
- [x] **The Path**: This task maps directly to `ROADMAP.yml` Hito 2.4.
- [x] **The Stack**: Strictly React 19 + Next.js 15 + Zustand + Tailwind.

## 2. Objective & Scope
**Goal**: Implement the "Discovery Engine" of WorkGraph OS. A sidebar that enables navigating the graph through logical clustering, trust-based search, and real-time synchronization with the canvas and editor.

**Scope**:
- [x] **Sidebar Layout**: A persistent, collapsible left panel.
- [x] **Discovery Features**:
    - **Smart Search**: Real-time fuzzy filter on node content, type, and IDs. 
    - **Trust-Integrated Tree View**: Grouped by node type with status indicators (`validated`, `confidence`, `origin`).
    - **Referential Navigation**: Clicking a node in the sidebar triggers `setSelectedNode` and `centerNode` in the graph.
- [x] **Performance**: Ensure UI response remains under the **100ms** invariant budget.

## 3. Implementation Plan
### 3.1 Proposed Changes
- **[NEW]** `src/components/layout/Sidebar.tsx`
    - Vertical layout with Search Input and Scrollable List.
    - Integrated logic for node grouping (utilizing `WorkNode['type']`).
- **[NEW]** `src/components/layout/NodeListItem.tsx`
    - Dedicated component for trust-heavy list items (shows badge + confidence + validation state).
- **[MODIFY]** `src/app/page.tsx`
    - Update layout to: Sidebar (Left) | Graph Canvas (Center) | Editor (Right).
- **[MODIFY]** `src/store/useGraphStore.ts`
    - Add `searchQuery: string` to state.
    - Add `setSearchQuery(q: string): void`.
    - Implement `centerNode(id: string): void` (Centers view on specific node).

### 3.2 Technical Constraints
- [x] **Zod Validation**: No UI state bypasses IR schemas.
- [x] **Traceability**: Sidebar hover must display `version_hash` truncated (observability).
- [x] **Atomic States**: Sidebar selection must trigger atomic store updates.

## 4. Verification Plan (The Gate)
### 4.1 Automated Tests
- [x] `npm run typecheck`
- [x] `npm run build`
- [x] Store Integrity Check: Run `tests/schema.test.ts` to ensure no schema regressions during store updates.

### 4.2 Manual Verification
- [x] **Scenario: Discovery Efficiency**
    - **Action**: Type "Claim" in Search.
    - **Result**: Sidebar only shows `Claim` nodes. Status badges (checkmarks/color dots) are visible.
- [x] **Scenario: Graph Sync**
    - **Action**: Click a node at the bottom of the list.
    - **Result**: Graph Canvas pans to that node, centers it, and Node Editor loads its content instantly.

## 5. Definition of Done
- [x] Sidebar fulfills the **Discovery Engine** vision.
- [x] Search matches are highlighted.
- [x] Metadata indicators (validation, confidence) visible in discovery view.
- [x] Latency feels local-first (<100ms).
- [x] Summary report generated.

---
**Approvals**:
- [ ] **Human Review**: 
