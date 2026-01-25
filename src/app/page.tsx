'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { WebLogin } from '../components/ui/WebLogin';

export default function Home() {
    const router = useRouter();
    const [isLoading, setIsLoading] = React.useState(true);
    const [session, setSession] = React.useState<any>(null);

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
            setIsLoading(false);

            if (session) {
                // If logged in, go to Projects
                router.replace('/projects');
            }
        };

        checkSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session) router.replace('/projects');
        });

        return () => subscription.unsubscribe();
    }, [router]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-black">
                <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
        );
    }

    if (!session) {
        return <WebLogin />;
    }

    return null; // Redirecting...
}
