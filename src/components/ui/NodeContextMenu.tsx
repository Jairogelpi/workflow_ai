import React from 'react';
import { Edit3, MessageSquare, Shuffle, Trash2, Pin, PinOff, BrainCircuit } from 'lucide-react';
import { useGraphStore } from '../../store/useGraphStore';
import { KernelBridge } from '../../kernel/KernelBridge';

interface NodeContextMenuProps {
    nodeId: string;
    x: number;
    y: number;
    onClose: () => void;
}

export const NodeContextMenu: React.FC<NodeContextMenuProps> = ({ nodeId, x, y, onClose }) => {
    const nodes = useGraphStore(state => state.nodes);
    const renameNode = useGraphStore(state => state.renameNode);
    const addNodeComment = useGraphStore(state => state.addNodeComment);
    const mutateNodeType = useGraphStore(state => state.mutateNodeType);
    const deleteNode = useGraphStore(state => state.deleteNode);

    const node = nodes.find(n => n.id === nodeId);
    if (!node) return null;

    const isPinned = node.data?.metadata?.pin;

    const handleRename = () => {
        const currentName = (node.data as any).content || (node.data as any).statement || (node.data as any).title || 'Untitled';
        const newName = prompt('Nuevo nombre:', currentName);
        if (newName && newName !== currentName) {
            renameNode(nodeId, newName);
        }
        onClose();
    };

    const handleComment = () => {
        const currentComment = (node.data?.metadata as any)?.comment || '';
        const newComment = prompt('Comentario:', currentComment);
        if (newComment !== null) {
            addNodeComment(nodeId, newComment);
        }
        onClose();
    };

    const handleChangeType = () => {
        const types = ['note', 'claim', 'evidence', 'decision', 'idea', 'task', 'artifact', 'assumption', 'constraint', 'source'];
        const typeChoice = prompt(`Cambiar tipo a (${types.join(', ')}):`, node.data.type);
        if (typeChoice && types.includes(typeChoice)) {
            mutateNodeType(nodeId, typeChoice as any);
        }
        onClose();
    };

    const handleDelete = () => {
        if (confirm('¿Eliminar este nodo?')) {
            deleteNode(nodeId);
        }
        onClose();
    };

    const handleTogglePin = () => {
        // Pin/unpin logic would be added to store
        onClose();
    };

    const handleSynthesize = () => {
        KernelBridge.emit({
            type: 'RLM_THOUGHT',
            payload: {
                message: `Iniciando síntesis cognitiva para el nodo ${nodeId}...`,
                type: 'info'
            }
        });

        // Dynamic import to avoid circular dependency or heavy kernel in UI
        import('../../kernel/digest_engine').then(m => {
            m.triggerBranchDigest(nodeId).catch((err: any) => {
                console.error("Failed to trigger digest:", err);
            });
        });
        onClose();
    };

    return (
        <>
            {/* Backdrop to close menu */}
            <div
                className="fixed inset-0 z-40"
                onClick={onClose}
            />

            {/* Menu */}
            <div
                className="fixed bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-50 min-w-[200px]"
                style={{ left: x, top: y }}
            >
                <button
                    onClick={handleSynthesize}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-purple-600 dark:text-purple-400 font-medium"
                >
                    <BrainCircuit size={16} />
                    <span>Sintetizar Rama (Deep Digest)</span>
                </button>

                <div className="border-t border-gray-200 dark:border-gray-700 my-1" />

                <button
                    onClick={handleRename}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                    <Edit3 size={16} className="text-blue-500" />
                    <span>Renombrar</span>
                </button>

                <button
                    onClick={handleComment}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                    <MessageSquare size={16} className="text-green-500" />
                    <span>Añadir comentario</span>
                </button>

                <button
                    onClick={handleChangeType}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                    <Shuffle size={16} className="text-purple-500" />
                    <span>Cambiar tipo</span>
                </button>

                <div className="border-t border-gray-200 dark:border-gray-700 my-1" />

                <button
                    onClick={handleTogglePin}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                    {isPinned ? (
                        <>
                            <PinOff size={16} className="text-orange-500" />
                            <span>Desanclar</span>
                        </>
                    ) : (
                        <>
                            <Pin size={16} className="text-orange-500" />
                            <span>Anclar (PIN)</span>
                        </>
                    )}
                </button>

                <button
                    onClick={handleDelete}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 text-red-600"
                >
                    <Trash2 size={16} />
                    <span>Eliminar</span>
                </button>
            </div>
        </>
    );
};
