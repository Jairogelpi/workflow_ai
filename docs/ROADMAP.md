# Axiom WorkGraph OS - Technical Roadmap 2026

> **Status**: Production Core (Zero Mock)
> **Version**: 1.2.0 (Absolute Reality)
> **Last Audit**: "The Fractal Synthesis" (Jan 2026)

This document outlines the current state of the "Absolute Reality" foundation and the planned evolution for the "Axiom" ecosystem.

## 0. Current State (Jan 2026 Milestones)
- [x] **Fractal Recursive Map-Reduce**: Branch-level cognitive synthesis with conflict detection.
- [x] **Unified Inference Tiers**: Smart Routing for `REFLEX`, `REASONING`, and `CREATIVE` tasks.
- [x] **Zero-Copy Physics**: Rust/WASM engine running at 60 FPS via Float32Array transferable objects.
- [x] **Hardware-Adherence (Vault)**: Secure BYOK key management with AES-GCM encryption.
- [x] **Agent Swarm (Absolute Reality)**: Multi-agent coordination with real tool-use (Wikipedia/Search).

## 1. Product Engine (Universal Compiler)
*Current State*: RICE Scoring + Fractal Digests.
*Target State*: **Neuro-Probabilistic Scoring (v2)**
- [ ] Implement `ml_engine.ts` to perform regression analysis on RICE scores based on historical project success.
- [ ] Connect `compilePRD` to external market data sources for "Reach" validation (Real-time Market Size).
- [ ] **Multi-Format Export**: Support PDF/Docx generation via high-speed Rust `stream-assembler`.

## 2. Security & Compliance
*Current State*: Supabase RLS + JWT + Vault.
*Target State*: **Sovereign Evidence Seals**
- [ ] Integrate with **WebCrypto API** for client-side non-extractable keys.
- [ ] **Formal Verification Audit**: Automate SAT solver checks during CI/CD to prevent logic contradictions in "PIN" nodes.

## 3. Swarm Agency (The Neural Network)
*Current State*: Sequential Mediator + Parallel Workers.
*Target State*: **Biomimetic Swarm**
- [ ] **Inter-Agent Protocol**: Implement a real message bus (e.g., RxJS or broadcast channel) for agents to debate without Mediator polling.
- [ ] **Self-Optimizing Personas**: Agents dynamically adjust their "Temperature" and "System Prompt" based on task success metrics.

## 4. Alignment & Knowledge (The Brain)
*Current State*: Alignment Engine + Hierarchical HNSW Index.
*Target State*: **Self-Healing Semantic Mesh**
- [ ] **Ghost Node Materialization**: Automatic creation of "Inference Nodes" to bridge detected logic gaps in the graph.
- [ ] **Recursive Learning**: Implement feedback loop where "Refuted" claims retrain the `UserContext` vector.

## 5. User Interface (The Lens)
*Current State*: 3D WebGL Graph (Three.js) + Glassmorphism UI.
*Target State*: **Holographic Projection**
- [ ] **Spatial Command HUD**: Cmd+K interface with predictive command completion based on graph topology.
- [ ] **Voice Interface**: Connect `product_engine` to WebSpeech API for verbal PRD commands.

---

## Technical Debt & Immediate Next Steps
1.  **Unit Testing**: The `kernel` logic is type-safe but lacks comprehensive Jest/Vitest coverage.
2.  **CI/CD**: Set up GitHub Actions for automated "Zero Mock" linting.
3.  **Observability**: Tune OTel sampling to reduce log volume during massive graph traversals.
