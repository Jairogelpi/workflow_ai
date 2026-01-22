import { useState } from 'react';
import { Layers } from 'lucide-react';

/**
 * ExtensionOverlay Component
 * 
 * This is the main UI component injected into the Shadow DOM of the host page.
 * It provides a floating button to toggle the WorkGraph OS panel.
 * 
 * Features:
 * - Isolated styles via Shadow DOM context
 * - Draggable/Floating toggle button (currently fixed position)
 * - Backdrop blur effect for modern aesthetics
 */
const ExtensionOverlay = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="font-sans antialiased text-white">
            {/* Toggle Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    style={{
                        position: 'fixed',
                        bottom: '20px',
                        right: '20px',
                        zIndex: 2147483647,
                        padding: '12px',
                        borderRadius: '50%',
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1.0)'}
                    title="Open WorkGraph OS"
                >
                    <Layers size={24} color="#6366f1" />
                </button>
            )}

            {/* Main Panel */}
            {isOpen && (
                <div
                    style={{
                        position: 'fixed',
                        top: '20px',
                        right: '20px',
                        width: '400px',
                        height: '600px',
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        backdropFilter: 'blur(12px)',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        zIndex: 2147483647
                    }}
                >
                    {/* Header */}
                    <div style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: 'rgba(30, 41, 59, 0.5)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Layers size={16} color="#818cf8" />
                            <span style={{ fontSize: '14px', fontWeight: 600, color: '#e2e8f0' }}>WorkGraph OS</span>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#94a3b8',
                                cursor: 'pointer',
                                fontSize: '18px',
                                padding: '4px'
                            }}
                        >
                            ×
                        </button>
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
                        <div style={{
                            padding: '16px',
                            backgroundColor: 'rgba(51, 65, 85, 0.5)',
                            borderRadius: '8px',
                            border: '1px dashed rgba(255, 255, 255, 0.1)',
                            textAlign: 'center'
                        }}>
                            <p style={{ margin: 0, fontSize: '14px', color: '#cbd5e1' }}>
                                Drag and drop content here or select text on the page to analyze.
                            </p>
                        </div>

                        {/* Demo List */}
                        <div style={{ marginTop: '20px' }}>
                            <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#64748b', marginBottom: '8px' }}>Recent Activty</h4>
                            {[1, 2, 3].map(i => (
                                <div key={i} style={{
                                    padding: '10px',
                                    backgroundColor: 'rgba(30, 41, 59, 0.3)',
                                    marginBottom: '8px',
                                    borderRadius: '6px',
                                    fontSize: '13px',
                                    color: '#94a3b8'
                                }}>
                                    Analyzed snippet from active page...
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExtensionOverlay;
