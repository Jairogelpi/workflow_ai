/// <reference lib="webworker" />

import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from 'd3-force';

/* -------------------------------------------------------------------------- */
/*                                Types & Intefaces                           */
/* -------------------------------------------------------------------------- */

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
/*                                D3 Engine (Fallback)                        */
/* -------------------------------------------------------------------------- */

class D3Engine implements PhysicsEngine {
    private simulation: any;
    private nodes: NodeData[] = [];
    private edges: EdgeData[] = [];
    private width: number = 1920;
    private height: number = 1080;

    init(nodes: NodeData[], edges: EdgeData[], w: number, h: number) {
        this.nodes = nodes;
        this.edges = edges;
        this.width = w;
        this.height = h;
        this.startSim();
    }

    update(nodes: NodeData[], edges: EdgeData[]) {
        // [Performance] Merging nodes instead of replacing them prevents 'Ghost Physics' jump
        const nodeMap = new Map(this.nodes.map(n => [n.id, n]));
        this.nodes = nodes.map(newN => {
            const existing = nodeMap.get(newN.id) as any;
            return {
                ...newN,
                x: existing?.x ?? newN.x ?? this.width / 2,
                y: existing?.y ?? newN.y ?? this.height / 2,
                vx: existing?.vx ?? 0,
                vy: existing?.vy ?? 0,
                fx: newN.isPinned ? (existing?.x ?? newN.x ?? null) : null,
                fy: newN.isPinned ? (existing?.y ?? newN.y ?? null) : null
            };
        });

        this.edges = edges.map(e => ({ ...e }));

        if (this.simulation) {
            this.simulation.nodes(this.nodes);
            this.simulation.force('link').links(this.edges);
            this.simulation.alpha(0.3).restart(); // Lower alpha for gentle sync
        } else {
            this.startSim();
        }
    }

    resize(w: number, h: number) {
        this.width = w;
        this.height = h;
        if (this.simulation) {
            this.simulation.force('center', forceCenter(this.width / 2, this.height / 2));
            this.simulation.alpha(0.3).restart();
        }
    }

    stop() {
        if (this.simulation) this.simulation.stop();
    }

    private startSim() {
        if (this.simulation) this.simulation.stop();

        this.simulation = forceSimulation(this.nodes)
            .force('link', forceLink(this.edges).id((d: any) => d.id)
                .distance((d: any) => {
                    const relation = d.relation || 'relates_to';
                    if (relation === 'evidence_for') return 80;
                    if (relation === 'part_of') return 50;
                    if (relation === 'contradicts') return 300;
                    return 180;
                })
                .strength((d: any) => {
                    const relation = d.relation || 'relates_to';
                    if (relation === 'evidence_for') return 0.8;
                    return 0.2;
                })
            )
            .force('charge', forceManyBody().strength((d: any) => {
                return d.isPinned ? -2000 : -800;
            }))
            .force('center', forceCenter(this.width / 2, this.height / 2))
            .force('collision', forceCollide().radius(150).strength(0.5))
            .alphaDecay(0.02)
            .alpha(0.8)
            .on('tick', () => {
                postMessage({
                    type: 'TICK_RESULT',
                    nodes: this.nodes.map(n => ({ id: n.id, x: n.x, y: n.y }))
                });
            });
    }
}

/* -------------------------------------------------------------------------- */
/*                                WASM Engine (Target)                        */
/* -------------------------------------------------------------------------- */

class WasmEngine implements PhysicsEngine {
    private wasmModule: any;
    private nodes: NodeData[] = [];
    private edges: EdgeData[] = [];

    constructor(wasmModule: any) {
        this.wasmModule = wasmModule;
    }

    init(nodes: NodeData[], edges: EdgeData[], w: number, h: number) {
        this.update(nodes, edges);
        // Start loop mechanism for WASM? 
        // Typically WASM acts as a single-step function or runs runs its own loop.
        // For now, we emulate the loop here
        this.loop();
    }

    update(nodes: NodeData[], edges: EdgeData[]) {
        this.nodes = nodes;
        this.edges = edges;
    }

    resize(w: number, h: number) {
        // Pass to WASM if supported
    }

    stop() {
        // Cancel loop
    }

    private loop() {
        if (!this.wasmModule) return;

        try {
            // [Note] The Antigravity WASM expects the graph in its optimized format
            // If the module provides apply_forces, we use it.
            if (this.wasmModule.apply_forces) {
                const result = this.wasmModule.apply_forces(this.nodes, this.edges);
                if (result) {
                    postMessage({ type: 'TICK_RESULT', nodes: result });
                }
            }
            // Request next frame
            requestAnimationFrame(() => this.loop());
        } catch (e) {
            console.error('[PhysicsWorker] WASM Loop Error (falling back to standby):', e);
        }
    }
}

/* -------------------------------------------------------------------------- */
/*                                Main Worker Logic                           */
/* -------------------------------------------------------------------------- */

let engine: PhysicsEngine | null = null;
let useWasm = false;

// Attempt to load WASM
async function bootstrap() {
    try {
        // [Ambitious] Try to load the Antigravity Engine WASM
        // We assume the build:wasm script has been run
        const wasm = await import('../../antigravity-engine/pkg/antigravity_engine.js' as any);
        await wasm.default(); // Initialize WASM

        console.log('[PhysicsWorker] 🦀 WASM Engine Loaded and Initialized!');

        useWasm = true;
        engine = new WasmEngine(wasm);
    } catch (e) {
        console.log('[PhysicsWorker] 🐢 WASM not available yet. Using D3 Engine (TypeScript) as high-perf fallback.');
        engine = new D3Engine();
    }
}

bootstrap();

self.onmessage = (e: MessageEvent<SimulationMessage>) => {
    const { type, nodes, edges, width, height } = e.data;

    // Ensure engine is ready
    if (!engine) {
        engine = new D3Engine(); // Emergency fallback
    }

    if (type === 'UPDATE_NODES') {
        engine.init(nodes || [], edges || [], width || 1920, height || 1080);
    }
    else if (type === 'RESIZE') {
        engine.resize(width || 1920, height || 1080);
    }
};
