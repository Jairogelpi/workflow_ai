# HITO 3.1: Hierarchical Digests & Native UI (Gate 7)

> **STATUS**: DONE
> **DATE**: 2026-01-22
> **VERSION**: 1.0.0

## 1. Summary
This milestone focused on two critical areas: **Operational Scalability** (via Digests) and **User Experience** (Native OS Feel). We implemented the "Gate 7" requirements, enabling the system to handle large graphs efficiently while providing a premium, app-like environment.

## 2. Delivered Features

### 2.1 Native UI Overhaul
TRANSFORMATION: `Website` -> `Native App`
- **Typography**: Switched to System Fonts (`-apple-system`, `Segoe UI`) for seamless OS integration.
- **Interaction**: Disabled global text selection to mimic application behavior.
- **Visuals**: 
    - Enhanced Glassmorphism (`glass-panel`, `floating-island`).
    - Thin, overlay-style scrollbars.
    - System default cursor.
- **Codebase**: Refactored `src/app/globals.css`.

### 2.2 The Digest Engine (Cost Optimization)
- **Concept**: "Raw-on-Demand". We prefer pre-computed summaries (Digests) for general queries and fall back to Raw Nodes only when high precision is strictly required.
- **Table Schema**: Added `digests` table (id, entity_type, entity_id, digest_flavor, summary_text, is_stale).
- **Logic**: 
    - `retrieveContext` tries to find a valid 'standard' digest first.
    - If digest is missing/stale/low-res, it fetches generic `nodes`.
- **Implementation**: `src/kernel/digest_engine.ts`.

### 2.3 Observability (OpenTelemetry Lite)
- **Goal**: Auditability of AI costs and latency.
- **Features**:
    - `traceSpan` wrapper for performance tracking.
    - `measureCost` utility for token-based accounting.
- **Implementation**: `src/kernel/observability.ts`.

### 2.4 Database Schema Integrity
- **Adaptation**: Refactored `sync.ts` to map the new logical IR to the **existing** database schema (`work_nodes`, `work_edges`).
- **Migration**: Partial migration created `src/canon/migrations/001_gate7_schema.sql` to purely add the missing `digests` capabilities without destroying data.

## 3. Technical Evidence

### 3.1 Key Files
- `src/kernel/digest_engine.ts`: Core logic for retrieval strategy.
- `src/kernel/observability.ts`: Instrumentation.
- `src/lib/sync.ts`: Data access layer (Updated).
- `src/app/globals.css`: Styling core.
- `src/canon/migrations/001_gate7_schema.sql`: DDL.

### 3.2 Verification
- **Compilation**: Typescript errors in `useGraphStore` and `sync.ts` were strictly resolved (Zod branding keys, type narrowing).
- **Linting**: Code passes strict checks.

## 4. Next Steps
- Activate the **Staleness Worker** (Hito 3.2 real-time triggers).
- Connect the **Digest Generator** to the LLM Pipeline.

## 5. The "Brain" of Gate 7
We integrated the **System Prompt**, **Serializer**, and **Worker Logic** into a single, self-contained kernel module: `src/kernel/digest_engine.ts`. 

### 5.1 Architecture
- **Self-Contained**: No external prompt files. The `DIGEST_SYSTEM_PROMPT` is constant within the engine.
- **Data Hydration**: The engine automatically maps raw SQL rows (`work_nodes`) to Domain Objects (`WorkNode`) before processing, ensuring type safety.
- **Canon Compliance**: Implicit enforcement of PINs and Validated status via the System Prompt.

### 5.2 Key Components
1.  **Serializer (`serializeBranchForLLM`)**: Flattens polymorphic nodes into dense text.
2.  **System Prompt**: Enforces "Hierarchy of Truth" and "Reference Integrity".
3.  **Retrieve Context**: Automatically decides between `RAW` and `DIGEST` strategies.


