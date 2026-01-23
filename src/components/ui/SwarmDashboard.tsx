/**
 * Phase 15: Swarm Dashboard (Neural HUD)
 * A real-time visualization of agent activity within the Swarm.
 */
'use client';

import React from 'react';
import { useGraphStore } from '../../store/useGraphStore';
import { Brain, Zap, Activity, ShieldAlert, BookOpen } from 'lucide-react';

export function SwarmDashboard() {
    const { activeAgents } = useGraphStore();

    const agentIcons: Record<string, any> = {
        'harvester': BookOpen,
        'expansionist': Zap,
        'critic': ShieldAlert,
        'validator': Activity,
        'librarian': Brain
    };

    const agentsList = Object.entries(activeAgents);

    return (
        <div className="fixed top-20 right-8 z-[60] flex flex-col gap-3 w-64">
            <div className="bg-white/90 backdrop-blur-2xl border border-slate-100 rounded-[28px] p-5 shadow-[0_15px_45px_-10px_rgba(0,0,0,0.08)]">
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <Activity className="w-4 h-4 text-blue-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estado del Enjambre</span>
                    </div>
                </div>

                <div className="space-y-3">
                    {agentsList.map(([id, agent]) => {
                        const personality = id.split('-')[0] as string;
                        const Icon = agentIcons[personality as keyof typeof agentIcons] || Brain;
                        const isActive = agent.status !== 'IDLE';

                        return (
                            <div
                                key={id}
                                className={`flex items-center gap-4 p-3 rounded-2xl transition-all duration-500 ${isActive ? 'bg-blue-50/50 border-blue-100 border' : 'bg-slate-50 border-transparent border'}`}
                            >
                                <div className={`p-2 rounded-xl ${isActive ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-white text-slate-400 border border-slate-100'}`}>
                                    <Icon size={14} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-1">
                                        <span className={`text-[11px] font-bold truncate ${isActive ? 'text-slate-800' : 'text-slate-400'}`}>
                                            {agent.type || agent.name}
                                        </span>
                                        <div className={`w-2 h-2 rounded-full ${agent.status === 'WORKING' ? 'bg-green-500' : agent.status === 'THINKING' ? 'bg-blue-400 animate-pulse' : 'bg-slate-200'}`} />
                                    </div>
                                    <div className="text-[9px] font-bold text-slate-300 uppercase tracking-wider mt-0.5">
                                        {agent.status === 'IDLE' ? 'Inactivo' : agent.status === 'THINKING' ? 'Pensando...' : 'Trabajando'}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Neural Load Indicator */}
            <div className="bg-white/50 backdrop-blur-xl border border-slate-100 rounded-2xl p-3 flex items-center justify-between px-5 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Latencia</span>
                <span className="text-[10px] font-bold text-blue-500">124ms</span>
            </div>
        </div>
    );
}
