# PREFLIGHT CHECKLIST: [HITO-ID] [TITLE]

> **STATUS**: [PENDING | APPROVED]
> **HITO**: [ID from ROADMAP.yml]
> **MODE**: [PLANNING | EXECUTION | VERIFICATION]

## 1. Context Synchronization
- [ ] **Rule Zero**: I have read `PROJECT_CHARTER.md`.
- [ ] **The Law**: I have read `canon/03_invariants.md`.
- [ ] **The Path**: This task maps directly to `ROADMAP.yml` Hito [ID].
- [ ] **The Stack**: I am strictly using `canon/01_stack.md`.

## 2. Objective & Scope
**Goal**: [Concise description of what this Hito achieves]

**Scope**:
- [ ] **Nodes**: [List new IR Node types if any]
- [ ] **Edges**: [List new Edge types]
- [ ] **Logic**: [Description of logic changes]

## 3. Implementation Plan
### 3.1 Proposed Changes
[List files to modify/create/delete]
- **[NEW]** `path/to/file`
- **[MODIFY]** `path/to/file`

### 3.2 Technical Constraints (Stack)
- [ ] Language: TypeScript (Strict) / Zod
- [ ] No `any` types.
- [ ] No business logic in UI components.
- [ ] All data structures defined via Zod.

## 4. Verification Plan (The Gate)
### 4.1 Automated Tests
- [ ] `npm run check` (Typecheck strict)
- [ ] Unit Tests: [Command to run]
- [ ] Schema Validation: [Specific check]

### 4.2 Manual Verification
- [ ] Step 1: [Action]
- [ ] Step 2: [Expected Result]

## 5. Definition of Done (Final Filter)
- [ ] **Invariant Compliance**: Checked against `canon/03_invariants.md`.
- [ ] **Traceability**: All changes mapped to this Hito.
- [ ] **Evidence**: Assertion Map & Receipts will be generated.
- [ ] **Cleanliness**: Prettier + ESLint pass.

---
**Approvals**:
- [ ] **Human Review**: [Signature/Date]
