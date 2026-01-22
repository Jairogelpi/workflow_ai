import { TextBlockDetector, TextBlock } from './text-block-detector';
import { SemanticBuffer } from './semantic-buffer';
import { classifyTextBlocks } from './semantic-classifier';
import { XRayHighlighter } from './xray-highlighter';
import { xrayState, setupAltKeyListener } from './xray-state';
import { XRayHUD } from './xray-hud';

/**
 * X-Ray Vision System
 * Main orchestrator for ambient semantic analysis and visual overlay
 */
export class XRaySystem {
    private detector: TextBlockDetector;
    private buffer: SemanticBuffer;
    private highlighter: XRayHighlighter;
    private hud: XRayHUD;
    private classifiedBlocks: TextBlock[] = [];

    constructor() {
        // Initialize components
        this.buffer = new SemanticBuffer(this.handleClassification.bind(this));
        this.detector = new TextBlockDetector(this.handleBlockDetected.bind(this));
        this.highlighter = new XRayHighlighter();
        this.hud = new XRayHUD();

        // Initialize components
        this.highlighter.init();
        this.hud.init();

        // Subscribe to state changes
        xrayState.subscribe((active) => {
            this.highlighter.setActive(active);
            this.hud.setVisible(active);
            if (active) {
                this.renderHighlights();
            }
        });

        // Setup scroll handler
        let scrollTimeout: any;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                if (xrayState.isActive) {
                    this.highlighter.updateAllPositions();
                }
            }, 100);
        });
    }

    /**
     * Start the X-Ray system
     */
    start(): void {
        console.log('[XRaySystem] Starting...');

        // Setup Alt key listener
        setupAltKeyListener();

        // Start detector
        this.detector.start();

        console.log('[XRaySystem] Running');
    }

    /**
     * Stop the X-Ray system
     */
    stop(): void {
        this.detector.stop();
        this.highlighter.destroy();
        this.hud.destroy();
        console.log('[XRaySystem] Stopped');
    }

    /**
     * Handle new text block detected
     */
    private handleBlockDetected(block: TextBlock): void {
        // Skip if already analyzed
        if (block.analyzed) return;

        // Track metric
        this.hud.increment('blocksScanned');

        // Add to buffer for classification
        this.buffer.add(block);
    }

    /**
     * Handle batch classification
     */
    private async handleClassification(blocks: TextBlock[]): Promise<void> {
        const startTime = performance.now();

        try {
            const classified = await classifyTextBlocks(blocks);

            // Track metrics
            const latency = performance.now() - startTime;
            this.hud.increment('blocksClassified', classified.length);
            this.hud.updateLatency(latency);

            // Estimate cost (very rough: $0.0001 per block with heuristics)
            const estimatedCost = classified.length * 0.0001;
            this.hud.addCost(estimatedCost);

            // Store classified blocks
            this.classifiedBlocks.push(...classified);

            // Render highlights if X-Ray is active
            if (xrayState.isActive) {
                this.renderHighlights();
            }

        } catch (error) {
            console.error('[XRaySystem] Classification failed:', error);
        }
    }

    /**
     * Render highlights for all classified blocks
     */
    private renderHighlights(): void {
        let highlightCount = 0;

        this.classifiedBlocks.forEach(block => {
            if (block.classification && block.classification.type !== 'neutral') {
                this.highlighter.highlight(block, this.handleCapture.bind(this));
                highlightCount++;
            }
        });

        this.hud.updateMetrics({ activeHighlights: highlightCount });
    }

    /**
     * Handle capture button click
     */
    private async handleCapture(block: TextBlock): Promise<void> {
        console.log('[XRaySystem] Capturing block:', block);

        try {
            // Send to backend
            const response = await fetch('http://localhost:3000/api/nodes/quick', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: block.text,
                    source_url: window.location.href,
                    type: block.classification?.type || 'note',
                    metadata: {
                        selector: block.selector,
                        confidence: block.classification?.confidence
                    }
                })
            });

            const result = await response.json();

            if (result.success) {
                // Show success feedback
                this.showNotification('✅ Captured to WorkGraph', 'success');

                // Remove highlight
                this.highlighter.removeOverlay(block.element);
            } else {
                throw new Error(result.error);
            }

        } catch (error: any) {
            console.error('[XRaySystem] Capture failed:', error);
            this.showNotification(`❌ Capture failed: ${error.message}`, 'error');
        }
    }

    /**
     * Show notification
     */
    private showNotification(message: string, type: 'success' | 'error'): void {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 20px;
            background: ${type === 'success' ? '#10b981' : '#ef4444'};
            color: white;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 9999999;
            font-size: 14px;
            font-weight: 600;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Initialize system when content script loads
let xraySystem: XRaySystem | null = null;

export function initializeXRaySystem(): void {
    if (!xraySystem) {
        xraySystem = new XRaySystem();
        xraySystem.start();
        console.log('[X-Ray Vision] System initialized');
    }
}

// Auto-initialize on supported pages
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeXRaySystem);
} else {
    initializeXRaySystem();
}
