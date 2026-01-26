# 🧠 The Digest Engine (Link-OS Memory)

## Overview
The **Digest Engine** (`src/kernel/digest_engine.ts`) is the "Long-Term Memory" of Axiom Link-OS.
It solves the context window problem by **compressing** branches of the knowledge graph into high-level summaries called "Digests".

Instead of feeding 50 raw nodes to the LLM (expensive & noisy), we feed 1 Digest (cheap & clean).

## Architecture

### 1. Fractal Recursive Map-Reduce (Milestone 3.1)
The engine now supports deep hierarchical synthesis:
- **Discovery**: Uses a BFS/DFS traversal of the graph (based on `part_of` relations) to cluster related thought branches.
- **Architect Role**: A high-level LLM persona ("The Architect") analyzes the cluster to detect:
    - **Core Objectives**: The main goal of the branch.
    - **Dissonance**: Logical contradictions or gaps between child nodes.
    - **Action Items**: Implicit tasks derived from the synthesis.
- **Scale Optimization**: If a branch exceeds the token window, it uses a recursive Map-Reduce approach, summarizing sub-clusters before final synthesis.

### 2. Crystallized Intelligence (`node_digests` table)
Unlike flat summaries, `node_digests` stores highly structured insights:
- `summary`: Markdown executive summary.
- `key_insights`: Highly compressed bullet points.
- `conflicts_detected`: JSON array of logical inconsistencies found by the AI.

### 3. The Staleness Protocol
1. **Mutation**: Any change to a child node marks its parent digest as `is_stale`.
2. **Trigger**: The UI context menu option "Sintetizar Rama" (Deep Digest) triggers an async job.
3. **Queue**: Jobs are processed by the worker-tier (`ingestion_worker.ts`) to prevent UI blocking.

## Usage

### UI Trigger (Node Context Menu)
Users can manually trigger a "Deep Digest" for any node. This emits a `trigger_digest` event through the `KernelBridge`, which is then handled as an async job in the `ingestion_jobs` table.

### Background Healing
The `DigestEngine` automatically triggers background refreshes if it detects a stale read during context retrieval, maintaining memory integrity without human intervention.

## Economic Impact
- **Without Digest**: 50 Nodes x 200 tokens = 10,000 tokens ($0.15 on GPT-4).
- **With Digest**: 1 Digest x 500 tokens = 500 tokens ($0.007).
**Savings: ~95%**
