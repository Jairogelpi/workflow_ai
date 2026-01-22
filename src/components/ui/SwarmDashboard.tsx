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
        <div className="fixed top-4 right-4 z-[60] flex flex-col gap-2 w-56">
            <div className="bg-slate-900/80 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-3 shadow-2xl">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
                        <span className="text-[10px] font-bold text-slate-200 uppercase tracking-widest">Swarm Mind</span>
                    </div>
                    <span className="text-[8px] font-mono text-cyan-600 bg-cyan-950 px-1 rounded">V1.5-NEURAL</span>
                </div>

                <div className="space-y-2">
                    {agentsList.map(([id, agent]) => {
                        const personality = id.split('-')[0] as string;
                        const Icon = agentIcons[personality as keyof typeof agentIcons] || Brain;
                        const isActive = agent.status !== 'IDLE';

                        return (
                            <div
                                key={id}
                                className={`flex items-center gap-3 p-2 rounded-lg border transition-all duration-500 ${isActive ? 'bg-slate-800/50 border-cyan-500/50' : 'bg-slate-950/20 border-slate-800'}`}
                            >
                                <div className={`p-1.5 rounded-md ${isActive ? 'bg-cyan-500/20 text-cyan-400 animate-pulse' : 'bg-slate-900 text-slate-600'}`}>
                                    <Icon size={12} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-1">
                                        <span className={`text-[10px] font-bold truncate ${isActive ? 'text-slate-100' : 'text-slate-500'}`}>
                                            {agent.name}
                                        </span>
                                        <div className={`w-1.5 h-1.5 rounded-full ${agent.status === 'WORKING' ? 'bg-green-500 shadow-[0_0_5px_green]' : agent.status === 'THINKING' ? 'bg-cyan-400 shadow-[0_0_5px_cyan] animate-pulse' : 'bg-slate-800'}`} />
                                    </div>
                                    <div className="text-[8px] font-mono text-slate-600 uppercase tracking-tighter">
                                        {agent.status}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Neural Load Indicator */}
            <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-lg p-2 flex items-center justify-between px-3">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Neural Latency</span>
                <span className="text-[9px] font-mono text-cyan-500">124ms</span>
            </div>
        </div>
    );
}
