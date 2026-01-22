'use client';

import GraphCanvas from '../components/graph/GraphCanvas';
import GlobalDropzone from '../components/graph/GlobalDropzone';
import { FloatingPanel } from '../components/ui/FloatingPanel';
import { SmartViewer } from '../components/ui/SmartViewer';
import NodeEditor from '../components/editor/NodeEditor';
import { useGraphStore } from '../store/useGraphStore';
import { useTheme } from '../components/providers/ThemeProvider';
import { MediatorHUD } from '../components/ui/MediatorHUD';

export default function Home() {
    const { activeWindow, closeWindow } = useGraphStore();
    const { theme, toggleTheme } = useTheme();

    const handlePopOut = () => {
        if (!activeWindow?.contentUrl) return;
        window.open(activeWindow.contentUrl, '_blank');
        closeWindow();
    };

    return (
        <GlobalDropzone>
            <main className="relative h-screen w-screen overflow-hidden bg-surface dark:bg-surface-dark transition-colors duration-300">
                {/* Theme Toggle - Floating Top Right */}
                <div className="absolute top-4 right-4 z-50">
                    <button
                        onClick={toggleTheme}
                        className="floating-island p-3 transition-all hover:scale-105 active:scale-95"
                        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                    >
                        {theme === 'light' ? (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-outline">
                                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                            </svg>
                        ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-outline-variant">
                                <circle cx="12" cy="12" r="5" />
                                <line x1="12" y1="1" x2="12" y2="3" />
                                <line x1="12" y1="21" x2="12" y2="23" />
                                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                                <line x1="1" y1="12" x2="3" y2="12" />
                                <line x1="21" y1="12" x2="23" y2="12" />
                                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                            </svg>
                        )}
                    </button>
                </div>

                {/* Logo - Top Left */}
                <div className="absolute top-4 left-4 z-50">
                    <div className="floating-island px-4 py-2 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
                            <span className="text-white font-bold text-sm">W</span>
                        </div>
                        <span className="font-semibold text-on-surface dark:text-white hidden sm:block">
                            WorkGraph
                        </span>
                    </div>
                </div>

                {/* Graph Canvas */}
                <div className="w-full h-full">
                    <GraphCanvas />
                    <MediatorHUD />
                </div>

                {/* Floating Editor Panel */}
                {activeWindow && (
                    <FloatingPanel
                        title={activeWindow.title}
                        isOpen={true}
                        onClose={closeWindow}
                        contentUrl={activeWindow.contentUrl}
                        onPopOut={handlePopOut}
                        initialPos={{ x: typeof window !== 'undefined' ? window.innerWidth - 500 : 400, y: 80 }}
                    >
                        {activeWindow.contentType === 'editor' ? (
                            <div className="h-full bg-surface dark:bg-surface-dark-container overflow-y-auto">
                                <NodeEditor />
                            </div>
                        ) : (
                            <SmartViewer
                                content={activeWindow.textContent || activeWindow.nodeData?.content || ''}
                                receipt={activeWindow.nodeData?.receipt}
                            />
                        )}
                    </FloatingPanel>
                )}
            </main>
        </GlobalDropzone>
    );
}
