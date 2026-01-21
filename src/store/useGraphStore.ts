import { create } from 'zustand';
import {
    Node,
    Edge,
    OnNodesChange,
    OnEdgesChange,
    applyNodeChanges,
    applyEdgeChanges,
    Connection,
    addEdge
} from 'reactflow';
import { WorkNode, WorkEdge } from '../canon/schema/ir';

// AppNode uses the Kernel WorkNode as its internal data
export type AppNode = Node<WorkNode, string>;
export type AppEdge = Edge<WorkEdge>;

interface GraphState {
    nodes: AppNode[];
    edges: AppEdge[];
    selectedNodeId: string | null;

    // Core Actions
    setNodes: (nodes: AppNode[]) => void;
    setEdges: (edges: AppEdge[]) => void;

    // React Flow Handlers
    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    onConnect: (connection: Connection) => void;

    // Interaction
    setSelectedNode: (id: string | null) => void;
    updateNodeContent: (id: string, content: string) => void;
}

export const useGraphStore = create<GraphState>((set, get) => ({
    nodes: [],
    edges: [],
    selectedNodeId: null,

    setNodes: (nodes) => set({ nodes }),
    setEdges: (edges) => set({ edges }),

    onNodesChange: (changes) => {
        set({
            nodes: applyNodeChanges(changes, get().nodes) as AppNode[],
        });
    },

    onEdgesChange: (changes) => {
        set({
            edges: applyEdgeChanges(changes, get().edges) as AppEdge[],
        });
    },

    onConnect: (connection) => {
        set({
            edges: addEdge(connection, get().edges) as AppEdge[],
        });
    },

    setSelectedNode: (id) => set({ selectedNodeId: id }),

    updateNodeContent: (id, content) => {
        const { nodes } = get();
        set({
            nodes: nodes.map((node) => {
                if (node.id === id) {
                    const nodeData = node.data;
                    const newData = { ...nodeData };

                    // Discriminant-aware update using type-safe reassignment
                    if (newData.type === 'note') {
                        newData.content = content;
                    } else if (newData.type === 'claim') {
                        newData.statement = content;
                    } else if (newData.type === 'evidence') {
                        newData.content = content;
                    } else if (newData.type === 'decision') {
                        newData.rationale = content;
                    } else if (newData.type === 'idea') {
                        newData.details = content;
                    } else if (newData.type === 'task') {
                        newData.description = content;
                    } else if (newData.type === 'artifact') {
                        newData.name = content;
                    } else if (newData.type === 'assumption') {
                        newData.premise = content;
                    } else if (newData.type === 'constraint') {
                        newData.rule = content;
                    }

                    // Update metadata timestamp for traceability
                    newData.metadata = {
                        ...newData.metadata,
                        updated_at: new Date().toISOString(),
                    };

                    return { ...node, data: newData as WorkNode };
                }
                return node;
            }),
        });
    },
}));
