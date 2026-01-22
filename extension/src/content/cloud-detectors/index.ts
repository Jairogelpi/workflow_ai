/**
 * Cloud Storage Capture System
 * 
 * Unified orchestration layer for capturing files from
 * cloud storage platforms (Google Drive, Notion, Dropbox).
 * 
 * @module extension/content/cloud-detectors
 */

import { CloudFile, CloudFileDetector, detectPlatform, formatFileSize } from './base';
import { GoogleDriveDetector } from './google-drive';
import { NotionDetector } from './notion';
import { DropboxDetector } from './dropbox';

// Initialize all detectors
const DETECTORS: CloudFileDetector[] = [
    new GoogleDriveDetector(),
    new NotionDetector(),
    new DropboxDetector()
];

/**
 * Get the appropriate detector for the current page
 */
export function getDetector(): CloudFileDetector | null {
    const platform = detectPlatform(window.location.href);
    if (!platform) return null;

    return DETECTORS.find(d => d.platform === platform) || null;
}

/**
 * Scan the current page for capturable files
 */
export async function scanForFiles(): Promise<CloudFile[]> {
    const detector = getDetector();
    if (!detector) return [];

    try {
        return await detector.detect();
    } catch (error) {
        console.error('[CloudCapture] Detection failed:', error);
        return [];
    }
}

/**
 * Capture a file and send to WorkGraph
 */
export async function captureFile(file: CloudFile): Promise<void> {
    const detector = getDetector();
    if (!detector) {
        throw new Error('No detector available for current platform');
    }

    console.log(`[CloudCapture] Capturing: ${file.name}`);

    try {
        // Download the file
        const blob = await detector.download(file);

        // Convert to base64 for message passing
        const arrayBuffer = await blob.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

        // Send to background script
        chrome.runtime.sendMessage({
            type: 'CAPTURE_CLOUD_FILE',
            payload: {
                file: {
                    name: file.name,
                    mimeType: file.mimeType,
                    size: blob.size,
                    platform: file.platform,
                    data: base64
                },
                metadata: file.metadata
            }
        });

        console.log(`[CloudCapture] Sent to background: ${file.name} (${formatFileSize(blob.size)})`);
    } catch (error) {
        console.error(`[CloudCapture] Capture failed for ${file.name}:`, error);
        throw error;
    }
}

/**
 * Create floating capture button for a file element
 */
export function createCaptureButton(
    file: CloudFile,
    element: HTMLElement,
    detector: CloudFileDetector
): HTMLElement {
    const position = detector.getButtonPosition(element);

    const button = document.createElement('button');
    button.className = 'workgraph-capture-btn';
    button.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
    `;
    button.title = `Capture ${file.name} to WorkGraph`;
    button.style.cssText = `
        position: fixed;
        left: ${position.x}px;
        top: ${position.y}px;
        z-index: 10000;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: #6366f1;
        color: white;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(99, 102, 241, 0.4);
        transition: all 0.2s ease;
    `;

    button.onmouseenter = () => {
        button.style.transform = 'scale(1.1)';
        button.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.6)';
    };

    button.onmouseleave = () => {
        button.style.transform = 'scale(1)';
        button.style.boxShadow = '0 2px 8px rgba(99, 102, 241, 0.4)';
    };

    button.onclick = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        button.innerHTML = '⏳';
        button.style.pointerEvents = 'none';

        try {
            await captureFile(file);
            button.innerHTML = '✓';
            button.style.background = '#10b981';
            setTimeout(() => button.remove(), 2000);
        } catch (error) {
            button.innerHTML = '✗';
            button.style.background = '#ef4444';
            setTimeout(() => {
                button.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>`;
                button.style.background = '#6366f1';
                button.style.pointerEvents = 'auto';
            }, 2000);
        }
    };

    return button;
}

/**
 * Initialize cloud storage detection on page
 */
export async function initCloudCapture(): Promise<void> {
    const detector = getDetector();
    if (!detector) {
        console.log('[CloudCapture] Not a supported cloud platform');
        return;
    }

    console.log(`[CloudCapture] Initializing for ${detector.platform}`);

    // Initial scan
    const files = await scanForFiles();
    console.log(`[CloudCapture] Found ${files.length} files`);

    // Observe for dynamic content
    const observer = new MutationObserver(async () => {
        // Re-scan for new files when DOM changes
        await scanForFiles();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// Export for index
export * from './base';
export { GoogleDriveDetector } from './google-drive';
export { NotionDetector } from './notion';
export { DropboxDetector } from './dropbox';
