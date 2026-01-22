/**
 * X-Ray Mode State Management
 */

export class XRayState {
    private _isActive = false;
    private listeners = new Set<(active: boolean) => void>();

    /**
     * Check if X-Ray is active
     */
    get isActive(): boolean {
        return this._isActive;
    }

    /**
     * Toggle X-Ray mode
     */
    toggle(): void {
        this.setActive(!this._isActive);
    }

    /**
     * Set X-Ray active state
     */
    setActive(active: boolean): void {
        if (this._isActive !== active) {
            this._isActive = active;
            this.notifyListeners();
        }
    }

    /**
     * Subscribe to state changes
     */
    subscribe(listener: (active: boolean) => void): () => void {
        this.listeners.add(listener);
        // Return unsubscribe function
        return () => this.listeners.delete(listener);
    }

    /**
     * Notify all listeners
     */
    private notifyListeners(): void {
        this.listeners.forEach(listener => listener(this._isActive));
    }
}

// Global instance
export const xrayState = new XRayState();

/**
 * Setup Alt key listener
 */
export function setupAltKeyListener(): void {
    let altPressed = false;

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Alt' && !altPressed) {
            altPressed = true;
            xrayState.setActive(true);
        }
    });

    document.addEventListener('keyup', (e) => {
        if (e.key === 'Alt') {
            altPressed = false;
            xrayState.setActive(false);
        }
    });

    console.log('[XRayState] Alt key listener initialized');
}
