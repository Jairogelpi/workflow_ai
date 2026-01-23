import { create } from 'zustand';

/**
 * X-RAY MODE HOOK [2026]
 * Global state for transparency/audit mode toggle.
 */
interface XRayState {
    isXRayActive: boolean;
    toggleXRay: () => void;
    hoveredNodeId: string | null;
    setHoveredNodeId: (id: string | null) => void;
}

export const useXRayMode = create<XRayState>((set) => ({
    isXRayActive: false,
    toggleXRay: () => set((s) => ({ isXRayActive: !s.isXRayActive })),
    hoveredNodeId: null,
    setHoveredNodeId: (id) => set({ hoveredNodeId: id }),
}));
