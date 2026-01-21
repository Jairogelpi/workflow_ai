# 02 — ROADMAP (Executable Hitos)

This roadmap defines the **Trajectory** of WorkGraph OS. Any new task must map to a specific Hito.

## Phase 0: The IR Kernel (Execution Core)
- **Hito 0.1**: Schema definition for WorkGraph IR (Nodes/Edges/Metadata).
- **Hito 0.2**: Versioning Engine (Hash-based delta tracking).
- **Hito 0.3**: PIN/Invariant enforcement logic in the DB layer.
- **GATE**: A node cannot be deleted if it is a PIN or has active dependents.

## Phase 1: RLM Compiler v1 (Deliverable Engine)
- **Hito 1.1**: Pipeline architecture (Planner -> Retriever -> Assembler).
- **Hito 1.2**: Manifest-based templates (PRD, Report, Pitch).
- **Hito 1.3**: Proof-Carrying Deliverables (Receipts generation).
- **GATE**: Deliverables must include an Assertion Map to be marked as "Done".

## Phase 2: Capture & Extensibility (The Wedge)
- **Hito 2.1**: Chrome MV3 Extension (Explicit selection capture).
- **Hito 2.2**: Multi-source ingestion (URLs, Local Files, Chat Export).
- **Hito 2.3**: BYOK Secrets Management (Vault integration).
- **GATE**: Captures must pass Zod validation before entering the WorkGraph.

## Phase 3: Scaling & Verification (Operational Excellence)
- **Hito 3.1**: Hierarchical Digests (Branch/Project summarization).
- **Hito 3.2**: Staleness Detection (Evidence expiration warnings).
- **Hito 3.3**: Collaborative Governance (Propose/Approve workflows).
- **GATE**: RLM Compiler identifies contradictions with the Canon automatically.

## Phase 4: Enterprise Hardening
- **Hito 4.1**: SSO/SAML & RBAC.
- **Hito 4.2**: Local Compiler (Disconnected mode).
- **Hito 4.3**: SIEM/Audit integration.
- **GATE**: SOC2 Type II compliance readiness.
