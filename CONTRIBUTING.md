# CONTRIBUTING — Preflight Protocol

This protocol is **mandatory** for any contribution to WorkGraph OS. Failure to follow this protocol will result in immediate rejection of the work.

## 1. The Preflight Checklist
Before writing a single line of code, you MUST clone and fill the [PREFLIGHT_TEMPLATE.md](file:///c:/Users/jairo/Desktop/workgraph/PREFLIGHT_TEMPLATE.md) and confirm:
- [ ] **Canon Review**: I have read all files in `/canon/` (00-04).
- [ ] **Hito Alignment**: My task maps to a specific Hito in `ROADMAP.yml`.
- [ ] **Invariants Check**: My proposal does not violate any rules in `03_invariants.md`.
- [ ] **Stack Compliance**: I am using only the approved technologies in `01_stack.md`.

## 2. Technical Requirements
- Every new function must have **TypeScript types**. No `any`.
- Every business logic unit must have a **Zod schema**.
- Every module must include a **verification test** or a scripted check.

## 3. Commitment Message Structure
Commits must follow this pattern:
`[HITO-X.Y] <Type>: <Description>`
Example: `[HITO-0.1] feat: Add Zod schema for WorkGraph nodes`

## 4. Self-Review Against Canon
Before pushing, audit your own code:
- Does this introduce unversioned state? (Reject if yes)
- Is this BYOK compliant? (Reject if no)
- Does it maintain the audit trail? (Reject if no)
