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
/*                                Worker State                                */
/* -------------------------------------------------------------------------- */

let simulation: any = null;
let nodes: NodeData[] = [];
let edges: EdgeData[] = [];
let width = 1920;
let height = 1080;

/* -------------------------------------------------------------------------- */
/*                                Physics Logic                               */
/* -------------------------------------------------------------------------- */

function initSimulation() {
    if (simulation) simulation.stop();

    simulation = forceSimulation(nodes)
        .force('link', forceLink(edges).id((d: any) => d.id)
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
        .force('center', forceCenter(width / 2, height / 2))
        .force('collision', forceCollide().radius(150).strength(0.5))
        .alphaDecay(0.02) // Slower decay for more persistent movement
        .alpha(0.8)       // Start hot
        .on('tick', () => {
            postMessage({
                type: 'TICK_RESULT',
                nodes: nodes.map(n => ({ id: n.id, x: n.x, y: n.y }))
            });
        });
}

/* -------------------------------------------------------------------------- */
/*                                Message Handler                             */
/* -------------------------------------------------------------------------- */

self.onmessage = (e: MessageEvent<SimulationMessage>) => {
    const { type, nodes: newNodes, edges: newEdges, width: w, height: h } = e.data;

    if (type === 'RESIZE') {
        if (w && h) {
            width = w;
            height = h;
            if (simulation) simulation.force('center', forceCenter(width / 2, height / 2));
            if (simulation) simulation.alpha(0.3).restart();
        }
    }

    if (type === 'UPDATE_NODES') {
        // Merge new data with existing simulation state to preserve positions
        const nodeMap = new Map(nodes.map(n => [n.id, n]));

        nodes = (newNodes || []).map(newN => {
            const existing = nodeMap.get(newN.id);
            return {
                ...newN,
                x: existing?.x || newN.x || width / 2 + (Math.random() - 0.5) * 50,
                y: existing?.y || newN.y || height / 2 + (Math.random() - 0.5) * 50,
                fx: newN.isPinned ? (existing?.x ?? newN.x ?? null) : null,
                fy: newN.isPinned ? (existing?.y ?? newN.y ?? null) : null
            };
        });

        edges = (newEdges || []).map(e => ({ ...e }));

        initSimulation();
    }
};
