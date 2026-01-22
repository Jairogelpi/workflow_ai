import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getAnimationDuration } from '../../lib/motion';

interface WindowTransitionProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: string;
}

/**
 * WindowTransition Component
 * 
 * Provides OS-like window animations with spring physics.
 * Includes backdrop blur and smooth open/close transitions.
 */
export const WindowTransition: React.FC<WindowTransitionProps> = ({
    isOpen,
    onClose,
    children,
    title
}) => {
    const [shouldRender, setShouldRender] = useState(isOpen);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setShouldRender(true);
            // Trigger open animation
            requestAnimationFrame(() => {
                setIsAnimating(true);
            });
        } else {
            // Trigger close animation
            setIsAnimating(false);
            // Remove from DOM after animation
            const duration = getAnimationDuration(300);
            setTimeout(() => {
                setShouldRender(false);
            }, duration);
        }
    }, [isOpen]);

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleEscapeKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
    };

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleEscapeKey);
            return () => document.removeEventListener('keydown', handleEscapeKey);
        }
        return undefined;
    }, [isOpen]);

    if (!shouldRender) return null;

    return createPortal(
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${isAnimating ? 'backdrop-fade' : ''
                }`}
            style={{
                backdropFilter: isAnimating ? 'blur(12px)' : 'blur(0px)',
                backgroundColor: isAnimating ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0)',
                transition: 'backdrop-filter 300ms var(--ease-out-expo), backgroundColor 300ms var(--ease-out-expo)'
            }}
            onClick={handleBackdropClick}
        >
            <div
                className={`relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden glass ${isAnimating ? 'window-open' : 'window-close'
                    }`}
            >
                {/* Window Header */}
                {title && (
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {title}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}

                {/* Window Content */}
                <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
};
