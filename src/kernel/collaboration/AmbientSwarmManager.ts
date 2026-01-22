/**
 * Phase 16: Ambient Swarm Manager
 * Listens to GraphStore changes and triggers autonomous reasoning cycles.
 */

import { useGraphStore } from '../../store/useGraphStore';
import { SwarmOrchestrator } from './SwarmOrchestrator';

export class AmbientSwarmManager {
    private static isInitialized = false;
    private static lastUpdate = Date.now();
    private static DEBOUNCE_MS = 5000; // Only trigger every 5s max to avoid loops

    static init() {
        if (this.isInitialized) return;

        console.log('[AMBIENT_SWARM] Initializing neural listener...');

        // Subscribe to store changes
        useGraphStore.subscribe((state, prevState) => {
            const now = Date.now();
            if (now - this.lastUpdate < this.DEBOUNCE_MS) return;

            // Trigger criteria: New nodes or new edges
            const nodeDiff = state.nodes.length !== prevState.nodes.length;
            const edgeDiff = state.edges.length !== prevState.edges.length;

            if (nodeDiff || edgeDiff) {
                console.log('[AMBIENT_SWARM] Significant change detected. Dispatching sub-pulse...');
                this.lastUpdate = now;

                const recentNodeIds = state.nodes.slice(-3).map(n => n.id);
                if (recentNodeIds.length > 0) {
                    SwarmOrchestrator.dispatchSwarmPulse(recentNodeIds);
                }
            }
        });

        this.isInitialized = true;
    }
}
