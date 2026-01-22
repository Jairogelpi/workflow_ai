import { BaseFileDetector, DetectedFile } from './file-detector';

/**
 * Claude File Detector
 * Detects files uploaded to Claude (Anthropic) interface
 */
export class ClaudeDetector extends BaseFileDetector {
    detect(): DetectedFile[] {
        const files: DetectedFile[] = [];

        // Claude typically uses attachment pills or file cards
        const selectors = [
            '[data-testid="file-attachment"]',
            '[class*="FileAttachment"]',
            '.attachment-pill',
            '[role="button"][aria-label*="file" i]'
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
        const name = element.getAttribute('aria-label') ||
            element.querySelector('[class*="filename"]')?.textContent?.trim() ||
            'unknown-file';

        // Claude might have a download button or link
        const downloadLink = element.querySelector('a[download], button[download]');
        const downloadUrl = downloadLink instanceof HTMLAnchorElement ? downloadLink.href : undefined;

        return {
            name,
            type: this.inferMimeType(name),
            element,
            downloadUrl,
            platform: 'claude'
        };
    }

    inject(file: DetectedFile, onCapture: (file: DetectedFile) => void): void {
        if (file.element.querySelector('.wg-capture-btn')) return;

        const button = document.createElement('button');
        button.className = 'wg-capture-btn';
        button.innerHTML = '📥';
        button.title = 'Send to WorkGraph';
        button.style.cssText = `
            margin-left: 6px;
            padding: 6px 10px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            transition: all 0.2s;
        `;

        button.addEventListener('mouseenter', () => {
            button.style.transform = 'scale(1.05)';
            button.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
        });

        button.addEventListener('mouseleave', () => {
            button.style.transform = 'scale(1)';
            button.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        });

        button.addEventListener('click', (e) => {
            e.stopPropagation();
            button.innerHTML = '⏳';
            button.disabled = true;
            onCapture(file);
        });

        file.element.appendChild(button);
    }
}
