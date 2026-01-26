/**
 * Kernel Bridge (Event Bus & State Proxy)
 * Decouples the pure logic Kernel from the React/Zustand UI Store.
 */

export type KernelEvent =
    | { type: 'RLM_THOUGHT'; payload: { message: string; type: 'info' | 'warn' | 'error' | 'success' | 'reasoning'; agentId?: string; agentName?: string } }
    | { type: 'AGENT_STATUS'; payload: { agentId: string; status: 'IDLE' | 'THINKING' | 'WORKING' } }
    | { type: 'CMD_ADD_NODE'; payload: { node: any; position: { x: number; y: number } } };

export interface GraphStateProvider {
    getNodes: () => any[];
    getEdges: () => any[];
}

export class KernelBridge {
    private static listeners: ((event: KernelEvent) => void)[] = [];
    private static stateProvider: GraphStateProvider | null = null;

    /**
     * Kernel calls this to emit events to the UI/System.
     */
    static emit(event: KernelEvent) {
        this.listeners.forEach(fn => fn(event));
    }

    /**
     * UI/System calls this to subscribe to Kernel events.
     */
    static subscribe(fn: (event: KernelEvent) => void) {
        this.listeners.push(fn);
        return () => {
            this.listeners = this.listeners.filter(l => l !== fn);
        };
    }

    /**
     * Register the data source (Store) so Kernel can read state lazily.
     */
    static registerStateProvider(provider: GraphStateProvider) {
        this.stateProvider = provider;
        console.log('[KernelBridge] State Provider registered.');
    }

    /**
     * Kernel calls this to read current graph state.
     */
    static getState() {
        if (!this.stateProvider) {
            console.warn('[KernelBridge] No State Provider registered! Returning empty state.');
            return { nodes: [], edges: [] };
        }
        return {
            nodes: this.stateProvider.getNodes(),
            edges: this.stateProvider.getEdges()
        };
    }
}
