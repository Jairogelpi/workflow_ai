'use client';
import React from 'react';
import { Handle, Position, NodeProps, NodeToolbar } from 'reactflow';
import { WorkNode as WorkNodeIR } from '../../canon/schema/ir';
import { useGraphStore } from '../../store/useGraphStore';
import {
    MessageSquare,
    CheckCircle2,
    ShieldAlert,
    HelpCircle,
    Lightbulb,
    CheckSquare,
    FileText,
    Brain,
    Lock,
    Link
} from 'lucide-react';

const NODE_TYPE_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
    note: { label: 'Note', color: 'bg-slate-500', icon: MessageSquare },
    claim: { label: 'Claim', color: 'bg-blue-600', icon: ShieldAlert },
    evidence: { label: 'Evidence', color: 'bg-green-600', icon: CheckCircle2 },
    decision: { label: 'Decision', color: 'bg-purple-600', icon: Brain },
    idea: { label: 'Idea', color: 'bg-yellow-600', icon: Lightbulb },
    task: { label: 'Task', color: 'bg-orange-600', icon: CheckSquare },
    artifact: { label: 'Artifact', color: 'bg-pink-600', icon: FileText },
    assumption: { label: 'Assumption', color: 'bg-red-400', icon: HelpCircle },
    constraint: { label: 'Constraint', color: 'bg-red-700', icon: Lock },
    source: { label: 'Source', color: 'bg-cyan-600', icon: Link },
};

export function WorkNodeComponent({ data, selected, id }: NodeProps<WorkNodeIR>) {
    const { mutateNodeType } = useGraphStore();
    const config = (NODE_TYPE_CONFIG[data.type] || NODE_TYPE_CONFIG.note)!;
    const Icon = config.icon;

    // Content preview logic - handle both string and object content
    const rawContent = (data as any).content || (data as any).statement || (data as any).rationale || (data as any).summary || (data as any).description || (data as any).name || (data as any).rule || '';
    const content = typeof rawContent === 'object' ? (rawContent.name || rawContent.content || JSON.stringify(rawContent)) : String(rawContent);
    const preview = content.replace(/<[^>]*>?/gm, '').slice(0, 50) + (content.length > 50 ? '...' : '');

    return (
        <>
            {/* React Flow Toolbar - Visible on Selection */}
            <NodeToolbar
                isVisible={selected}
                position={Position.Top}
                className="flex gap-1 p-1 bg-slate-900/90 backdrop-blur-md rounded-lg border border-slate-700 shadow-2xl translate-y-[-8px]"
            >
                {Object.entries(NODE_TYPE_CONFIG).slice(0, 6).map(([type, cfg]) => {
                    const TypeIcon = cfg.icon;
                    return (
                        <button
                            key={type}
                            onClick={(e) => {
                                e.stopPropagation();
                                mutateNodeType(id, type as any);
                            }}
                            className={`p-1.5 rounded-md transition-all hover:scale-110 active:scale-95 ${data.type === type ? 'bg-slate-700 text-white shadow-inner' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                }`}
                            title={`Convert to ${cfg.label}`}
                        >
                            <TypeIcon size={14} />
                        </button>
                    );
                })}
            </NodeToolbar>

            {/* Node UI */}
            <div className={`min-w-[180px] max-w-[240px] rounded-lg border-2 bg-slate-900 shadow-xl transition-all ${selected ? 'border-blue-500 ring-4 ring-blue-500/20' : 'border-slate-800'
                }`}>
                {/* Header */}
                <div className={`px-3 py-1.5 rounded-t-lg flex items-center justify-between gap-2 ${config.color}`}>
                    <div className="flex items-center gap-1.5 overflow-hidden">
                        <Icon size={12} className="text-white shrink-0" />
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider truncate">
                            {config.label}
                        </span>
                    </div>
                </div>

                {/* Body */}
                <div className="p-3">
                    <p className="text-xs text-slate-300 leading-normal line-clamp-3">
                        {preview || <span className="text-slate-600 italic">Empty {data.type}</span>}
                    </p>
                </div>

                {/* Handles */}
                <Handle
                    type="target"
                    position={Position.Top}
                    className="w-3 h-3 border-2 border-slate-900 bg-slate-700"
                />
                <Handle
                    type="source"
                    position={Position.Bottom}
                    className="w-3 h-3 border-2 border-slate-900 bg-slate-700"
                />
            </div>
        </>
    );
}
