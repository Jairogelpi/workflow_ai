import React from 'react';
import { auditStore } from '../../kernel/observability';
import { AlertCircle, DollarSign, TrendingUp, Clock } from 'lucide-react';

interface BudgetHUDProps {
    dailyBudgetLimit?: number;
}

export const BudgetHUD: React.FC<BudgetHUDProps> = ({ dailyBudgetLimit = 10.0 }) => {
    const [sessionSpend, setSessionSpend] = React.useState(0);
    const [burnRate, setBurnRate] = React.useState(0);
    const [recentActivity, setRecentActivity] = React.useState(0);

    React.useEffect(() => {
        const interval = setInterval(() => {
            setSessionSpend(auditStore.getSessionSpend());
            setBurnRate(auditStore.getBurnRate());
            setRecentActivity(auditStore.getRecentMetrics(10).length);
        }, 1000); // Update every second

        return () => clearInterval(interval);
    }, []);

    const budgetPercent = (sessionSpend / dailyBudgetLimit) * 100;
    const isHighBurn = burnRate > 1.0; // $1/hour threshold
    const isNearLimit = budgetPercent > 90;

    return (
        <div className="fixed bottom-4 right-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl p-4 min-w-[320px] z-50">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <DollarSign size={16} className="text-emerald-600" />
                    Budget Monitor
                </h3>
                {isNearLimit && (
                    <AlertCircle size={16} className="text-orange-500 animate-pulse" />
                )}
            </div>

            {/* Session Spend */}
            <div className="space-y-3">
                <div>
                    <div className="flex justify-between items-baseline mb-1">
                        <span className="text-xs text-gray-600 dark:text-gray-400">Session Spend</span>
                        <span className={`text-lg font-mono font-bold ${isNearLimit ? 'text-orange-600' : 'text-emerald-600'}`}>
                            ${sessionSpend.toFixed(4)}
                        </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-300 ${budgetPercent > 90 ? 'bg-orange-500' :
                                    budgetPercent > 70 ? 'bg-yellow-500' :
                                        'bg-emerald-500'
                                }`}
                            style={{ width: `${Math.min(budgetPercent, 100)}%` }}
                        />
                    </div>
                    <div className="flex justify-between mt-1">
                        <span className="text-[10px] text-gray-500">${(dailyBudgetLimit * 0).toFixed(2)}</span>
                        <span className="text-[10px] text-gray-500">${dailyBudgetLimit.toFixed(2)} limit</span>
                    </div>
                </div>

                {/* Burn Rate */}
                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-2">
                        <TrendingUp size={14} className={isHighBurn ? 'text-orange-500' : 'text-blue-500'} />
                        <span className="text-xs text-gray-600 dark:text-gray-400">Burn Rate</span>
                    </div>
                    <span className="text-sm font-mono font-semibold text-gray-900 dark:text-white">
                        ${burnRate.toFixed(2)}/h
                    </span>
                </div>

                {/* Recent Activity */}
                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-2">
                        <Clock size={14} className="text-purple-500" />
                        <span className="text-xs text-gray-600 dark:text-gray-400">Last 10min</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {recentActivity} calls
                    </span>
                </div>

                {/* Economic Mode Recommendation */}
                {isNearLimit && (
                    <div className="p-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                        <div className="flex items-start gap-2">
                            <AlertCircle size={14} className="text-orange-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="text-xs font-semibold text-orange-900 dark:text-orange-300">Budget Alert</p>
                                <p className="text-[10px] text-orange-700 dark:text-orange-400 mt-0.5">
                                    Consider switching to EFFICIENCY tier for routine tasks.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 text-center">
                        All costs auditable via Compilation Receipts
                    </p>
                </div>
            </div>
        </div>
    );
};
