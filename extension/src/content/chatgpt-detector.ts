import { BaseFileDetector, DetectedFile } from './file-detector';

/**
 * ChatGPT File Detector
 * Detects files uploaded to ChatGPT interface
 */
export class ChatGPTDetector extends BaseFileDetector {
    detect(): DetectedFile[] {
        const files: DetectedFile[] = [];

        // ChatGPT uses different selectors depending on version
        // Try multiple selectors for robustness
        const selectors = [
            '[data-testid="attachment"]',
            '.file-upload-item',
            '[class*="attachment"]',
            'button[aria-label*="file" i]'
        ];

        for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);
            elements.forEach((el) => {
                if (el instanceof HTMLElement && !el.dataset.wgProcessed) {
                    const file = this.extractFileInfo(el);
                    if (file) {
                        files.push(file);
                        el.dataset.wgProcessed = 'true';
                    }
                }
            });
        }

        return files;
    }

    private extractFileInfo(element: HTMLElement): DetectedFile | null {
        // Try to extract file name from element
        const nameElement = element.querySelector('[class*="filename"], [class*="name"]');
        const name = nameElement?.textContent?.trim() || 'unknown-file';

        // Try to find download link
        const downloadLink = element.querySelector('a[href][download], a[href*="blob:"]');
        const downloadUrl = downloadLink instanceof HTMLAnchorElement ? downloadLink.href : undefined;

        return {
            name,
            type: this.inferMimeType(name),
            element,
            downloadUrl,
            platform: 'chatgpt'
        };
    }

    inject(file: DetectedFile, onCapture: (file: DetectedFile) => void): void {
        // Don't inject if already injected
        if (file.element.querySelector('.wg-capture-btn')) return;

        const button = document.createElement('button');
        button.className = 'wg-capture-btn';
        button.innerHTML = '📥 Send to WorkGraph';
        button.style.cssText = `
            margin-left: 8px;
            padding: 4px 8px;
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 12px;
            cursor: pointer;
            transition: background 0.2s;
        `;

        button.addEventListener('mouseenter', () => {
            button.style.background = '#2563eb';
        });

        button.addEventListener('mouseleave', () => {
            button.style.background = '#3b82f6';
        });

        button.addEventListener('click', (e) => {
            e.stopPropagation();
            button.innerHTML = '⏳ Sending...';
            button.disabled = true;
            onCapture(file);
        });

        // Insert button next to file name
        file.element.appendChild(button);
    }
}
