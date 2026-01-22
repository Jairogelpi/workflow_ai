import { BaseFileDetector, DetectedFile } from './file-detector';

/**
 * Gemini File Detector  
 * Detects files uploaded to Google Gemini interface
 */
export class GeminiDetector extends BaseFileDetector {
    detect(): DetectedFile[] {
        const files: DetectedFile[] = [];

        // Gemini uses Google's Material Design components
        const selectors = [
            '[data-test-id="file-chip"]',
            '.file-attachment',
            '[class*="attachment-chip"]',
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
        const name = element.getAttribute('data-filename') ||
            element.querySelector('[class*="filename"]')?.textContent?.trim() ||
            element.textContent?.trim() ||
            'unknown-file';

        const downloadLink = element.querySelector('a[href]');
        const downloadUrl = downloadLink instanceof HTMLAnchorElement ? downloadLink.href : undefined;

        return {
            name,
            type: this.inferMimeType(name),
            element,
            downloadUrl,
            platform: 'gemini'
        };
    }

    inject(file: DetectedFile, onCapture: (file: DetectedFile) => void): void {
        if (file.element.querySelector('.wg-capture-btn')) return;

        const button = document.createElement('button');
        button.className = 'wg-capture-btn';
        button.innerHTML = '📥 WorkGraph';
        button.style.cssText = `
            margin-left: 8px;
            padding: 6px 12px;
            background: #4285f4;
            color: white;
            border: none;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 500;
            cursor: pointer;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            transition: all 0.2s;
        `;

        button.addEventListener('mouseenter', () => {
            button.style.background = '#1a73e8';
        });

        button.addEventListener('mouseleave', () => {
            button.style.background = '#4285f4';
        });

        button.addEventListener('click', (e) => {
            e.stopPropagation();
            button.innerHTML = '⏳ Sending...';
            button.disabled = true;
            onCapture(file);
        });

        file.element.appendChild(button);
    }
}
