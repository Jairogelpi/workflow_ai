import { create } from 'zustand';

interface GraphState {
    nodes: any[];
    edges: any[];
    setNodes: (nodes: any[]) => void;
    setEdges: (edges: any[]) => void;
}

export const useGraphStore = create<GraphState>((set) => ({
    nodes: [],
    edges: [],
    setNodes: (nodes) => set({ nodes }),
    setEdges: (edges) => set({ edges }),
}));
