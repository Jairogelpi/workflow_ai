/**
 * Notion File Detector
 * 
 * Detects and captures files from Notion pages.
 * Supports file blocks, PDF embeds, and image attachments.
 */

import { CloudFile, CloudFileDetector } from './base';

export class NotionDetector implements CloudFileDetector {
    platform: CloudFile['platform'] = 'notion';

    isMatch(url: string): boolean {
        return /notion\.so/.test(url);
    }

    async detect(): Promise<CloudFile[]> {
        const files: CloudFile[] = [];

        // Detect file blocks
        const fileBlocks = document.querySelectorAll('[data-block-id]');
        for (const block of fileBlocks) {
            const file = this.extractFileFromBlock(block as HTMLElement);
            if (file) files.push(file);
        }

        // Detect PDF embeds
        const pdfEmbeds = document.querySelectorAll('iframe[src*="pdf"]');
        for (const embed of pdfEmbeds) {
            const file = this.extractPdfEmbed(embed as HTMLIFrameElement);
            if (file) files.push(file);
        }

        // Detect image attachments
        const images = document.querySelectorAll('[data-block-id] img[src*="secure.notion-static"]');
        for (const img of images) {
            const file = this.extractImage(img as HTMLImageElement);
            if (file) files.push(file);
        }

        return files;
    }

    private extractFileFromBlock(block: HTMLElement): CloudFile | null {
        const blockId = block.getAttribute('data-block-id');
        if (!blockId) return null;

        // Look for file name in block content
        const fileNameElement = block.querySelector('.notion-file-block__title');
        const name = fileNameElement?.textContent || 'Notion File';

        // Look for download link
        const downloadLink = block.querySelector('a[href*="secure.notion-static"]') as HTMLAnchorElement;
        if (!downloadLink) return null;

        const downloadUrl = downloadLink.href;

        return {
            id: blockId,
            name,
            mimeType: this.inferMimeTypeFromUrl(downloadUrl),
            platform: 'notion',
            downloadUrl,
            metadata: {
                sourceUrl: window.location.href,
                capturedAt: new Date().toISOString()
            }
        };
    }

    private extractPdfEmbed(iframe: HTMLIFrameElement): CloudFile | null {
        const src = iframe.src;
        if (!src) return null;

        // Extract filename from URL or use default
        const urlParts = src.split('/');
        const encodedName = urlParts[urlParts.length - 1]?.split('?')[0];
        const name = decodeURIComponent(encodedName || 'Document.pdf');

        return {
            id: `pdf-${Date.now()}`,
            name,
            mimeType: 'application/pdf',
            platform: 'notion',
            downloadUrl: src,
            previewUrl: src,
            metadata: {
                sourceUrl: window.location.href,
                capturedAt: new Date().toISOString()
            }
        };
    }

    private extractImage(img: HTMLImageElement): CloudFile | null {
        const src = img.src;
        if (!src) return null;

        // Extract filename from alt text or URL
        const name = img.alt || 'Notion Image';

        return {
            id: `img-${Date.now()}`,
            name: `${name}.png`,
            mimeType: 'image/png',
            platform: 'notion',
            downloadUrl: src,
            previewUrl: src,
            metadata: {
                sourceUrl: window.location.href,
                capturedAt: new Date().toISOString()
            }
        };
    }

    private inferMimeTypeFromUrl(url: string): string {
        const ext = url.split('.').pop()?.split('?')[0]?.toLowerCase() || '';
        const mimeMap: Record<string, string> = {
            'pdf': 'application/pdf',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg'
        };
        return mimeMap[ext] || 'application/octet-stream';
    }

    async download(file: CloudFile): Promise<Blob> {
        if (!file.downloadUrl) {
            throw new Error('No download URL available');
        }

        const response = await fetch(file.downloadUrl);
        if (!response.ok) {
            throw new Error(`Download failed: ${response.status}`);
        }

        return response.blob();
    }

    getButtonPosition(element: HTMLElement): { x: number; y: number } {
        const rect = element.getBoundingClientRect();
        return {
            x: rect.right - 30,
            y: rect.top + (rect.height / 2) - 12
        };
    }
}
