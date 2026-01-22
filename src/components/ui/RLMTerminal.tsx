/**
 * RLM TERMINAL v1.0
 * 
 * A retro-futuristic console for real-time AI reasoning feedback.
 * Connects to rlmThoughts state in useGraphStore.
 */
'use client';

import { useEffect, useRef, useState } from 'react';
import { useGraphStore } from '../../store/useGraphStore';
import { Terminal, ChevronUp, ChevronDown, Trash2, Zap, Brain, Shield } from 'lucide-react';

export function RLMTerminal() {
    const { rlmThoughts } = useGraphStore();
    const [isExpanded, setIsExpanded] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom on new thoughts
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [rlmThoughts]);

    return (
        <div
            className={`fixed bottom-0 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-in-out ${isExpanded ? 'w-[800px] h-64' : 'w-64 h-10'
                }`}
        >
            {/* Header / Toggle */}
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                className={`
                    w-full h-10 flex items-center justify-between px-4 cursor-pointer
                    bg-slate-900 border-t border-x border-cyan-500/30 rounded-t-xl
                    hover:bg-slate-800 transition-colors
                `}
            >
                <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-cyan-400" />
                    <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest">
                        RLM Reasoning Engine
                    </span>
                </div>
                {isExpanded ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronUp size={14} className="text-slate-500" />}
            </div>

            {/* Terminal Body */}
            {isExpanded && (
                <div className="w-full h-[calc(100%-40px)] bg-slate-950/90 backdrop-blur-md border-x border-cyan-500/30 overflow-hidden flex flex-col">
                    <div
                        ref={scrollRef}
                        className="flex-1 overflow-y-auto p-3 font-mono text-[11px] space-y-1.5 scrollbar-hide"
                    >
                        {rlmThoughts.length === 0 ? (
                            <div className="text-slate-700 h-full flex items-center justify-center italic">
                                Waiting for logic events...
                            </div>
                        ) : (
                            rlmThoughts.map((thought) => (
                                <div key={thought.id} className="flex gap-2 animate-in fade-in slide-in-from-left-2 items-baseline">
                                    <span className="text-slate-600 shrink-0 text-[10px]">
                                        [{new Date(thought.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
                                    </span>

                                    {/* [Phase 14] Agent Badge */}
                                    {thought.agentName && (
                                        <span className="shrink-0 px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400 font-black tracking-tighter text-[8px] border border-cyan-500/20 uppercase">
                                            {thought.agentName}
                                        </span>
                                    )}

                                    <span className={`
                                        flex-1
                                        ${thought.type === 'reasoning' ? 'text-cyan-300' : ''}
                                        ${thought.type === 'success' ? 'text-green-400' : ''}
                                        ${thought.type === 'warn' ? 'text-amber-400' : ''}
                                        ${thought.type === 'error' ? 'text-red-400' : ''}
                                        ${thought.type === 'info' ? 'text-blue-400' : ''}
                                    `}>
                                        {thought.type === 'reasoning' && <Brain className="w-2.5 h-2.5 inline mr-1 -mt-0.5" />}
                                        {thought.type === 'success' && <Shield className="w-2.5 h-2.5 inline mr-1 -mt-0.5" />}
                                        {thought.type === 'error' && <Zap className="w-2.5 h-2.5 inline mr-1 -mt-0.5 text-red-500" />}
                                        {thought.message}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>

                    {/* [Phase 12] Omniscience Controls */}
                    <div className="px-3 pb-3 flex gap-2">
                        <button
                            onClick={() => {
                                useGraphStore.getState().addRLMThought({
                                    message: "Self-Healing SAT: Requesting logical resolution from RLM-Core...",
                                    type: "warn"
                                });
                            }}
                            className="flex-1 flex items-center justify-center gap-2 p-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-[10px] font-bold hover:bg-red-500/20 transition-all uppercase tracking-tighter"
                        >
                            <Zap size={10} />
                            Heal SAT
                        </button>
                        <button
                            onClick={() => {
                                useGraphStore.getState().addRLMThought({
                                    message: "Neural Shadowing: Predicting next logical nodes via SLM...",
                                    type: "reasoning"
                                });
                            }}
                            className="flex-1 flex items-center justify-center gap-2 p-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-cyan-400 text-[10px] font-bold hover:bg-cyan-500/20 transition-all uppercase tracking-tighter"
                        >
                            <Brain size={10} />
                            Predict
                        </button>
                    </div>

                    {/* Footer Status Bar */}
                    <div className="h-6 bg-slate-900 border-t border-cyan-900/50 px-3 flex items-center justify-between text-[9px] text-slate-500 uppercase tracking-tighter">
                        <div className="flex gap-4">
                            <span>Status: Operational</span>
                            <span>Engine: V1.2-RLM</span>
                        </div>
                        <div className="flex items-center gap-1 text-cyan-600">
                            <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse" />
                            Live Bridge Active
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
