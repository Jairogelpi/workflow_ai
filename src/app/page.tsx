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

export default function Home() {
    const [hasBooted, setHasBooted] = React.useState(false);
    const { toggleTheme, theme } = useTheme();

    if (!hasBooted) {
        return <BootSequence onComplete={() => setHasBooted(true)} />;
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
