'use client';
import React, { useEffect, useCallback, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Save, Trash2, X, Shield, Lock, Unlock, Award, AlertTriangle } from 'lucide-react';
import { useGraphStore } from '../../store/useGraphStore';
import { computeNodeHash } from '../../kernel/versioning';
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

    // Hito 4.4: Authority Signature State
    const [isSealBroken, setIsSealBroken] = useState(false);
    const isSigned = !!selectedNode?.data?.metadata?.human_signature;

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

    // Verification of seal integrity (Hito 4.4)
    useEffect(() => {
        if (selectedNode && isSigned) {
            const currentHash = computeNodeHash(selectedNode.data);
            setIsSealBroken(currentHash !== selectedNode.data.metadata.human_signature?.hash_at_signing);
        } else {
            setIsSealBroken(false);
        }
    }, [selectedNode, isSigned]);

    const handleSign = async () => {
        if (selectedNodeId) {
            await useGraphStore.getState().signNode(selectedNodeId, 'Architect-User-01');
        }
    };

    const handleBreakSeal = async () => {
        if (selectedNodeId && confirm("⚠️ ¿Deseas ROMPER el PACTO DE AUTORIDAD? La IA podrá volver a sugerir cambios en este nodo.")) {
            await useGraphStore.getState().breakSeal(selectedNodeId);
        }
    };


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

    const canEdit = !isSigned || isSealBroken;

    useEffect(() => {
        if (editor) {
            editor.setEditable(canEdit);
        }
    }, [editor, canEdit]);

    if (!editor) return null;

    return (
        <div className="flex flex-col h-full bg-slate-900 text-slate-200 shadow-2xl">
            {/* Header with node type selector and AUTHORITY STATUS */}
            <div className={`flex items-center justify-between gap-2 p-3 border-b border-slate-700 transition-colors ${isSigned ? (isSealBroken ? 'bg-red-900/50' : 'bg-blue-900 text-white') : 'bg-slate-800/50'
                }`}>
                <div className="flex items-center gap-2">
                    {isSigned ? (
                        isSealBroken ? <AlertTriangle className="text-red-500 h-4 w-4 animate-pulse" /> : <Award className="text-yellow-400 h-5 w-5" />
                    ) : (
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
                    )}

                    <div>
                        {selectedNodeId && (
                            <span className={`text-[10px] font-mono block opacity-60`}>
                                ID: {selectedNodeId.slice(0, 8)}
                            </span>
                        )}
                        {isSigned && (
                            <p className={`text-[9px] font-bold tracking-widest uppercase ${isSealBroken ? 'text-red-400' : 'text-blue-300'}`}>
                                {isSealBroken ? '⚠️ PACTO ROTO' : '🛡️ ARCHITECT VERIFIED'}
                            </p>
                        )}
                    </div>
                </div>

                {selectedNode && (
                    <div className={`text-[10px] uppercase tracking-wider font-bold ${isSigned && !isSealBroken ? 'text-blue-200' : 'text-slate-500'}`}>
                        {selectedNode.data.metadata.origin}
                    </div>
                )}
            </div>


            <div className={`flex-1 overflow-auto p-6 scrollbar-thin scrollbar-thumb-slate-700 ${!canEdit ? 'bg-slate-950/20' : ''}`}>
                <div className="flex items-center justify-between mb-4">
                    <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Contenido Secuencial</label>
                    {isSigned && !isSealBroken && (
                        <span className="text-[9px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30 font-bold flex items-center gap-1">
                            <Lock className="h-2.5 w-2.5" /> BLOQUEADO POR AUTORIDAD
                        </span>
                    )}
                </div>

                <div className="prose dark:prose-invert max-w-none">
                    <EditorContent editor={editor} className={`outline-none min-h-[150px] transition-opacity ${!canEdit ? 'opacity-60 cursor-not-allowed' : 'opacity-100'}`} />
                </div>

                {/* Zona de Firma de Autoridad (Hito 4.4) */}
                {selectedNode && (
                    <div className={`mt-8 p-4 rounded border transition-all ${isSigned
                            ? (isSealBroken ? 'border-red-500/50 bg-red-950/20' : 'border-blue-500/30 bg-blue-900/10 shadow-[0_0_20px_rgba(30,58,138,0.1)]')
                            : 'border-dashed border-slate-800 bg-slate-800/20'
                        }`}>
                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Shield className={`h-3.5 w-3.5 ${isSigned && !isSealBroken ? 'text-blue-400' : ''}`} /> Canon & Authority Pact
                        </h4>

                        {!isSigned ? (
                            <div className="space-y-3">
                                <p className="text-[11px] text-slate-400 leading-relaxed italic">
                                    Sella este nodo como **Cimiento del Canon**. La IA lo tratará como verdad absoluta en el RLM y no podrá alterarlo.
                                </p>
                                <button
                                    onClick={handleSign}
                                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
                                >
                                    <Award className="h-4 w-4" /> SELLAR CON AUTORIDAD
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded ${isSealBroken ? 'bg-red-500/20' : 'bg-blue-500/20'}`}>
                                        {isSealBroken ? <Unlock className="text-red-400 h-4 w-4" /> : <Lock className="text-blue-400 h-4 w-4" />}
                                    </div>
                                    <div>
                                        <p className={`text-xs font-bold ${isSealBroken ? 'text-red-400' : 'text-blue-100'}`}>
                                            {isSealBroken ? 'Pacto de Integridad Roto' : 'Sello de Autoridad Activo'}
                                        </p>
                                        <p className="text-[10px] text-slate-500">
                                            Autorizado el {new Date(selectedNode.data.metadata.human_signature?.timestamp || '').toLocaleTimeString()}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleBreakSeal}
                                    className={`w-full py-2 border rounded font-bold text-xs transition ${isSealBroken
                                            ? 'border-red-500/50 text-red-400 hover:bg-red-500/10'
                                            : 'border-slate-700 text-slate-400 hover:bg-slate-700/30'
                                        }`}
                                >
                                    {isSealBroken ? 'REINICIAR SELLO' : 'ROMPER SELLO (Fricción Alta)'}
                                </button>
                            </div>
                        )}
                    </div>
                )}

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
                                    node={selectedNode.data}
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
