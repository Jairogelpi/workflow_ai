'use client';
import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import GraphCanvas from '@/components/graph/GraphCanvas';
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
                        <MediatorHUD />
                        <SwarmDashboard />
                    </div>
                    <WindowManager />
                </main>
            </GlobalDropzone>
        </Desktop>
    );
}
