/**
 * Content Script
 * Injected into webpages (ChatGPT, Gemini, Claude) to enhance links.
 */

// Simple Icon SVG
const BRAIN_ICON = `
<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-brain"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/></svg>
`;

// Helper to check if a link is already processed
const MARKER_ATTR = 'data-wg-processed';

function injectBrainIcons() {
    const links = document.querySelectorAll('a');
    links.forEach(link => {
        // Skip processed, internal anchors, or tiny links
        if (link.hasAttribute(MARKER_ATTR) || link.href.startsWith('javascript') || link.href.includes(window.location.host)) return;

        // Skip links that wrap images entirely (usually logos)
        if (link.querySelector('img') && link.innerText.trim() === '') return;

        // Create Trigger Button
        const btn = document.createElement('span');
        btn.innerHTML = BRAIN_ICON;
        btn.style.display = 'inline-flex';
        btn.style.marginLeft = '4px';
        btn.style.cursor = 'pointer';
        btn.style.color = '#8E51FF'; // WorkGraph Purple
        btn.style.verticalAlign = 'middle';
        btn.title = "Parse with WorkGraph OS";

        btn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();

            // Visual Feedback
            btn.style.opacity = '0.5';

            console.log('[WorkGraph] Requesting parse for:', link.href);
            chrome.runtime.sendMessage({ type: 'PROCESS_LINK_CLICK', url: link.href });
        };

        link.parentNode?.insertBefore(btn, link.nextSibling);
        link.setAttribute(MARKER_ATTR, 'true');
    });
}

// 1. Initial Injection
injectBrainIcons();

// 2. Observe Mutations (SPA navigation / Infinite Scroll in Chat)
const observer = new MutationObserver((mutations) => {
    let shouldScan = false;
    for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
            shouldScan = true;
            break;
        }
    }
    if (shouldScan) injectBrainIcons();
});

observer.observe(document.body, { childList: true, subtree: true });
