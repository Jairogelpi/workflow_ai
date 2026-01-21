'use client';
import React from 'react';
import { WorkNode } from '../../canon/schema/ir';
import { CheckCircle2, AlertCircle, User, Cpu } from 'lucide-react';

interface NodeListItemProps {
    node: WorkNode;
    selected: boolean;
    onClick: () => void;
}

const NODE_TYPE_COLORS: Record<string, string> = {
    note: 'bg-slate-500',
    claim: 'bg-blue-500',
    evidence: 'bg-green-500',
    decision: 'bg-purple-500',
    idea: 'bg-yellow-500',
    task: 'bg-orange-500',
    artifact: 'bg-pink-500',
    assumption: 'bg-red-400',
    constraint: 'bg-red-600',
    source: 'bg-cyan-500',
};

export function NodeListItem({ node, selected, onClick }: NodeListItemProps) {
    const { metadata } = node;
    const typeColor = NODE_TYPE_COLORS[node.type] || 'bg-slate-400';

    // Extract a preview string from the various content fields
    const content = (node as any).content || (node as any).statement || (node as any).rationale || (node as any).summary || (node as any).description || (node as any).name || (node as any).rule || (node as any).premise || '';
    const preview = content.replace(/<[^>]*>?/gm, '').slice(0, 40) + (content.length > 40 ? '...' : '');

    return (
        <div
            onClick={onClick}
            className={`p-3 cursor-pointer border-l-2 transition-all hover:bg-slate-800/50 ${selected ? 'bg-slate-800 border-blue-500' : 'border-transparent'
                }`}
            title={`Hash: ${metadata.version_hash.slice(0, 8)}...`}
        >
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${typeColor}`} />
                    <span className="text-[10px] uppercase font-bold tracking-tighter text-slate-400">
                        {node.type}
                    </span>
                </div>
                <div className="flex items-center gap-1.5">
                    {metadata.validated ? (
                        <CheckCircle2 size={12} className="text-green-500" />
                    ) : (
                        <AlertCircle size={12} className="text-slate-600" />
                    )}
                    {metadata.origin === 'human' ? (
                        <User size={12} className="text-slate-500" />
                    ) : (
                        <Cpu size={12} className="text-blue-400" />
                    )}
                </div>
            </div>

            <p className="text-sm text-slate-200 truncate leading-tight">
                {preview || <span className="italic text-slate-500">No content</span>}
            </p>

            <div className="flex items-center justify-between mt-2">
                <span className="text-[9px] font-mono text-slate-600">
                    {node.id.slice(0, 8)}
                </span>
                <span className={`text-[9px] font-bold ${metadata.confidence > 0.8 ? 'text-green-600' : metadata.confidence > 0.5 ? 'text-yellow-600' : 'text-red-900'
                    }`}>
                    {Math.round(metadata.confidence * 100)}%
                </span>
            </div>
        </div>
    );
}
