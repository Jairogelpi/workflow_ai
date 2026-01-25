'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { WebLogin } from '../components/ui/WebLogin';

export default function Home() {
    const router = useRouter();
    const [isLoading, setIsLoading] = React.useState(true);
    const [splashFinished, setSplashFinished] = React.useState(false);
    const [session, setSession] = React.useState<any>(null);

    // Forces Splash Screen for at least 3.5s (Brand Requirement)
    useEffect(() => {
        const timer = setTimeout(() => {
            setSplashFinished(true);
        }, 3500); // Syncs with Logo Reveal
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const checkSession = async () => {
            // In parallel, check session
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
            setIsLoading(false);
        };
        checkSession();
    }, []);

    // Effect: Only redirect when BOTH session is active AND splash is done
    useEffect(() => {
        if (!isLoading && session && splashFinished) {
            router.replace('/projects');
        }
    }, [isLoading, session, splashFinished, router]);

    // If splash is running OR loading -> Show Intro Splash
    if (!splashFinished || isLoading) {
        return (
            <div className="fixed inset-0 bg-white flex items-center justify-center overflow-hidden z-[9999]">
                {/* Cinematic Reveal */}
                <div className="flex flex-col items-center animate-in fade-in duration-1000">
                    <img
                        src="/logo.png"
                        alt="Axiom"
                        className="w-[300px] md:w-[500px] h-auto drop-shadow-2xl animate-[axiom-epic-reveal_3s_ease-out_forwards]"
                    />
                    <div className="mt-8 text-slate-300 tracking-[0.8em] text-xs font-light uppercase animate-pulse">
                        Initializing...
                    </div>
                </div>
                <style jsx>{`
                    @keyframes axiom-epic-reveal {
                        0% { opacity: 0; transform: scale(0.9) translateY(20px); filter: blur(10px); }
                        100% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
                    }
                 `}</style>
            </div>
        );
    }

    // Only show login if splash is done AND no session
    if (!session && splashFinished) {
        return <WebLogin />;
    }

    return null; // Redirecting...
}
