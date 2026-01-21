import React from 'react';
import './globals.css';
import { Metadata } from 'next';
import Providers from './providers';
import Link from 'next/link';

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
        <html lang="en">
            <body className="antialiased min-h-screen flex text-slate-900 bg-white dark:bg-slate-950 dark:text-slate-50">
                <Providers>
                    {/* Sidebar */}
                    <aside className="w-16 border-r border-slate-200 dark:border-slate-800 flex flex-col items-center py-4 gap-4 bg-slate-50 dark:bg-slate-900 z-10">
                        <div className="font-bold text-xl mb-4">WG</div>
                        <Link href="/" className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-800" title="Graph">
                            G
                        </Link>
                        <Link href="/editor" className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-800" title="Editor">
                            E
                        </Link>
                    </aside>

                    {/* Main Content */}
                    <div className="flex-1 relative">
                        {children}
                    </div>
                </Providers>
            </body>
        </html>
    );
}
