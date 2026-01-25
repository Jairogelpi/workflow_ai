# Axiom WorkGraph OS - Technical Roadmap 2026

> **Status**: Production Core (Zero Mock)
> **Version**: 1.0.0 (Foundation)
> **Last Audit**: "The Relentless Sweep" (Jan 2026)

This document outlines the features and logic that are currently functional but basic ("Real Foundation"), and the planned evolution for the "Axiom" ecosystem.

## 1. Product Engine (Universal Compiler)
*Current State*: Deterministic Arithmetic for RICE Scoring (Avg of Metadata).
*Target State*: **Neuro-Probabilistic Scoring (v2)**
- [ ] Implement `ml_engine.ts` to perform regression analysis on RICE scores based on historical project success.
- [ ] Connect `compilePRD` to external market data sources for "Reach" validation (Real-time Market Size).
- [ ] **Multi-Format Export**: Support PDF/Docx generation via headless browser (Puppeteer).

## 2. Security & Cryptography
*Current State*: `Vault` class with basic AES encryption key-map.
*Target State*: **Hardware-Backed Authority**
- [ ] Integrate with **WebCrypto API** for client-side non-extractable keys (Hardware adherence).
- [ ] Implement **Ed25519 Signatures** for "Authority Seals" (real cryptographic proof of human approval).
- [ ] **Audit Ledger**: Move `auditStore` from in-memory array to an immutable Append-Only Log in Supabase (`audit_logs` table).

## 3. Swarm Agency (The Neural Network)
*Current State*: Sequential Agent Loop in `SwarmOrchestrator`. Parallelism via simple `forEach`.
*Target State*: **True Concurrent Swarm**
- [ ] **Web Workers**: Move each Agent (`Harvester`, `Critic`) to a dedicated Web Worker to prevent UI blocking during heavy reasoning.
- [ ] **Inter-Agent Protocol**: Implement a real message bus (e.g., RxJS or broadcast channel) for agents to debate without Mediator polling.
- [ ] **External Tool Loading**: Allow `ToolRegistry` to fetch and sandbox external plugins (WASM modules).

## 4. Alignment & Knowledge (The Brain)
*Current State*: `alignment_engine.ts` uses Basic SAT Solver logic + LLM Semantic check.
*Target State*: **Full Formal Verification**
- [ ] **Rust WASM Core**: Compile the Rust `logic-engine` to WASM for millisecond-level constraint solving on the client.
- [ ] **Vector Memory Expansion**: Move from simple `rpc('match_nodes')` to a hierarchical HNSW index for million-node scale.
- [ ] **Recursive Learning**: Implement feedback loop where "Refuted" claims retrain the `UserContext` vector.

## 5. User Interface (The Lens)
*Current State*: Strict X-Ray Mode with calculated Integrity Score.
*Target State*: **Holographic Projection**
- [ ] **WebGL Rendering**: Migrate `ReactFlow` graph to `Three.js` or `Cosmos` for 3D exploration of large knowledge graphs.
- [ ] **Real-Time Collaboration**: Use Yjs or Supabase Realtime for cursor tracking and live node editing (Google Docs style).
- [ ] **Voice Interface**: Connect `product_engine` to WebSpeech API for verbal PRD commands.

---

## Technical Debt & Immediate Next Steps
1.  **Unit Testing**: The `kernel` logic is type-safe but lacks comprehensive Jest/Vitest coverage.
2.  **Error Boundaries**: Add React Error Boundaries around `GraphCanvas` to prevent crash on malformed node data.
3.  **CI/CD**: Set up GitHub Actions for automated "Zero Mock" linting (fail build if `Simulated` string is found).
