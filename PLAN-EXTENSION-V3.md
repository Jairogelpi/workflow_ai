# PLAN: Link-OS Extension (Chrome V3)

> **Goal**: Transform the extension into a "Link-OS" with Side Panel navigation and "Raw-on-Demand" parsing, enabling seamless interaction within ChatGPT/Gemini context.

## 1. Architecture Update
- **Manifest V3**: Add `sidePanel` and `offscreen` permissions.
- **Offscreen Document**: A hidden HTML/JS context to parse raw HTML using `Readability.js` (bypass Service Worker DOM limitations).
- **Side Panel**: A React-based UI to view cleaned content alongside the active tab.

## 2. Implementation Steps

### 2.1 Manifest & Build Config
- [ ] Update `extension/manifest.json` with new permissions and entry points.
- [ ] Update `extension/vite.config.ts` to include `offscreen.html` and `sidepanel.html` in the build rollup inputs.

### 2.2 The Parser (Offscreen)
- [ ] Create `extension/src/offscreen/offscreen.html`.
- [ ] Create `extension/src/offscreen/offscreen.ts`.
- [ ] Implement message listener for `PARSE_URL`.
- [ ] Integrate `@mozilla/readability`.

### 2.3 The Viewer (Side Panel)
- [ ] Create `extension/src/sidepanel/sidepanel.html` (Entry point).
- [ ] Create `extension/src/sidepanel/index.tsx` (React Root).
- [ ] Create `extension/src/sidepanel/SidePanelViewer.tsx` (The UI Component).
- [ ] Implement "Insert to Chat" logic.

### 2.4 Chat Integration (Content Script)
- [ ] Update `extension/src/content/index.tsx` (or new `chat-observer.ts`) to detect links in ChatGPT/Gemini.
- [ ] Inject "Brain" icon 🧠 next to links.
- [ ] Implement click handler to trigger parsing and open Side Panel.

## 3. Dependencies
- `@mozilla/readability` (Need to install in `extension/package.json` if not present, or main package.json).

## 4. Verification
- Build the extension (`npm run build`).
- Load unpacked in Chrome.
- Test: Open a link in Side Panel -> Select text -> Insert into Chat.
