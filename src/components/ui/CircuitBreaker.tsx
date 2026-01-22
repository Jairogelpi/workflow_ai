
import React from 'react';
import { LogicCircuitBreakerError } from '../../kernel/errors';

interface CircuitBreakerProps {
    error: LogicCircuitBreakerError;
    onReset: () => void; // Para cerrar/reintentar
}

export const CircuitBreaker: React.FC<CircuitBreakerProps> = ({ error, onReset }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-red-950/95 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="max-w-2xl w-full bg-black border-2 border-red-600 shadow-2xl rounded-lg overflow-hidden font-mono text-red-50">

                {/* Cabecera de Alerta */}
                <div className="bg-red-600 text-black px-6 py-4 flex items-center gap-3">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                        <h2 className="text-xl font-bold uppercase tracking-widest">Runtime Logic Error</h2>
                        <p className="text-xs font-semibold opacity-80">CIRCUIT BREAKER ACTIVATED</p>
                    </div>
                </div>

                {/* Cuerpo del Delito */}
                <div className="p-6 space-y-6">
                    <p className="text-lg text-red-200 border-l-4 border-red-500 pl-4 italic">
                        "{error.message}"
                    </p>

                    <div className="space-y-3">
                        <h3 className="text-sm uppercase text-gray-500">Violaciones Detectadas (Trace):</h3>
                        <div className="bg-red-900/30 p-4 rounded border border-red-800/50 max-h-60 overflow-y-auto">
                            {error.violations.map((v: any, i: number) => (
                                <div key={i} className="mb-3 last:mb-0">
                                    <div className="flex items-start gap-2">
                                        <span className="text-red-500 font-bold">[{v.code}]</span>
                                        <span className="text-red-100">{v.message}</span>
                                    </div>
                                    <p className="text-xs text-red-400 mt-1 ml-6 font-mono">
                                        Node ID: {v.nodeId || 'N/A'} | Source: Canon Verification
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Botón de Acción */}
                    <div className="flex justify-end pt-4 border-t border-red-900">
                        <button
                            onClick={onReset}
                            className="bg-red-600 hover:bg-red-500 text-black font-bold py-2 px-6 rounded transition-colors uppercase text-sm tracking-wider"
                        >
                            Entendido, corregiré el grafo
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
