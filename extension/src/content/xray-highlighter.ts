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
                border-radius: 4px;
                transition: all 0.3s ease;
                box-shadow: 0 0 0 0 transparent;
                cursor: pointer;
            }

            .xray-overlay:hover {
                transform: scale(1.02);
                box-shadow: 0 0 20px 5px currentColor;
            }

            .xray-overlay.claim {
                background: rgba(59, 130, 246, 0.15);
                border-color: rgba(59, 130, 246, 0.6);
                color: rgb(59, 130, 246);
            }

            .xray-overlay.evidence {
                background: rgba(16, 185, 129, 0.15);
                border-color: rgba(16, 185, 129, 0.6);
                color: rgb(16, 185, 129);
            }

            .xray-overlay.assumption {
                background: rgba(245, 158, 11, 0.15);
                border-color: rgba(245, 158, 11, 0.6);
                color: rgb(245, 158, 11);
            }

            .xray-capture-btn {
                position: absolute;
                top: -30px;
                right: 0;
                padding: 6px 12px;
                background: rgba(59, 130, 246, 0.95);
                color: white;
                border: none;
                border-radius: 6px;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                opacity: 0;
                transition: opacity 0.2s;
                pointer-events: auto;
                backdrop-filter: blur(10px);
            }

            .xray-overlay:hover .xray-capture-btn {
                opacity: 1;
            }

            .xray-capture-btn:hover {
                background: rgb(59, 130, 246);
                transform: scale(1.05);
            }

            .xray-confidence {
                position: absolute;
                bottom: -20px;
                left: 0;
                font-size: 10px;
                color: currentColor;
                font-weight: 600;
                opacity: 0.8;
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
        captureBtn.textContent = '📥 Confirm';
        captureBtn.onclick = (e) => {
            e.stopPropagation();
            onCapture(block);
        };
        overlay.appendChild(captureBtn);

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
