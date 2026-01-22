'use client';
import React, { useEffect, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useGraphStore } from '../../store/useGraphStore';
import { WorkNode } from '../../canon/schema/ir';
import SourceNodeView from './SourceNodeView';

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
    const { selectedNodeId, nodes, updateNodeContent, mutateNodeType } = useGraphStore();

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
            else if ('citation' in d) content = d.citation;

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
        <div className="flex flex-col h-full bg-slate-900 text-slate-200 shadow-2xl">
            {/* Header with node type selector */}
            <div className="flex items-center justify-between gap-2 p-3 border-b border-slate-700 bg-slate-800/50">
                <div className="flex items-center gap-2">
                    {selectedNode ? (
                        <select
                            value={nodeType}
                            onChange={(e) => mutateNodeType(selectedNodeId!, e.target.value as any)}
                            className={`px-2 py-1 text-xs font-semibold text-white rounded cursor-pointer appearance-none outline-none ring-1 ring-white/10 ${typeConfig?.color || 'bg-slate-500'}`}
                        >
                            {Object.entries(NODE_TYPE_CONFIG).map(([type, cfg]) => (
                                <option key={type} value={type} className="bg-slate-800 text-white">
                                    {cfg.label}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <span className="text-sm text-slate-500 italic">No node selected</span>
                    )}
                    {selectedNodeId && (
                        <span className="text-xs text-slate-500 font-mono">
                            ID: {selectedNodeId.slice(0, 8)}
                        </span>
                    )}
                </div>

                {selectedNode && (
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                        {selectedNode.data.metadata.origin}
                    </div>
                )}
            </div>

            {/* Editor content */}
            <div className="flex-1 overflow-auto p-6 scrollbar-thin scrollbar-thumb-slate-700">
                <div className="prose dark:prose-invert max-w-none">
                    <EditorContent editor={editor} className="outline-none min-h-[200px]" />
                </div>

                {/* Evidence & Context section */}
                {selectedNode && (selectedNode.data.metadata.source || selectedNode.data.metadata.snippet_context) && (
                    <div className="mt-8 pt-6 border-t border-slate-800">
                        <h3 className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-4 flex items-center gap-2">
                            <span className="w-1 h-3 bg-blue-500 rounded-full" />
                            Evidence & Context
                        </h3>

                        <div className="space-y-4">
                            {selectedNode.data.metadata.source_title && (
                                <div>
                                    <span className="text-[9px] text-slate-600 block mb-1 uppercase tracking-tighter">Source Title</span>
                                    <p className="text-xs text-slate-300 font-medium">{selectedNode.data.metadata.source_title}</p>
                                </div>
                            )}

                            {selectedNode.data.metadata.source && (
                                <div>
                                    <span className="text-[9px] text-slate-600 block mb-1 uppercase tracking-tighter">Origin URL</span>
                                    <a
                                        href={selectedNode.data.metadata.source}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-400 hover:underline break-all block"
                                    >
                                        {selectedNode.data.metadata.source}
                                    </a>
                                </div>
                            )}

                            {selectedNode.data.metadata.accessed_at && (
                                <div>
                                    <span className="text-[9px] text-slate-600 block mb-1 uppercase tracking-tighter">Captured On</span>
                                    <p className="text-[11px] text-slate-400">
                                        {new Date(selectedNode.data.metadata.accessed_at).toLocaleString()}
                                    </p>
                                </div>
                            )}

                            {selectedNode.data.metadata.snippet_context && (
                                <div>
                                    <span className="text-[9px] text-slate-600 block mb-1 uppercase tracking-tighter">Surrounding Context</span>
                                    <div className="p-3 bg-slate-950/50 rounded border border-slate-800 text-[11px] text-slate-500 italic leading-relaxed line-clamp-4 hover:line-clamp-none transition-all cursor-zoom-in">
                                        "...{selectedNode.data.metadata.snippet_context}..."
                                    </div>
                                </div>
                            )}

                            {selectedNode.data.type === 'source' && (
                                <SourceNodeView
                                    nodeId={selectedNodeId!}
                                    metadata={selectedNode.data.metadata}
                                />
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Inbox Triage Alert */}
            {selectedNode && (selectedNode as any).project_id === '00000000-0000-0000-0000-000000000000' && (
                <div className="p-3 bg-blue-900/20 border-t border-blue-900/40 text-center">
                    <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">
                        Inbox: Triage required
                    </p>
                </div>
            )}
        </div>
    );
}
