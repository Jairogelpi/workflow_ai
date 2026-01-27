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
                <div className="bg-white/90 backdrop-blur-2xl border border-blue-100 rounded-3xl p-6 shadow-[0_10px_40px_-10px_rgba(59,130,246,0.15)]">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Neural Swarm Audit...</span>
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
        <div className="absolute top-6 right-6 w-80 animate-in fade-in slide-in-from-right-4 duration-500 pointer-events-auto">
            <div className={`bg-white/90 backdrop-blur-xl border ${isHardLogicBreach ? 'border-red-200' : 'border-slate-200/60'} rounded-3xl p-6 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] relative overflow-hidden group`}>
                {/* Background Glow */}
                <div className={`absolute -top-12 -right-12 w-24 h-24 ${isHardLogicBreach ? 'bg-red-500/5' : 'bg-blue-500/5'} blur-3xl group-hover:bg-blue-500/10 transition-all duration-700`} />

                <div className="flex items-center justify-between mb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Zap className={`w-3 h-3 ${isHardLogicBreach ? 'text-red-500' : 'text-blue-500'} fill-current/20`} />
                            <span className={`text-[10px] font-black ${isHardLogicBreach ? 'text-red-600' : 'text-blue-600'} uppercase tracking-widest`}>
                                {isHardLogicBreach ? 'Logic Blockade' : 'Semantic Balance'}
                            </span>
                        </div>
                        <h3 className="text-3xl font-black text-slate-800 tracking-tighter">
                            {score}<span className={isHardLogicBreach ? 'text-red-500' : 'text-blue-500'}>%</span>
                        </h3>
                    </div>
                    <div className={`p-3 rounded-2xl ${score > 90 ? 'bg-blue-50 text-blue-600' : isHardLogicBreach ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                        {score > 90 ? <ShieldCheck size={24} /> : isHardLogicBreach ? <AlertCircle size={24} /> : <AlertCircle size={24} />}
                    </div>
                </div>

                <div className="space-y-3">
                    <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider mb-2">
                        {isHardLogicBreach ? 'Critical Violations' : `Detected Gaps (${gaps.length})`}
                    </p>

                    {gaps.length === 0 ? (
                        <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 text-center">
                            <p className="text-xs text-blue-600 italic">Total Alignment Achieved.</p>
                        </div>
                    ) : (
                        gaps.map((gap: any, idx: number) => (
                            <div
                                key={idx}
                                className={`group/item relative p-4 rounded-2xl bg-white border border-slate-100 ${isHardLogicBreach ? 'hover:border-red-200' : 'hover:border-blue-200'} transition-all cursor-default shadow-sm`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="mt-1">
                                        <div className={`w-1.5 h-1.5 rounded-full ${isHardLogicBreach ? 'bg-red-500 shadow-sm' : 'bg-amber-400 shadow-sm'}`} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-slate-700 font-bold leading-snug mb-2">{gap.missingConcept}</p>
                                        {!isHardLogicBreach && (
                                            <button
                                                onClick={() => handleAutoFill(gap)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all shadow-sm active:scale-95"
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

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <p className="text-[9px] text-slate-400 italic leading-relaxed max-w-[140px]">
                        {isHardLogicBreach ? 'Logical inconsistencies detected by Rust logic-engine.' : 'Zero-friction alignment: Materialize to close strategy gaps.'}
                    </p>
                    <div className="flex items-center gap-1 px-2 py-1 bg-slate-50 rounded-md border border-slate-100">
                        <span className="text-[8px] font-black text-slate-400">OS V7.5</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
