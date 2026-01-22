'use client';
import React from 'react';
import { useGraphStore } from '../../store/useGraphStore';
import { FloatingPanel } from './FloatingPanel';
import NodeEditor from '../editor/NodeEditor';
import { SmartViewer } from './SmartViewer';

export function WindowManager() {
    const windows = useGraphStore(state => state.windows);
    const closeWindow = useGraphStore(state => state.closeWindow);
    const focusWindow = useGraphStore(state => state.focusWindow);

    return (
        <>
            {Object.values(windows).map((win) => (
                win.isOpen && (
                    <div
                        key={win.id}
                        style={{ zIndex: 1000 + win.zIndex }}
                        className="fixed inset-0 pointer-events-none"
                    >
                        <div className="pointer-events-auto w-full h-full relative">
                            <FloatingPanel
                                title={win.title}
                                isOpen={true}
                                onClose={() => closeWindow(win.id)}
                                contentUrl={win.contentUrl}
                                onPopOut={() => {
                                    if (win.contentUrl) window.open(win.contentUrl, '_blank');
                                    closeWindow(win.id);
                                }}
                                initialPos={{
                                    x: typeof window !== 'undefined' ? (window.innerWidth / 2) - 300 + (win.zIndex * 20) : 400,
                                    y: 80 + (win.zIndex * 20)
                                }}
                            >
                                <div
                                    className="h-full w-full"
                                    onMouseDown={() => focusWindow(win.id)}
                                >
                                    {win.contentType === 'editor' ? (
                                        <div className="h-full bg-surface dark:bg-surface-dark-container overflow-y-auto">
                                            {/* We need to pass the nodeId to NodeEditor or have it fetch from store based on focus */}
                                            {/* For now, we assume NodeEditor uses a selectedNode state we might need to fix */}
                                            <NodeEditor />
                                        </div>
                                    ) : (
                                        <SmartViewer
                                            content={win.textContent || win.nodeData?.content || ''}
                                            receipt={win.nodeData?.receipt}
                                        />
                                    )}
                                </div>
                            </FloatingPanel>
                        </div>
                    </div>
                )
            ))}
        </>
    );
}
