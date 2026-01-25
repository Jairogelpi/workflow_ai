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

    // Forces Splash Screen for at least 5s (Brand Requirement)
    useEffect(() => {
        const timer = setTimeout(() => {
            setSplashFinished(true);
        }, 5000); // Syncs with Video Duration
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
            <div className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden z-[9999]">
                <video
                    src="/axiom_animation.mp4"
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover animate-in fade-in duration-1000"
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
