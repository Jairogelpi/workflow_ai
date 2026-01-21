# 03 — INVARIANTS (The Supreme Rules)

This document defines the **Non-Negotiable Guardrails** of WorkGraph OS. Any implementation, architecture, or behavior that violates these rules is a system failure.

## 1. Vision Invariants
- **IR First**: Knowledge is an executable Intermediate Representation (Nodes/Edges), not raw text. Text is just a view.
- **Traceability**: No data exists without a version hash, timestamp, and immutable origin (`human` | `ai` | `hybrid`).
- **PIN Priority**: `PIN` nodes are the "Hard Constraints" of the project. The RLM Compiler MUST flag any contradiction, never resolve it automatically.
- **Explicit Capture**: Knowledge enters only via explicit user action (Selection, Upload, Export). Background scraping is strictly prohibited.
- **Format Portability**: WorkGraph OS MUST NOT enforce vendor lock-in. The entire graph (Nodes, Edges, Metadata, Receipts) must be exportable in an open, machine-readable format (JSON/Markdown) at any time.

## 2. Technical Invariants (Stack)
- **Strict TypeScript**: `noImplicitAny`, `strict`, and `exactOptionalPropertyTypes` are mandatory. "any" is a bug.
- **Zod as Truth**: All data entering or leaving the WorkGraph (API, DB, Storage) MUST pass Zod validation.
- **Logical Isolation**: The **RLM Compiler (Python/FastAPI)** must be decoupled from the **UI (Next.js/React)** and the **Storage (Postgres)**. No business logic in components.
- **BYOK**: AI costs must be explicit, transparent, and funded by user-owned keys.
- **Idempotency**: All Compiler and Extraction jobs MUST be idempotent. Repeating a job with the same `compilation_id` must yield the same receipt.
- **Environment Parity**: Production must be reproducible locally. No manual prod-only configuration.
- **Performance Budgets**: UI interactions (node expansion, graph navigation) must maintain a latency of <100ms for a local-first feel.

## 3. Architecture & Data Invariants
- **Soft Delete Only**: Information is archived by default to preserve the audit trail.
- **Referential Integrity**: A node cannot be deleted if it has active dependents or is part of a `PIN` chain.
- **Durable Execution**: Any task exceeding 5 seconds MUST use durable patterns (Queues/Temporal).
- **Immutability**: Every modification generates a new version. History is never overwritten.
- **Local-First Resilience**: Core navigation and graph editing MUST work offline.
- **Atomic Transactions**: Multi-node updates MUST be atomic.
- **Migration Safety**: Schema changes MUST be backward compatible for at least one version.

## 4. RLM Compiler Invariants
- **Pipeline Integrity**: The stages `Plan -> Retrieve -> Generate -> Verify -> Assemble` are mandatory.
- **Proof-Carrying**: Every deliverable MUST include an **Assertion Map** (Claim -> Evidence) and **Compilation Receipts**.
- **No Evidence, No Claim**: Statements without evidence must be tagged as `Assumption` or `Pending`.
- **Zero-Hydration**: No placeholder or hardcoded data allowed in deliverables.
- **Token Budget**: Every RLM job must have a predefined token budget.
- **Observability**: All critical operations MUST emit traces and structured logs.

## 5. Security & Governance Invariants
- **Human-in-the-Loop**: No `Validated` or `PIN` status without explicit human approval.
- **No Black Box**: Every automated action must be explainable and cite its inputs.
- **Secrets Encryption**: Sensitive metadata MUST be encrypted at rest (AES-GCM-256).
- **Least Privilege**: LLM model calls and third-party tools must only be granted the minimum necessary context and key scopes.
- **Hito Compliance**: All work must map to an active Hito in `ROADMAP.yml`.

---
**THE GOLDEN RULE**: If the code allows an action that contradicts this document, the system is designed incorrectly.
