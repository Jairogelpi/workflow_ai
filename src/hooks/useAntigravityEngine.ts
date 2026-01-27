import { useEffect, useRef } from 'react';
import { useGraphStore, AppNode } from '../store/useGraphStore';
import { traceSpan } from '../kernel/observability';
import { useReactFlow } from 'reactflow';

/**
 * Antigravity Physics Engine Hook (Refactored v3)
 * Offloads physics calculation to a Web Worker for 60FPS UI performance.
 * Optimized: Uses React Flow's internal store for ticks to avoid Zustand re-render storms.
 */
export function useAntigravityEngine() {
    const nodes = useGraphStore(state => state.nodes);
    const edges = useGraphStore(state => state.edges);
    const setNodesZustand = useGraphStore(state => state.setNodes);
    const isAntigravityActive = useGraphStore(state => state.isAntigravityActive);
    const syncPositions = useGraphStore(state => state.syncPositions);

    const { setNodes: setNodesFlow } = useReactFlow();
    const workerRef = useRef<Worker | null>(null);
    // [Performance] Mutable Ref for latest positions (Zero React Render on Update)
    const latestPositions = useRef<Float32Array | null>(null);
    const nodeOrderRef = useRef<string[]>([]);
    const rafRef = useRef<number | null>(null);
    const isRunning = useRef(false);

    // 1. Initialize Worker & Loop
    useEffect(() => {
        if (!workerRef.current) {
            workerRef.current = new Worker(new URL('../workers/physics.worker.ts', import.meta.url));

            workerRef.current.onmessage = (e: MessageEvent) => {
                const { type, positions } = e.data;

                if (type === 'TICK_RESULT') {
                    // Zero-Copy: Receive Float32Array directly
                    latestPositions.current = positions;
                    if (!isRunning.current) startLoop();
                }
                else if (type === 'SIMULATION_END') {
                    isRunning.current = false;
                    latestPositions.current = positions; // Ensure final frame

                    // Final Render (Sync Mode)
                    const nodeOrder = nodeOrderRef.current;
                    const finalUpdates = new Map<string, { x: number, y: number }>();
                    if (positions) {
                        for (let i = 0; i < nodeOrder.length; i++) {
                            if (i * 2 + 1 < positions.length) {
                                const id = nodeOrder[i];
                                if (id) finalUpdates.set(id, { x: positions[i * 2], y: positions[i * 2 + 1] });
                            }
                        }
                    }

                    setNodesFlow((currentFlowNodes) => {
                        return currentFlowNodes.map(n => {
                            if (n.dragging || n.selected) return n;
                            const up = finalUpdates.get(n.id || '');
                            return up ? { ...n, position: up } : n;
                        });
                    });

                    // Sync to Store (Persistence)
                    const appNodes = nodes.map(n => {
                        const up = finalUpdates.get(n.id || '');
                        return up ? { ...n, position: up } : n;
                    });
                    syncPositions(appNodes);
                }
            };
        }

        return () => {
            if (workerRef.current) {
                workerRef.current.terminate();
                workerRef.current = null;
            }
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, []);

    // [Render Loop] Decoupled from Worker Frequency
    const startLoop = () => {
        isRunning.current = true;

        const loop = () => {
            if (!isRunning.current) return;

            if (latestPositions.current) {
                const positions = latestPositions.current;
                latestPositions.current = null; // Clear queue

                const nodeOrder = nodeOrderRef.current;
                const updates = new Map<string, { x: number, y: number }>();

                // Fast Map: O(N) instead of O(N^2)
                for (let i = 0; i < nodeOrder.length; i++) {
                    if (i * 2 + 1 < positions.length) {
                        const id = nodeOrder[i];
                        if (id) updates.set(id, { x: positions[i * 2], y: positions[i * 2 + 1] });
                    }
                }

                setNodesFlow((currentFlowNodes) => {
                    return currentFlowNodes.map(n => {
                        // [Fix] Respect user interaction: Do not update if dragging or selected
                        if (n.dragging || n.selected) return n;

                        const up = updates.get(n.id || '');
                        if (up) {
                            return {
                                ...n,
                                position: up,
                            };
                        }
                        return n;
                    });
                });
            }

            rafRef.current = requestAnimationFrame(loop);
        };
        loop();
    };

    // [Performance] Compute a lightweight hash for pin state to avoid re-syncing on text changes
    const pinSignature = nodes.map(n => n.data.metadata.pin ? '1' : '0').join('');

    // 2. Sync Data to Worker
    useEffect(() => {
        if (!workerRef.current || !isAntigravityActive || nodes.length === 0) return;

        traceSpan('antigravity.sync', { nodeCount: nodes.length }, () => {
            // Only send essential data for physics to minimize serialization cost
            const physicsNodes = nodes.map(n => ({
                id: n.id,
                x: n.position.x,
                y: n.position.y,
                isPinned: n.data.metadata.pin,
                relation: 'relates_to' // Default for now
            }));

            // [Topology Sync] Update ID order for Zero-Copy mapping
            nodeOrderRef.current = physicsNodes.map(n => n.id);

            const physicsEdges = edges.map(e => ({
                source: e.source,
                target: e.target,
                relation: e.data?.relation
            }));

            workerRef.current?.postMessage({
                type: 'UPDATE_NODES',
                nodes: physicsNodes,
                edges: physicsEdges,
                width: window.innerWidth,
                height: window.innerHeight
            });
        });

    }, [nodes.length, edges.length, isAntigravityActive, pinSignature]);

    // 3. Handle Resize
    useEffect(() => {
        const handleResize = () => {
            workerRef.current?.postMessage({
                type: 'RESIZE',
                width: window.innerWidth,
                height: window.innerHeight
            });
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
}
