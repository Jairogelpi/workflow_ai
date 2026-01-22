'use client';

import { useState, useEffect } from 'react';
import { Filter } from 'lucide-react';

export interface GraphFilterState {
    showPinnedOnly: boolean;
    showValidatedOnly: boolean;
    types: {
        idea: boolean;
        decision: boolean;
        plan: boolean;
        evidence: boolean;
        source: boolean;
    };
}

interface GraphFiltersProps {
    onFilterChange: (filters: GraphFilterState) => void;
}

export const GraphFilters = ({ onFilterChange }: GraphFiltersProps) => {
    const [filters, setFilters] = useState<GraphFilterState>({
        showPinnedOnly: false,
        showValidatedOnly: false,
        types: {
            idea: true,
            decision: true,
            plan: true,
            evidence: true,
            source: true,
        },
    });

    const [isOpen, setIsOpen] = useState(true);

    useEffect(() => {
        onFilterChange(filters);
    }, [filters, onFilterChange]);

    const toggleType = (type: keyof GraphFilterState['types']) => {
        setFilters((prev) => ({
            ...prev,
            types: { ...prev.types, [type]: !prev.types[type] },
        }));
    };

    return (
        <div className="absolute top-4 left-4 z-10 bg-white p-4 rounded-lg shadow-md border border-gray-100 w-64">
            <div className="flex items-center justify-between mb-3 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
                <h3 className="text-sm font-semibold text-gray-700 flex items-center">
                    <Filter className="w-4 h-4 mr-2" /> Graph Filters
                </h3>
                <span className="text-xs text-gray-400">{isOpen ? '▼' : '▶'}</span>
            </div>

            {isOpen && (
                <div className="space-y-3">
                    {/* Status Filters */}
                    <div className="space-y-2 pb-3 border-b border-gray-100">
                        <label className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                            <input
                                type="checkbox"
                                checked={filters.showPinnedOnly}
                                onChange={(e) => setFilters({ ...filters, showPinnedOnly: e.target.checked })}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span>PIN Nodes Only</span>
                        </label>
                        <label className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                            <input
                                type="checkbox"
                                checked={filters.showValidatedOnly}
                                onChange={(e) => setFilters({ ...filters, showValidatedOnly: e.target.checked })}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span>Validated Only</span>
                        </label>
                    </div>

                    {/* Type Filters */}
                    <div>
                        <p className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">Node Types</p>
                        <div className="grid grid-cols-2 gap-2">
                            {(Object.keys(filters.types) as Array<keyof GraphFilterState['types']>).map((type) => (
                                <label key={type} className="flex items-center space-x-2 text-xs text-gray-600 capitalize cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={filters.types[type]}
                                        onChange={() => toggleType(type)}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span>{type}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
