'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useGraphStore } from '../../store/useGraphStore';
import { Loader2, CheckCircle2, AlertCircle, FileText, X } from 'lucide-react';

interface IngestionJob {
    id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    metadata: any;
    error_message?: string;
}

export function IngestionHUD() {
    const [jobs, setJobs] = useState<IngestionJob[]>([]);
    const projectManifest = useGraphStore(state => state.projectManifest);
    const projectId = projectManifest?.id;

    useEffect(() => {
        if (!projectId) return;

        const fetchJobs = async () => {
            const { data } = await supabase
                .from('ingestion_jobs')
                .select('*')
                .eq('project_id', projectId)
                .in('status', ['pending', 'processing', 'failed'])
                .order('created_at', { ascending: false })
                .limit(5);

            if (data) setJobs(data as IngestionJob[]);
        };

        fetchJobs();

        const channel = supabase
            .channel(`ingestion_tracking_${projectId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'ingestion_jobs',
                filter: `project_id=eq.${projectId}`
            }, (payload) => {
                const updatedJob = payload.new as IngestionJob;

                setJobs(current => {
                    const exists = current.find(j => j.id === updatedJob.id);

                    // Auto-remove completed jobs
                    if (updatedJob.status === 'completed') {
                        return current.filter(j => j.id !== updatedJob.id);
                    }

                    if (exists) {
                        return current.map(j => j.id === updatedJob.id ? updatedJob : j);
                    } else if (updatedJob.status === 'processing' || updatedJob.status === 'pending') {
                        return [updatedJob, ...current].slice(0, 5);
                    }
                    return current;
                });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [projectId]);

    const dismissJob = (id: string) => {
        setJobs(prev => prev.filter(j => j.id !== id));
    };

    if (jobs.length === 0) return null;

    return (
        <div className="fixed bottom-24 right-6 z-[1000] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
            {jobs.map(job => (
                <div
                    key={job.id}
                    className="group bg-white/40 backdrop-blur-xl border border-white/40 rounded-2xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.1)] pointer-events-auto transition-all duration-500 hover:scale-[1.02] hover:bg-white/60 animate-in slide-in-from-bottom-5 fade-in"
                >
                    <div className="flex items-start gap-3">
                        <div className={`p-2.5 rounded-xl shadow-inner ${job.status === 'failed'
                            ? 'bg-red-500/10 text-red-600'
                            : 'bg-blue-500/10 text-blue-600'
                            }`}>
                            {job.status === 'processing' ? (
                                <Loader2 className="animate-spin" size={18} />
                            ) : job.status === 'failed' ? (
                                <AlertCircle size={18} />
                            ) : (
                                <FileText size={18} />
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1.5">
                                <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest truncate pr-4">
                                    {job.metadata?.source_title || 'Compilando Memoria...'}
                                </h4>
                                <button
                                    onClick={() => dismissJob(job.id)}
                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200/50 rounded-md transition-all absolute top-2 right-2 text-slate-400 hover:text-slate-600"
                                >
                                    <X size={14} />
                                </button>
                                <span className="text-[10px] font-mono font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                                    {Math.round((job.progress || 0) * 100)}%
                                </span>
                            </div>

                            <div className="h-2 w-full bg-slate-200/50 rounded-full overflow-hidden shadow-inner border border-white/20">
                                <div
                                    className={`h-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(59,130,246,0.3)] ${job.status === 'failed' ? 'bg-gradient-to-r from-red-500 to-rose-600' : 'bg-gradient-to-r from-blue-500 to-cyan-500'
                                        }`}
                                    style={{ width: `${(job.progress || 0) * 100}%` }}
                                />
                            </div>

                            {job.status === 'failed' ? (
                                <div className="mt-2.5 flex items-center gap-1.5 text-[9px] text-red-600 font-bold bg-red-50/50 p-1.5 rounded-lg border border-red-100">
                                    <AlertCircle size={10} />
                                    <span className="truncate">{job.error_message || 'Fallo Crítico de Ingestión'}</span>
                                </div>
                            ) : (
                                <div className="mt-2 flex items-center justify-between">
                                    <p className="text-[9px] text-slate-500 font-medium tracking-tight">
                                        {job.status === 'processing' ? 'Sincronizando con el Canon...' : 'Preparando Secuencia...'}
                                    </p>
                                    <div className="flex gap-1">
                                        <div className="w-1 h-1 rounded-full bg-blue-400 animate-bounce" />
                                        <div className="w-1 h-1 rounded-full bg-blue-400 animate-bounce [animation-delay:0.2s]" />
                                        <div className="w-1 h-1 rounded-full bg-blue-400 animate-bounce [animation-delay:0.4s]" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ))}

            {/* Manual Swarm Trigger & Memory Consolidation */}
            <div className="pointer-events-auto flex justify-end gap-2">
                <button
                    onClick={async () => {
                        console.log('[HUD] Resuming Memory...');
                        if (projectId) {
                            await triggerMemoryConsolidation(projectId);
                        }
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-lg transition-all active:scale-95"
                >
                    <Brain size={14} className="" />
                    <span>Memoria Infinita</span>
                </button>

                <button
                    onClick={async () => {
                        const { SwarmOrchestrator } = await import('../../kernel/collaboration/SwarmOrchestrator');
                        const { useGraphStore } = await import('../../store/useGraphStore');

                        // Pulse the visible nodes for context
                        const visibleNodes = useGraphStore.getState().nodes.map(n => n.id);
                        if (visibleNodes.length > 0) {
                            console.log('[HUD] Manually triggering Swarm Pulse...');
                            SwarmOrchestrator.dispatchSwarmPulse(visibleNodes.slice(0, 10)); // Top 10 context
                        }
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-lg transition-all active:scale-95"
                >
                    <Wind size={14} className="animate-pulse" />
                    <span>Activar Enjambre</span>
                </button>
            </div>
        </div>
    );
}
