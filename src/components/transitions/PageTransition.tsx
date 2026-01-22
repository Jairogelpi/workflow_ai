import React, { useEffect, useState, useRef } from 'react';
import { detectSwipe, getAnimationDuration } from '../../lib/motion';

interface PageTransitionProps {
    children: React.ReactNode;
    type?: 'fade' | 'slide-right' | 'slide-left' | 'slide-up' | 'scale';
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
}

/**
 * PageTransition Component
 * 
 * Provides OS-like page transitions with gesture support.
 * Supports fade, slide, and scale animations.
 */
export const PageTransition: React.FC<PageTransitionProps> = ({
    children,
    type = 'fade',
    onSwipeLeft,
    onSwipeRight
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Trigger animation on mount
        setIsVisible(true);

        // Setup gesture detection
        if (containerRef.current && (onSwipeLeft || onSwipeRight)) {
            const cleanup = detectSwipe(containerRef.current, (direction) => {
                if (direction === 'left' && onSwipeLeft) {
                    onSwipeLeft();
                } else if (direction === 'right' && onSwipeRight) {
                    onSwipeRight();
                }
            });

            return cleanup;
        }
        return () => { }; // No-op cleanup
    }, [onSwipeLeft, onSwipeRight]);

    const getAnimationClass = () => {
        const baseClass = 'page-transition';

        switch (type) {
            case 'slide-right':
                return `${baseClass} slide-in-right`;
            case 'slide-left':
                return `${baseClass} slide-in-left`;
            case 'slide-up':
                return `${baseClass} slide-in-up`;
            case 'scale':
                return `${baseClass} scale-spring`;
            default:
                return baseClass;
        }
    };

    return (
        <div
            ref={containerRef}
            className={`${getAnimationClass()} ${isVisible ? 'visible' : ''}`}
            style={{
                width: '100%',
                height: '100%'
            }}
        >
            {children}
        </div>
    );
};
