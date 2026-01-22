# PROJECT CHARTER — WorkGraph OS (The Supreme Contract)

**WorkGraph OS** is the operative kernel for structured, traceable, and human-verified knowledge. This document is the **Supreme Operational Rule (Rule Zero)**. 

> [!IMPORTANT]
> Any action, technical decision, or implementation that contradicts this Charter or the Canon is invalid by design.

## 1. The Operational Protocol (MANDATORY)
Before any code generation or planning, the Assistant MUST:
1. **Sync with Canon**: Read the full `/canon/` directory (00-04).
2. **Execute Preflight**: Clone and fill the `PREFLIGHT_TEMPLATE.md`.
3. **Map to Roadmap**: Identify the current Hito in `ROADMAP.yml`. **Sequentiality is mandatory.**
4. **Enforce Invariants**: Verify the plan against `/canon/03_invariants.md`.

## 2. No-Negotiation Invariants
- **BYOK (Bring Your Own Key)**: All AI costs are transparent and funded by the user.
- **Traceability**: Every bit of knowledge must have a version hash and source attribution.
- **Strict Typing**: TypeScript `strict` mode is the baseline. `any` is a system failure.
- **Kernel Isolation**: The WorkGraph IR remains pure and decoupled from UI or AI providers.
- **Data Sovereignty**: The system must ensure zero vendor lock-in; exports must be available at all times.
- **Market-Linked Pricing**: Costs must be calculated against live market rates (e.g., OpenRouter) to ensure user transparency.


## 3. Conflict Resolution (The PIN Protocol)
If a task conflicts with a **PIN node** or an **Invariant**:
- **DO NOT** attempt to resolve it automatically.
- **STOP** and trigger an "Inconsistency Alert".
- **REQUEST** human arbitration. The Human is the ultimate validator.

## 4. Implementation Workflow
- **Plan (ADR)**: Propose changes with a clear problem definition and dependency audit.
- **Execute**: Code must pass `npm run check` (Lint, Typecheck, Format).
- **Verify**: Follow the checklist in `/canon/04_definition_of_done.md`.
- **Sign**: Every deliverable is incomplete without an **Audit Receipt** and **Assertion Map**.

## 5. Success Criteria
- **Zero-Hydration**: No hardcoded or mock data in compiled deliverables.
- **Performance**: UI interactions must stay within the 100ms latency budget.
- **Reliability**: 100% test coverage on critical IR path.

---
**THE GOLDEN RULE**: If the system allows an action that contradicts the Canon, the system is flawed. The Canon takes precedence over technical convenience.
