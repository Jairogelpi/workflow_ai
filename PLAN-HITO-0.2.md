# PREFLIGHT CHECKLIST: HITO-0.2 Versioning Engine

> **STATUS**: APPROVED
> **HITO**: 0.2
> **MODE**: EXECUTION

## 1. Context Synchronization
- [x] **Rule Zero**: I have read `PROJECT_CHARTER.md`.
- [x] **The Law**: I have read `canon/03_invariants.md`.
- [x] **The Path**: This task maps directly to `ROADMAP.yml` Hito 0.2.
- [x] **The Stack**: I am strictly using `canon/01_stack.md`.

## 2. Objective & Scope
**Goal**: Implement the **Versioning Engine** (The "Git" of WorkGraph). This component ensures that every change in the graph is cryptographically verifiable, traceable, and immutable. It enables time-travel and audit trails by linking every node state to a specific `version_hash` derived from its content and its parent version.

**Scope**:
- [ ] **Hashing**: Implement deterministic SHA-256 hashing for Node content.
- [ ] **Deltas**: Logic to compute the difference between two Node states.
- [ ] **Versioning Logic**: `computeNextVersion(info: { previous_hash: string, content: NodeContent })`.
- [ ] **Verification**: Ensure that `Hash(Content + Previous) === CurrentHash`.

## 3. Implementation Plan
### 3.1 Proposed Changes
#### [NEW] `src/kernel/versioning.ts`
- **Purpose**: Core logic for version control.
- **Functions**:
    - `computeNodeHash(node: WorkNode): VersionHash`
    - `createVersion(node: WorkNode, parentHash: VersionHash | null): NodeMetadata` for updating the audit trail.
    - `verifyIntegrity(node: WorkNode): boolean`

#### [NEW] `src/kernel/index.ts`
- **Purpose**: Export kernel primitives.

### 3.2 Technical Constraints (Stack)
- [ ] Language: TypeScript (Strict)
- [ ] **Crypto**: Use native `crypto` (Node.js) or `Web Crypto API` (Edge compatible).
- [ ] **Immutability**: Functions must be pure. Input Node -> Output Hash.
- [ ] **Zod**: Use schemas from Hito 0.1 for validation.

## 4. Verification Plan (The Gate)
### 4.1 Automated Tests
- [ ] **Versioning Suite**: Create `tests/versioning.test.ts`.
    - **Determinism**: Same content = Same Hash.
    - **Avalanche Effect**: Small change = Totally different Hash.
    - **Chain**: Verify `v2` contains hash of `v1`.
    - **Command**: `npx vitest run tests/versioning.test.ts`

### 4.2 Manual Verification
- [ ] Review implementation against "Traceability" Invariant in `canon/03_invariants.md`.

## 5. Definition of Done (Final Filter)
- [ ] **Invariant Compliance**: "Traceability" - Every change has a hash.
- [ ] **Traceability**: Code implements the chain of custody logic.
- [ ] **Evidence**: Test suite proving cryptographic integrity.
- [ ] **Cleanliness**: Prettier + ESLint pass.

---
**Approvals**:
- [ ] **Human Review**: 
