/**
 * X-Ray HUD Component
 * Corner display showing real-time metrics
 */

export interface XRayMetrics {
    blocksScanned: number;
    blocksClassified: number;
    totalCost: number;
    avgLatency: number;
    activeHighlights: number;
}

export class XRayHUD {
    private container: HTMLDivElement | null = null;
    private metrics: XRayMetrics = {
        blocksScanned: 0,
        blocksClassified: 0,
        totalCost: 0,
        avgLatency: 0,
        activeHighlights: 0
    };

    /**
     * Initialize the HUD
     */
    init(): void {
        this.container = document.createElement('div');
        this.container.id = 'wg-xray-hud';
        this.container.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 16px 20px;
            background: rgba(15, 23, 42, 0.95);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(59, 130, 246, 0.3);
            border-radius: 16px;
            color: white;
            font-family: 'Inter', -apple-system, sans-serif;
            font-size: 12px;
            z-index: 999998;
            min-width: 200px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.3s ease;
            pointer-events: none;
        `;

        this.render();
        document.body.appendChild(this.container);
    }

    /**
     * Show/hide the HUD
     */
    setVisible(visible: boolean): void {
        if (!this.container) return;


        if (visible) {
            this.container.style.opacity = '1';
            this.container.style.transform = 'translateY(0)';
        } else {
            this.container.style.opacity = '0';
            this.container.style.transform = 'translateY(20px)';
        }
    }

    /**
     * Update metrics
     */
    updateMetrics(updates: Partial<XRayMetrics>): void {
        this.metrics = { ...this.metrics, ...updates };
        this.render();
    }

    /**
     * Increment a counter
     */
    increment(key: keyof XRayMetrics, amount: number = 1): void {
        (this.metrics[key] as number) += amount;
        this.render();
    }

    /**
     * Add cost (in dollars)
     */
    addCost(cost: number): void {
        this.metrics.totalCost += cost;
        this.render();
    }

    /**
     * Update average latency
     */
    updateLatency(latency: number): void {
        // Simple moving average
        if (this.metrics.avgLatency === 0) {
            this.metrics.avgLatency = latency;
        } else {
            this.metrics.avgLatency = (this.metrics.avgLatency * 0.7) + (latency * 0.3);
        }
        this.render();
    }

    /**
     * Render the HUD content
     */
    private render(): void {
        if (!this.container) return;

        this.container.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                <div style="width: 8px; height: 8px; background: #3b82f6; border-radius: 50%; animation: pulse 2s infinite;"></div>
                <div style="font-weight: 700; font-size: 13px; letter-spacing: 0.5px; color: #3b82f6;">X-RAY ACTIVE</div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px 16px;">
                <div>
                    <div style="color: rgba(255,255,255,0.5); font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px;">Scanned</div>
                    <div style="font-weight: 600; font-size: 18px; margin-top: 2px;">${this.metrics.blocksScanned}</div>
                </div>
                
                <div>
                    <div style="color: rgba(255,255,255,0.5); font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px;">Classified</div>
                    <div style="font-weight: 600; font-size: 18px; margin-top: 2px; color: #10b981;">${this.metrics.blocksClassified}</div>
                </div>
                
                <div>
                    <div style="color: rgba(255,255,255,0.5); font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px;">Highlights</div>
                    <div style="font-weight: 600; font-size: 18px; margin-top: 2px; color: #f59e0b;">${this.metrics.activeHighlights}</div>
                </div>
                
                <div>
                    <div style="color: rgba(255,255,255,0.5); font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px;">Latency</div>
                    <div style="font-weight: 600; font-size: 18px; margin-top: 2px;">${Math.round(this.metrics.avgLatency)}<span style="font-size: 11px; opacity: 0.7;">ms</span></div>
                </div>
            </div>
            
            <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.1);">
                <div style="color: rgba(255,255,255,0.5); font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px;">Total Cost</div>
                <div style="font-weight: 700; font-size: 16px; margin-top: 2px; color: #3b82f6;">
                    $${this.metrics.totalCost.toFixed(4)}
                </div>
            </div>
            
            <style>
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            </style>
        `;
    }

    /**
     * Reset all metrics
     */
    reset(): void {
        this.metrics = {
            blocksScanned: 0,
            blocksClassified: 0,
            totalCost: 0,
            avgLatency: 0,
            activeHighlights: 0
        };
        this.render();
    }

    /**
     * Destroy the HUD
     */
    destroy(): void {
        this.container?.remove();
        this.container = null;
    }
}
