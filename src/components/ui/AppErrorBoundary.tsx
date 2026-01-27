'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * Global Error Boundary ("The Neural Safety Net")
 * Captures React rendering errors to prevent white-screen of death.
 * Offers "Soft Recovery" (Reload) and "Hard Recovery" (Clear Cache).
 */
export class AppErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('[NeuroSafe] Global React Error Caught:', error, errorInfo);
        // Optional: Send to observability service (e.g. Sentry/OpenTelemetry)
    }

    private handleReload = () => {
        window.location.reload();
    };

    private handleHardReset = () => {
        if (confirm('This will clear all local cache and reload. Unsaved data might be lost. Proceed?')) {
            localStorage.clear();
            sessionStorage.clear();
            window.location.reload();
        }
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="fixed inset-0 bg-white flex flex-col items-center justify-center p-6 text-slate-900 z-[99999]">
                    <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 shadow-2xl shadow-slate-200/50 flex flex-col items-center text-center space-y-6">

                        {/* Icon */}
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center animate-pulse">
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>

                        {/* Text */}
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold tracking-tight text-slate-800">
                                Interrupción de Sistema
                            </h2>
                            <p className="text-slate-500 text-sm font-medium">
                                Se ha detectado una anomalía crítica en la interfaz.
                            </p>
                            {this.state.error && (
                                <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 text-left w-full overflow-hidden">
                                    <code className="text-[10px] text-red-600 font-mono break-words block">
                                        {this.state.error.toString()}
                                    </code>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="grid grid-cols-2 gap-3 w-full pt-4">
                            <button
                                onClick={this.handleReload}
                                className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all font-bold text-sm shadow-lg shadow-slate-900/10"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Reiniciar
                            </button>

                            <button
                                onClick={this.handleHardReset}
                                className="flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-slate-50 text-slate-600 rounded-xl transition-all font-bold text-sm border border-slate-200 shadow-sm"
                            >
                                <Trash2 className="w-4 h-4" />
                                Limpiar Cache
                            </button>
                        </div>

                        <div className="text-[10px] text-slate-300 font-bold uppercase tracking-widest pt-4">
                            Status: NEURAL_DESYNC_V1
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
