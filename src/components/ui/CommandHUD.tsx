'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Search, Command, Zap, ArrowRight, X } from 'lucide-react';
import { useGraphStore } from '../../store/useGraphStore';

export function CommandHUD() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);
    const { nodes, setSelectedNode, centerNode } = useGraphStore();

    // Key listeners for Cmd+K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (e.key === 'Escape') setIsOpen(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Simple search logic
    useEffect(() => {
        if (!query) {
            setResults([]);
            return;
        }
        const filtered = nodes.filter(n =>
            (n.data as any).label?.toLowerCase().includes(query.toLowerCase()) ||
            (n.data as any).content?.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 5);
        setResults(filtered);
    }, [query, nodes]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh] bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-black/5 animate-in zoom-in-95 duration-200">
                <div className="flex items-center px-6 border-b border-slate-100">
                    <Search className="w-5 h-5 text-slate-400" />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Busca ideas, documentos o tareas..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="flex-1 h-16 bg-transparent border-none outline-none px-4 font-medium text-lg text-slate-800 placeholder:text-slate-400"
                    />
                    <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-lg border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-500 tracking-wider">Alt K</span>
                    </div>
                </div>

                <div className="max-h-[60vh] overflow-y-auto p-2">
                    {query.startsWith('/') ? (
                        <div className="p-2">
                            <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-2 mb-2">Neural Commands</h3>
                            <div className="space-y-1">
                                <CommandItem
                                    icon={<Zap className="w-4 h-4 text-amber-400" />}
                                    title="/pulse"
                                    description="Trigger a semantic pulse across the entire swarm."
                                    onSelect={() => { console.log('Pulse triggered'); setIsOpen(false); }}
                                />
                                <CommandItem
                                    icon={<Zap className="w-4 h-4 text-emerald-400" />}
                                    title="/heal"
                                    description="Autonomously resolve structural contradictions."
                                    onSelect={() => { console.log('Heal triggered'); setIsOpen(false); }}
                                />
                            </div>
                        </div>
                    ) : (
                        results.length > 0 ? (
                            <div className="p-2">
                                <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-2 mb-2">Node Discovery</h3>
                                <div className="space-y-1">
                                    {results.map(n => (
                                        <CommandItem
                                            key={n.id}
                                            icon={<div className="w-3 h-3 rounded-full" style={{ backgroundColor: getAgentColor(n.type) }} />}
                                            title={(n.data as any).label || (n.data as any).content?.slice(0, 30)}
                                            description={`Type: ${n.type}`}
                                            onSelect={() => {
                                                setSelectedNode(n.id);
                                                centerNode(n.id);
                                                setIsOpen(false);
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        ) : query && (
                            <div className="p-8 text-center">
                                <p className="text-zinc-400">No nodes found for "{query}"</p>
                            </div>
                        )
                    )}
                </div>

                <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                    <p className="text-[11px] text-slate-400 font-medium">Usa <span className="font-bold text-slate-600">↑↓</span> para navegar y <span className="font-bold text-slate-600">Enter</span> para seleccionar</p>
                    <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-slate-200 rounded-full transition-colors">
                        <X className="w-4 h-4 text-slate-400" />
                    </button>
                </div>
            </div>
        </div>
    );
}

function CommandItem({ icon, title, description, onSelect }: any) {
    return (
        <button
            onClick={onSelect}
            className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-all group text-left"
        >
            <div className="w-12 h-12 flex items-center justify-center bg-white border border-slate-100 rounded-2xl shadow-sm group-hover:scale-105 transition-transform">
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-800 truncate">{title}</p>
                    <ArrowRight className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                </div>
                <p className="text-xs text-slate-400 truncate mt-1">{description}</p>
            </div>
        </button>
    );
}

function getAgentColor(type: string) {
    const colors: any = {
        note: '#fbbf24', claim: '#22d3ee', evidence: '#f87171',
        decision: '#c084fc', idea: '#4ade80', task: '#ec4899'
    };
    return colors[type] || '#ccc';
}
