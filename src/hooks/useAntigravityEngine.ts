import { useEffect, useRef } from 'react';
import { useGraphStore } from '../store/useGraphStore';
import { traceSpan } from '../kernel/observability';

/**
 * Antigravity Physics Engine Hook (Refactored v2)
 * Offloads physics calculation to a Web Worker for 60FPS UI performance.
 */
export function useAntigravityEngine() {
    const nodes = useGraphStore(state => state.nodes);
    const edges = useGraphStore(state => state.edges);
    const setNodes = useGraphStore(state => state.setNodes);
    const isAntigravityActive = useGraphStore(state => state.isAntigravityActive);

    const workerRef = useRef<Worker | null>(null);

    // 1. Initialize Worker
    useEffect(() => {
        if (!workerRef.current) {
            workerRef.current = new Worker(new URL('../workers/physics.worker.ts', import.meta.url));

            // Listen for ticks
            workerRef.current.onmessage = (e) => {
                const { type, nodes: updatedPositions } = e.data;
                if (type === 'TICK_RESULT') {
                    // Update store with new positions
                    // We must read the latest state directly since setNodes doesn't accept a callback
                    const currentNodes = useGraphStore.getState().nodes;

                    const updatedNodes = currentNodes.map(n => {
                        const update = updatedPositions.find((u: any) => u.id === n.id);
                        if (update) {
                            return {
                                ...n,
                                position: { x: update.x, y: update.y }
                            };
                        }
                        return n;
                    });

                    setNodes(updatedNodes);
                }
            };
        }

        return () => {
            if (workerRef.current) {
                workerRef.current.terminate();
                workerRef.current = null;
            }
        };
    }, [setNodes]);

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

    }, [nodes.length, edges.length, isAntigravityActive]); // Only re-sync when count changes or topology changes

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
