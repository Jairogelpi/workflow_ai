import { TextBlock } from './text-block-detector';

/**
 * X-Ray Highlighter
 * Renders visual overlays on classified text blocks
 */
export class XRayHighlighter {
    private shadowHost: HTMLDivElement | null = null;
    private shadowRoot: ShadowRoot | null = null;
    private overlays = new Map<HTMLElement, HTMLDivElement>();

    /**
     * Initialize the highlighter with Shadow DOM
     */
    init(): void {
        // Create shadow host
        this.shadowHost = document.createElement('div');
        this.shadowHost.id = 'wg-xray-host';
        this.shadowHost.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 999999;';

        // Attach shadow DOM
        this.shadowRoot = this.shadowHost.attachShadow({ mode: 'open' });

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .xray-overlay {
                position: absolute;
                pointer-events: auto;
                border: 2px solid transparent;
                border-radius: 8px;
                transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                box-shadow: 0 0 0 0 transparent;
                cursor: pointer;
                overflow: visible;
            }

            /* Ambient Glow: Subtle outline for classified blocks */
            .xray-overlay.claim {
                background: rgba(59, 130, 246, 0.05);
                border-color: rgba(59, 130, 246, 0.2);
                color: rgb(59, 130, 246);
            }

            .xray-overlay.evidence {
                background: rgba(16, 185, 129, 0.05);
                border-color: rgba(16, 185, 129, 0.2);
                color: rgb(16, 185, 129);
            }

            .xray-overlay.assumption {
                background: rgba(245, 158, 11, 0.05);
                border-color: rgba(245, 158, 11, 0.2);
                color: rgb(245, 158, 11);
            }

            /* Hover State: High intensity and reveal button */
            .xray-overlay:hover {
                transform: scale(1.01);
                background: rgba(var(--color-rgb), 0.15);
                border-color: rgba(var(--color-rgb), 0.8);
                box-shadow: 0 0 30px rgba(var(--color-rgb), 0.3);
                z-index: 10;
            }

            .xray-overlay.claim:hover { --color-rgb: 59, 130, 246; }
            .xray-overlay.evidence:hover { --color-rgb: 16, 185, 129; }
            .xray-overlay.assumption:hover { --color-rgb: 245, 158, 11; }

            .xray-capture-btn {
                position: absolute;
                top: -36px;
                right: 0;
                padding: 8px 16px;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 12px;
                font-size: 11px;
                font-weight: 700;
                cursor: pointer;
                opacity: 0;
                transform: translateY(10px);
                transition: all 0.2s ease;
                pointer-events: auto;
                backdrop-filter: blur(12px);
                display: flex;
                items-center;
                gap: 6px;
                white-space: nowrap;
            }

            .xray-overlay:hover .xray-capture-btn {
                opacity: 1;
                transform: translateY(0);
            }

            .xray-capture-btn:hover {
                background: #10b981;
                border-color: #10b981;
                transform: scale(1.05);
            }

            .xray-confidence {
                position: absolute;
                bottom: -24px;
                left: 8px;
                font-size: 10px;
                color: currentColor;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                background: rgba(0, 0, 0, 0.05);
                padding: 2px 6px;
                border-radius: 4px;
            }
        `;
        this.shadowRoot.appendChild(style);

        // Append to body
        document.body.appendChild(this.shadowHost);
    }

    /**
     * Activate/deactivate X-Ray mode
     */
    setActive(active: boolean): void {

        if (active) {
            this.shadowHost!.style.display = 'block';
        } else {
            this.shadowHost!.style.display = 'none';
        }
    }

    /**
     * Highlight a text block
     */
    highlight(block: TextBlock, onCapture: (block: TextBlock) => void): void {
        if (!this.shadowRoot || !block.classification) return;

        // Remove existing overlay if any
        this.removeOverlay(block.element);

        // Get current position
        const rect = block.element.getBoundingClientRect();

        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = `xray-overlay ${block.classification.type}`;
        overlay.style.cssText = `
            top: ${rect.top + window.scrollY}px;
            left: ${rect.left + window.scrollX}px;
            width: ${rect.width}px;
            height: ${rect.height}px;
        `;

        // Add capture button
        const captureBtn = document.createElement('button');
        captureBtn.className = 'xray-capture-btn';
        captureBtn.innerHTML = '✨ <span>Confirm</span> <span style="opacity:0.5; margin-left:4px;">(Shift+Click)</span>';
        captureBtn.onclick = (e) => {
            e.stopPropagation();
            onCapture(block);
        };
        overlay.appendChild(captureBtn);

        // Zero-Friction Confirm: Shift + Click on the overlay
        overlay.onclick = (e) => {
            if (e.shiftKey) {
                e.stopPropagation();
                onCapture(block);
            }
        };

        // Add confidence indicator
        const confidence = document.createElement('div');
        confidence.className = 'xray-confidence';
        confidence.textContent = `${Math.round(block.classification.confidence * 100)}% ${block.classification.type}`;
        overlay.appendChild(confidence);

        // Add to shadow DOM
        this.shadowRoot.appendChild(overlay);
        this.overlays.set(block.element, overlay);

        // Update position on scroll
        this.updateOverlayPosition(block.element);
    }

    /**
     * Remove overlay for an element
     */
    removeOverlay(element: HTMLElement): void {
        const overlay = this.overlays.get(element);
        if (overlay) {
            overlay.remove();
            this.overlays.delete(element);
        }
    }

    /**
     * Update overlay positions (call on scroll)
     */
    updateOverlayPosition(element: HTMLElement): void {
        const overlay = this.overlays.get(element);
        if (!overlay) return;

        const rect = element.getBoundingClientRect();
        overlay.style.top = `${rect.top + window.scrollY}px`;
        overlay.style.left = `${rect.left + window.scrollX}px`;
    }

    /**
     * Update all overlay positions
     */
    updateAllPositions(): void {
        this.overlays.forEach((_overlay, element) => {
            this.updateOverlayPosition(element);
        });
    }

    /**
     * Clear all overlays
     */
    clear(): void {
        this.overlays.forEach(overlay => overlay.remove());
        this.overlays.clear();
    }

    /**
     * Destroy the highlighter
     */
    destroy(): void {
        this.clear();
        this.shadowHost?.remove();
        this.shadowHost = null;
        this.shadowRoot = null;
    }
}
