# HITO 3.4: Link-OS (Chrome Extension V3)

> **Status**: COMPLETED
> **Architecture**: Service Worker + Side Panel + Offscreen Document

## 1. Vision
We transformed the Chrome Extension from a simple "Selection Capture" tool into a full **Link OS Overlay**. It now allows users to analyze external links without leaving their AI chat (ChatGPT/Gemini/Claude).

## 2. Core Components

### 2.1 The Observer (Content Script)
- Injects a discrete Brain icon (🧠) next to external links.
- Uses `MutationObserver` to track new links in streaming chat responses.
- Triggers the parsing orchestration in the background.

### 2.2 The Brain (Offscreen Parser)
- Solves the Manifest V3 limitation (Service Workers cannot access DOM).
- Runs an invisible document to load and parse URLs using `@mozilla/readability`.
- Sanitizes output with `DOMPurify` to ensure high-fidelity, safe views.

### 2.3 The Viewer (Side Panel)
- A persistent sidebar that displays the "Clean View" of the technical article.
- Features:
    - **Insert to Chat**: Injects the parsed text directly into the active chat textarea.
    - **Reference Preservation**: Maintains the original source URL and metadata.
    - **Visual Extraction**: Galleries for images found in the article.

### 2.4 Knowledge Materialization (Persistence)
- **Supabase Integration**: The extension is now a first-class citizen in the WorkGraph ecosystem.
- **Save to WorkGraph**: Allows one-click persistence of research articles.
- **Automatic Inbox**: Articles are saved as `source` nodes in the Default Project for immediate triage.
- **Environment Safety**: Uses Vite-injected credentials to securely connect to the shared backend.

## 3. Technical Evidence
- **Build**: Vite-powered production build (`extension/dist`).
- **Orchestration**: `extension/src/background/index.ts` (Message Relay).
- **Security**: `manifest.json` strict permissions (SidePanel, Offscreen).

## 4. Verification
- All TypeScript types validated.
- Zero-error build achieved.
- Verified interaction flow: `Click 🧠` -> `Open SidePanel` -> `Parse` -> `Insert to Chat`.
