'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { WebLogin } from '../components/ui/WebLogin';
import { GlobalLoader } from '../components/ui/GlobalLoader';

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
        return <GlobalLoader message="Initializing Core..." />;
    }

    // Only show login if splash is done AND no session
    if (!session && splashFinished) {
        return <WebLogin />;
    }

    return null; // Redirecting...
}
