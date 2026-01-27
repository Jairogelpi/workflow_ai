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

    // Forces Splash Screen for 6s (Match animation loop) then yields to App
    useEffect(() => {
        const timer = setTimeout(() => {
            setSplashFinished(true);
        }, 6000); // Optimized duration
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const checkSession = async () => {
            // Parallel: Pre-fetch session while animation plays
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

    const videoRef = React.useRef<HTMLVideoElement>(null);

    // Force play on mount to bypass React hydration quirks
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.play().catch(e => console.error("Autoplay failed:", e));
        }
    }, [isLoading]);

    // If splash is running OR loading -> Show Intro Splash
    if (!splashFinished || isLoading) {
        return (
            <div
                className="fixed inset-0 h-screen w-screen !bg-white !flex !items-center !justify-center p-4 !z-[9999]"
                style={{ backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-64 md:w-80 lg:w-[450px] h-auto object-contain animate-in fade-in duration-500"
                >
                    <source src="/axiom_animation.mp4" type="video/mp4" />
                    {/* Fallback for really old browsers */}
                    <div className="text-slate-400 text-xs">Loading Axiom OS...</div>
                </video>
            </div>
        );
    }

    // Only show login if splash is done AND no session
    if (!session && splashFinished) {
        return <WebLogin />;
    }

    return null; // Redirecting...
}
