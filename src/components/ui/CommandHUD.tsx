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
                <div className="flex items-center px-4 border-b border-black/5 dark:border-white/5">
                    <Search className="w-5 h-5 text-zinc-400" />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Telepathic Search... (or try /pulse, /heal)"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="flex-1 h-14 bg-transparent border-none outline-none px-3 font-medium text-lg text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400"
                    />
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-md border border-black/5 dark:border-white/5">
                        <Command className="w-3 h-3 text-zinc-400" />
                        <span className="text-[10px] font-bold text-zinc-400 tracking-wider">K</span>
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

                <div className="px-4 py-3 bg-zinc-50/50 dark:bg-zinc-800/20 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                    <p className="text-[10px] text-zinc-400 font-medium">Navigate with <span className="font-bold">↑↓</span> and <span className="font-bold">Enter</span></p>
                    <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md transition-colors">
                        <X className="w-4 h-4 text-zinc-400" />
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
            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/5 transition-all group text-left"
        >
            <div className="w-10 h-10 flex items-center justify-center bg-white dark:bg-zinc-800 border border-black/5 dark:border-white/10 rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                    <p className="font-bold text-zinc-800 dark:text-zinc-100 truncate">{title}</p>
                    <ArrowRight className="w-4 h-4 text-zinc-300 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                </div>
                <p className="text-xs text-zinc-400 truncate mt-0.5">{description}</p>
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
