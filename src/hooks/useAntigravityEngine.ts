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

    // 1. Initialize Worker
    useEffect(() => {
        if (!workerRef.current) {
            workerRef.current = new Worker(new URL('../workers/physics.worker.ts', import.meta.url));

            // Listen for ticks
            workerRef.current.onmessage = (e: MessageEvent) => {
                const { type, nodes: updatedPositions } = e.data;

                // [TRANSIENT UPDATE] 60fps Animation Loop
                // Updates ONLY the React Flow internal state (Visuals)
                // Does NOT touch Zustand or Supabase
                if (type === 'TICK_RESULT' || type === 'SIMULATION_END') {
                    setNodesFlow((currentFlowNodes) => {
                        return currentFlowNodes.map(n => {
                            const update = updatedPositions.find((u: any) => u.id === n.id);
                            if (update) {
                                return {
                                    ...n,
                                    position: { x: update.x, y: update.y },
                                    // Optimization: Only update if position actually changed > epsilon
                                    // But map is cheap enough for now
                                };
                            }
                            return n;
                        });
                    });
                }

                // [PERSISTENCE UPDATE] Only when physics settles
                // Sincroniza con el Store de Zustand solo cuando el movimiento se detenga
                if (type === 'SIMULATION_END') {
                    // Reconstruct full nodes from latest visual state to sync
                    // Since setNodesFlow is async, we use the data from worker directly for sync
                    // We need to map the worker 'nodes' back to AppNodes structure
                    const appNodes = nodes.map(n => {
                        const update = updatedPositions.find((u: any) => u.id === n.id);
                        return update ? { ...n, position: { x: update.x, y: update.y } } : n;
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
        };
    }, []);

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
