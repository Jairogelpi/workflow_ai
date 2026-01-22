/**
 * Google Drive File Detector
 * 
 * Detects and captures files from Google Drive interfaces.
 * Supports file preview pages and folder views.
 */

import { CloudFile, CloudFileDetector } from './base';

export class GoogleDriveDetector implements CloudFileDetector {
    platform: CloudFile['platform'] = 'google-drive';

    isMatch(url: string): boolean {
        return /drive\.google\.com/.test(url);
    }

    async detect(): Promise<CloudFile[]> {
        const files: CloudFile[] = [];

        // Detect files in Grid/List view
        const fileElements = document.querySelectorAll('[data-id]');
        for (const element of fileElements) {
            const file = this.extractFileFromElement(element as HTMLElement);
            if (file) files.push(file);
        }

        // Detect file in Preview mode
        const previewFile = this.detectPreviewFile();
        if (previewFile) files.push(previewFile);

        return files;
    }

    private extractFileFromElement(element: HTMLElement): CloudFile | null {
        const id = element.getAttribute('data-id');
        if (!id) return null;

        // Try to get filename from aria-label or inner text
        const name = element.getAttribute('aria-label')
            || element.querySelector('[data-tooltip]')?.getAttribute('data-tooltip')
            || 'Unknown File';

        // Extract mime type from icon or class
        const mimeType = this.inferMimeType(element);

        return {
            id,
            name,
            mimeType,
            platform: 'google-drive',
            downloadUrl: `https://drive.google.com/uc?export=download&id=${id}`,
            previewUrl: `https://drive.google.com/file/d/${id}/view`,
            metadata: {
                sourceUrl: window.location.href,
                capturedAt: new Date().toISOString()
            }
        };
    }

    private detectPreviewFile(): CloudFile | null {
        // Extract file ID from URL
        const match = window.location.href.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (!match) return null;

        const id = match[1];

        // Get filename from page title or header
        const name = document.querySelector('[data-tooltip-unhoverable-text]')?.textContent
            || document.title.replace(' - Google Drive', '')
            || 'Downloaded File';

        return {
            id,
            name,
            mimeType: this.inferMimeTypeFromName(name),
            platform: 'google-drive',
            downloadUrl: `https://drive.google.com/uc?export=download&id=${id}`,
            previewUrl: window.location.href,
            metadata: {
                sourceUrl: window.location.href,
                capturedAt: new Date().toISOString()
            }
        };
    }

    private inferMimeType(element: HTMLElement): string {
        // Check for common file type indicators
        const classList = element.className.toLowerCase();
        if (classList.includes('pdf')) return 'application/pdf';
        if (classList.includes('doc') || classList.includes('word')) return 'application/msword';
        if (classList.includes('sheet') || classList.includes('excel')) return 'application/vnd.ms-excel';
        if (classList.includes('image')) return 'image/*';
        return 'application/octet-stream';
    }

    private inferMimeTypeFromName(name: string): string {
        const ext = name.split('.').pop()?.toLowerCase() || '';
        const mimeMap: Record<string, string> = {
            'pdf': 'application/pdf',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xls': 'application/vnd.ms-excel',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'gif': 'image/gif',
            'txt': 'text/plain',
            'csv': 'text/csv'
        };
        return mimeMap[ext] || 'application/octet-stream';
    }

    async download(file: CloudFile): Promise<Blob> {
        if (!file.downloadUrl) {
            throw new Error('No download URL available');
        }

        const response = await fetch(file.downloadUrl, {
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`Download failed: ${response.status}`);
        }

        return response.blob();
    }

    getButtonPosition(element: HTMLElement): { x: number; y: number } {
        const rect = element.getBoundingClientRect();
        return {
            x: rect.right - 40,
            y: rect.top + 10
        };
    }
}
