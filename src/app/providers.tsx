'use client';
import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '../components/providers/ThemeProvider';

export default function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient());

    React.useEffect(() => {
        import('../kernel/collaboration/AmbientSwarmManager').then(({ AmbientSwarmManager }) => {
            AmbientSwarmManager.init();
        });
    }, []);

    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider>
                {children}
            </ThemeProvider>
        </QueryClientProvider>
    );
}
