import React from 'react';
import './globals.css';
import { Metadata } from 'next';
import Providers from './providers';
import { KernelStateBridge } from '../components/KernelStateBridge';

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
            <body className="antialiased">
                <Providers>
                    <KernelStateBridge />
                    {children}
                </Providers>
            </body>
        </html>
    );
}
