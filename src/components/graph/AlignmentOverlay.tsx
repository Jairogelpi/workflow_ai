import React from 'react';
import { ShieldCheck, AlertCircle, PlusCircle, Zap } from 'lucide-react';
import { useGraphStore } from '../../store/useGraphStore';

/**
 * AlignmentOverlay (Hito 7.2)
 * Premium HUD for visualizing zero-friction semantic alignment.
 */
export const AlignmentOverlay: React.FC = () => {
    const { alignmentReport, isAlignmentComputing, addNode, setAlignmentReport } = useGraphStore();

    if (!alignmentReport && !isAlignmentComputing) return null;

    // Loading state for Neural Ripples
    if (isAlignmentComputing) {
        return (
            <div className="absolute top-6 right-6 w-80 animate-pulse">
                <div className="bg-slate-900/80 backdrop-blur-2xl border border-cyan-500/30 rounded-3xl p-6 shadow-2xl">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
                        <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Neural Swarm Audit...</span>
                    </div>
                </div>
            </div>
        );
    }

    const { score, gaps } = alignmentReport!;

    const handleAutoFill = (gap: any) => {
        const { materializeGhost } = useGraphStore.getState();
        materializeGhost(gap);
    };

    const isHardLogicBreach = score === 0 && gaps.some((g: any) => g.sourceNodeId === 'SAT_VIOLATION');

    return (
        <div className="absolute top-6 right-6 w-80 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className={`bg-slate-900/80 backdrop-blur-2xl border ${isHardLogicBreach ? 'border-red-500/50' : 'border-cyan-500/30'} rounded-3xl p-6 shadow-2xl relative overflow-hidden group`}>
                {/* Background Glow */}
                <div className={`absolute -top-12 -right-12 w-24 h-24 ${isHardLogicBreach ? 'bg-red-500/10' : 'bg-cyan-500/10'} blur-3xl group-hover:bg-cyan-500/20 transition-all duration-700`} />

                <div className="flex items-center justify-between mb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Zap className={`w-3 h-3 ${isHardLogicBreach ? 'text-red-400' : 'text-cyan-400'} fill-current/20`} />
                            <span className={`text-[10px] font-black ${isHardLogicBreach ? 'text-red-400' : 'text-cyan-400'} uppercase tracking-widest`}>
                                {isHardLogicBreach ? 'Logic Blockade' : 'Semantic Balance'}
                            </span>
                        </div>
                        <h3 className="text-3xl font-black text-white tracking-tighter">
                            {score}<span className={isHardLogicBreach ? 'text-red-500' : 'text-cyan-500'}>%</span>
                        </h3>
                    </div>
                    <div className={`p-3 rounded-2xl ${score > 90 ? 'bg-cyan-500/20 text-cyan-400' : isHardLogicBreach ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                        {score > 90 ? <ShieldCheck size={24} /> : isHardLogicBreach ? <AlertCircle size={24} /> : <AlertCircle size={24} />}
                    </div>
                </div>

                <div className="space-y-3">
                    <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider mb-2">
                        {isHardLogicBreach ? 'Critical Violations' : `Detected Gaps (${gaps.length})`}
                    </p>

                    {gaps.length === 0 ? (
                        <div className="p-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/10 text-center">
                            <p className="text-xs text-cyan-400 italic">Total Alignment Achieved.</p>
                        </div>
                    ) : (
                        gaps.map((gap: any, idx: number) => (
                            <div
                                key={idx}
                                className={`group/item relative p-4 rounded-2xl bg-white/5 border border-white/5 ${isHardLogicBreach ? 'hover:border-red-500/30' : 'hover:border-cyan-500/30'} transition-all cursor-default`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="mt-1">
                                        <div className={`w-1.5 h-1.5 rounded-full ${isHardLogicBreach ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'}`} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-slate-200 font-bold leading-snug mb-2">{gap.missingConcept}</p>
                                        {!isHardLogicBreach && (
                                            <button
                                                onClick={() => handleAutoFill(gap)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 text-[10px] font-black uppercase tracking-widest hover:bg-cyan-500 hover:text-white transition-all shadow-lg shadow-cyan-500/5 active:scale-95"
                                            >
                                                <PlusCircle size={12} />
                                                Materialize
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                    <p className="text-[9px] text-slate-500 italic leading-relaxed max-w-[140px]">
                        {isHardLogicBreach ? 'Logical inconsistencies detected by Rust logic-engine.' : 'Zero-friction alignment: Materialize to close strategy gaps.'}
                    </p>
                    <div className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded-md border border-white/5">
                        <span className="text-[8px] font-black text-slate-400">OS V7.5</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
