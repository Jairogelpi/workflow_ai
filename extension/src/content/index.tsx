import React from 'react';
import { createRoot } from 'react-dom/client';
import { ChatGPTDetector } from './chatgpt-detector';
import { ClaudeDetector } from './claude-detector';
import { GeminiDetector } from './gemini-detector';
import { DragDropHandler } from './drag-drop-handler';
import { DetectedFile } from './file-detector';

/**
 * Content Script - LLM File Capture
 * Detects and captures files from LLM interfaces
 */

// Determine which platform we're on
function detectPlatform(): 'chatgpt' | 'claude' | 'gemini' | 'other' {
    const hostname = window.location.hostname;

    if (hostname.includes('chatgpt.com') || hostname.includes('chat.openai.com')) {
        return 'chatgpt';
    }
    if (hostname.includes('claude.ai')) {
        return 'claude';
    }
    if (hostname.includes('gemini.google.com') || hostname.includes('aistudio.google.com')) {
        return 'gemini';
    }
    return 'other';
}

// Initialize the appropriate detector
function initializeFileCaptureSystem(): void {
    const platform = detectPlatform();

    if (platform === 'other') {
        console.log('[WorkGraph] Not on a supported LLM platform');
        return;
    }

    console.log(`[WorkGraph] Initializing file capture for ${platform}`);

    let detector;
    switch (platform) {
        case 'chatgpt':
            detector = new ChatGPTDetector();
            break;
        case 'claude':
            detector = new ClaudeDetector();
            break;
        case 'gemini':
            detector = new GeminiDetector();
            break;
    }

    // Setup drag-and-drop
    const dragDropHandler = new DragDropHandler(handleFileCapture);

    // Handle file capture
    function handleFileCapture(file: DetectedFile): void {
        console.log('[WorkGraph] Capturing file:', file.name);

        // Send to background script
        chrome.runtime.sendMessage({
            type: 'CAPTURE_FILE',
            file: {
                name: file.name,
                type: file.type,
                platform: file.platform,
                downloadUrl: file.downloadUrl,
                size: file.size
            }
        }).then((response) => {
            if (response?.success) {
                showSuccessNotification(file.name);
            } else {
                showErrorNotification(file.name, response?.error);
            }
        }).catch((error) => {
            console.error('[WorkGraph] Capture failed:', error);
            showErrorNotification(file.name, error.message);
        });
    }

    // Process detected files
    function processDetectedFiles(files: DetectedFile[]): void {
        files.forEach(file => {
            // Inject capture button
            detector.inject(file, handleFileCapture);

            // Make draggable
            dragDropHandler.makeDraggable(file);
        });
    }

    // Start observing for files
    detector.startObserving(processDetectedFiles);

    // Initial scan
    const initialFiles = detector.detect();
    processDetectedFiles(initialFiles);
}

// Success/Error notifications
function showSuccessNotification(filename: string): void {
    const notification = createNotification(
        '✅ Sent to WorkGraph',
        `${filename} has been imported successfully`,
        'success'
    );
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

function showErrorNotification(filename: string, error?: string): void {
    const notification = createNotification(
        '❌ Import Failed',
        `Could not import ${filename}${error ? `: ${error}` : ''}`,
        'error'
    );
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 5000);
}

function createNotification(title: string, message: string, type: 'success' | 'error'): HTMLDivElement {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : '#ef4444'};
        color: white;
        padding: 16px 20px;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 999999;
        max-width: 300px;
        animation: slideIn 0.3s ease;
    `;

    notification.innerHTML = `
        <div style="font-weight: 600; margin-bottom: 4px;">${title}</div>
        <div style="font-size: 13px; opacity: 0.95;">${message}</div>
    `;

    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);

    return notification;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFileCaptureSystem);
} else {
    initializeFileCaptureSystem();
}

console.log('[WorkGraph] Content script loaded');
