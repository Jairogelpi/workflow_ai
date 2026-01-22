import { useEffect } from 'react';
import init, { apply_forces } from 'antigravity-engine';
import { useGraphStore } from '../store/useGraphStore';
import { traceSpan } from '../kernel/observability';

/**
 * useAntigravityEngine v3.0 (Gate 11)
 * 
 * Performance Bridge: Delegates heavy vectorial calculations to Rust/WASM.
 * Disables itself automatically when Antigravity is toggled off.
 */
export function useAntigravityEngine() {
    const { nodes, setNodes, isAntigravityActive } = useGraphStore();

    useEffect(() => {
        let interval: NodeJS.Timeout;

        const runPhysics = async () => {
            if (!isAntigravityActive || nodes.length === 0) return;

            try {
                // Observability Trace [Hito 4.5]
                await traceSpan('antigravity.wasm_tick', { count: nodes.length }, async () => {
                    const { cursorPosition } = useGraphStore.getState();

                    // Note: In production, init() is called once at app startup
                    await init();

                    const nodesForWasm = nodes.map(n => {
                        let x = n.position.x;
                        let y = n.position.y;

                        // Phase 21: Spatial Magnetism (TypeScript-side pre-processing)
                        if (cursorPosition) {
                            const dx = x - cursorPosition.x;
                            const dy = y - cursorPosition.y;
                            const dist = Math.sqrt(dx * dx + dy * dy);

                            if (dist < 300) {
                                // Pull nodes slightly towards cursor
                                const force = (300 - dist) / 5000;
                                x -= dx * force;
                                y -= dy * force;
                            }
                        }

                        return {
                            id: n.id,
                            x,
                            y,
                            is_pin: n.data.metadata.pin
                        };
                    });

                    const updatedPositions = apply_forces(nodesForWasm, []);

                    // Re-map WASM results back to React Flow nodes
                    const updatedNodes = nodes.map(n => {
                        const wasmNode = (updatedPositions as any[]).find(wn => wn.id === n.id);
                        if (wasmNode) {
                            return {
                                ...n,
                                position: { x: wasmNode.x, y: wasmNode.y }
                            };
                        }
                        return n;
                    });

                    setNodes(updatedNodes);
                });
            } catch (err) {
                console.error("Antigravity WASM engine failure:", err);
            }
        };

        if (isAntigravityActive) {
            interval = setInterval(runPhysics, 16); // 60 FPS Target
        }

        return () => clearInterval(interval);
    }, [isAntigravityActive, nodes, setNodes]);
}
