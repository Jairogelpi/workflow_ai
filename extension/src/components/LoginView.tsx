import React from 'react';
import { Globe, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const LoginView: React.FC = () => {
    const handleLogin = async () => {
        // En una extensión de Chrome, el flujo de OAuth se maneja mejor redirigiendo a la app web 
        // o usando chrome.identity. 
        // Para este ejemplo real, vamos a usar el flujo de Supabase.

        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: chrome.identity.getRedirectURL(),
                skipBrowserRedirect: false
            }
        });

        if (error) {
            console.error('Error logging in:', error.message);
            alert('Error al iniciar sesión: ' + error.message);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-full p-10 bg-white">
            {/* Logo Section */}
            <div className="mb-12 w-full flex flex-col items-center">
                <div className="relative mb-8 animate-in fade-in zoom-in duration-1000">
                    <img src="/logo.png" alt="Axiom" className="w-48 h-auto drop-shadow-[0_15px_40px_rgba(0,0,0,0.06)]" />
                </div>
                <div className="text-center space-y-2">
                    <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Bienvenido a Axiom</h1>
                    <p className="text-[13px] text-slate-400 font-medium">Captura el conocimiento de la web</p>
                </div>
            </div>

            <div className="w-full space-y-4">
                <button
                    onClick={handleLogin}
                    className="w-full group relative flex items-center justify-between bg-white border-2 border-slate-100 p-5 rounded-[24px] hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/5 transition-all active:scale-[0.98]"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-full group-hover:bg-blue-50 transition-colors">
                            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
                        </div>
                        <span className="font-bold text-slate-700">Continuar con Google</span>
                    </div>
                </button>
            </div>

            <div className="mt-16 grid grid-cols-2 gap-6 w-full opacity-70">
                <div className="flex flex-col items-center text-center space-y-3">
                    <div className="p-3 bg-blue-50/50 rounded-2xl text-blue-500">
                        <Globe size={18} />
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">Captura Inteligente</p>
                </div>
                <div className="flex flex-col items-center text-center space-y-3">
                    <div className="p-3 bg-green-50/50 rounded-2xl text-green-500">
                        <ShieldCheck size={18} />
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">Privacidad Axiom</p>
                </div>
            </div>

            <div className="mt-auto pt-10">
                <p className="text-[9px] text-slate-300 font-bold uppercase tracking-[0.2em]">
                    Axiom GraphOs Protocol
                </p>
            </div>
        </div>
    );
};
