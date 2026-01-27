/**
 * Phase 15: Swarm Dashboard (Neural HUD)
 * A real-time visualization of agent activity within the Swarm.
 */
'use client';

import React from 'react';
import { useGraphStore } from '../../store/useGraphStore';
import { Brain, Zap, Activity, ShieldAlert, BookOpen } from 'lucide-react';
import { DraggableHUD } from './DraggableHUD';

import { useSystemPulse } from '../../hooks/useSystemPulse';

export function SwarmDashboard() {
    const { activeAgents } = useGraphStore();
    const { latency, isOnline } = useSystemPulse();

    const agentIcons: Record<string, any> = {
        'harvester': BookOpen,
        'expansionist': Zap,
        'critic': ShieldAlert,
        'validator': Activity,
        'librarian': Brain
    };

    const agentsList = Object.entries(activeAgents);

    return (
        <DraggableHUD id="swarm-dashboard" title="Swarm Dashboard" defaultPosition={{ x: 1000, y: 100 }}>
            <div className="flex flex-col gap-4 w-60 select-none animate-in fade-in slide-in-from-right-4 duration-700">
                {/* Main Surface */}
                <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 px-1">
                        <Activity size={14} className="text-blue-600" />
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Sistema de Enjambre</span>
                    </div>

                    <div className="space-y-1">
                        {agentsList.map(([id, agent]) => {
                            const personality = id.split('-')[0] as string;
                            const Icon = agentIcons[personality as keyof typeof agentIcons] || Brain;
                            const isActive = agent.status !== 'IDLE';

                            return (
                                <div
                                    key={id}
                                    className={`group flex items-center gap-3 p-2 rounded-2xl transition-all duration-300 ${isActive ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}
                                >
                                    <div className={`flex shrink-0 items-center justify-center w-8 h-8 rounded-xl transition-all duration-500 ${isActive ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 scale-105' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
                                        <Icon size={14} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <span className={`text-xs font-medium truncate ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>
                                                {agent.name}
                                            </span>
                                            <div className={`w-1.5 h-1.5 rounded-full ${agent.status === 'WORKING' ? 'bg-emerald-500' : agent.status === 'THINKING' ? 'bg-blue-500 animate-pulse' : 'bg-slate-300'}`} />
                                        </div>
                                        <div className="text-[9px] font-medium text-slate-400 mt-0.5">
                                            {agent.status === 'IDLE' ? 'Estando' : agent.status === 'THINKING' ? 'Modelando...' : 'Procesando'}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Performance Footer (Real Data) */}
                <div className="bg-slate-50/80 backdrop-blur-md border border-slate-200/40 rounded-2xl py-2 px-4 flex items-center justify-between shadow-sm transition-all duration-500">
                    <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)] transition-colors duration-500 ${isOnline ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-red-500 shadow-red-500/50 animate-pulse'}`} />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest transition-colors duration-500">
                            {isOnline ? 'En Línea' : 'Desconectado'}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-medium text-slate-400">PULSO</span>
                        <span className={`text-[10px] font-bold tabular-nums transition-colors duration-300 ${latency > 200 ? 'text-amber-500' : 'text-slate-900'}`}>
                            {latency}ms
                        </span>
                    </div>
                </div>
            </div>
        </DraggableHUD>
    );
}
