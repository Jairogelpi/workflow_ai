import { useState, useEffect } from 'react';

export function useSystemPulse() {
    const [latency, setLatency] = useState<number>(0);
    const [isOnline, setIsOnline] = useState<boolean>(true);

    useEffect(() => {
        const ping = async () => {
            const start = performance.now();
            try {
                // Ping the own origin to measure round-trip to Next.js server/CDN
                await fetch('/favicon.ico', { method: 'HEAD', cache: 'no-store' });
                const end = performance.now();
                setLatency(Math.round(end - start));
                setIsOnline(true);
            } catch (e) {
                setIsOnline(false);
            }
        };

        // Initial ping
        ping();

        // Ping every 3 seconds
        const interval = setInterval(ping, 3000);
        return () => clearInterval(interval);
    }, []);

    return { latency, isOnline };
}
