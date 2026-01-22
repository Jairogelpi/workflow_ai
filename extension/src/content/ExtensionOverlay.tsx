import { useState, useEffect, useRef } from 'react';

/**
 * ExtensionOverlay Component - Futuristic Draggable Panel
 * 
 * Features:
 * - Draggable window with position memory (chrome.storage)
 * - Pop-out to localhost:3000
 * - Shadow DOM isolated styles (inline)
 */

interface ExtensionOverlayProps {
    onClose: () => void;
}

const ExtensionOverlay = ({ onClose }: ExtensionOverlayProps) => {
    const [position, setPosition] = useState({ x: window.innerWidth - 420, y: 20 });
    const [isDragging, setIsDragging] = useState(false);
    const dragRef = useRef<{ startX: number; startY: number; initX: number; initY: number } | null>(null);

    // Load saved position on mount
    useEffect(() => {
        chrome.storage.local.get(['overlayPos'], (result) => {
            if (result.overlayPos) {
                setPosition(result.overlayPos);
            }
        });
    }, []);

    // Save position when drag ends
    const handleMouseUp = () => {
        setIsDragging(false);
        chrome.storage.local.set({ overlayPos: position });
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        dragRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            initX: position.x,
            initY: position.y
        };
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging || !dragRef.current) return;
            const dx = e.clientX - dragRef.current.startX;
            const dy = e.clientY - dragRef.current.startY;
            setPosition({
                x: Math.max(0, Math.min(window.innerWidth - 400, dragRef.current.initX + dx)),
                y: Math.max(0, Math.min(window.innerHeight - 500, dragRef.current.initY + dy))
            });
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, position]);

    const handlePopOut = () => {
        window.open('http://localhost:3000', '_blank');
        onClose();
    };

    // Inline styles (Shadow DOM isolation)
    const panelStyle: React.CSSProperties = {
        position: 'fixed',
        left: position.x,
        top: position.y,
        width: 400,
        height: 500,
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(24px)',
        borderRadius: 16,
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        color: '#e2e8f0',
        pointerEvents: 'auto'
    };

    const headerStyle: React.CSSProperties = {
        height: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 12px',
        cursor: 'move',
        userSelect: 'none',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
    };

    const buttonStyle: React.CSSProperties = {
        background: 'transparent',
        border: 'none',
        padding: 6,
        cursor: 'pointer',
        borderRadius: 4,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 0.2s'
    };

    return (
        <div style={panelStyle} className="overlay-panel">
            {/* HEADER - Draggable */}
            <div style={headerStyle} onMouseDown={handleMouseDown}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2">
                        <polygon points="12 2 2 7 12 12 22 7 12 2" />
                        <polyline points="2 17 12 22 22 17" />
                        <polyline points="2 12 12 17 22 12" />
                    </svg>
                    <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, color: '#22d3ee', fontFamily: 'monospace' }}>
                        WORKGRAPH OS // LIVE
                    </span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {/* Pop-out button */}
                    <button 
                        style={{ ...buttonStyle, color: '#94a3b8' }} 
                        onClick={handlePopOut}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        title="Open in new tab"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                    </button>
                    
                    {/* Close button */}
                    <button 
                        style={{ ...buttonStyle, color: '#94a3b8' }} 
                        onClick={onClose}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#f87171'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}
                        title="Close"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* CONTENT */}
            <div style={{ flex: 1, padding: 16, overflowY: 'auto' }}>
                {/* Drop Zone */}
                <div style={{
                    border: '1px dashed rgba(100, 116, 139, 0.5)',
                    borderRadius: 8,
                    height: 100,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(30, 41, 59, 0.5)',
                    marginBottom: 16,
                    transition: 'border-color 0.2s'
                }}>
                    <span style={{ fontSize: 10, color: '#64748b', marginBottom: 4, letterSpacing: 1 }}>DROP ZONE ACTIVE</span>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>Drag evidence here</span>
                </div>

                {/* Recent Captures */}
                <div>
                    <p style={{ fontSize: 10, color: '#64748b', marginBottom: 8, letterSpacing: 1, fontFamily: 'monospace' }}>RECENT CAPTURES</p>
                    <div style={{
                        backgroundColor: 'rgba(30, 41, 59, 0.5)',
                        padding: 10,
                        borderRadius: 6,
                        fontSize: 12,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <span>No captures yet</span>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#64748b' }} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExtensionOverlay;
