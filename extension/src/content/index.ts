/// <reference types="chrome" />
console.log('[WorkGraph] Content script injected.');

let captureButton: HTMLButtonElement | null = null;

function createCaptureButton() {
    const btn = document.createElement('button');
    btn.innerText = 'WG Capture';
    btn.style.position = 'absolute';
    btn.style.zIndex = '999999';
    btn.style.padding = '4px 8px';
    btn.style.background = '#000';
    btn.style.color = '#fff';
    btn.style.border = '1px solid #444';
    btn.style.borderRadius = '4px';
    btn.style.cursor = 'pointer';
    btn.style.fontSize = '12px';
    btn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        const selection = window.getSelection()?.toString();
        if (selection) {
            chrome.runtime.sendMessage({ type: 'CAPTURE_SELECTION', text: selection, url: window.location.href });
        }
        removeButton();
    });
    document.body.appendChild(btn);
    return btn;
}

function removeButton() {
    if (captureButton) {
        captureButton.remove();
        captureButton = null;
    }
}

window.addEventListener('mouseup', (e) => {
    const selection = window.getSelection()?.toString().trim();
    if (selection && selection.length > 0) {
        if (!captureButton) captureButton = createCaptureButton();
        captureButton.style.top = `${window.scrollY + e.clientY - 30}px`;
        captureButton.style.left = `${window.scrollX + e.clientX}px`;
    } else {
        setTimeout(() => {
            if (!window.getSelection()?.toString().trim()) removeButton();
        }, 100);
    }
});
