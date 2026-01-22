'use client';
import React from 'react';
import { useGraphStore } from '../../store/useGraphStore';
import { NodeListItem } from './NodeListItem';
import { Search, Layers, ShieldCheck, User, Ghost } from 'lucide-react';
import { UserRole } from '../../canon/schema/ir';

export default function Sidebar() {
    const { nodes, selectedNodeId, centerNode, searchQuery, setSearchQuery, currentUser, setCurrentUser } = useGraphStore();

    const filteredNodes = nodes.filter(node => {
        const data = node.data;
        const q = searchQuery.toLowerCase();
        const content = (data as any).content || (data as any).statement || (data as any).rationale || (data as any).summary || (data as any).description || (data as any).name || (data as any).rule || (data as any).premise || '';

        return (
            node.id.toLowerCase().includes(q) ||
            data.type.toLowerCase().includes(q) ||
            content.toLowerCase().includes(q)
        );
    });

    // Group nodes by type for better hierarchy
    const groupedNodes = filteredNodes.reduce((acc, node) => {
        const type = node.data.type;
        if (!acc[type]) acc[type] = [];
        acc[type].push(node);
        return acc;
    }, {} as Record<string, typeof nodes>);

    return (
        <aside className="w-80 h-full flex flex-col bg-slate-900 border-r border-slate-800 shadow-2xl">
            {/* Search Header */}
            <div className="p-4 border-b border-slate-800">
                <div className="flex items-center gap-2 mb-4">
                    <Layers className="text-blue-500" size={18} />
                    <h2 className="text-sm font-bold text-slate-200 uppercase tracking-widest">
                        WorkGraph OS
                    </h2>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                    <input
                        type="text"
                        placeholder="Discovery search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-md py-2 pl-9 pr-4 text-xs text-slate-200 placeholder:text-slate-600 outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                </div>
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {Object.entries(groupedNodes).map(([type, typeNodes]) => (
                    <div key={type} className="mb-2">
                        <div className="px-4 py-2 bg-slate-950/40 text-[9px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between sticky top-0 z-10 backdrop-blur-sm border-y border-slate-800/30">
                            {type}s
                            <span className="bg-slate-800 px-1.5 rounded text-slate-400">
                                {typeNodes.length}
                            </span>
                        </div>
                        <div className="divide-y divide-slate-800/20">
                            {typeNodes.map(node => (
                                <NodeListItem
                                    key={node.id}
                                    node={node.data}
                                    selected={selectedNodeId === node.id}
                                    onClick={() => centerNode(node.id)}
                                />
                            ))}
                        </div>
                    </div>
                ))}

                {filteredNodes.length === 0 && (
                    <div className="p-10 text-center">
                        <p className="text-xs text-slate-600 italic">No nodes found in this view</p>
                    </div>
                )}
            </div>

            {/* RBAC Role Selector (Hito 4.1) */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/40">
                <div className="flex items-center gap-2 mb-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    <ShieldCheck size={12} className="text-cyan-500" />
                    RBAC Identity
                </div>
                <div className="flex gap-1">
                    {(['viewer', 'editor', 'admin'] as UserRole[]).map((role) => (
                        <button
                            key={role}
                            onClick={() => setCurrentUser({ ...currentUser, role })}
                            className={`flex-1 flex flex-col items-center gap-1.5 py-2 rounded-lg border transition-all duration-300 ${currentUser.role === role ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-slate-950 border-slate-800 text-slate-600 hover:border-slate-700'}`}
                        >
                            {role === 'viewer' && <Ghost size={14} />}
                            {role === 'editor' && <User size={14} />}
                            {role === 'admin' && <ShieldCheck size={14} />}
                            <span className="text-[8px] font-black uppercase tracking-tighter">{role}</span>
                        </button>
                    ))}
                </div>
                <div className="mt-3 text-[8px] font-mono text-slate-700 text-center truncate">
                    ID: {currentUser.id} | V-HASH INTEGRity: ACTIVE
                </div>
            </div>
        </aside>
    );
}
