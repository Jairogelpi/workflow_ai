/// <reference types="chrome" />
console.log('[WorkGraph] Background service worker initialized.');

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'capture-to-workgraph',
        title: 'Capture to WorkGraph',
        contexts: ['selection']
    });
});

chrome.contextMenus.onClicked.addListener((info, _tab) => {
    if (info.menuItemId === 'capture-to-workgraph' && info.selectionText) {
        handleCapture(info.selectionText, _tab?.url || '');
    }
});

chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'CAPTURE_SELECTION') {
        handleCapture(message.text, message.url);
    }
});

async function handleCapture(text: string, url: string) {
    console.log('[WorkGraph] Capturing:', { text, url });

    // TODO: Post to Kernel API (e.g. localhost:3000/api/capture)
    try {
        chrome.action.setBadgeText({ text: 'OK' });
        setTimeout(() => chrome.action.setBadgeText({ text: '' }), 2000);
    } catch (err) {
        console.error('[WorkGraph] Capture error:', err);
        chrome.action.setBadgeText({ text: 'ERR' });
    }
}
