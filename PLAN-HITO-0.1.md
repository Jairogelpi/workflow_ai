# PREFLIGHT CHECKLIST: HITO-0.1 IR Schema Definition

> **STATUS**: APPROVED
> **HITO**: 0.1
> **MODE**: EXECUTION

## 1. Context Synchronization
- [x] **Rule Zero**: I have read `PROJECT_CHARTER.md`.
- [x] **The Law**: I have read `canon/03_invariants.md`.
- [x] **The Path**: This task maps directly to `ROADMAP.yml` Hito 0.1.
- [x] **The Stack**: I am strictly using `canon/01_stack.md`.

## 2. Objective & Scope
**Goal**: Define the foundational **WorkGraph Intermediate Representation (IR)** using strict Zod schemas. This includes the structure for Nodes, Edges, and Metadata, ensuring all data entering the system is strictly typed and validated, fulfilling the "IR First" invariant.

**Scope**:
- [x] **Nodes**: Define generic `WorkNode` and specific types (`Note`, `Task`, `Idea`, `Source`).
- [x] **Edges**: Define `WorkEdge` and relation types (`relates_to`, `blocks`, `evidence_for`).
- [x] **Metadata**: Define `NodeMetadata` (timestamps, hashes, origin).
- [x] **Validation**: Complete Zod schema export for the Kernel.

## 3. Implementation Plan
### 3.1 Proposed Changes
#### [NEW] `src/canon/schema/ir.ts`
- **Purpose**: Central definition of the WorkGraph IR.
- **Content**:
    - `NodeId`, `EdgeId` (Branded types).
    - `NodeMetadataSchema`: Zod schema for common metadata (created_at, updated_at, version_hash, origin).
    - `WorkNodeSchema`: Discriminated union of node types.
    - `WorkEdgeSchema`: Definition of directional edges.
    - `WorkGraphSchema`: The container for the entire graph state.

#### [NEW] `src/canon/schema/index.ts`
- **Purpose**: Barrel file for exporting schemas.

### 3.2 Technical Constraints (Stack)
- [x] Language: TypeScript (Strict) / Zod
- [x] No `any` types.
- [x] No business logic in UI components.
- [x] All data structures defined via Zod.

## 4. Verification Plan (The Gate)
### 4.1 Automated Tests
- [ ] `npm run check`: Verify no TypeScript errors.
- [ ] **Schema Test**: Create `tests/schema.test.ts` to validate:
    - Valid node structures pass.
    - Invalid node structures fail (e.g., missing ID, wrong type).
    - Metadata compliance (origin is required).
    - Command: `npx tsx tests/schema.test.ts` (assuming `tsx` is available or similar runner).

### 4.2 Manual Verification
- [ ] Review `src/canon/schema/ir.ts` against `canon/03_invariants.md` to ensure `origin` (`human` | `ai` | `hybrid`) is enforced.

## 5. Definition of Done (Final Filter)
- [ ] **Invariant Compliance**: "IR First" - Code must define the IR, not just text.
- [ ] **Traceability**: All items have `version_hash` and `origin` in the schema.
- [ ] **Evidence**: The Schema ITSELF is the evidence for Hito 0.1.
- [ ] **Cleanliness**: Prettier + ESLint pass.

---
**Approvals**:
- [ ] **Human Review**: 
