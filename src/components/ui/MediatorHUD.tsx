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
            <div className="flex items-center gap-2 px-4 py-2 bg-white text-slate-400 border border-slate-100 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase shadow-sm mx-auto mb-2">
                <Brain size={12} className="text-blue-500" />
                <span>Asistente Axiom</span>
            </div>

            {proposals.map(proposal => (
                <div
                    key={proposal.id}
                    className="p-5 bg-white border border-slate-100 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] animate-in slide-in-from-right-10 duration-500"
                >
                    <div className="flex items-start gap-4">
                        <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-500">
                            {proposal.type === 'CREATE_ARTIFACT' ? <PlusCircle size={20} /> :
                                proposal.type === 'ADD_RELATION' ? <Activity size={20} /> :
                                    <AlertCircle size={20} />}
                        </div>

                        <div className="flex-1 min-w-0">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                Sugerencia
                            </h4>
                            <p className="text-sm text-slate-700 font-medium mt-1 leading-relaxed">
                                {proposal.reason}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 mt-5">
                        <button
                            onClick={() => resolveProposal(proposal.id, 'reject')}
                            className="flex-1 py-2.5 rounded-2xl text-xs font-bold text-slate-400 hover:bg-slate-50 transition-colors"
                        >
                            <span>Ahora no</span>
                        </button>

                        <button
                            onClick={() => resolveProposal(proposal.id, 'accept')}
                            className="flex-[2] py-2.5 rounded-2xl text-xs font-bold bg-blue-500 text-white hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                        >
                            <span>Aceptar</span>
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
