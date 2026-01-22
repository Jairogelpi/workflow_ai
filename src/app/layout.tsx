import React from 'react';
import './globals.css';
import { Metadata } from 'next';
import Providers from './providers';

export const metadata: Metadata = {
    title: 'WorkGraph OS',
    description: 'Agentic RLM Workbench',
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
                    {children}
                </Providers>
            </body>
        </html>
    );
}
