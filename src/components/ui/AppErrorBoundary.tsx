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
                <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 text-white z-[99999]">
                    <div className="max-w-md w-full bg-slate-900 border border-red-500/20 rounded-2xl p-8 shadow-2xl flex flex-col items-center text-center space-y-6">

                        {/* Icon */}
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center animate-pulse">
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>

                        {/* Text */}
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold font-mono tracking-tight text-red-400">
                                SYSTEM MALFUNCTION
                            </h2>
                            <p className="text-slate-400 text-sm">
                                A critical error caused the neural interface to disconnect.
                            </p>
                            {this.state.error && (
                                <div className="mt-4 p-3 bg-black/40 rounded border border-red-900/30 text-left w-full overflow-hidden">
                                    <code className="text-[10px] text-red-300 font-mono break-words block">
                                        {this.state.error.toString()}
                                    </code>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="grid grid-cols-2 gap-3 w-full pt-4">
                            <button
                                onClick={this.handleReload}
                                className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all font-medium text-sm"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Reboot System
                            </button>

                            <button
                                onClick={this.handleHardReset}
                                className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all font-medium text-sm border border-slate-700"
                            >
                                <Trash2 className="w-4 h-4" />
                                Hard Reset
                            </button>
                        </div>

                        <div className="text-[10px] text-slate-600 pt-4">
                            Error Code: NEURAL_DESYNC_V1
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
