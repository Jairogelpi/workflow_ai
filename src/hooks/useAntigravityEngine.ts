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
    const latestPositions = useRef<any[] | null>(null);
    const rafRef = useRef<number | null>(null);
    const isRunning = useRef(false);

    // 1. Initialize Worker & Loop
    useEffect(() => {
        if (!workerRef.current) {
            workerRef.current = new Worker(new URL('../workers/physics.worker.ts', import.meta.url));

            workerRef.current.onmessage = (e: MessageEvent) => {
                const { type, nodes: updatedPositions } = e.data;

                if (type === 'TICK_RESULT') {
                    // Just update the Red, DO NOT Trigger Render here
                    latestPositions.current = updatedPositions;
                    if (!isRunning.current) startLoop();
                }
                else if (type === 'SIMULATION_END') {
                    isRunning.current = false;
                    latestPositions.current = updatedPositions; // Ensure final frame

                    // Final Render Force
                    setNodesFlow((currentFlowNodes) => {
                        return currentFlowNodes.map(n => {
                            const update = updatedPositions.find((u: any) => u.id === n.id);
                            return update ? { ...n, position: { x: update.x, y: update.y } } : n;
                        });
                    });

                    // Sync to Store (Persistence)
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
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, []);

    // [Render Loop] Decoupled from Worker Frequency
    const startLoop = () => {
        isRunning.current = true;

        const loop = () => {
            if (!isRunning.current) return;

            if (latestPositions.current) {
                const updates = latestPositions.current;
                latestPositions.current = null; // Clear queue

                setNodesFlow((currentFlowNodes) => {
                    return currentFlowNodes.map(n => {
                        const update = updates.find((u: any) => u.id === n.id);
                        if (update) {
                            return {
                                ...n,
                                position: { x: update.x, y: update.y },
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
