'use client';

import { useEffect } from 'react';
import { useGraphStore } from '../store/useGraphStore';
import { KernelBridge } from '../kernel/KernelBridge';

/**
 * Connects the pure KernelBridge to the React/Zustand Store.
 * Must be mounted in the Root Layout.
 */
export function KernelStateBridge() {
    useEffect(() => {
        // 1. Register State Provider (Allow Kernel to read Store)
        KernelBridge.registerStateProvider({
            getNodes: () => useGraphStore.getState().nodes,
            getEdges: () => useGraphStore.getState().edges
        });

        // 2. Subscribe to Kernel Events (Allow Kernel to update Store)
        const unsubscribe = KernelBridge.subscribe((event) => {
            if (event.type === 'RLM_THOUGHT') {
                useGraphStore.getState().addRLMThought(event.payload);
            } else if (event.type === 'AGENT_STATUS') {
                useGraphStore.getState().setAgentStatus(event.payload.agentId, event.payload.status);
            }
        });

        console.log('[KernelStateBridge] Connected.');
        return () => unsubscribe();
    }, []);

    return null; // Headless component
}
