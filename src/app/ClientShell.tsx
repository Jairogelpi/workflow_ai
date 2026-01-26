'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useGraphStore } from '../store/useGraphStore';

// Dynamic imports for client-only components that chain to WASM modules
const KernelStateBridge = dynamic(
    () => import('../components/KernelStateBridge').then(m => m.KernelStateBridge),
    { ssr: false }
);
const BudgetHUD = dynamic(
    () => import('../components/ui/BudgetHUD').then(m => m.BudgetHUD),
    { ssr: false }
);

export function ClientShell() {
    const [isAuthReady, setIsAuthReady] = useState(false);
    const { setCurrentUser } = useGraphStore();

    useEffect(() => {
        const initSession = async () => {
            try {
                // 1. Get Session
                const { data: { session } } = await supabase.auth.getSession();

                if (session?.user) {
                    // 2. Hydrate Store
                    setCurrentUser({
                        id: session.user.id,
                        role: 'editor' // Assume editor for now, RBAC will refine
                    });
                    console.log('[ClientShell] Session hydrated for:', session.user.id);
                } else {
                    // 3. Anonymous Fallback (for public demos)
                    console.warn('[ClientShell] No session found. Running in Anonymous Mode.');
                    setCurrentUser({
                        id: 'anon-' + Math.random().toString(36).slice(2, 9),
                        role: 'viewer'
                    });
                }
            } catch (err) {
                console.error('[ClientShell] Auth Init Failed:', err);
            } finally {
                setIsAuthReady(true);
            }
        };

        initSession();
    }, [setCurrentUser]);

    if (!isAuthReady) {
        return (
            <div className="fixed inset-0 bg-slate-950 flex items-center justify-center z-50">
                <div className="text-slate-400 text-sm animate-pulse">Initializing Secure Environment...</div>
            </div>
        );
    }

    return (
        <>
            <KernelStateBridge />
            <BudgetHUD />
        </>
    );
}
