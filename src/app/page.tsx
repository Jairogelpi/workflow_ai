'use client';
import React from 'react';

import GraphCanvas from '../components/graph/GraphCanvas';
import GlobalDropzone from '../components/graph/GlobalDropzone';
import { FloatingPanel } from '../components/ui/FloatingPanel';
import { SmartViewer } from '../components/ui/SmartViewer';
import NodeEditor from '../components/editor/NodeEditor';
import { useGraphStore } from '../store/useGraphStore';
import { useTheme } from '../components/providers/ThemeProvider';
import { MediatorHUD } from '../components/ui/MediatorHUD';
import { SwarmDashboard } from '../components/ui/SwarmDashboard';
import { CommandHUD } from '../components/ui/CommandHUD';
import { NeuralRipple } from '../components/graph/NeuralRipple';
import { BootSequence } from '../components/ui/BootSequence';
import { Desktop } from '../components/shell/Desktop';
import { WindowManager } from '../components/ui/WindowManager';

import { WebLogin } from '../components/ui/WebLogin';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

export default function Home() {
    const [user, setUser] = React.useState<User | null>(null);
    const [authLoading, setAuthLoading] = React.useState(true);
    const [hasBooted, setHasBooted] = React.useState(false);
    const { toggleTheme, theme } = useTheme();

    console.log('[Home Page] Render State:', { authLoading, hasUser: !!user, hasBooted });

    const handleBootComplete = React.useCallback(() => {
        console.log('[Home Page] handleBootComplete triggered. Setting hasBooted = true');
        setHasBooted(true);
    }, []);

    React.useEffect(() => {
        console.log('[Home Page] Mount - Initializing session check...');

        // Expose debug info to window for the USER to copy/paste if needed
        (window as any).__DEBUG_AUTH__ = async () => {
            const { data, error } = await supabase.auth.getSession();
            console.log('[DEBUG] Manual getSession:', { data, error });
            const { data: userData, error: userError } = await supabase.auth.getUser();
            console.log('[DEBUG] Manual getUser:', { userData, userError });
            alert(`Session: ${data.session ? 'EXIST' : 'NONE'}. User: ${userData.user ? userData.user.email : 'NONE'}`);
        };

        // Initial session check
        supabase.auth.getSession().then(({ data: { session }, error }) => {
            if (error) console.error('[Home Page] getSession error:', error);
            console.log('[Home Page] Initial session check result:', JSON.stringify({
                hasSession: !!session,
                email: session?.user?.email,
                expires_at: session?.expires_at
            }, null, 2));

            setUser(session?.user ?? null);
            setAuthLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log(`[Home Page] Auth state change event: ${event}. Session state: ${session ? 'PRESENT' : 'MISSING'}`);
            setUser(session?.user ?? null);
            setAuthLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    if (authLoading) {
        return (
            <div className="fixed inset-0 bg-white flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (!user) {
        return <WebLogin />;
    }

    if (!hasBooted) {
        return <BootSequence onComplete={handleBootComplete} />;
    }

    return (
        <Desktop>
            <GlobalDropzone>
                <main className="relative h-full w-full overflow-hidden bg-transparent transition-colors duration-300">
                    {/* Theme Toggle - Hidden in Desktop OS (managed by system bar later) */}

                    {/* Graph Canvas */}
                    <div className="w-full h-full">
                        <CommandHUD />
                        <NeuralRipple />
                        <GraphCanvas />
                        <MediatorHUD />
                        <SwarmDashboard />
                    </div>

                    <WindowManager />
                </main>
            </GlobalDropzone>
        </Desktop>
    );
}
