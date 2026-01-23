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

            <div className="relative z-10 w-full max-w-5xl px-10 flex flex-col items-center justify-center min-h-[90vh]">
                {/* Massive Logo Reveal - The Axiom Entrance */}
                <div className="relative group mb-8 animate-in fade-in zoom-in duration-[1200ms] ease-out">
                    <img
                        src="/logo.png"
                        alt="Axiom"
                        className="w-[450px] md:w-[650px] lg:w-[800px] h-auto transition-transform duration-1000 group-hover:scale-[1.02] drop-shadow-[0_30px_90px_rgba(0,0,0,0.06)]"
                    />
                </div>

                <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-5 duration-700 delay-300 fill-mode-forwards opacity-0">
                    <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-4">Bienvenido al Grafo</h1>
                    <p className="text-lg md:text-xl text-slate-400 font-medium leading-relaxed max-w-2xl">Conecta tus ideas, automatiza tu investigación y <br className="hidden md:block" />visualiza el conocimiento como nunca antes.</p>
                </div>

                <div className="w-full max-w-lg space-y-4 animate-in fade-in slide-in-from-bottom-5 duration-700 delay-500 fill-mode-forwards opacity-0">
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

                    <p className="text-center text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em] pt-8">
                        Axiom GraphOs Protocol v2.5
                    </p>
                </div>

                {/* Features Matrix */}
                <div className="grid grid-cols-3 gap-12 mt-24 w-full max-w-4xl animate-in fade-in duration-1000 delay-700 fill-mode-forwards opacity-0">
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="p-5 bg-blue-50/50 rounded-[24px] text-blue-500 shadow-sm">
                            <Globe size={28} />
                        </div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none">Web Nativa</span>
                    </div>
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="p-5 bg-yellow-50/50 rounded-[24px] text-yellow-500 shadow-sm">
                            <Zap size={28} />
                        </div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none">IA Tiempo Real</span>
                    </div>
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="p-5 bg-green-50/50 rounded-[24px] text-green-500 shadow-sm">
                            <ShieldCheck size={28} />
                        </div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none">Auto-Soberano</span>
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
