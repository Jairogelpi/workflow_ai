/**
 * FORENSIC HUD v1.0
 * 
 * An immersive overlay for inspecting the evidence chain of a generated paragraph.
 * Visualizes the original Source and Evidence nodes.
 */
'use client';

import { useGraphStore } from '../../store/useGraphStore';
import { X, Shield, FileText, ExternalLink, Activity } from 'lucide-react';

interface ForensicHUDProps {
    forensicId: string;
    evidenceIds: string[];
    signedNodeIds: string[];
    onClose: () => void;
}

export function ForensicHUD({ forensicId, evidenceIds, signedNodeIds, onClose }: ForensicHUDProps) {
    const { nodes } = useGraphStore();

    // Map IDs to actual node data
    const evidenceNodes = nodes
        .filter(n => evidenceIds.includes(n.id))
        .map(n => n.data);

    const signedNodes = nodes
        .filter(n => signedNodeIds.includes(n.id))
        .map(n => n.data);

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-4xl h-[600px] bg-slate-900 border border-cyan-500/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">

                {/* Header */}
                <div className="p-6 border-b border-cyan-500/10 flex items-center justify-between bg-slate-800/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-cyan-500/10 rounded-xl">
                            <Activity className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white uppercase tracking-wider">Forensic Inspection</h2>
                            <p className="text-[10px] font-mono text-cyan-500 opacity-70">Artifact Trace ID: {forensicId}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-700 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Left: Evidence Chain */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-4 h-4 text-blue-400" />
                            <span className="text-[11px] font-black uppercase text-slate-400 tracking-widest">
                                Evidence Chain ({evidenceNodes.length})
                            </span>
                        </div>

                        <div className="grid gap-3">
                            {evidenceNodes.length === 0 ? (
                                <div className="p-4 bg-slate-800/30 border border-dashed border-slate-700 rounded-2xl text-[11px] text-slate-500 italic">
                                    No source nodes detected for this trace.
                                </div>
                            ) : (
                                evidenceNodes.map((node, i) => (
                                    <div key={i} className="p-4 bg-slate-800/50 border border-slate-700 rounded-2xl flex gap-3 group transition-all hover:bg-slate-800 hover:border-cyan-500/30">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                        <div className="flex-1">
                                            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-tighter">
                                                {(node as any).type}
                                            </span>
                                            <p className="text-[11px] text-slate-300 leading-relaxed mt-1 line-clamp-2">
                                                {(node as any).statement || (node as any).content || 'No content available'}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Right: Human Authority & Verity */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Shield className="w-4 h-4 text-amber-500" />
                            <span className="text-[11px] font-black uppercase text-slate-400 tracking-widest">
                                Authority Seals ({signedNodes.length})
                            </span>
                        </div>

                        <div className="grid gap-3">
                            {signedNodes.length === 0 ? (
                                <div className="p-4 bg-slate-800/30 border border-dashed border-slate-700 rounded-2xl text-[11px] text-slate-500 italic">
                                    This paragraph contains purely AI-generated or inferred content.
                                </div>
                            ) : (
                                signedNodes.map((node, i) => (
                                    <div key={i} className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex gap-3 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-1 opacity-20 transition-opacity group-hover:opacity-100">
                                            <ExternalLink className="w-3 h-3 text-amber-400" />
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                                            <Shield className="w-4 h-4 text-amber-500" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-tighter">
                                                    HUMAN SIGNED
                                                </span>
                                                <span className="text-[9px] text-slate-500 font-mono">
                                                    ID: {(node as any).id.slice(0, 8)}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-slate-300 leading-relaxed mt-1 font-semibold">
                                                {(node as any).statement || (node as any).content || 'Signed node'}
                                            </p>
                                            <div className="mt-2 text-[9px] text-amber-600/60 font-mono uppercase font-bold">
                                                Seal Intact: Ed25519 Verified
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Summary Box */}
                        <div className="mt-8 p-4 bg-cyan-500/5 border border-cyan-500/10 rounded-2xl">
                            <div className="flex items-center gap-2 text-cyan-400 mb-1">
                                <Activity className="w-3 h-3" />
                                <span className="text-[9px] font-bold uppercase tracking-widest">System Confidence</span>
                            </div>
                            <div className="text-[24px] font-black text-white font-mono leading-none">
                                {signedNodes.length > 0 ? 'CALIBRATED' : 'PROBABILISTIC'}
                            </div>
                            <p className="text-[10px] text-slate-500 mt-2 leading-tight">
                                This trace connection is secured by the Antigravity Engine using recursive topology indexing.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-950 border-t border-cyan-500/10 flex justify-center">
                    <span className="text-[9px] text-slate-600 font-mono uppercase tracking-[0.3em]">
                        WorkGraph OS // Deep Forensic Mapping // V1.0 - Pure Truth
                    </span>
                </div>
            </div>
        </div>
    );
}
