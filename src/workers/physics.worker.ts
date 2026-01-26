/// <reference lib="webworker" />

// [ANTIGRAVITY] Phase 1: Pure WASM Engine
// We have removed d3-force to ensure we are running on the Rust Core.

type NodeData = {
    id: string;
    x?: number;
    y?: number;
    fx?: number | null;
    fy?: number | null;
    isPinned?: boolean;
    relation?: string;
    metadata?: any;
};

type EdgeData = {
    source: string;
    target: string;
    relation?: string;
};

type SimulationMessage = {
    type: 'UPDATE_NODES' | 'TICK' | 'RESIZE';
    nodes?: NodeData[];
    edges?: EdgeData[];
    width?: number;
    height?: number;
    alpha?: number;
};

/* -------------------------------------------------------------------------- */
/*                                Engine Abstraction                          */
/* -------------------------------------------------------------------------- */

interface PhysicsEngine {
    init(nodes: NodeData[], edges: EdgeData[], w: number, h: number): void;
    update(nodes: NodeData[], edges: EdgeData[]): void;
    resize(w: number, h: number): void;
    stop(): void;
}

/* -------------------------------------------------------------------------- */
/*                                WASM Engine (Primary)                       */
/* -------------------------------------------------------------------------- */

class WasmEngine implements PhysicsEngine {
    private wasmModule: any;
    private nodes: NodeData[] = [];
    private edges: EdgeData[] = [];
    private isRunning: boolean = false;

    constructor(wasmModule: any) {
        this.wasmModule = wasmModule;
    }

    init(nodes: NodeData[], edges: EdgeData[], w: number, h: number) {
        this.nodes = nodes;
        this.edges = edges;
        this.isRunning = true;
        this.loop();
    }

    update(nodes: NodeData[], edges: EdgeData[]) {
        // Create a map for faster lookup if we needed to preserve state, 
        // but WASM usually handles state internally or we pass full state.
        // For this version (stateless tick), we just update the reference.
        this.nodes = nodes;
        this.edges = edges;
    }

    resize(w: number, h: number) {
        // Pass width/height to WASM if architecture supports bounds
    }

    stop() {
        this.isRunning = false;
    }

    private loop() {
        if (!this.isRunning) return;
        if (!this.wasmModule) return;

        try {
            // [Rust Core] Call the Antigravity Engine
            // Expects: apply_forces(nodes, edges) -> updated_nodes
            if (this.wasmModule.apply_forces) {
                const result = this.wasmModule.apply_forces(this.nodes, this.edges);

                if (result) {
                    // [Performance] Calculate Kinetic Energy (Displacement)
                    // If the system has settled, we notify the main thread to sync to DB.
                    let totalDisplacement = 0;
                    // Optimization: Use simple loop assuming order preservation from WASM
                    const len = result.length;
                    for (let i = 0; i < len; i++) {
                        const oldNode = this.nodes[i];
                        const newNode = result[i];
                        if (oldNode && newNode && oldNode.id === newNode.id) {
                            const dx = (newNode.x || 0) - (oldNode.x || 0);
                            const dy = (newNode.y || 0) - (oldNode.y || 0);
                            totalDisplacement += Math.abs(dx) + Math.abs(dy);
                        }
                    }

                    // Update local state
                    this.nodes = result;

                    // Threshold: 1.0 total pixel movement across all nodes
                    if (totalDisplacement < 0.5) {
                        postMessage({
                            type: 'SIMULATION_END',
                            nodes: result
                        });
                        // Optional: Stop loop or sleep? 
                        // For now, continue loop but maybe with reduced frequency or just send END messages repeatedly?
                        // Better: Stop sending TICKs, just sends END once then waits for interaction?
                        // Let sends END every frame if settled? No, that spams.
                        // We should probably check if we *was* running. 
                        // But simplification: The hook will handle the debounce/idempotency.
                    } else {
                        postMessage({
                            type: 'TICK_RESULT',
                            nodes: result
                        });
                    }
                }
            }

            requestAnimationFrame(() => this.loop());

        } catch (e) {
            console.error('[PhysicsWorker] CRITICAL: WASM Panic', e);
            this.stop();
        }
    }
}

/* -------------------------------------------------------------------------- */
/*                                Main Worker Logic                           */
/* -------------------------------------------------------------------------- */

let engine: PhysicsEngine | null = null;

async function bootstrap() {
    try {
        console.log('[PhysicsWorker] Initializing Antigravity Engine (Rust)...');

        // Import the WASM module
        // We use the pkg direct import.
        // const wasm = await import('../../antigravity-engine/pkg/antigravity_engine.js');
        // NOTE: The 'bundler' target in wasm-pack initializes automatically on import.
        const wasm = await import('../../antigravity-engine/pkg/antigravity_engine.js');

        console.log('[PhysicsWorker] 🦀 RUST ENGINE ONLINE.');

        engine = new WasmEngine(wasm);

        // Notify main thread we are ready
        postMessage({ type: 'ENGINE_READY' });

    } catch (e) {
        console.error('[PhysicsWorker] FATAL: Could not load Antigravity Engine.', e);
        console.error('Check that "npm run build:wasm" has been run and "antigravity-engine/pkg" exists.');
    }
}

bootstrap();

self.onmessage = (e: MessageEvent<SimulationMessage>) => {
    const { type, nodes, edges, width, height } = e.data;

    if (!engine) {
        // Drop messages until engine is ready
        return;
    }

    if (type === 'UPDATE_NODES') {
        engine.init(nodes || [], edges || [], width || 1920, height || 1080);
    }
    else if (type === 'TICK') {
        // Manual tick if not using loop
    }
    else if (type === 'RESIZE') {
        engine.resize(width || 1920, height || 1080);
    }
};
