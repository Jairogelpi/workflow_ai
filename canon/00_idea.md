# 00 — IDEA (WorkGraph OS Kernel)

**WorkGraph OS** is a thinking operating system that converts interactions and materials into a **persistent graph with human authorship, invariants (PIN), and traceability**.

## 1. Core Vision (The Kernel)
- **WorkGraph IR**: Knowledge is not loose text; it is an executable Intermediate Representation.
- **RLM Compiler**: A multi-stage pipeline (Plan -> Retrieve -> Generate -> Verify -> Assemble) that generates extensive deliverables without context limits.
- **Proof-Carrying Deliverables**: Every output includes an **Assertion Map** (claims → evidence) and **Compilation Receipts**.

## 2. WorkGraph IR (Data Entities)
- **Nodes**: `Claim`, `Evidence`, `Decision`, `Constraint`, `Assumption`, `Plan`, `Task`, `Artifact`.
- **Node Metadata**: `origin` (human/ai/hybrid), `validated` (bool), `pin` (bool), `confidence` (0-100), `version` (hash+ts).
- **Edges**: `supports`, `depends_on`, `contradicts`, `refines`, `supersedes`.

## 3. RLM Compiler Lifecycle
1. **Planner**: Creates the index and required sections based on the manifest and canon.
2. **Retriever**: Selective context retrieval (PINs, validated decisions, branch digests).
3. **Recursive Generation**: Section-by-section generation with sub-division for depth.
4. **Verifier**: Cross-checks against the Canon (PINs) and identifies evidence gaps.
5. **Assembler**: Concatenates sections and attaches the **Audit Appendix** (Receipts + Assertion Map).

## 4. Operational Guardrails
- **BYOK (User-Pays-The-Model)**: The user provides API keys; the system manages the "Thinking Budget".
- **Explicit Capture**: No background scraping. Knowledge enters via explicit selection or file upload.
- **Immutability (Soft Delete)**: Information is archived by default to preserve the audit trail.
- **Canon Priority**: Any generation that contradicts a `PIN` node is flagged as a system conflict.

## 5. Definition of Success
The system is successful when a user can defend any statement in a thousand-page document by tracing it back to its original evidence and human decision.
