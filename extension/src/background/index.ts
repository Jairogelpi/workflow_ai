// Background Service Worker
// Orchestrates the "Link-OS" flow

let offscreenCreating: Promise<void> | null = null;

// 1. Context Menu to Open Link in WorkGraph
// 1. Context Menu to Open Link in WorkGraph
chrome.runtime.onInstalled.addListener((details) => {
    // Open Welcome Page on Install
    if (details.reason === 'install') {
        chrome.tabs.create({ url: 'welcome.html' });
    }

    chrome.contextMenus.create({
        id: "open-in-workgraph",
        title: "Open in WorkGraph OS",
        contexts: ["link", "selection"]
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "open-in-workgraph") {
        if (info.selectionText) {
            processCapture({
                type: 'SELECTION',
                content: info.selectionText,
                url: info.pageUrl,
                title: tab?.title || "Unknown Page"
            }, tab?.id);
        } else if (info.linkUrl) {
            processCapture({
                type: 'LINK',
                url: info.linkUrl
            }, tab?.id);
        }
    }
});

// 2. Message Listener (from Content Script)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'PROCESS_LINK_CLICK') {
        processCapture({
            type: 'LINK',
            url: message.url
        }, sender.tab?.id);
    }

    if (message.type === 'CAPTURE_FILE') {
        handleFileCapture(message.file).then(sendResponse);
        return true;
    }

    if (message.type === 'CAPTURE_CLOUD_FILE') {
        handleCloudFileCapture(message.payload).then(sendResponse);
        return true;
    }

    if (message.type === 'CLASSIFY_TEXT') {
        classifyText(message.text).then(sendResponse);
        return true;
    }

    // [PERFECTION] Forward X-Ray Captures to SidePanel (where Auth lives)
    if (message.type === 'CAPTURE_BLOCK') {
        // We forward the message to the SidePanel (Runtime)
        // If SidePanel is closed, we might need to open it first, but for now assuming open (overlay visible)
        chrome.runtime.sendMessage(message, (response) => {
            sendResponse(response);
        });
        return true;
    }

    // [HYBRID] Open Floating Window (Native App Mode)
    if (message.type === 'OPEN_FLOATING_WINDOW') {
        chrome.windows.create({
            url: chrome.runtime.getURL('sidepanel.html'),
            type: 'popup',
            width: 450,
            height: 800,
            focused: true
        });
        // We can close the side panel if we want, but keeping it might be safer for state.
        // For now, just open the window.
    }
});

/**
 * Main Logic: Open Side Panel -> Parse URL/Handle Selection -> Send Data
 */
async function processCapture(payload: { type: 'LINK' | 'SELECTION', url: string, content?: string, title?: string }, tabId?: number) {
    if (!tabId) return;

    // A. Open Side Panel
    try {
        await chrome.sidePanel.open({ tabId });
        await chrome.runtime.sendMessage({ type: 'PARSING_START' }); // Tell SidePanel to show loader
    } catch (e) {
        console.warn('Could not open side panel automatically (chrome restriction?)', e);
    }

    // Handle Selection Immediately
    if (payload.type === 'SELECTION' && payload.content) {
        chrome.runtime.sendMessage({
            type: 'SHOW_CAPTURE',
            data: {
                content: payload.content,
                url: payload.url,
                title: payload.title,
                timestamp: new Date().toISOString()
            }
        });
        return;
    }

    // B. Ensure Offscreen Document exists (For Links)
    await setupOffscreenDocument('offscreen.html');

    // C. Delegate Parsing to Offscreen Environment
    try {
        const response = await chrome.runtime.sendMessage({
            type: 'PARSE_URL',
            url: payload.url
        });

        if (response && response.success) {
            // D. Send Result to Side Panel
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
 * Handle File Capture from LLM Interfaces
 */
async function handleFileCapture(file: any) {
    console.log('[WorkGraph] Handling file capture:', file.name);

    try {
        // 1. Download the file if URL is available
        let fileBlob: Blob;

        if (file.downloadUrl) {
            const response = await fetch(file.downloadUrl);
            if (!response.ok) throw new Error('Failed to download file');
            fileBlob = await response.blob();
        } else {
            // If no download URL, we cannot proceed
            throw new Error('No download URL available for this file');
        }

        // 2. Create FormData
        const formData = new FormData();
        formData.append('file', fileBlob, file.name);
        formData.append('platform', file.platform);

        // 3. Send to WorkGraph API
        const serverUrl = 'http://localhost:3000'; // TODO: Get from settings
        const uploadResponse = await fetch(`${serverUrl}/api/ingest/file`, {
            method: 'POST',
            body: formData
        });

        const result = await uploadResponse.json();

        if (!result.success) {
            throw new Error(result.error || 'Upload failed');
        }

        console.log('[WorkGraph] File captured successfully:', result.nodeId);
        return { success: true, nodeId: result.nodeId };

    } catch (error: any) {
        console.error('[WorkGraph] File capture failed:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Classify text using semantic analysis
 */
async function classifyText(text: string) {
    console.log('[WorkGraph] Classifying text...');

    try {
        // Simple heuristic classification (can be upgraded to LLM call)
        const lower = text.toLowerCase();
        let type: 'claim' | 'evidence' | 'assumption' | 'neutral' = 'neutral';
        let confidence = 0.5;

        // Claim indicators
        if (lower.match(/\b(is|are|will|must|should|always|never)\b/) && !lower.match(/\?/)) {
            type = 'claim';
            confidence = 0.6;
        }
        // Evidence indicators
        else if (lower.match(/\b(study|research|data|found|showed|according to|percent|%)\b/)) {
            type = 'evidence';
            confidence = 0.7;
        }
        // Assumption indicators
        else if (lower.match(/\b(assume|suppose|if|given that|assuming)\b/)) {
            type = 'assumption';
            confidence = 0.65;
        }

        return {
            success: true,
            classification: { type, confidence }
        };

    } catch (error: any) {
        console.error('[WorkGraph] Classification failed:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Handle Cloud Storage File Capture (Google Drive, Notion, Dropbox)
 */
async function handleCloudFileCapture(payload: {
    file: {
        name: string;
        mimeType: string;
        size: number;
        platform: string;
        data: string; // base64
    };
    metadata: {
        sourceUrl: string;
        capturedAt: string;
    };
}) {
    console.log(`[WorkGraph] Handling cloud file capture: ${payload.file.name} from ${payload.file.platform}`);

    try {
        // 1. Convert base64 to Blob
        const binaryString = atob(payload.file.data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        const fileBlob = new Blob([bytes], { type: payload.file.mimeType });

        // 2. Create FormData
        const formData = new FormData();
        formData.append('file', fileBlob, payload.file.name);
        formData.append('platform', payload.file.platform);
        formData.append('sourceUrl', payload.metadata.sourceUrl);
        formData.append('capturedAt', payload.metadata.capturedAt);

        // 3. Send to WorkGraph API
        const serverUrl = 'http://localhost:3000'; // TODO: Get from settings
        const uploadResponse = await fetch(`${serverUrl}/api/ingest/file`, {
            method: 'POST',
            body: formData
        });

        const result = await uploadResponse.json();

        if (!result.success) {
            throw new Error(result.error || 'Upload failed');
        }

        console.log(`[WorkGraph] Cloud file captured successfully: ${result.nodeId}`);
        return { success: true, nodeId: result.nodeId };

    } catch (error: any) {
        console.error('[WorkGraph] Cloud file capture failed:', error);
        return { success: false, error: error.message };
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
