/// <reference types="chrome" />
import { createRoot, Root } from 'react-dom/client';
import ExtensionOverlay from './ExtensionOverlay';

console.log('[WorkGraph] Content script loaded (dormant).');

/**
 * WorkGraph OS - Smart Overlay Injection
 * 
 * Strategy: "On-Demand Injection"
 * - NO automatic injection on page load (no resource waste)
 * - Click extension icon → TOGGLE_OVERLAY message → inject/show/hide
 * - Shadow DOM isolates styles from host page
 * - Position persists via chrome.storage
 */

let root: Root | null = null;
let overlayContainer: HTMLElement | null = null;

// Listen for TOGGLE_OVERLAY from background script
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'TOGGLE_OVERLAY') {
        toggleOverlay();
        sendResponse({ success: true });
    }
    
    if (message.type === 'GET_SELECTION_CONTEXT') {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const container = range.commonAncestorContainer;
            const parentElement = container.nodeType === 1 ? (container as HTMLElement) : container.parentElement;
            sendResponse({
                context: parentElement?.innerText || null,
                title: document.title
            });
        } else {
            sendResponse({ context: null, title: document.title });
        }
    }
    return true;
});

function toggleOverlay() {
    // If already mounted, toggle visibility
    if (overlayContainer) {
        const isHidden = overlayContainer.style.display === 'none';
        overlayContainer.style.display = isHidden ? 'block' : 'none';
        console.log(`[WorkGraph] Overlay ${isHidden ? 'shown' : 'hidden'}`);
        return;
    }

    // First time: mount the overlay
    mountOverlay();
}

function mountOverlay() {
    console.log('[WorkGraph] Mounting overlay...');

    // 1. Create Host Container (fixed, full viewport, click-through)
    overlayContainer = document.createElement('div');
    overlayContainer.id = 'workgraph-os-host';
    overlayContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: 2147483647;
        pointer-events: none;
    `;
    document.body.appendChild(overlayContainer);

    // 2. Attach Shadow DOM (style isolation)
    const shadow = overlayContainer.attachShadow({ mode: 'open' });

    // 3. Inject base styles into Shadow
    const style = document.createElement('style');
    style.textContent = `
        :host {
            all: initial;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        *, *::before, *::after {
            box-sizing: border-box;
        }
        .overlay-panel {
            pointer-events: auto;
        }
    `;
    shadow.appendChild(style);

    // 4. Mount React
    const rootDiv = document.createElement('div');
    shadow.appendChild(rootDiv);

    root = createRoot(rootDiv);
    root.render(
        <ExtensionOverlay 
            onClose={() => {
                if (overlayContainer) overlayContainer.style.display = 'none';
            }} 
        />
    );

    console.log('[WorkGraph] Overlay mounted successfully.');
}
