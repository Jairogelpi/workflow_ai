# Hito 2.6 Summary: The Ingestor (Chrome Extension)

## Objective Accomplished
Built the "Sensory Input" for WorkGraph OS. A Chrome Extension (Manifest V3) that allows capturing knowledge from any webpage directly into the graph storage.

## Key Changes

### 1. Ingestor Manifest (V3)
- **Permissions**: `contextMenus` for capture, `storage` for settings, and `notifications` for feedback.
- **Security**: Strict host permissions for Supabase, ensuring safe background communication.

### 2. Context Menu Capture
- **Feature**: Right-click on any selected text -> "Save to WorkGraph".
- **Metadata**: Automatically captures Source URL, Page Title, and timestamps.
- **Traceability**: Captured nodes are marked as `origin: human`, preserving the user's intent.

### 3. Rich Context Extraction
- **Surrounding Text**: The extension now asks the content script for the text surrounding the selection (`snippet_context`), providing the "Why" behind the "What".
- **Enriched Metadata**: Captures `accessed_at` (timestamp for evidence) and uses the page title as the primary identifier.

### 4. Web App Inbox Integration
- **Inbox Badge**: Capture nodes are marked with an `INBOX` status for future triage.
- **Evidence Panel**: The Node Editor now displays the full capture context, including the origin URL and surrounding snippet.

## Installation
1. Open Chrome and go to `chrome://extensions/`.
2. Enable **Developer Mode**.
3. Click **Load Unpacked**.
4. Select the `workgraph/extension/dist` folder.

## Verification
- [x] Vite Build passed (Production ready).
- [x] Background service worker correctly handles Supabase upserts.
- [x] Notification system provides instant feedback on capture success.

## Files Created/Modified
- `extension/src/background/index.ts` (Logic & Sync)
- `extension/src/content/index.ts` (Context extraction)
- `extension/src/popup.ts` (Config & Zero-touch)
- `src/components/layout/NodeListItem.tsx` (Inbox UI)
- `src/components/editor/NodeEditor.tsx` (Evidence View)
- `src/canon/schema/ir.ts` (Rich Metadata types)
