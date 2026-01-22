/**
 * SISTEMA DE AUDITORÍA FORENSE v1.0
 * 
 * "Black Box" console for real-time architectural transparency.
 * Exposes data flows, latencies, and costs directly to the user.
 */
import { useAuditStream } from '../hooks/useAuditStream';
import { Activity, Cpu, DollarSign, Clock } from 'lucide-react';

export function SidePanelAuditView() {
    const logs = useAuditStream();

    if (logs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-cyan-800/50 h-full bg-slate-900 font-mono">
                <Activity className="w-8 h-8 mb-4 animate-pulse" />
                <p className="text-xs uppercase tracking-widest text-center">
                    Waiting for system pulse...<br />
                    [Forensic Mode Active]
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-slate-900 border-t border-cyan-900/50">
            {/* Header / Metrics Dashboard */}
            <div className="p-3 bg-slate-950/50 border-b border-cyan-900/30 flex items-center justify-between">
                <h3 className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest flex items-center">
                    <Activity className="w-3 h-3 mr-2" /> Live Audit Trail
                </h3>
                <div className="flex gap-3">
                    <span className="text-[9px] text-emerald-400 flex items-center">
                        <CheckIcon className="w-2.5 h-2.5 mr-1" /> Integrity: OK
                    </span>
                </div>
            </div>

            {/* Scrollable Log Stream */}
            <div className="flex-1 overflow-y-auto p-3 font-mono text-[10px]">
                {logs.map((log, i) => (
                    <div
                        key={i}
                        className="mb-3 p-2 bg-slate-800/40 rounded border-l-2 border-cyan-500/50 hover:bg-slate-800/60 transition-colors group animate-in fade-in slide-in-from-left-2"
                    >
                        <div className="flex justify-between items-start mb-1">
                            <span className="text-cyan-300 font-bold uppercase">{log.operation}</span>
                            <span className="text-slate-500 text-[8px]">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-y-1 mt-2 text-slate-400">
                            <div className="flex items-center">
                                <Clock className="w-2.5 h-2.5 mr-1.5 text-yellow-500/70" />
                                <span>{log.duration_ms}ms</span>
                            </div>
                            <div className="flex items-center">
                                <DollarSign className="w-2.5 h-2.5 mr-1.5 text-emerald-500/70" />
                                <span>${log.cost_usd.toFixed(4)}</span>
                            </div>
                            <div className="flex items-center col-span-2">
                                <Cpu className="w-2.5 h-2.5 mr-1.5 text-blue-500/70" />
                                <span className="truncate">{log.engine}</span>
                            </div>
                        </div>

                        {log.metadata && (
                            <div className="mt-2 pt-2 border-t border-slate-700/50 text-[9px] text-slate-500 italic truncate" title={JSON.stringify(log.metadata)}>
                                {typeof log.metadata === 'string' ? log.metadata : JSON.stringify(log.metadata)}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

const CheckIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
);
