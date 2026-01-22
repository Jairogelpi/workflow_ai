/// <reference types="chrome" />
import { createRoot } from 'react-dom/client';
import ExtensionOverlay from './ExtensionOverlay';

console.log('[WorkGraph] Content script injected.');

/**
 * WorkGraph OS - Content Script Injection
 * 
 * This script runs on every page visited by the user (as per <all_urls> permission).
 * It acts as the bridge between the browser page and the WorkGraph Extension.
 * 
 * Strategy: "The Shadow Injection"
 * We create a Shadow DOM root to isolate our extension's UI (The Overlay)
 * from the host page's CSS. This prevents style bleeding in both directions.
 */
function injectOverlay() {
    // 1. Create the Host Container
    // This div sits in the main DOM but is invisible (width/height 0)
    const host = document.createElement('div');
    host.id = 'workgraph-os-host';
    host.style.position = 'fixed';
    host.style.top = '0';
    host.style.left = '0';
    host.style.width = '0'; // Cero para no bloquear clicks cuando está cerrado
    host.style.height = '0';
    host.style.zIndex = '2147483647'; // El número más alto permitido en CSS (Max Z-Index)

    document.body.appendChild(host);

    // 2. Create the Shadow DOM (The Isolated Bubble)
    // mode: 'open' allows us to access the shadow entries if needed
    const shadow = host.attachShadow({ mode: 'open' });

    // 3. Inject Styles
    // We inject a style reset or Tailwind styles specific to our shadow root
    // :host refers to the shadow host element itself
    const style = document.createElement('style');
    style.textContent = `
    :host {
      all: initial; 
      font-family: sans-serif;
    }
    div {
      box-sizing: border-box;
    }
  `;
    shadow.appendChild(style);

    // 4. Mount React Root
    // We create a div *inside* the shadow options to mount our React app
    const rootDiv = document.createElement('div');
    shadow.appendChild(rootDiv);

    const root = createRoot(rootDiv);

    // Renderizar el Overlay
    root.render(<ExtensionOverlay />);
}

// Ejecutar al cargar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectOverlay);
} else {
    injectOverlay();
}

// Mantenemos los listeners de contexto originales (opcional, si queremos mantener la funcionalidad de captura click derecho)
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.type === 'GET_SELECTION_CONTEXT') {
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
