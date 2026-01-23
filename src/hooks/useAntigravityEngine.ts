import { useEffect } from 'react';
import { useGraphStore } from '../store/useGraphStore';
import { traceSpan } from '../kernel/observability';

/**
 * Antigravity Physics Engine Hook
 * Applies spatial forces to nodes using WASM (when available) or JS fallback
 */
export function useAntigravityEngine() {
    const nodes = useGraphStore(state => state.nodes);
    const edges = useGraphStore(state => state.edges);
    const setNodes = useGraphStore(state => state.setNodes);
    const isAntigravityActive = useGraphStore(state => state.isAntigravityActive);
    const cursorPosition = useGraphStore(state => state.cursorPosition);

    useEffect(() => {
        if (!isAntigravityActive || nodes.length === 0) return;

        const interval = setInterval(() => {
            traceSpan('antigravity.tick', { nodeCount: nodes.length }, () => {
                // JavaScript fallback for spatial magnetism
                const updatedNodes = nodes.map(node => {
                    if (node.data.metadata.pin) return node; // Pinned nodes don't move

                    let dx = 0;
                    let dy = 0;

                    // Cursor magnetism
                    if (cursorPosition) {
                        const distX = cursorPosition.x - node.position.x;
                        const distY = cursorPosition.y - node.position.y;
                        const distance = Math.sqrt(distX * distX + distY * distY);

                        if (distance < 200 && distance > 0) {
                            const force = (200 - distance) / 200 * 2;
                            dx += (distX / distance) * force;
                            dy += (distY / distance) * force;
                        }
                    }

                    // Center gravity (weak)
                    const centerX = 400;
                    const centerY = 300;
                    dx += (centerX - node.position.x) * 0.001;
                    dy += (centerY - node.position.y) * 0.001;

                    return {
                        ...node,
                        position: {
                            x: node.position.x + dx,
                            y: node.position.y + dy
                        }
                    };
                });

                setNodes(updatedNodes);
            });
        }, 50); // 20 FPS

        return () => clearInterval(interval);
    }, [isAntigravityActive, nodes, edges, cursorPosition, setNodes]);
}
