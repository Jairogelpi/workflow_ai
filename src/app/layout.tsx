import React from 'react';
import './globals.css';
import { Metadata } from 'next';
import Providers from './providers';
import { KernelStateBridge } from '../components/KernelStateBridge';
import { BudgetHUD } from '../components/ui/BudgetHUD';
import { AppErrorBoundary } from '../components/ui/AppErrorBoundary';

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
                <AppErrorBoundary>
                    <Providers>
                        <KernelStateBridge />
                        <BudgetHUD />
                        {children}
                    </Providers>
                </AppErrorBoundary>
            </body>
        </html>
    );
}
