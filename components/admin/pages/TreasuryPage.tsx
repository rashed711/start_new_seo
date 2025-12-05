import React, { useState, useEffect, useMemo } from 'react';
import { useTreasury } from '../../../contexts/TreasuryContext';
import { useUI } from '../../../contexts/UIContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useUserManagement } from '../../../contexts/UserManagementContext';
import { formatNumber, formatDateTime, getStartAndEndDates } from '../../../utils/helpers';
import { PlusIcon, BankIcon, PencilIcon, TrashIcon, FilterIcon, ChevronUpIcon, ChevronDownIcon, SearchIcon } from '../../icons/Icons';
import { ManualTransactionModal } from '../ManualTransactionModal';
import { TreasuryEditModal } from '../TreasuryEditModal';
import type { TreasuryTransaction } from '../../../types';

export const TreasuryPage: React.FC = () => {
    const { t } = useUI();
    const { hasPermission } = useAuth();
    const { users } = useUserManagement();
    const { treasuries, transactions, isTreasuryLoading, fetchTreasuryData, deleteTreasury } = useTreasury();
    
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [isTreasuryModalOpen, setIsTreasuryModalOpen] = useState(false);
    const [editingTreasury, setEditingTreasury] = useState<any | null>(null);

    // Filter State
    const [isFilterExpanded, setIsFilterExpanded] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState('thisMonth');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [creatorFilter, setCreatorFilter] = useState('all');

    useEffect(() => {
        fetchTreasuryData();
    }, [fetchTreasuryData]);
    
    const canAddTransaction = hasPermission('add_manual_transaction');
    const canManageTreasuries = hasPermission('manage_treasuries');

    const creators = useMemo(() => {
        const creatorIds = new Set(transactions.map(tx => tx.created_by).filter(id => id != null));
        return users.filter(user => creatorIds.has(user.id));
    }, [transactions, users]);

    const filteredTransactions = useMemo(() => {
        const { startDate, endDate } = getStartAndEndDates(dateRange, customStartDate, customEndDate);

        return transactions.filter(tx => {
            const txDate = new Date(tx.created_at);
            if (txDate < startDate || txDate > endDate) return false;
            if (typeFilter !== 'all' && tx.transaction_type !== typeFilter) return false;
            if (creatorFilter !== 'all' && String(tx.created_by) !== creatorFilter) return false;

            if (searchTerm) {
                const lower = searchTerm.toLowerCase();
                return (
                    tx.description?.toLowerCase().includes(lower) ||
                    String(tx.amount).includes(lower) ||
                    tx.created_by_name?.toLowerCase().includes(lower) ||
                    (tx.related_invoice_id ? String(tx.related_invoice_id).includes(lower) : false)
                );
            }
            return true;
        });
    }, [transactions, dateRange, customStartDate, customEndDate, typeFilter, creatorFilter, searchTerm]);

    const handleEditTreasury = (treasury: any) => {
        setEditingTreasury(treasury);
        setIsTreasuryModalOpen(true);
    };

    const handleAddNewTreasury = () => {
        setEditingTreasury(null);
        setIsTreasuryModalOpen(true);
    };

    const getTransactionTypeTranslation = (type: TreasuryTransaction['transaction_type']) => {
        const key = type as 'deposit' | 'withdrawal' | 'sales' | 'purchase';
        return t[key] || type;
    };
    
    const dateFilterButtonClasses = (filter: string) => `px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${dateRange === filter ? 'bg-primary-600 text-white shadow' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600'}`;
    const activeFilterCount = (dateRange !== 'thisMonth' ? 1 : 0) + (typeFilter !== 'all' ? 1 : 0) + (creatorFilter !== 'all' ? 1 : 0) + (searchTerm ? 1 : 0);

    return (
        <div className="animate-fade-in-up">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t.treasury}</h2>
                <div className="flex items-center gap-2 flex-wrap">
                    {canManageTreasuries && <button onClick={handleAddNewTreasury} className="bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"><PlusIcon className="w-5 h-5" />{t.addNewTreasury}</button>}
                    {canAddTransaction && <button onClick={() => setIsTransactionModalOpen(true)} className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"><PlusIcon className="w-5 h-5" />{t.addNewTransaction}</button>}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {treasuries.map(treasury => (
                    <div key={treasury.id} className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 relative group">
                        <div className="flex items-center gap-3"><div className="p-3 bg-primary-100 dark:bg-primary-900/50 rounded-full"><BankIcon className="w-6 h-6 text-primary-600 dark:text-primary-400"/></div><div><h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400">{treasury.name}</h3><p className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{formatNumber(treasury.current_balance)} <span className="text-base font-semibold">{t.currency}</span></p></div></div>
                        {canManageTreasuries && <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => handleEditTreasury(treasury)} className="p-2 text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-full"><PencilIcon className="w-5 h-5" /></button><button onClick={() => deleteTreasury(treasury.id)} className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full"><TrashIcon className="w-5 h-5" /></button></div>}
                    </div>
                ))}
            </div>

            <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100">{t.treasuryTransactions}</h3>
            
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg mb-6 border border-slate-200 dark:border-slate-700">
                <div className="p-4 flex justify-between items-center cursor-pointer select-none" onClick={() => setIsFilterExpanded(!isFilterExpanded)}>
                    <div className="flex items-center gap-2"><FilterIcon className="w-5 h-5 text-slate-500" /><h3 className="font-semibold">{t.filter}</h3>{activeFilterCount > 0 && <span className="bg-primary-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">{activeFilterCount}</span>}</div>
                    <button className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">{isFilterExpanded ? <ChevronUpIcon className="w-6 h-6" /> : <ChevronDownIcon className="w-6 h-6" />}</button>
                </div>
                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isFilterExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-4">
                        <div className="relative"><input type="text" placeholder={t.search + '...'} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full p-2 ps-10 rounded-lg border-slate-300 dark:bg-slate-700 dark:border-slate-600" /><div className="absolute top-1/2 -translate-y-1/2 start-3 text-slate-400"><SearchIcon className="w-5 h-5" /></div></div>
                        <div className="flex flex-wrap items-center gap-2">{['today', 'yesterday', 'last7days', 'thisMonth'].map(dr => <button key={dr} onClick={() => setDateRange(dr)} className={dateFilterButtonClasses(dr)}>{t[dr as keyof typeof t]}</button>)}</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                            <div><label className="block text-sm font-medium mb-1">{t.startDate}</label><input type="date" value={customStartDate} onChange={e => {setCustomStartDate(e.target.value); setDateRange('custom');}} className="w-full p-2 rounded-lg border-slate-300 dark:bg-slate-700 dark:border-slate-600"/></div>
                            <div><label className="block text-sm font-medium mb-1">{t.endDate}</label><input type="date" value={customEndDate} onChange={e => {setCustomEndDate(e.target.value); setDateRange('custom');}} className="w-full p-2 rounded-lg border-slate-300 dark:bg-slate-700 dark:border-slate-600"/></div>
                            <div><label className="block text-sm font-medium mb-1">{t.transactionType}</label><select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="w-full p-2 rounded-lg border-slate-300 dark:bg-slate-700 dark:border-slate-600"><option value="all">{t.allTypes}</option><option value="deposit">{t.deposit}</option><option value="withdrawal">{t.withdrawal}</option><option value="sales">{t.sales}</option><option value="purchase">{t.purchase}</option></select></div>
                            <div><label className="block text-sm font-medium mb-1">{t.creator}</label><select value={creatorFilter} onChange={e => setCreatorFilter(e.target.value)} className="w-full p-2 rounded-lg border-slate-300 dark:bg-slate-700 dark:border-slate-600"><option value="all">{t.all}</option>{creators.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="hidden md:block bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden border border-slate-200 dark:border-slate-700">
                <div className="overflow-x-auto"><table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700"><thead className="bg-slate-50 dark:bg-slate-700/50"><tr><th className="px-4 py-3 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">{t.date}</th><th className="px-4 py-3 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">{t.transactionType}</th><th className="px-4 py-3 text-end text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">{t.amount}</th><th className="px-4 py-3 text-end text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">{t.balanceAfter}</th><th className="px-4 py-3 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">{t.details}</th><th className="px-4 py-3 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">{t.createdBy}</th></tr></thead><tbody className="divide-y divide-slate-200 dark:divide-slate-700">{isTreasuryLoading ? (<tr><td colSpan={6} className="text-center py-10 text-slate-500">{t.loading}</td></tr>) : filteredTransactions.length > 0 ? filteredTransactions.map(tx => (<tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50"><td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{formatDateTime(tx.created_at)}</td><td className="px-4 py-3 text-sm font-medium"><span className={`px-2 py-1 text-xs rounded-full ${tx.transaction_type === 'deposit' || tx.transaction_type === 'sales' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>{getTransactionTypeTranslation(tx.transaction_type)}</span></td><td className={`px-4 py-3 text-sm text-end font-semibold ${tx.transaction_type === 'deposit' || tx.transaction_type === 'sales' ? 'text-green-600' : 'text-red-600'}`}>{tx.transaction_type === 'deposit' || tx.transaction_type === 'sales' ? '+' : '-'} {formatNumber(tx.amount)}</td><td className="px-4 py-3 text-sm text-end font-mono text-slate-600 dark:text-slate-300">{formatNumber(tx.balance_after)}</td><td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{tx.related_invoice_id ? (<a href={`#/admin/${tx.invoice_type === 'purchase' ? 'purchaseInvoices' : 'salesInvoices'}?view_${tx.invoice_type}=${tx.related_invoice_id}`} className="text-blue-600 hover:underline">{t.invoiceLink} #{tx.related_invoice_id}</a>) : tx.description || <span className="text-slate-400">{t.manualEntry}</span>}</td><td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{tx.created_by_name || 'System'}</td></tr>)) : (<tr><td colSpan={6} className="text-center py-10 text-slate-500">{t.noTransactionsFound}</td></tr>)}</tbody></table></div>
            </div>
            <div className="md:hidden space-y-4">{isTreasuryLoading ? (<div className="text-center py-10 text-slate-500 bg-white dark:bg-slate-800 rounded-lg">{t.loading}</div>) : filteredTransactions.length > 0 ? filteredTransactions.map(tx => (<div key={tx.id} className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 space-y-3"><div className="flex justify-between items-start"><div><span className={`px-2 py-1 text-xs rounded-full font-medium ${tx.transaction_type === 'deposit' || tx.transaction_type === 'sales' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>{getTransactionTypeTranslation(tx.transaction_type)}</span><p className="text-xs text-slate-500 mt-2">{formatDateTime(tx.created_at)}</p></div><div className="text-end"><p className={`text-lg font-bold ${tx.transaction_type === 'deposit' || tx.transaction_type === 'sales' ? 'text-green-600' : 'text-red-600'}`}>{tx.transaction_type === 'deposit' || tx.transaction_type === 'sales' ? '+' : '-'} {formatNumber(tx.amount)}</p><p className="text-xs text-slate-500">{t.balanceAfter}: {formatNumber(tx.balance_after)}</p></div></div><div className="border-t border-slate-100 dark:border-slate-700 pt-3 text-sm text-slate-600 dark:text-slate-300"><p><strong>{t.details}:</strong> {tx.related_invoice_id ? <a href={`#/admin/${tx.invoice_type === 'purchase' ? 'purchaseInvoices' : 'salesInvoices'}?view_${tx.invoice_type}=${tx.related_invoice_id}`} className="text-blue-600 hover:underline">{t.invoiceLink} #{tx.related_invoice_id}</a> : tx.description || <span className="text-slate-400">{t.manualEntry}</span>}</p><p><strong>{t.createdBy}:</strong> {tx.created_by_name || 'System'}</p></div></div>)) : (<div className="text-center py-10 text-slate-500 bg-white dark:bg-slate-800 rounded-lg">{t.noTransactionsFound}</div>)}</div>
            {isTransactionModalOpen && canAddTransaction && <ManualTransactionModal onClose={() => setIsTransactionModalOpen(false)} />}
            {isTreasuryModalOpen && canManageTreasuries && <TreasuryEditModal treasuryToEdit={editingTreasury} onClose={() => setIsTreasuryModalOpen(false)} />}
        </div>
    );
};