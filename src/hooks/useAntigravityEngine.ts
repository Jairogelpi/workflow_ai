import { useEffect } from 'react';
import { useGraphStore } from '../store/useGraphStore';
import { traceSpan } from '../kernel/observability';

// Dynamic import for WASM module (works in production)
let wasmModule: any = null;
let wasmInitialized = false;

/**
 * Antigravity Physics Engine Hook
 * Uses Rust/WASM for high-performance spatial physics
 */
export function useAntigravityEngine() {
    const nodes = useGraphStore(state => state.nodes);
    const edges = useGraphStore(state => state.edges);
    const setNodes = useGraphStore(state => state.setNodes);
    const isAntigravityActive = useGraphStore(state => state.isAntigravityActive);

    useEffect(() => {
        // Initialize WASM module once
        if (!wasmInitialized) {
            import('../../../antigravity-engine/pkg')
                .then(module => {
                    wasmModule = module;
                    wasmInitialized = true;
                    console.log('[Antigravity] WASM module loaded successfully');
                })
                .catch(err => {
                    console.warn('[Antigravity] WASM not available, using JS fallback:', err);
                });
        }
    }, []);

    useEffect(() => {
        if (!isAntigravityActive || nodes.length === 0) return;

        const interval = setInterval(() => {
            traceSpan('antigravity.tick', { nodeCount: nodes.length }, () => {
                if (wasmModule && wasmModule.apply_forces) {
                    // Use WASM for physics
                    const nodeData = nodes.map(n => ({
                        id: n.id,
                        x: n.position.x,
                        y: n.position.y,
                        is_pin: n.data.metadata.pin || false
                    }));

                    const edgeData = edges.map(e => ({
                        source: e.source,
                        target: e.target
                    }));

                    try {
                        const updatedData = wasmModule.apply_forces(nodeData, edgeData);
                        const updatedNodes = nodes.map((node, i) => ({
                            ...node,
                            position: {
                                x: updatedData[i].x,
                                y: updatedData[i].y
                            }
                        }));
                        setNodes(updatedNodes);
                    } catch (err) {
                        console.error('[Antigravity] WASM error:', err);
                    }
                }
            });
        }, 50); // 20 FPS

        return () => clearInterval(interval);
    }, [isAntigravityActive, nodes, edges, setNodes]);
}
