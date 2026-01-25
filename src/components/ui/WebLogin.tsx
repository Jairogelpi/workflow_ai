'use client';
import React from 'react';
import { supabase } from '@/lib/supabase';
import { Globe, ShieldCheck, Zap, ChevronRight } from 'lucide-react';

export const WebLogin = () => {
    // Stage 0: True Start (White Screen)
    // Stage 1: Logo Appears (Fade In + Zoom)
    // Stage 2: Text Appears
    // Stage 3: Splash Gone (Show Form)
    const [stage, setStage] = React.useState(0);
    const [showSplash, setShowSplash] = React.useState(true);

    React.useEffect(() => {
        // Timeline
        // 0ms: Stage 0 (Invisible)
        // 1000ms: Stage 1 (Logo Visible)
        // 3500ms: Stage 2 (Text Visible)
        // 5500ms: Stage 3 (Remove Splash)

        const t1 = setTimeout(() => setStage(1), 1000);
        const t2 = setTimeout(() => setStage(2), 3500);
        const t3 = setTimeout(() => {
            setStage(3);
            setShowSplash(false);
        }, 5500);

        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }, []);

    const handleLogin = async () => {
        try {
            console.log('[WebLogin] Login button clicked. Initiating Google OAuth...');
            const redirectTo = `${window.location.origin}/auth/callback`;
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo,
                    skipBrowserRedirect: false,
                    queryParams: {
                        prompt: 'select_account'
                    }
                }
            });

            if (error) {
                alert('Error al iniciar sesión: ' + error.message);
                return;
            }
        } catch (err: any) {
            alert('Error crítico al iniciar sesión: ' + (err.message || String(err)));
        }
    };

    return (
        <>
            {/* INTRO OVERLAY */}
            <div
                className={`fixed inset-0 bg-white flex items-center justify-center overflow-hidden z-[9999] transition-opacity duration-1000 ${stage >= 3 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                aria-hidden={!showSplash}
            >
                <div className="relative flex flex-col items-center justify-center">
                    {/* Cinematic Logo Reveal */}
                    <div
                        className={`transition-all duration-[2500ms] ease-out-expo transform 
                            ${stage >= 1 ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-90 blur-sm'}
                        `}
                    >
                        <img
                            src="/logo.png"
                            alt="Axiom"
                            className="w-[400px] md:w-[700px] h-auto drop-shadow-[0_20px_50px_rgba(0,0,0,0.15)]"
                        />
                    </div>

                    {/* Text Reveal */}
                    <div
                        className={`mt-12 text-slate-300 tracking-[0.8em] text-sm font-light uppercase transition-all duration-1000 delay-[500ms]
                            ${stage >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
                        `}
                    >
                        Initializing GraphOS...
                    </div>
                </div>
            </div>

            {/* LOGIN FORM (Underneath) */}
            <div className={`fixed inset-0 bg-white overflow-y-auto overflow-x-hidden transition-opacity duration-1000 ${stage >= 3 ? 'opacity-100' : 'opacity-0'}`}>
                {/* Background Bloom */}
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] bg-gradient-to-tr from-blue-50/40 via-white to-yellow-50/40 rounded-full blur-[160px] pointer-events-none opacity-80" />

                <div className="relative z-10 w-full flex flex-col items-center justify-center min-h-screen py-10">
                    <div className="relative group mb-8">
                        <img src="/logo.png" alt="Axiom" className="w-[250px] md:w-[350px] h-auto drop-shadow-sm" />
                    </div>

                    <div className="bg-white/80 backdrop-blur-xl border border-white/50 p-8 rounded-[40px] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] w-full max-w-md mx-6 transition-all hover:shadow-[0_40px_80px_-12px_rgba(0,0,0,0.12)] hover:scale-[1.01]">
                        <div className="text-center mb-10">
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">Bienvenido</h1>
                            <p className="text-slate-500 font-medium">Inicia sesión para continuar</p>
                        </div>

                        <button onClick={handleLogin} className="w-full group relative flex items-center justify-between bg-white border border-slate-200 p-5 rounded-[24px] hover:border-blue-500 hover:bg-blue-50/30 transition-all active:scale-[0.98]">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 rounded-full shadow-sm">
                                    <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
                                </div>
                                <span className="text-lg font-bold text-slate-700">Continuar con Google</span>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                        </button>

                        <div className="mt-8 pt-6 border-t border-slate-100 flex justify-center gap-6">
                            <div className="flex flex-col items-center"><Globe size={18} className="text-slate-400 mb-1" /><span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Web</span></div>
                            <div className="flex flex-col items-center"><Zap size={18} className="text-slate-400 mb-1" /><span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">AI</span></div>
                            <div className="flex flex-col items-center"><ShieldCheck size={18} className="text-slate-400 mb-1" /><span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Secure</span></div>
                        </div>
                    </div>

                    <p className="text-center text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em] mt-12">Axiom GraphOs Protocol v2.6</p>
                </div>

                <div className="absolute bottom-0 left-0 w-full h-[4px] flex opacity-50">
                    <div className="flex-1 bg-blue-500" />
                    <div className="flex-1 bg-red-500" />
                    <div className="flex-1 bg-yellow-400" />
                    <div className="flex-1 bg-green-500" />
                </div>
            </div>
        </>
    );
};
