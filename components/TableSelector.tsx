import React from 'react';
import { formatNumber } from '../utils/helpers';

interface TableSelectorProps {
    tableCount: number;
    selectedTable: string;
    onSelectTable: (table: string) => void;
}

export const TableSelector: React.FC<TableSelectorProps> = ({ tableCount, selectedTable, onSelectTable }) => {
    if (tableCount <= 0) return null;

    const tables = Array.from({ length: tableCount }, (_, i) => i + 1);

    return (
        <div className="grid grid-cols-5 gap-2">
            {tables.map(tableNum => {
                const tableStr = tableNum.toString();
                const isSelected = selectedTable === tableStr;
                return (
                    <button
                        key={tableNum}
                        type="button"
                        onClick={() => onSelectTable(isSelected ? '' : tableStr)} // Allow unselecting
                        className={`p-3 text-lg font-bold rounded-md aspect-square flex items-center justify-center transition-all duration-200 border-2 ${
                            isSelected 
                            ? 'bg-primary-500 text-white border-primary-600 shadow-lg scale-105' 
                            : 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
                        }`}
                    >
                        {formatNumber(tableNum)}
                    </button>
                );
            })}
        </div>
    );
};