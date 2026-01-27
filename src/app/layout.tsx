import React from 'react';
import './globals.css';
import { Metadata } from 'next';
import Providers from './providers';
import { AppErrorBoundary } from '../components/ui/AppErrorBoundary';
import { ClientShell } from './ClientShell';

export const metadata: Metadata = {
    title: 'Axiom GraphOs',
    description: 'Sistema Operativo de Gráfos Inteligentes',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
            </head>
            <body className="antialiased">
                <AppErrorBoundary>
                    <Providers>
                        <ClientShell />
                        {children}
                    </Providers>
                </AppErrorBoundary>
            </body>
        </html>
    );
}
