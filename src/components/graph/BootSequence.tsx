import React from 'react';
import { useGraphStore } from '../../store/useGraphStore';
import { Zap, Brain, Shield, Search } from 'lucide-react';

/**
 * BootSequence (Hito 4.1)
 * High-fidelity immersive loader with Neural Ripple Waves.
 */
export const BootSequence: React.FC = () => {
    const { isBooting, rlmThoughts } = useGraphStore();

    if (!isBooting) return null;

    return (
        <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col items-center justify-center animate-in fade-in duration-1000">
            {/* Background Matrix Data Stream */}
            <div className="absolute inset-0 opacity-10 overflow-hidden pointer-events-none">
                <div className="flex gap-8 justify-around h-full">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="flex flex-col gap-4 animate-matrix-slide whitespace-nowrap text-cyan-400 font-mono text-[9px] uppercase">
                            {[...Array(40)].map((_, j) => (
                                <div key={j} className="flex gap-2">
                                    <span className="opacity-40">{Math.random().toString(36).substring(2, 6)}</span>
                                    <span className="text-slate-800">|</span>
                                    <span>{Math.random().toString(16).substring(2, 10).toUpperCase()}</span>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* Neural Ripple Waves */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                <svg className="w-[800px] h-[800px] text-cyan-500 opacity-20">
                    {[...Array(5)].map((_, i) => (
                        <circle
                            key={i}
                            cx="400"
                            cy="400"
                            r="10"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1"
                            className="animate-ripple-wave"
                            style={{ animationDelay: `${i * 0.8}s` }}
                        />
                    ))}
                </svg>
            </div>

            <div className="relative z-10 w-full max-w-xl p-10 flex flex-col items-center">
                {/* Core Animation */}
                <div className="relative mb-14">
                    <div className="w-32 h-32 bg-cyan-500/5 rounded-full flex items-center justify-center border border-cyan-500/20 glass-panel shadow-[0_0_50px_rgba(6,182,212,0.1)]">
                        <Zap className="w-12 h-12 text-cyan-400 fill-current animate-pulse" />
                    </div>
                    {/* Spinning HUD rings */}
                    <div className="absolute inset-[-10px] border border-cyan-500/30 rounded-full border-t-transparent animate-[spin_3s_linear_infinite]" />
                    <div className="absolute inset-[-20px] border border-cyan-500/10 border-dashed rounded-full animate-[spin_10s_linear_infinite_reverse]" />
                </div>

                <div className="text-center space-y-3 mb-12">
                    <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase font-mono">INITIATING_SWARM</h2>
                    <div className="flex items-center justify-center gap-3">
                        <div className="w-12 h-0.5 bg-gradient-to-r from-transparent to-cyan-500/40" />
                        <p className="text-cyan-400 text-[10px] font-black uppercase tracking-[0.6em] animate-pulse font-mono">NEURAL_ENGRAMS_LOADED</p>
                        <div className="w-12 h-0.5 bg-gradient-to-l from-transparent to-cyan-500/40" />
                    </div>
                </div>

                {/* Real-time Thought Stream */}
                <div className="w-full bg-slate-900/60 border border-cyan-500/10 rounded-3xl p-8 backdrop-blur-xl max-h-56 overflow-hidden relative shadow-inner">
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 to-transparent h-10 pointer-events-none z-10" />
                    <div className="space-y-4">
                        {rlmThoughts.slice(-4).reverse().map((thought, idx) => (
                            <div key={thought.id} className="flex gap-5 animate-in slide-in-from-left-4 fade-in duration-500" style={{ opacity: 1 - idx * 0.2 }}>
                                <div className="font-mono text-[9px] text-cyan-500/40 mt-0.5">[{thought.timestamp.split('T')[1]?.split('.')[0]}]</div>
                                <div className="flex-1">
                                    <p className="text-[11px] font-bold text-slate-300 font-mono tracking-tight lowercase">
                                        <span className={`mr-2 uppercase text-[9px] px-1.5 py-0.5 rounded ${thought.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
                                                thought.type === 'error' ? 'bg-red-500/10 text-red-400' :
                                                    'bg-cyan-500/10 text-cyan-400'
                                            }`}>{thought.type}</span>
                                        {thought.message}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* Pulsing indicator */}
                    <div className="mt-6 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-cyan-500 animate-ping rounded-full" />
                        <div className="text-[8px] font-black text-cyan-500/30 uppercase tracking-[0.2em] font-mono">Processing_Network_V7.2</div>
                    </div>
                </div>

                <div className="mt-12 flex gap-10">
                    {[
                        { icon: Shield, label: 'SAT_KERNEL' },
                        { icon: Brain, label: 'RLM_CORE' },
                        { icon: Search, label: 'FORENSIC_HUD' }
                    ].map((item, i) => (
                        <div key={i} className="flex flex-col items-center gap-2 group">
                            <item.icon className="w-5 h-5 text-cyan-500/40 group-hover:text-cyan-400 transition-colors" />
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest font-mono">{item.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            <style jsx>{`
                @keyframes matrix-slide {
                    0% { transform: translateY(0); }
                    100% { transform: translateY(-33.33%); }
                }
                @keyframes ripple-wave {
                    0% { transform: scale(0.1); opacity: 1; stroke-width: 4; }
                    100% { transform: scale(2.5); opacity: 0; stroke-width: 0.5; }
                }
                .animate-matrix-slide {
                    animation: matrix-slide 15s linear infinite;
                }
                .animate-ripple-wave {
                    animation: ripple-wave 4s cubic-bezier(0, 0.45, 0.45, 1) infinite;
                }
            `}</style>
        </div>
    );
};
