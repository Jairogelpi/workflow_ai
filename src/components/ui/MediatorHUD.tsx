'use client';
import React from 'react';
import { useGraphStore } from '../../store/useGraphStore';
import { Check, X, Brain, AlertCircle, PlusCircle, Activity } from 'lucide-react';

/**
 * Mediator HUD (Cerebro Operativo)
 * 
 * Floating interface to review AI Proposals.
 * Part of the "Kernel to Kernel" dialogue flow.
 */
export function MediatorHUD() {
    const proposals = useGraphStore(state => state.proposals);
    const resolveProposal = useGraphStore(state => state.resolveProposal);

    if (proposals.length === 0) return null;

    return (
        <div className="fixed bottom-24 right-6 w-80 z-[1000] flex flex-col gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-sky-950/90 text-sky-400 border border-sky-400/50 rounded-t-xl text-[10px] font-mono tracking-widest uppercase">
                <Brain size={12} className="animate-pulse" />
                <span>Mediator Agent v3.0 Active</span>
            </div>

            {proposals.map(proposal => (
                <div
                    key={proposal.id}
                    className="p-4 bg-white/95 dark:bg-surface-dark/95 backdrop-blur-2xl border border-outline-variant/30 rounded-2xl shadow-elevation-5 animate-in slide-in-from-right-10 duration-500"
                >
                    <div className="flex items-start gap-3">
                        <div className="p-2 rounded-xl bg-primary/10 text-primary">
                            {proposal.type === 'CREATE_ARTIFACT' ? <PlusCircle size={18} /> :
                                proposal.type === 'ADD_RELATION' ? <Activity size={18} /> :
                                    <AlertCircle size={18} />}
                        </div>

                        <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-outline dark:text-outline-variant uppercase tracking-wide">
                                {proposal.type.replace('_', ' ')}
                            </h4>
                            <p className="text-sm text-outline dark:text-outline-variant mt-1 leading-relaxed">
                                {proposal.reason}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-outline-variant/20">
                        <button
                            onClick={() => resolveProposal(proposal.id, 'reject')}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 transition-colors"
                        >
                            <X size={14} />
                            <span>Ignorar</span>
                        </button>

                        <button
                            onClick={() => resolveProposal(proposal.id, 'accept')}
                            className="flex-[2] flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary/90 transition-all shadow-elevation-2 active:scale-95"
                        >
                            <Check size={14} />
                            <span>Confirmar</span>
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
