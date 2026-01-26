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
    const [loading, setLoading] = React.useState(true);

    const fetchData = async () => {
        // Fetch Today's Spend from Real Ledger
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { data, error } = await supabase
            .from('token_ledger')
            .select('cost_usd, savings_usd, input_tokens, output_tokens')
            .gte('created_at', today.toISOString());

        if (data) {
            const spend = data.reduce((acc, curr) => acc + (curr.cost_usd || 0), 0);
            const savings = data.reduce((acc, curr) => acc + (curr.savings_usd || 0), 0);
            const tokens = data.reduce((acc, curr) => acc + (curr.input_tokens || 0) + (curr.output_tokens || 0), 0);

            setCurrentSpend(spend);
            setTotalSavings(savings);
            setTokenCount(tokens);
        }
        setLoading(false);
    };

    React.useEffect(() => {
        fetchData(); // Initial Load

        // [IMPROVEMENT] Realtime Subscription instead of Polling
        const subscription = supabase
            .channel('realtime_budget_monitor')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'token_ledger' },
                (payload) => {
                    const newEntry = payload.new;
                    setCurrentSpend(prev => prev + (newEntry.cost_usd || 0));
                    setTotalSavings(prev => prev + (newEntry.savings_usd || 0));
                    setTokenCount(prev => prev + (newEntry.input_tokens || 0) + (newEntry.output_tokens || 0));
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, []);

    const budgetPercent = (currentSpend / dailyBudgetLimit) * 100;
    const isNearLimit = budgetPercent > 90;

    return (
        <div className="fixed bottom-4 right-4 bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl shadow-2xl p-4 min-w-[300px] z-[9999] transition-all hover:scale-[1.02] hover:bg-white">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white">
                        <DollarSign size={14} className="font-bold" />
                    </div>
                    <div>
                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Economía Real</h3>
                        <p className="text-[9px] text-slate-400 font-medium">Mercado Abierto (OpenRouter)</p>
                    </div>
                </div>
                {loading && <RefreshCcw size={12} className="text-slate-300 animate-spin" />}
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
