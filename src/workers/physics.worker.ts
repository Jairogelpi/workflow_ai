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
                // Must serialize/deserialize at the boundary if WASM expects JsValue
                // Note: In refined versions, we'd use SharedArrayBuffer for zero-copy
                const result = this.wasmModule.apply_forces(this.nodes, this.edges);

                if (result) {
                    // Update local state with result
                    this.nodes = result;

                    // Send back to Main Thread
                    postMessage({
                        type: 'TICK_RESULT',
                        nodes: result
                    });
                }
            }

            // Loop
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
