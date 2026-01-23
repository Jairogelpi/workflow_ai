'use client';
import React from 'react';
import { supabase } from '@/lib/supabase';
import { Globe, ShieldCheck, Zap, ChevronRight } from 'lucide-react';

export const WebLogin = () => {
    const handleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`
            }
        });

        if (error) {
            console.error('Error logging in:', error.message);
            alert('Error al iniciar sesión: ' + error.message);
        }
    };

    return (
        <div className="fixed inset-0 bg-white flex items-center justify-center overflow-hidden">
            {/* Cinematic Background Bloom */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] bg-gradient-to-tr from-blue-50/40 via-white to-yellow-50/40 rounded-full blur-[160px] pointer-events-none opacity-80" />

            <div className="relative z-10 w-full max-w-xl px-10 flex flex-col items-center">
                {/* Massive Logo Reveal */}
                <div className="mb-16 animate-in fade-in zoom-in duration-1000 slide-in-from-bottom-10">
                    <img src="/logo.png" alt="Axiom" className="w-[500px] h-auto drop-shadow-[0_40px_100px_rgba(0,0,0,0.1)]" />
                </div>

                <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-5 duration-700 delay-300 fill-mode-forwards opacity-0">
                    <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-4">Bienvenido al Grafo</h1>
                    <p className="text-lg text-slate-400 font-medium leading-relaxed">Conecta tus ideas, automatiza tu investigación y <br />visualiza el conocimiento como nunca antes.</p>
                </div>

                <div className="w-full space-y-4 animate-in fade-in slide-in-from-bottom-5 duration-700 delay-500 fill-mode-forwards opacity-0">
                    <button
                        onClick={handleLogin}
                        className="w-full group relative flex items-center justify-between bg-white border-2 border-slate-100 p-6 rounded-[32px] hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-500/10 transition-all active:scale-[0.99]"
                    >
                        <div className="flex items-center gap-6">
                            <div className="w-12 h-12 flex items-center justify-center bg-slate-50 rounded-full group-hover:bg-blue-50 transition-colors">
                                <img src="https://www.google.com/favicon.ico" className="w-6 h-6" alt="Google" />
                            </div>
                            <span className="text-xl font-bold text-slate-800">Continuar con Google</span>
                        </div>
                        <ChevronRight className="w-6 h-6 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                    </button>

                    <p className="text-center text-xs font-bold text-slate-300 uppercase tracking-[0.2em] mt-8">
                        Axiom GraphOs Protocol v2.4
                    </p>
                </div>

                {/* Features Matrix */}
                <div className="grid grid-cols-3 gap-8 mt-20 w-full animate-in fade-in duration-1000 delay-700 fill-mode-forwards opacity-0">
                    <div className="flex flex-col items-center text-center space-y-3">
                        <div className="p-4 bg-blue-50/50 rounded-2xl text-blue-500">
                            <Globe size={24} />
                        </div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Web Nativa</span>
                    </div>
                    <div className="flex flex-col items-center text-center space-y-3">
                        <div className="p-4 bg-yellow-50/50 rounded-2xl text-yellow-500">
                            <Zap size={24} />
                        </div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">IA en Tiempo Real</span>
                    </div>
                    <div className="flex flex-col items-center text-center space-y-3">
                        <div className="p-4 bg-green-50/50 rounded-2xl text-green-500">
                            <ShieldCheck size={24} />
                        </div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Auto-Soberano</span>
                    </div>
                </div>
            </div>

            {/* Subtle Gradient Accents */}
            <div className="absolute bottom-0 left-0 w-full h-[6px] flex">
                <div className="flex-1 bg-blue-500" />
                <div className="flex-1 bg-red-500" />
                <div className="flex-1 bg-yellow-400" />
                <div className="flex-1 bg-green-500" />
            </div>
        </div>
    );
};
