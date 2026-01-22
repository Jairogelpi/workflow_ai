/**
 * Dropbox File Detector
 * 
 * Detects and captures files from Dropbox interfaces.
 * Supports file preview pages and folder listings.
 */

import { CloudFile, CloudFileDetector } from './base';

export class DropboxDetector implements CloudFileDetector {
    platform: CloudFile['platform'] = 'dropbox';

    isMatch(url: string): boolean {
        return /dropbox\.com/.test(url);
    }

    async detect(): Promise<CloudFile[]> {
        const files: CloudFile[] = [];

        // Detect files in folder view
        const fileRows = document.querySelectorAll('[data-testid="sl-list-row"]');
        for (const row of fileRows) {
            const file = this.extractFileFromRow(row as HTMLElement);
            if (file) files.push(file);
        }

        // Detect file in preview mode
        const previewFile = this.detectPreviewFile();
        if (previewFile) files.push(previewFile);

        return files;
    }

    private extractFileFromRow(row: HTMLElement): CloudFile | null {
        // Get file name
        const nameElement = row.querySelector('[data-testid="sl-link"]');
        const name = nameElement?.textContent?.trim() || 'Unknown File';

        // Get file link
        const linkElement = row.querySelector('a[href*="/s/"]') as HTMLAnchorElement;
        const previewUrl = linkElement?.href;

        if (!previewUrl) return null;

        // Extract ID from URL
        const idMatch = previewUrl.match(/\/s\/([a-zA-Z0-9]+)/);
        const id = idMatch ? idMatch[1] : `dropbox-${Date.now()}`;

        return {
            id,
            name,
            mimeType: this.inferMimeType(name),
            platform: 'dropbox',
            previewUrl,
            downloadUrl: previewUrl.replace('?dl=0', '?dl=1'),
            metadata: {
                sourceUrl: window.location.href,
                capturedAt: new Date().toISOString()
            }
        };
    }

    private detectPreviewFile(): CloudFile | null {
        // Check if we're on a file preview page
        const url = window.location.href;
        if (!url.includes('/s/') && !url.includes('/scl/fi/')) return null;

        // Get filename from page
        const titleElement = document.querySelector('[data-testid="filename"]')
            || document.querySelector('.dig-Typography--headlineSm');
        const name = titleElement?.textContent?.trim() || document.title.replace(' - Dropbox', '');

        // Extract ID
        const idMatch = url.match(/\/(?:s|scl\/fi)\/([a-zA-Z0-9]+)/);
        const id = idMatch ? idMatch[1] : `dropbox-${Date.now()}`;

        return {
            id,
            name,
            mimeType: this.inferMimeType(name),
            platform: 'dropbox',
            previewUrl: url,
            downloadUrl: url.includes('?') ? url.replace(/\?.*/, '?dl=1') : `${url}?dl=1`,
            metadata: {
                sourceUrl: url,
                capturedAt: new Date().toISOString()
            }
        };
    }

    private inferMimeType(name: string): string {
        const ext = name.split('.').pop()?.toLowerCase() || '';
        const mimeMap: Record<string, string> = {
            'pdf': 'application/pdf',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xls': 'application/vnd.ms-excel',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'ppt': 'application/vnd.ms-powerpoint',
            'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'gif': 'image/gif',
            'txt': 'text/plain',
            'csv': 'text/csv',
            'zip': 'application/zip'
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
            x: rect.right - 50,
            y: rect.top + (rect.height / 2) - 12
        };
    }
}
