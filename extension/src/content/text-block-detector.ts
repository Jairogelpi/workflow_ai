/**
 * Text Block Detector
 * Scans web pages for meaningful text blocks and queues them for semantic analysis
 */

export interface TextBlock {
    element: HTMLElement;
    text: string;
    coords: DOMRect;
    selector: string;
    analyzed: boolean;
    classification?: {
        type: 'claim' | 'evidence' | 'assumption' | 'neutral';
        confidence: number;
    };
}

export class TextBlockDetector {
    private observer: MutationObserver | null = null;
    private processedElements = new WeakSet<HTMLElement>();
    private onBlockDetected: (block: TextBlock) => void;

    // Selectors for meaningful text containers
    private readonly TEXT_SELECTORS = [
        'p',
        'article',
        'section',
        'blockquote',
        'li',
        'td',
        'div[class*="content"]',
        'div[class*="text"]'
    ];

    private readonly MIN_TEXT_LENGTH = 50;
    private readonly MAX_TEXT_LENGTH = 1000;

    constructor(onBlockDetected: (block: TextBlock) => void) {
        this.onBlockDetected = onBlockDetected;
    }

    /**
     * Start observing the page for text blocks
     */
    start(): void {
        // Initial scan
        this.scanPage();

        // Watch for dynamic content
        this.observer = new MutationObserver((mutations) => {
            // Debounce: only process if significant changes
            const hasSignificantChanges = mutations.some(m =>
                m.addedNodes.length > 0 || m.removedNodes.length > 0
            );

            if (hasSignificantChanges) {
                setTimeout(() => this.scanPage(), 500);
            }
        });

        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        console.log('[TextBlockDetector] Started scanning');
    }

    /**
     * Stop observing
     */
    stop(): void {
        this.observer?.disconnect();
        this.processedElements = new WeakSet();
        console.log('[TextBlockDetector] Stopped scanning');
    }

    /**
     * Scan the current page for text blocks
     */
    private scanPage(): void {
        const selector = this.TEXT_SELECTORS.join(', ');
        const elements = document.querySelectorAll(selector);

        elements.forEach((el) => {
            if (el instanceof HTMLElement && !this.processedElements.has(el)) {
                this.processElement(el);
            }
        });
    }

    /**
     * Process a single element
     */
    private processElement(element: HTMLElement): void {
        const text = element.textContent?.trim() || '';

        // Filter by length and content quality
        if (text.length < this.MIN_TEXT_LENGTH || text.length > this.MAX_TEXT_LENGTH) {
            return;
        }

        // Skip if mostly links or code
        if (this.isLowQuality(element)) {
            return;
        }

        // Mark as processed
        this.processedElements.add(element);

        // Create text block
        const block: TextBlock = {
            element,
            text,
            coords: element.getBoundingClientRect(),
            selector: this.getSelector(element),
            analyzed: false
        };

        // Notify callback
        this.onBlockDetected(block);
    }

    /**
     * Check if element is low quality (mostly links, code, etc.)
     */
    private isLowQuality(element: HTMLElement): boolean {
        // Count children
        const links = element.querySelectorAll('a').length;
        const code = element.querySelectorAll('code, pre').length;
        const totalChildren = element.children.length;

        // If more than 50% are links or code, skip
        if (totalChildren > 0 && (links + code) / totalChildren > 0.5) {
            return true;
        }

        return false;
    }

    /**
     * Generate a unique CSS selector for an element
     */
    private getSelector(element: HTMLElement): string {
        if (element.id) {
            return `#${element.id}`;
        }

        const path: string[] = [];
        let current: Element | null = element;

        while (current && current !== document.body) {
            let selector = current.tagName.toLowerCase();

            if (current.className && typeof current.className === 'string') {
                const classes = current.className.trim().split(/\s+/);
                if (classes.length > 0 && classes[0]) {
                    selector += `.${classes[0]}`;
                }
            }

            path.unshift(selector);
            current = current.parentElement;
        }

        return path.join(' > ');
    }
}
