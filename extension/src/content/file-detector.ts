/**
 * File Detector System
 * Unified interface for detecting uploaded files in LLM chat interfaces
 */

export interface DetectedFile {
    name: string;
    type: string; // MIME type
    size?: number;
    downloadUrl?: string; // If available
    element: HTMLElement; // The DOM element representing the file
    platform: 'chatgpt' | 'claude' | 'gemini' | 'other';
}

export abstract class BaseFileDetector {
    protected observer?: MutationObserver;

    abstract detect(): DetectedFile[];
    abstract inject(file: DetectedFile, onCapture: (file: DetectedFile) => void): void;

    /**
     * Start observing DOM for new file uploads
     */
    startObserving(callback: (files: DetectedFile[]) => void): void {
        this.observer = new MutationObserver(() => {
            const files = this.detect();
            if (files.length > 0) {
                callback(files);
            }
        });

        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    stopObserving(): void {
        this.observer?.disconnect();
    }

    /**
     * Extract file type from element or filename
     */
    protected inferMimeType(filename: string): string {
        const ext = filename.split('.').pop()?.toLowerCase();
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
        return mimeMap[ext || ''] || 'application/octet-stream';
    }
}
