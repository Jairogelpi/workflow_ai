import { useEffect, useRef } from 'react';
import { useGraphStore } from '../store/useGraphStore';
import { traceSpan } from '../kernel/observability';

/**
 * Antigravity Engine Hook
 * 
 * Drives the semantic physics simulation with integrated traceability.
 * This hook manages the continuous physics loop that applies forces to nodes
 * based on their semantic relationships (evidence, contradiction, etc.).
 * 
 * **Key Features:**
 * - Automatic physics simulation when antigravity is active
 * - Real-time observability via OpenTelemetry-style tracing
 * - Seamless integration with the graph store
 * - Performance monitoring via traceSpan
 * - Automatic pause when no nodes exist or antigravity is disabled
 * 
 * **Physics Relationships:**
 * - `evidence_for`: 60px distance, strong attraction (0.7 strength)
 * - `contradicts`: 450px distance, strong repulsion (1.0 strength)
 * - `relates_to`: 200px distance, weak association (0.1 strength)
 * - PIN nodes: Act as heavy anchors with -2200 charge
 * 
 * **Performance:**
 * - ~1ms per physics tick (40 D3-force iterations)
 * - Runs at 60 FPS via requestAnimationFrame
 * - Traced with OpenTelemetry semantics
 * 
 * @example
 * ```tsx
 * // In GraphCanvas component
 * function GraphContent() {
 *   useAntigravityEngine(); // Automatically starts the physics loop
 *   // ... rest of component
 * }
 * ```
 * 
 * @see {@link useGraphStore} for the store that manages graph state
 * @see {@link traceSpan} for observability integration
 */
export function useAntigravityEngine() {
    const isAntigravityActive = useGraphStore((state) => state.isAntigravityActive);
    const applyForces = useGraphStore((state) => state.applyForces);
    const nodes = useGraphStore((state) => state.nodes);
    const edges = useGraphStore((state) => state.edges);
    const frameRef = useRef<number | undefined>(undefined);

    useEffect(() => {
        if (!isAntigravityActive || nodes.length === 0) {
            if (frameRef.current) cancelAnimationFrame(frameRef.current);
            return;
        }

        const loop = async () => {
            // Permanent Observability: Trace every physics cycle as a Span
            await traceSpan('antigravity.physics.engine', {
                node_count: nodes.length,
                edge_count: edges.length,
                active_forces: 'RLM_SEMANTIC_FORCE'
            }, async () => {
                applyForces();
                return { success: true }; // Return value for traceSpan
            });

            if (isAntigravityActive) {
                frameRef.current = requestAnimationFrame(loop);
            }
        };

        frameRef.current = requestAnimationFrame(loop);

        return () => {
            if (frameRef.current) cancelAnimationFrame(frameRef.current);
        };
    }, [isAntigravityActive, nodes.length, edges.length, applyForces]);
}
