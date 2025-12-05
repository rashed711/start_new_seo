
import React, { useState, useMemo } from 'react';
import { useUI } from '../../../contexts/UIContext';
import { SearchIcon, ChevronUpIcon, ChevronDownIcon } from '../../icons/Icons';
import { formatNumber } from '../../../utils/helpers';

interface Column {
    Header: string;
    accessor: string;
    Cell?: (row: any) => React.ReactNode;
}

interface DataTableProps {
    columns: Column[];
    data: any[];
    onRowClick?: (row: any) => void;
}

export const DataTable: React.FC<DataTableProps> = ({ columns, data, onRowClick }) => {
    const { t } = useUI();
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const filteredData = useMemo(() => {
        if (!searchTerm) return data;
        const lowercasedTerm = searchTerm.toLowerCase();
        
        return data.filter(row => {
            // Search logic: Check ALL values in the row, not just displayed columns.
            // This allows searching by fields like 'mobile' or 'notes' even if they aren't visible columns.
            return Object.values(row).some(value => {
                if (value == null) return false;
                
                // If it's an object (like customer details), search its string representation
                if (typeof value === 'object') {
                    return JSON.stringify(value).toLowerCase().includes(lowercasedTerm);
                }
                
                // Otherwise search the string value
                return String(value).toLowerCase().includes(lowercasedTerm);
            });
        });
    }, [data, searchTerm]);

    const sortedData = useMemo(() => {
        let sortableData = [...filteredData];
        if (sortConfig !== null) {
            sortableData.sort((a, b) => {
                // Handle potentially missing values safely
                const aValue = a[sortConfig.key] ?? '';
                const bValue = b[sortConfig.key] ?? '';

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortableData;
    }, [filteredData, sortConfig]);
    
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return sortedData.slice(startIndex, startIndex + itemsPerPage);
    }, [sortedData, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(sortedData.length / itemsPerPage);

    const requestSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const renderSortIcon = (key: string) => {
        if (!sortConfig || sortConfig.key !== key) {
            return <ChevronUpIcon className="w-4 h-4 text-slate-400 opacity-30" />;
        }
        if (sortConfig.direction === 'asc') {
            return <ChevronUpIcon className="w-4 h-4 text-slate-600 dark:text-slate-200" />;
        }
        return <ChevronDownIcon className="w-4 h-4 text-slate-600 dark:text-slate-200" />;
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200/80 dark:border-slate-700/80">
            <div className="relative mb-4">
                <input
                    type="text"
                    placeholder={t.searchTable}
                    value={searchTerm}
                    onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} // Reset to page 1 on search
                    className="w-full p-2 ps-10 rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-400"
                />
                <div className="absolute top-1/2 -translate-y-1/2 start-3 text-slate-400"><SearchIcon className="w-5 h-5" /></div>
            </div>
            
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-700/50">
                        <tr>
                            {columns.map(col => (
                                <th
                                    key={col.accessor}
                                    onClick={() => requestSort(col.accessor)}
                                    className="px-6 py-3 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider cursor-pointer select-none"
                                >
                                    <div className="flex items-center gap-2">{col.Header} {renderSortIcon(col.accessor)}</div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {paginatedData.map((row, index) => (
                            <tr 
                                key={index} 
                                className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 ${onRowClick ? 'cursor-pointer' : ''}`}
                                onClick={() => onRowClick && onRowClick(row)}
                            >
                                {columns.map(col => (
                                    <td key={col.accessor} className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-200">
                                        {col.Cell ? col.Cell(row) : row[col.accessor]}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {paginatedData.length === 0 && (
                <div className="text-center py-10 text-slate-500">{t.noDataForPeriod}</div>
            )}

            {totalPages > 1 && (
                 <div className="py-3 flex items-center justify-between border-t border-slate-200 dark:border-slate-700">
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                        {t.showing} {formatNumber(paginatedData.length)} {t.of} {formatNumber(sortedData.length)} {t.results}
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 text-sm font-medium rounded-md bg-slate-200 dark:bg-slate-700 disabled:opacity-50">
                            {t.previous}
                        </button>
                        <span className="text-sm font-semibold">{currentPage} / {totalPages}</span>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 text-sm font-medium rounded-md bg-slate-200 dark:bg-slate-700 disabled:opacity-50">
                            {t.next}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
