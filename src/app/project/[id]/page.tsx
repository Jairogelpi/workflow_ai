'use client';
import React from 'react';
import dynamic from 'next/dynamic';
import { useParams, useRouter } from 'next/navigation';
import GlobalDropzone from '@/components/graph/GlobalDropzone';
import { CommandHUD } from '@/components/ui/CommandHUD';
import { NeuralRipple } from '@/components/graph/NeuralRipple';
import { MediatorHUD } from '@/components/ui/MediatorHUD';
import { SwarmDashboard } from '@/components/ui/SwarmDashboard';
import { WindowManager } from '@/components/ui/WindowManager';
import { Desktop } from '@/components/shell/Desktop';
import { useGraphStore } from '@/store/useGraphStore';
import { supabase } from '@/lib/supabase';
import { BootSequence } from '@/components/ui/BootSequence';
import { TrafficLightHUD } from '@/components/workflow/TrafficLightHUD';
import { CircuitBreakerOverlay } from '@/components/ui/CircuitBreaker';

// Dynamic import for heavy client-only components (WASM/WebGL)
const GraphCanvas = dynamic(() => import('@/components/graph/GraphCanvas'), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-slate-950 flex items-center justify-center text-slate-500 text-xs">Initializing Graph Engine...</div>
});

export default function ProjectWorkspace() {
    const params = useParams();
    const projectId = params?.id as string;
    const { loadProject } = useGraphStore();
    const router = useRouter();

    // Auth State
    const [loading, setLoading] = React.useState(true);
    const [hasBooted, setHasBooted] = React.useState(false);

    React.useEffect(() => {
        // Verify Session
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.replace('/'); // Redirect to login
                return;
            }

            // Load Project Data
            if (projectId) {
                console.log(`[Workspace] Loading project: ${projectId}`);
                // In a real app, we would await this.
                // await loadProject(projectId); 
            }
            setLoading(false);
        };
        checkSession();
    }, [projectId, router, loadProject]);

    const handleBootComplete = () => {
        setHasBooted(true);
    };

    if (loading) return <div className="bg-black text-white flex items-center justify-center h-screen">Loading Interface...</div>;

    if (!hasBooted) {
        return <BootSequence onComplete={handleBootComplete} />;
    }

    return (
        <Desktop>
            <GlobalDropzone>
                <main className="relative h-full w-full overflow-hidden bg-transparent transition-colors duration-300">
                    <div className="w-full h-full">
                        <CommandHUD />
                        <NeuralRipple />
                        <GraphCanvas />
                        <SwarmDashboard />
                        <TrafficLightHUD /> {/* [Circuit Breaker] */}
                    </div>
                    <WindowManager />
                    <CircuitBreakerOverlay /> {/* [Safety Core] */}
                </main>
            </GlobalDropzone>
        </Desktop>
    );
}
