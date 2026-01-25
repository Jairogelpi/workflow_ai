# Axiom Core Skills & Architecture Pillars

This document outlines the strategic skills and architectural principles defining the Axiom Thought Kernel.

## 1. 🧠 Core Cognition & Architecture
**Goal:** Reinforce the logical structure of the graph.

*   **Agent Memory Architecture**:
    *   Focus: Selective retrieval over simple storage.
    *   Application: Refine "Digests" logic. The RLM (Recursive Language Model) must granularly retrieve only relevant context for compilation.
*   **Complex Logic Planning**:
    *   Focus: Atomic decomposition of objectives.
    *   Application: Strengthen `planner.ts`. Ensure the blueprint is logically sound *before* drafting content.

## 2. 🚦 Workflow & Safety (The Human "Circuit Breaker")
**Goal:** Introduce "deliberate friction" for safety and control.

*   **The Traffic Light (3-Phase Workflow)**:
    *   **Jam**: Ideation / Sketching.
    *   **Blueprint**: Structured plan.
    *   **Build**: Execution.
    *   *Constraint*: The agent cannot move from Blueprint to Build without explicit human "Authority Signature".
*   **Systematic Debugging / Software Architecture**:
    *   Application: `verifier.ts`. Train the capability to systematically hunt for contradictions and structural flaws, not just syntax errors.

## 3. 🎨 Visualization & UX ("X-Ray Mode")
**Goal:** Make the underlying graph visible and tangible.

*   **D3 Viz / JSON Canvas**:
    *   Focus: Visualizing nodes and edges.
    *   Application: The "X-Ray Mode" frontend. Editing canvas files (obsidian-style) directly.
*   **UI/UX Pro Max**:
    *   Focus: Professionalizing error states.
    *   Application: The "Red Logic Error Screen" (Circuit Breaker) should feel like a premium OS safety control, not a crash.

## 4. 📈 Product & Growth (Value Sale)
**Goal:** Auditable deliverables.

*   **Product Management Toolkit**:
    *   Focus: Structuring deliverables.
    *   Application: Use frameworks like RICE prioritization. generate PRDs and reports that meet high industry standards.
