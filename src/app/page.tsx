'use client';

import GraphCanvas from '../components/graph/GraphCanvas';
import Sidebar from '../components/layout/Sidebar';
import { FloatingPanel } from '../components/ui/FloatingPanel';
import { SmartViewer } from '../components/ui/SmartViewer';
import NodeEditor from '../components/editor/NodeEditor';
import { useGraphStore } from '../store/useGraphStore';

export default function Home() {
    const { activeWindow, closeWindow } = useGraphStore();

    // Función mágica de Pop-Out
    const handlePopOut = () => {
        if (!activeWindow?.contentUrl) return;

        // 1. Abre la nueva pestaña y le da foco automáticamente
        window.open(activeWindow.contentUrl, '_blank');

        // 2. Cierra la ventana flotante en la app para "transferirla"
        // (Esto da la sensación de que la ventana se ha movido allí)
        closeWindow();
    };

    return (
        <main className="flex h-screen w-screen overflow-hidden bg-black text-white relative">
            <Sidebar />

            <div className="flex-1 relative z-0">
                <GraphCanvas />

                {/* SYSTEM OVERLAY */}
                {activeWindow && (
                    <FloatingPanel
                        title={activeWindow.title}
                        isOpen={true}
                        onClose={closeWindow}
                        contentUrl={activeWindow.contentUrl} // Pasamos la URL
                        onPopOut={handlePopOut}              // Pasamos la acción
                        // Posición inicial inteligente (un poco a la derecha para no tapar el grafo central)
                        initialPos={{ x: window.innerWidth - 650, y: 100 }}
                    >
                        {/* LÓGICA DE RENDERIZADO */}
                        {activeWindow.contentType === 'editor' ? (
                            // AQUI RENDERIZAMOS TU EDITOR DENTRO DE LA VENTANA
                            <div className="h-full bg-slate-900 overflow-y-auto">
                                <NodeEditor />
                            </div>
                        ) : (
                            <SmartViewer
                                url={activeWindow.contentUrl || ''}
                                type={activeWindow.mimeType || activeWindow.contentType}
                                textContent={activeWindow.textContent}
                            />
                        )}
                    </FloatingPanel>
                )}
            </div>
        </main>
    );
}
