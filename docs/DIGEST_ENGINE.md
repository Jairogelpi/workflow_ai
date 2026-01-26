# 🧠 The Digest Engine (Link-OS Memory)

## Overview
The **Digest Engine** (`src/kernel/digest_engine.ts`) is the "Long-Term Memory" of Axiom Link-OS.
It solves the context window problem by **compressing** branches of the knowledge graph into high-level summaries called "Digests".

Instead of feeding 50 raw nodes to the LLM (expensive & noisy), we feed 1 Digest (cheap & clean).

## Architecture

### 1. Hierarchical Compression
The Knowledge Graph is a tree of thoughts.
- **Level 1 (Leaves)**: Raw Notes, Claims, Evidence.
- **Level 2 (Branch)**: A `Digest` summarizes a specific branch (e.g., "Authentication System Design").
- **Level 3 (Root)**: A "Master Digest" (optional) summarizes the Level 2 digests.

### 2. The `digests` Table
Stored in Supabase:
- `entity_id`: The ID of the branch (Node ID) or Project.
- `summary_text`: The AI-generated markdown summary.
- `is_stale`: A boolean flag. If `true`, the digest is outdated because a node in that branch has changed.

### 3. The "Staleness" Protocol
When a user edits a node:
1.  **Mutation**: `useGraphStore.updateNodeContent()` creates a new version.
2.  **Trigger**: `markStale(branchId)` hook is fired.
3.  **Healing**: Next time `retrieveContext` is called:
    - It sees `is_stale: true`.
    - It *returns the stale digest* immediately (Speed > Freshness for general queries).
    - It triggers `regenerateBranchDigest()` in the **background** (Self-Healing).

## Usage

### Retrieval (The Result)
```typescript
import { retrieveContext } from '@/kernel/digest_engine';

// Smart Retrieval
const context = await retrieveContext(
    "How does auth work?", 
    currentProjectId, 
    false // Force High Precision? (No = Use Digest)
);

console.log(context.text); 
// Output: "[DIGEST] The Authentication system uses Supabase Auth..."
```

### Regeneration (The Worker)
```typescript
import { regenerateBranchDigest } from '@/kernel/digest_engine';

// This is usually called by a Queue/Cron
await regenerateBranchDigest(branchId);
```

## Economic Impact
- **Without Digest**: 50 Nodes x 200 tokens = 10,000 tokens ($0.15 on GPT-4).
- **With Digest**: 1 Digest x 500 tokens = 500 tokens ($0.007).
**Savings: ~95%**
