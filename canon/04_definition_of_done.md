# 04 — DEFINITION OF DONE (The Execution Filter)

This document defines when a task, feature, or deliverable is officially **DONE**. Nothing bypasses these filters.

## 1. Global Done Criteria
- [ ] **Invariant Compliance**: The work does not violate any rule in `03_invariants.md`.
- [ ] **Stack Integrity**: Used only approved technologies from `01_stack.md`. No `any` types.
- [ ] **Traceability**: All items have a version hash and immutable origin.
- [ ] **Linter & Typecheck**: `npm run check` passes with zero errors/warnings.
- [ ] **Test Coverage**: Critical paths have 100% automated test coverage.
- [ ] **Observability Instrumented**: Traces and structured logs are implemented for all new logic.
- [ ] **Portability Audit**: Verified that the export functionality correctly captures the new changes/types.

## 2. Feature / Code Done
- [ ] **Zod Validated**: All new input/output data shapes have a Zod schema.
- [ ] **Hito Alignment**: Linked to a specific Hito in `02_roadmap.md`.
- [ ] **Sequential Guard**: Confirmed that all previous Hitos in `ROADMAP.yml` are marked as Done.
- [ ] **No Business Logic in UI**: Logic resides in IR/Logic layers.
- [ ] **Error Handling**: Graceful failure with user-readable feedback.
- [ ] **Documentation**: Self-documenting code and updated internal docs.
- [ ] **Node-Based Record**: The task is documented structurally node-by-node in the WorkGraph IR format.
- [ ] **Accessibility (A11y)**: Complies with WCAG 2.1 Level AA.
- [ ] **Performance Check**: The change does not exceed the 100ms latency budget for UI interactions.

## 3. WorkGraph Node Done
- [ ] **Type Correct**: Node type matches the WorkGraph IR taxonomy.
- [ ] **Origin Attribution**: Tagged as `human`, `ai`, or `hybrid`.
- [ ] **Human Validation**: `Validated`/`PIN` status has an explicit human signature.
- [ ] **Evidence Proof**: `Claims` are linked to `Evidence` or `Assumption`.
- [ ] **Dependency Audit**: No active links or invariants broken.

## 4. RLM Compiler / Deliverable Done
- [ ] **Pipeline Verified**: Passed all mandatory pipeline stages.
- [ ] **Assertion Map**: Attached map linking claims to evidence.
- [ ] **Receipts Included**: Attached compilation metadata and version receipts.
- [ ] **Zero-Mock**: No placeholder/hardcoded data in final output.
- [ ] **Idempotency Check**: Confirmed that identical jobs yield identical receipts.
- [ ] **Token Budget**: Generation stayed within the authorized budget.

## 5. Peer / Self-Audit Checklist
- [ ] "Is the audit trail reproducible?"
- [ ] "Is the cost of this operation visible and justified?"
- [ ] "Does this work for keyboard-only users?"
- [ ] "Is the observability sufficient to debug this in production?"
- [ ] "Does this release leak credentials or expose over-privileged scopes?"

---
**The Filter**: If any box remains unchecked, the work is **NOT DONE**.
