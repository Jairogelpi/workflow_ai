
import { useState, useEffect } from 'react';

export function useXRayMode() {
    const [isXRayActive, setIsXRayActive] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Alt') setIsXRayActive(true);
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === 'Alt') setIsXRayActive(false);
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    return isXRayActive;
}
