# PREFLIGHT CHECKLIST: HITO-2.6 The Ingestor (Chrome Extension)

> **STATUS**: PENDING
> **HITO**: 2.6
> **MODE**: PLANNING

## 1. Context Synchronization
- [x] **Rule Zero**: I have read `PROJECT_CHARTER.md`.
- [x] **The Law**: I have read `canon/03_invariants.md`. Ensuring **Traceability** from origin URL.
- [x] **The Path**: This task maps to `ROADMAP.yml` Hito 2.6.
- [x] **The Stack**: Chrome MV3, Vite, TypeScript, Supabase.

## 2. Objective & Scope
**Goal**: Build a Chrome Extension to serve as the "Sensory Input" for WorkGraph OS. Capture selections from any website and ingest them directly into the persistent storage.

**Scope**:
- [x] **Context Menu**: Right-click on selection -> "Send to WorkGraph".
- [x] **Metadata Capture**: Store source URL, Page Title, and timestamp automatically.
- [x] **Supabase Direct-to-DB**: Extension talks directly to Supabase for zero-latency ingestion.

## 3. Implementation Plan
### 3.1 Extension Scaffold (`/extension`)
- Use `vite` with `@crxjs/vite-plugin` for a modern MV3 development experience.
- `manifest.json`: Request `contextMenus`, `storage`, and host permissions for Supabase.

### 3.2 Background Logic (`background.ts`)
- Initialize context menus.
- Listen for `onClicked`.
- Create a `WorkNode` IR object and calling `supabase.from('work_nodes').upsert()`.

### 3.3 UI (`popup.tsx`)
- Allow user to login/setup Supabase keys if missing.
- Show recent captures status.

## 4. Verification Plan
### 4.1 Manual Verification
- [x] Select text in a browser tab.
- [x] Right-click -> "Save to WorkGraph".
- [x] Open `localhost:3000/editor`.
- [x] **Success Criteria**: A new node appears with the captured text and the `metadata.source` targeting the origin URL.

## 5. Definition of Done
- [x] Manifest V3 compliant.
- [x] Successful write to Supabase from background script.
- [x] Traceability (Origin URL) preserved in metadata.
