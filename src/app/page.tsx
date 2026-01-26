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

    // Forces Splash Screen for 10s (Brand presence) then yields to App
    useEffect(() => {
        const timer = setTimeout(() => {
            setSplashFinished(true);
        }, 10000); // Extended duration
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

    // If splash is running OR loading -> Show Intro Splash
    if (!splashFinished || isLoading) {
        return (
            <div className="fixed inset-0 bg-black flex items-center justify-center p-4 z-[9999]">
                <video
                    src="/axiom_animation.mp4"
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-32 md:w-56 lg:w-64 h-auto object-contain animate-in fade-in duration-1000"
                />
            </div>
        );
    }

    // Only show login if splash is done AND no session
    if (!session && splashFinished) {
        return <WebLogin />;
    }

    return null; // Redirecting...
}
