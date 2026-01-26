import React from 'react';
import { supabase } from '../../lib/supabase';
import { AlertCircle, DollarSign, TrendingUp, Clock, PiggyBank, RefreshCcw } from 'lucide-react';

interface BudgetHUDProps {
    dailyBudgetLimit?: number;
}

export const BudgetHUD: React.FC<BudgetHUDProps> = ({ dailyBudgetLimit = 5.0 }) => {
    const [currentSpend, setCurrentSpend] = React.useState(0);
    const [totalSavings, setTotalSavings] = React.useState(0);
    const [tokenCount, setTokenCount] = React.useState(0);
    const [isOpen, setIsOpen] = React.useState(false);

    // ... (fetch logic remains same)

    const budgetPercent = (currentSpend / dailyBudgetLimit) * 100;
    const isNearLimit = budgetPercent > 90;

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 right-4 bg-white/90 backdrop-blur-md border border-slate-200 rounded-full shadow-lg p-2 flex items-center gap-2 z-[9999] transition-all hover:scale-110 hover:bg-white group"
            >
                <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white group-hover:bg-blue-600 transition-colors">
                    <DollarSign size={14} className="font-bold" />
                </div>
                {/* Micro-indicator only if spending active */}
                {currentSpend > 0 && (
                    <span className="text-xs font-bold text-slate-700 pr-2">
                        ${currentSpend.toFixed(2)}
                    </span>
                )}
            </button>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl shadow-2xl p-4 min-w-[300px] z-[9999] transition-all animate-in slide-in-from-bottom-5">
            {/* Header with Close Button */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2" onClick={() => setIsOpen(false)} role="button">
                    <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white cursor-pointer hover:bg-slate-700">
                        <TrendingUp size={14} className="font-bold" />
                    </div>
                    <div>
                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Economía Real</h3>
                        <p className="text-[9px] text-slate-400 font-medium">Mercado Abierto (OpenRouter)</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsOpen(false)}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                </button>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                {/* Cost Today */}
                <div className="p-3 bg-red-50/50 rounded-xl border border-red-100 flex flex-col items-center">
                    <span className="text-[10px] uppercase font-bold text-red-400 tracking-wider mb-1">Gasto Hoy</span>
                    <span className="text-xl font-black text-red-600 tracking-tighter">
                        ${currentSpend.toFixed(4)}
                    </span>
                </div>

                {/* Savings */}
                <div className="p-3 bg-green-50/50 rounded-xl border border-green-100 flex flex-col items-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-1 opacity-20">
                        <PiggyBank size={32} className="text-green-500" />
                    </div>
                    <span className="text-[10px] uppercase font-bold text-green-500 tracking-wider mb-1">Ahorro IA</span>
                    <span className="text-xl font-black text-green-600 tracking-tighter">
                        ${totalSavings.toFixed(4)}
                    </span>
                </div>
            </div>

            {/* Token Ticker */}
            <div className="bg-slate-50 rounded-lg p-2 border border-slate-100 mb-3 flex justify-between items-center">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Tokens Procesados</span>
                <span className="text-xs font-mono font-bold text-slate-700">
                    {new Intl.NumberFormat('en-US').format(tokenCount)}
                </span>
            </div>

            {/* Budget Bar */}
            <div className="space-y-1">
                <div className="flex justify-between text-[9px] font-bold uppercase text-slate-400">
                    <span>Presupuesto Diario</span>
                    <span>${dailyBudgetLimit.toFixed(2)}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${isNearLimit ? 'bg-red-500' : 'bg-slate-800'}`}
                        style={{ width: `${Math.min(budgetPercent, 100)}%` }}
                    />
                </div>
            </div>

            {/* Disclaimer */}
            <div className="mt-3 pt-2 border-t border-slate-100 text-center">
                <p className="text-[8px] text-slate-300 uppercase tracking-widest font-bold">
                    Precios dinámicos vía OpenRouter API
                </p>
            </div>
        </div>
    );
};
