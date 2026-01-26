'use client';

import dynamic from 'next/dynamic';

// Dynamic imports for client-only components that chain to WASM modules
const KernelStateBridge = dynamic(
    () => import('../components/KernelStateBridge').then(m => m.KernelStateBridge),
    { ssr: false }
);
const BudgetHUD = dynamic(
    () => import('../components/ui/BudgetHUD').then(m => m.BudgetHUD),
    { ssr: false }
);

export function ClientShell() {
    return (
        <>
            <KernelStateBridge />
            <BudgetHUD />
        </>
    );
}
