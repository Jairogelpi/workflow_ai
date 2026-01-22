/**
 * Cloud File Detector - Base Interface
 * 
 * Provides the foundation for detecting and capturing files
 * from cloud storage platforms (Google Drive, Notion, Dropbox).
 * 
 * @module extension/content/cloud-detectors
 */

export interface CloudFile {
    id: string;
    name: string;
    mimeType: string;
    size?: number;
    platform: 'google-drive' | 'notion' | 'dropbox';
    downloadUrl?: string;
    previewUrl?: string;
    metadata: {
        sourceUrl: string;
        capturedAt: string;
        owner?: string;
        lastModified?: string;
    };
}

export interface CloudFileDetector {
    /** Platform identifier */
    platform: CloudFile['platform'];

    /** Check if current page is from this platform */
    isMatch(url: string): boolean;

    /** Detect all capturable files on the page */
    detect(): Promise<CloudFile[]>;

    /** Download a specific file as Blob */
    download(file: CloudFile): Promise<Blob>;

    /** Get capture button position for a file element */
    getButtonPosition(element: HTMLElement): { x: number; y: number };
}

// URL patterns for platform detection
export const CLOUD_PLATFORM_PATTERNS = {
    'google-drive': /drive\.google\.com/,
    'notion': /notion\.so/,
    'dropbox': /dropbox\.com/
} as const;

/**
 * Detect which cloud platform the current URL belongs to
 */
export function detectPlatform(url: string): CloudFile['platform'] | null {
    for (const [platform, pattern] of Object.entries(CLOUD_PLATFORM_PATTERNS)) {
        if (pattern.test(url)) {
            return platform as CloudFile['platform'];
        }
    }
    return null;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes?: number): string {
    if (!bytes) return 'Unknown size';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
}
