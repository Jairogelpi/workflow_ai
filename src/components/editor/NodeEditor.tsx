'use client';
import React, { useEffect, useMemo, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useGraphStore } from '../../store/useGraphStore';

// Simple debounce hook
function useDebouncedCallback<T extends (...args: any[]) => void>(
    callback: T,
    delay: number
): T {
    const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    return useCallback(
        ((...args: Parameters<T>) => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            timeoutRef.current = setTimeout(() => {
                callback(...args);
            }, delay);
        }) as T,
        [callback, delay]
    );
}

// Node type display names and colors
const NODE_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
    note: { label: 'Note', color: 'bg-slate-500' },
    claim: { label: 'Claim', color: 'bg-blue-500' },
    evidence: { label: 'Evidence', color: 'bg-green-500' },
    decision: { label: 'Decision', color: 'bg-purple-500' },
    idea: { label: 'Idea', color: 'bg-yellow-500' },
    task: { label: 'Task', color: 'bg-orange-500' },
    artifact: { label: 'Artifact', color: 'bg-pink-500' },
    assumption: { label: 'Assumption', color: 'bg-red-400' },
    constraint: { label: 'Constraint', color: 'bg-red-600' },
    source: { label: 'Source', color: 'bg-cyan-500' },
};

export default function NodeEditor() {
    const { selectedNodeId, nodes, updateNodeContent } = useGraphStore();

    // Find the current selected node data
    const selectedNode = nodes.find(n => n.id === selectedNodeId);
    const nodeType = selectedNode?.data?.type;
    const typeConfig = nodeType ? NODE_TYPE_CONFIG[nodeType] : null;

    // Debounced update to prevent rapid-fire store updates
    const debouncedUpdate = useDebouncedCallback(
        (id: string, content: string) => {
            updateNodeContent(id, content);
        },
        300
    );

    const editor = useEditor({
        extensions: [StarterKit],
        content: '',
        onUpdate: ({ editor }) => {
            if (selectedNodeId) {
                debouncedUpdate(selectedNodeId, editor.getHTML());
            }
        },
    });

    // Load node content when selection changes
    useEffect(() => {
        if (editor && selectedNode) {
            const data = selectedNode.data;
            let content = '';

            const d = data as any;
            if ('content' in d) content = d.content;
            else if ('statement' in d) content = d.statement;
            else if ('rationale' in d) content = d.rationale;
            else if ('summary' in d) content = d.summary;
            else if ('description' in d) content = d.description || '';
            else if ('details' in d) content = d.details || '';
            else if ('premise' in d) content = d.premise;
            else if ('rule' in d) content = d.rule;
            else if ('name' in d) content = d.name;

            // Only update if content is actually different
            if (editor.getHTML() !== content) {
                editor.commands.setContent(content || '');
            }
        } else if (editor && !selectedNode) {
            editor.commands.setContent('<p>Select a node to edit...</p>');
        }
    }, [selectedNodeId, selectedNode, editor]);

    if (!editor) return null;

    return (
        <div className="flex flex-col h-full">
            {/* Header with node type badge */}
            <div className="flex items-center gap-2 p-3 border-b border-slate-700">
                {typeConfig ? (
                    <>
                        <span className={`px-2 py-1 text-xs font-semibold text-white rounded ${typeConfig.color}`}>
                            {typeConfig.label}
                        </span>
                        <span className="text-sm text-slate-400 truncate">
                            ID: {selectedNodeId?.slice(0, 8)}...
                        </span>
                    </>
                ) : (
                    <span className="text-sm text-slate-500 italic">No node selected</span>
                )}
            </div>

            {/* Editor content */}
            <div className="flex-1 overflow-auto p-4 prose dark:prose-invert max-w-none">
                <EditorContent editor={editor} className="h-full outline-none" />
            </div>
        </div>
    );
}
