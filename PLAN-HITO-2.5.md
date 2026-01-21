# PREFLIGHT CHECKLIST: HITO-2.5 Persistence & Sync (SQL-First)

> **STATUS**: PENDING
> **HITO**: 2.5
> **MODE**: PLANNING

## 1. Context Synchronization
- [x] **Rule Zero**: I have read `PROJECT_CHARTER.md`.
- [x] **The Law**: I have read `canon/03_invariants.md`. Enforcing **Referential Integrity** and **Immutability**.
- [x] **The Path**: This task maps to `ROADMAP.yml` Hito 2.5.
- [x] **The Stack**: PostgreSQL (Supabase) + pgvector + Zod.

## 2. Objective & Scope
**Goal**: Transition from a RAM-based prototype to a persistent "Thinking OS". Connect the frontend to a high-fidelity SQL database in Supabase that handles IR nodes, edges, versioning, and embeddings.

**Scope**:
- [x] **Database Schema**: Deployment of the Master SQL Schema (Nodes, Edges, Revisions, Embeddings).
- [x] **Frontend Bridge**: Supabase client integration.
- [x] **Atomic Persistence**: Every change in the graph store must trigger a debounced upsert to the database.
- [x] **State Rehydration**: On application load, fetch the graph state from the database.

## 3. Implementation Plan
### 3.1 Infrastructure (SQL)
- **[NEW]** `supabase/migrations/init.sql`
    - Contains the Master Schema: `work_nodes`, `work_edges`, `node_revisions`, `compilation_receipts`.
    - Enforced Enums for Node types and Relations.
    - RLS (Row Level Security) policies for multi-project isolation.

### 3.2 Frontend Integration
- **[NEW]** `src/lib/supabase.ts`
    - Supabase client initialization (using env variables).
- **[NEW]** `src/lib/sync.ts`
    - High-level wrappers for `fetchGraph`, `upsertNode`, and `deleteNode`.
- **[MODIFY]** `src/store/useGraphStore.ts`
    - Integrate `isLoading` and `isSyncing` flags.
    - Initial `loadProject` action to hydrate the store.
    - Middlewares or direct calls in actions to sync with DB.

## 4. Verification Plan
### 4.1 Manual Verification
- [x] **Refreshed Success**: Create a Node, edit its content, Refresh page -> Content is preserved.
- [x] **Edge Integrity**: Connect two nodes, Refresh page -> Relationship is preserved.
- [x] **Mutation Integrity**: Change node type (Note -> Claim), Refresh page -> New type and metadata persist.

## 5. Definition of Done
- [x] No `localStorage` used.
- [x] All graph mutations are stored in Supabase `work_nodes` and `work_edges`.
- [x] Application hydrations works seamlessly.
- [x] Git sync performed.
