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
            if (this.wasmModule && this.wasmModule.apply_forces) {
                // Map to Rust struct: { id, x, y, is_pin }
                // Rust expects snake_case 'is_pin' and required floats.
                const safeNodes = this.nodes.map(n => ({
                    id: n.id,
                    x: n.x || 0.0,
                    y: n.y || 0.0,
                    is_pin: !!n.isPinned
                }));

                const result = this.wasmModule.apply_forces(safeNodes, this.edges);

                if (result && Array.isArray(result)) {
                    const len = result.length;
                    // ... rest of logic
                    const positions = new Float32Array(len * 2);
                    let totalDisplacement = 0;

                    for (let i = 0; i < len; i++) {
                        // ... map back result
                        const newNode = result[i];
                        // Map Rust result back to our NodeData if needed, 
                        // but here we just need positions.
                        // Assuming Rust returns similar struct.
                        const cx = newNode.x;
                        const cy = newNode.y;

                        // We need to correlate with this.nodes[i] assuming preserved order
                        const oldNode = this.nodes[i];

                        if (oldNode && oldNode.id === newNode.id) {
                            const dx = cx - (oldNode.x || 0);
                            const dy = cy - (oldNode.y || 0);
                            totalDisplacement += Math.abs(dx) + Math.abs(dy);
                        }

                        positions[i * 2] = cx;
                        positions[i * 2 + 1] = cy;
                    }

                    // Update local state with new positions
                    // We must be careful not to overwrite other properties if result is just strict Node struct
                    for (let i = 0; i < len; i++) {
                        if (this.nodes[i]) {
                            this.nodes[i].x = result[i].x;
                            this.nodes[i].y = result[i].y;
                        }
                    }

                    // Threshold: 0.5 total pixel movement across all nodes
                    if (totalDisplacement < 0.5) {
                        postMessage({
                            type: 'SIMULATION_END',
                            positions: positions
                        }, [positions.buffer]);
                    } else {
                        postMessage({
                            type: 'TICK_RESULT',
                            positions: positions
                        }, [positions.buffer]);
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
