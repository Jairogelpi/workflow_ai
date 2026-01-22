// Background Service Worker
// Orchestrates the "Link-OS" flow

let offscreenCreating: Promise<void> | null = null;

// 1. Context Menu to Open Link in WorkGraph
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "open-in-workgraph",
        title: "Open in WorkGraph OS",
        contexts: ["link"]
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "open-in-workgraph" && info.linkUrl) {
        processLink(info.linkUrl, tab?.id);
    }
});

// 2. Message Listener (from Content Script)
chrome.runtime.onMessage.addListener((message, sender, _sendResponse) => {
    if (message.type === 'PROCESS_LINK_CLICK') {
        processLink(message.url, sender.tab?.id);
    }
});

/**
 * Main Logic: Open Side Panel -> Parse URL -> Send Data
 */
async function processLink(url: string, tabId?: number) {
    if (!tabId) return;

    // A. Open Side Panel
    // Note: sidePanel.open requires user interaction or specific context. 
    // From context menu it works. From content script message, it might require rights.
    // 'activeTab' permission helps.
    try {
        await chrome.sidePanel.open({ tabId });
        await chrome.runtime.sendMessage({ type: 'PARSING_START' }); // Tell SidePanel to show loader
    } catch (e) {
        console.warn('Could not open side panel automatically (chrome restriction?)', e);
    }

    // B. Ensure Offscreen Document exists
    await setupOffscreenDocument('offscreen.html');

    // C. Delegate Parsing to Offscreen Environment
    try {
        const response = await chrome.runtime.sendMessage({
            type: 'PARSE_URL',
            url: url
        });

        if (response && response.success) {
            // D. Send Result to Side Panel
            // Using runtime.sendMessage broadcasts to all extension parts (including SidePanel)
            chrome.runtime.sendMessage({
                type: 'SHOW_ARTICLE',
                data: response.data
            });
        } else {
            console.error('Parsing failed', response?.error);
        }

    } catch (err) {
        console.error('Offscreen communication failed', err);
    }
}

/**
 * Boilerplate to create offscreen doc exactly once.
 */
async function setupOffscreenDocument(path: string) {
    // Check if offscreen document exists
    const existingContexts = await chrome.runtime.getContexts({
        contextTypes: ['OFFSCREEN' as any],
        documentUrls: [chrome.runtime.getURL(path)]
    });

    if (existingContexts.length > 0) {
        return;
    }

    // Create if not exists
    if (offscreenCreating) {
        await offscreenCreating;
    } else {
        offscreenCreating = chrome.offscreen.createDocument({
            url: path,
            reasons: [chrome.offscreen.Reason.DOM_PARSER],
            justification: 'Parsing HTML for Link-OS Viewer',
        });
        await offscreenCreating;
        offscreenCreating = null;
    }
}
