import React, { useState, useMemo, useEffect } from 'react';
import type { Supplier, PurchaseInvoice, SalesInvoice } from '../../types';
import { useUI } from '../../contexts/UIContext';
import { useInventory } from '../../contexts/InventoryContext';
import { useAuth } from '../../contexts/AuthContext';
import { PlusIcon, PencilIcon, TrashIcon, UsersIcon, ClipboardListIcon, CashRegisterIcon, SearchIcon, FilterIcon, ChevronUpIcon, ChevronDownIcon } from '../icons/Icons';
import { SupplierEditModal } from './SupplierEditModal';
import { PurchaseInvoiceModal } from './PurchaseInvoiceModal';
import { PurchaseInvoiceDetailsModal } from './PurchaseInvoiceDetailsModal';
import { SalesInvoiceModal } from './SalesInvoiceModal';
import { SalesInvoiceDetailsModal } from './SalesInvoiceDetailsModal';
import { formatDateTime, getStartAndEndDates } from '../../utils/helpers';
import { useUserManagement } from '../../contexts/UserManagementContext';

interface InventoryPageProps {
    pageType: 'suppliers' | 'purchaseInvoices' | 'salesInvoices';
}

export const InventoryPage: React.FC<InventoryPageProps> = ({ pageType }) => {
    const { t, language } = useUI();
    const { hasPermission } = useAuth();
    const { suppliers, purchaseInvoices, salesInvoices, deleteSupplier, deletePurchaseInvoice, deleteSalesInvoice, isInventoryLoading } = useInventory();
    const { users } = useUserManagement();

    const [editingSupplier, setEditingSupplier] = useState<Supplier | 'new' | null>(null);
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [editingInvoice, setEditingInvoice] = useState<PurchaseInvoice | null>(null);
    const [viewingInvoice, setViewingInvoice] = useState<PurchaseInvoice | null>(null);
    const [isSalesInvoiceModalOpen, setIsSalesInvoiceModalOpen] = useState(false);
    const [editingSalesInvoice, setEditingSalesInvoice] = useState<SalesInvoice | null>(null);
    const [viewingSalesInvoice, setViewingSalesInvoice] = useState<SalesInvoice | null>(null);
    
    // Common Filters
    const [isFilterExpanded, setIsFilterExpanded] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState('thisMonth');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    
    // Page-specific Filters
    const [supplierFilter, setSupplierFilter] = useState('all');
    const [salesCreatorFilter, setSalesCreatorFilter] = useState('all');

    const canManageSuppliers = hasPermission('manage_suppliers');
    const canManagePurchaseInvoices = hasPermission('add_purchase_invoice');
    const canManageSalesInvoices = hasPermission('manage_sales_invoices');

    const resetFilters = () => {
        setIsFilterExpanded(false);
        setSearchTerm('');
        setDateRange('thisMonth');
        setCustomStartDate('');
        setCustomEndDate('');
        setSupplierFilter('all');
        setSalesCreatorFilter('all');
    };

    useEffect(() => {
        resetFilters();
    }, [pageType]);

    // Effect to handle deep-linking from Treasury page
    useEffect(() => {
        const checkUrlForInvoice = () => {
            const hash = window.location.hash;
            const params = new URLSearchParams(hash.split('?')[1]);
            const purchaseId = params.get('view_purchase');
            const salesId = params.get('view_sales');

            // Ensure data is loaded before trying to find the invoice
            if (purchaseId && purchaseInvoices.length > 0) {
                const invoiceToView = purchaseInvoices.find(inv => inv.id === parseInt(purchaseId, 10));
                if (invoiceToView) {
                    setViewingInvoice(invoiceToView);
                    // Clean up URL to prevent modal from re-opening on every render
                    window.history.replaceState(null, '', `#/admin/${pageType}`);
                }
            } else if (salesId && salesInvoices.length > 0) {
                const invoiceToView = salesInvoices.find(inv => inv.id === parseInt(salesId, 10));
                if (invoiceToView) {
                    setViewingSalesInvoice(invoiceToView);
                    // Clean up URL
                    window.history.replaceState(null, '', `#/admin/${pageType}`);
                }
            }
        };

        // Run only after the initial data load is likely complete
        if (!isInventoryLoading) {
            checkUrlForInvoice();
        }
    }, [isInventoryLoading, purchaseInvoices, salesInvoices, setViewingInvoice, setViewingSalesInvoice, pageType]);
    
    const handleDeletePurchaseInvoice = (invoiceId: number) => {
        if (window.confirm(t.confirmDeleteInvoice)) {
            deletePurchaseInvoice(invoiceId);
        }
    };

    const handleDeleteSalesInvoice = (invoiceId: number) => {
        if (window.confirm(t.confirmDeleteSalesInvoice)) {
            deleteSalesInvoice(invoiceId);
        }
    };
    
    const salesCreators = useMemo(() => {
        const creatorIds = new Set(salesInvoices.map(inv => inv.created_by).filter(id => id != null));
        return users.filter(user => creatorIds.has(user.id));
    }, [salesInvoices, users]);

    const filteredSuppliers = useMemo(() => {
        if (!searchTerm) return suppliers;
        const lowercasedTerm = searchTerm.toLowerCase();
        return suppliers.filter(s =>
            s.name.toLowerCase().includes(lowercasedTerm) ||
            (s.contact_person && s.contact_person.toLowerCase().includes(lowercasedTerm)) ||
            (s.mobile && s.mobile.includes(lowercasedTerm))
        );
    }, [suppliers, searchTerm]);

    const filteredPurchaseInvoices = useMemo(() => {
        const { startDate, endDate } = getStartAndEndDates(dateRange, customStartDate, customEndDate);
        return purchaseInvoices.filter(inv => {
            const invDate = new Date(inv.invoice_date);
            if (invDate < startDate || invDate > endDate) return false;
            if (supplierFilter !== 'all' && String(inv.supplier_id) !== supplierFilter) return false;
            if (searchTerm) {
                const lower = searchTerm.toLowerCase();
                return String(inv.id).includes(lower) || (inv.invoice_number && inv.invoice_number.toLowerCase().includes(lower)) || inv.supplier_name.toLowerCase().includes(lower) || String(inv.total_amount).includes(lower);
            }
            return true;
        }).sort((a,b) => new Date(b.invoice_date).getTime() - new Date(a.invoice_date).getTime());
    }, [purchaseInvoices, dateRange, customStartDate, customEndDate, supplierFilter, searchTerm]);

    const filteredSalesInvoices = useMemo(() => {
        const { startDate, endDate } = getStartAndEndDates(dateRange, customStartDate, customEndDate);
        return salesInvoices.filter(inv => {
            const invDate = new Date(inv.invoice_date);
            if (invDate < startDate || invDate > endDate) return false;
            if (salesCreatorFilter !== 'all' && String(inv.created_by) !== salesCreatorFilter) return false;
            if (searchTerm) {
                const lower = searchTerm.toLowerCase();
                return inv.invoice_number.toLowerCase().includes(lower) || inv.customer_name.toLowerCase().includes(lower) || inv.customer_mobile.includes(lower) || String(inv.total_amount).includes(lower);
            }
            return true;
        }).sort((a,b) => new Date(b.invoice_date).getTime() - new Date(a.invoice_date).getTime());
    }, [salesInvoices, dateRange, customStartDate, customEndDate, salesCreatorFilter, searchTerm]);
    
    const dateFilterButtonClasses = (filter: string) => `px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${dateRange === filter ? 'bg-primary-600 text-white shadow' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600'}`;

    const renderSuppliers = () => (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
                <div className="relative w-full sm:w-auto sm:flex-grow max-w-sm">
                    <input
                        type="text"
                        placeholder={t.search + '...'}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full p-2 ps-10 rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-400"
                    />
                     <div className="absolute top-1/2 -translate-y-1/2 start-3 text-slate-400"><SearchIcon className="w-5 h-5" /></div>
                </div>
                {canManageSuppliers && (
                    <button onClick={() => setEditingSupplier('new')} className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 w-full sm:w-auto justify-center">
                        <PlusIcon className="w-5 h-5" />
                        {t.addNewSupplier}
                    </button>
                )}
            </div>
            {isInventoryLoading ? (
                <div className="text-center py-10 text-slate-500">{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</div>
            ) : filteredSuppliers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSuppliers.map(supplier => (
                        <div key={supplier.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 p-5 flex flex-col justify-between hover:shadow-lg transition-shadow">
                            <div>
                                <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">{supplier.name}</h4>
                                {supplier.contact_person && <p className="text-sm text-slate-600 dark:text-slate-300">{supplier.contact_person}</p>}
                                {supplier.mobile && <p className="text-sm text-slate-500 dark:text-slate-400 font-mono">{supplier.mobile}</p>}
                            </div>
                            {canManageSuppliers && (
                                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                                    <button onClick={() => setEditingSupplier(supplier)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200 flex items-center gap-1 text-sm font-semibold"><PencilIcon className="w-4 h-4" /> {t.edit}</button>
                                    <button onClick={() => deleteSupplier(supplier.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 flex items-center gap-1 text-sm font-semibold"><TrashIcon className="w-4 h-4" /> {t.delete}</button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 text-slate-500 bg-white dark:bg-slate-800 rounded-lg">{t.noSuppliersFound}</div>
            )}
        </div>
    );

    const renderPurchaseInvoices = () => {
        const activeFilterCount = (dateRange !== 'thisMonth' ? 1 : 0) + (supplierFilter !== 'all' ? 1 : 0) + (searchTerm ? 1 : 0);
        return (
        <div>
           <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 flex-grow">
                    <div className="p-4 flex justify-between items-center cursor-pointer select-none" onClick={() => setIsFilterExpanded(!isFilterExpanded)}>
                        <div className="flex items-center gap-2">
                            <FilterIcon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                            <h3 className="font-semibold text-slate-700 dark:text-slate-200">{t.filter}</h3>
                            {activeFilterCount > 0 && <span className="bg-primary-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">{activeFilterCount}</span>}
                        </div>
                        <button className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
                            {isFilterExpanded ? <ChevronUpIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" /> : <ChevronDownIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />}
                        </button>
                    </div>
                    <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isFilterExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-4">
                            <div className="relative"><input type="text" placeholder={t.search + '...'} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full p-2 ps-10 rounded-lg border-slate-300 dark:bg-slate-700 dark:border-slate-600" /><div className="absolute top-1/2 -translate-y-1/2 start-3 text-slate-400"><SearchIcon className="w-5 h-5" /></div></div>
                            <div className="flex flex-wrap items-center gap-2">{['today', 'yesterday', 'last7days', 'thisMonth'].map(dr => <button key={dr} onClick={() => setDateRange(dr)} className={dateFilterButtonClasses(dr)}>{t[dr as keyof typeof t]}</button>)}</div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                <div><label className="block text-sm font-medium mb-1">{t.startDate}</label><input type="date" value={customStartDate} onChange={e => {setCustomStartDate(e.target.value); setDateRange('custom');}} className="w-full p-2 rounded-lg border-slate-300 dark:bg-slate-700 dark:border-slate-600"/></div>
                                <div><label className="block text-sm font-medium mb-1">{t.endDate}</label><input type="date" value={customEndDate} onChange={e => {setCustomEndDate(e.target.value); setDateRange('custom');}} className="w-full p-2 rounded-lg border-slate-300 dark:bg-slate-700 dark:border-slate-600"/></div>
                                <div><label className="block text-sm font-medium mb-1">{t.supplier}</label><select value={supplierFilter} onChange={(e) => setSupplierFilter(e.target.value)} className="w-full p-2 rounded-lg border-slate-300 dark:bg-slate-700 dark:border-slate-600"><option value="all">{t.all}</option>{suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                            </div>
                        </div>
                    </div>
                </div>
               {canManagePurchaseInvoices && <button onClick={() => { setEditingInvoice(null); setIsInvoiceModalOpen(true); }} className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 shrink-0 self-start"><PlusIcon className="w-5 h-5" />{t.addNewPurchaseInvoice}</button>}
           </div>
           
           <div className="hidden md:block bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden border border-slate-200 dark:border-slate-700">
               <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-700/50">
                       <tr>
                           <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">ID</th>
                           <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.supplier}</th>
                           <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.invoiceDate}</th>
                           <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.totalAmount}</th>
                           <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.items}</th>
                       </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {isInventoryLoading ? (
                            <tr><td colSpan={5} className="text-center py-10 text-slate-500">{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</td></tr>
                        ) : filteredPurchaseInvoices.length > 0 ? filteredPurchaseInvoices.map((invoice) => (
                           <tr key={invoice.id} onClick={() => setViewingInvoice(invoice)} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer">
                               <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-500">{invoice.id}</td>
                               <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">{invoice.supplier_name}</td>
                               <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{formatDateTime(invoice.invoice_date)}</td>
                               <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-primary-700 dark:text-primary-400">{invoice.total_amount.toFixed(2)} {t.currency}</td>
                               <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{invoice.items.length}</td>
                           </tr>
                       )) : (
                           <tr>
                               <td colSpan={5} className="text-center py-10 text-slate-500">{t.noInvoicesFound}</td>
                           </tr>
                       )}
                   </tbody>
               </table>
           </div>
           <div className="md:hidden space-y-4">
                {isInventoryLoading ? (
                    <div className="text-center py-10 text-slate-500 bg-white dark:bg-slate-800 rounded-lg">{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</div>
                ) : filteredPurchaseInvoices.length > 0 ? filteredPurchaseInvoices.map(invoice => (
                   <div key={invoice.id} onClick={() => setViewingInvoice(invoice)} className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 space-y-3 border-l-4 border-primary-500">
                       <div className="flex justify-between items-start"><div><p className="font-bold text-slate-900 dark:text-slate-100">{invoice.supplier_name}</p><p className="text-sm text-slate-500 dark:text-slate-400">ID: {invoice.id}</p></div><div className="text-end"><p className="font-semibold text-lg text-primary-600 dark:text-primary-400">{invoice.total_amount.toFixed(2)}</p><p className="text-xs text-slate-400">{formatDateTime(invoice.invoice_date)}</p></div></div>
                        <div className="border-t border-slate-100 dark:border-slate-700 pt-3 flex justify-between items-center"><span className="text-sm font-medium text-slate-600 dark:text-slate-300">{invoice.items.length} {t.items}</span></div>
                   </div>
               )) : <div className="text-center py-10 text-slate-500 bg-white dark:bg-slate-800 rounded-lg">{t.noInvoicesFound}</div>}
           </div>
       </div>
   )};

    const renderSalesInvoices = () => {
        const activeFilterCount = (dateRange !== 'thisMonth' ? 1 : 0) + (salesCreatorFilter !== 'all' ? 1 : 0) + (searchTerm ? 1 : 0);
        return (
        <div>
           <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 flex-grow">
                    <div className="p-4 flex justify-between items-center cursor-pointer select-none" onClick={() => setIsFilterExpanded(!isFilterExpanded)}>
                        <div className="flex items-center gap-2"><FilterIcon className="w-5 h-5 text-slate-500" /><h3 className="font-semibold">{t.filter}</h3>{activeFilterCount > 0 && <span className="bg-primary-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">{activeFilterCount}</span>}</div>
                        <button className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">{isFilterExpanded ? <ChevronUpIcon className="w-6 h-6" /> : <ChevronDownIcon className="w-6 h-6" />}</button>
                    </div>
                     <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isFilterExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-4">
                            <div className="relative"><input type="text" placeholder={t.search + '...'} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full p-2 ps-10 rounded-lg border-slate-300 dark:bg-slate-700 dark:border-slate-600" /><div className="absolute top-1/2 -translate-y-1/2 start-3 text-slate-400"><SearchIcon className="w-5 h-5" /></div></div>
                            <div className="flex flex-wrap items-center gap-2">{['today', 'yesterday', 'last7days', 'thisMonth'].map(dr => <button key={dr} onClick={() => setDateRange(dr)} className={dateFilterButtonClasses(dr)}>{t[dr as keyof typeof t]}</button>)}</div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                <div><label className="block text-sm font-medium mb-1">{t.startDate}</label><input type="date" value={customStartDate} onChange={e => {setCustomStartDate(e.target.value); setDateRange('custom');}} className="w-full p-2 rounded-lg border-slate-300 dark:bg-slate-700 dark:border-slate-600"/></div>
                                <div><label className="block text-sm font-medium mb-1">{t.endDate}</label><input type="date" value={customEndDate} onChange={e => {setCustomEndDate(e.target.value); setDateRange('custom');}} className="w-full p-2 rounded-lg border-slate-300 dark:bg-slate-700 dark:border-slate-600"/></div>
                                <div><label className="block text-sm font-medium mb-1">{t.creator}</label><select value={salesCreatorFilter} onChange={(e) => setSalesCreatorFilter(e.target.value)} className="w-full p-2 rounded-lg border-slate-300 dark:bg-slate-700 dark:border-slate-600"><option value="all">{t.all}</option>{salesCreators.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                            </div>
                        </div>
                    </div>
                </div>
               {canManageSalesInvoices && <button onClick={() => { setEditingSalesInvoice(null); setIsSalesInvoiceModalOpen(true); }} className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 shrink-0 self-start"><PlusIcon className="w-5 h-5" />{t.addNewSalesInvoice}</button>}
           </div>
           
           <div className="hidden md:block bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden border border-slate-200 dark:border-slate-700">
               <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-700/50">
                       <tr>
                           <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">ID</th>
                           <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.customer}</th>
                           <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.invoiceDate}</th>
                           <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.totalAmount}</th>
                           <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.items}</th>
                       </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {isInventoryLoading ? (
                             <tr><td colSpan={5} className="text-center py-10 text-slate-500">{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</td></tr>
                        ) : filteredSalesInvoices.length > 0 ? filteredSalesInvoices.map((invoice) => (
                           <tr key={invoice.id} onClick={() => setViewingSalesInvoice(invoice)} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer">
                               <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-500">{invoice.invoice_number}</td>
                               <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">{invoice.customer_name}</td>
                               <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{formatDateTime(invoice.invoice_date)}</td>
                               <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-700 dark:text-green-400">{invoice.total_amount.toFixed(2)} {t.currency}</td>
                               <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{invoice.items.length}</td>
                           </tr>
                       )) : <tr><td colSpan={5} className="text-center py-10 text-slate-500">{t.noInvoicesFound}</td></tr>}
                   </tbody>
               </table>
           </div>
            <div className="md:hidden space-y-4">
                {isInventoryLoading ? (
                    <div className="text-center py-10 text-slate-500 bg-white dark:bg-slate-800 rounded-lg">{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</div>
                ) : filteredSalesInvoices.length > 0 ? filteredSalesInvoices.map(invoice => (
                   <div key={invoice.id} onClick={() => setViewingSalesInvoice(invoice)} className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 space-y-3 border-l-4 border-green-500">
                       <div className="flex justify-between items-start"><div><p className="font-bold text-slate-900 dark:text-slate-100">{invoice.customer_name}</p><p className="text-sm text-slate-500 dark:text-slate-400">ID: {invoice.invoice_number}</p></div><div className="text-end"><p className="font-semibold text-lg text-green-600 dark:text-green-400">{invoice.total_amount.toFixed(2)}</p><p className="text-xs text-slate-400">{formatDateTime(invoice.invoice_date)}</p></div></div>
                        <div className="border-t border-slate-100 dark:border-slate-700 pt-3 flex justify-between items-center"><span className="text-sm font-medium text-slate-600 dark:text-slate-300">{invoice.items.length} {t.items}</span></div>
                   </div>
               )) : <div className="text-center py-10 text-slate-500 bg-white dark:bg-slate-800 rounded-lg">{t.noInvoicesFound}</div>}
            </div>
       </div>
   )};

    return (
        <div className="animate-fade-in-up">
            {pageType === 'suppliers' && <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-slate-100">{t.suppliers}</h2>}
            {pageType === 'purchaseInvoices' && <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-slate-100">{t.purchaseInvoices}</h2>}
            {pageType === 'salesInvoices' && <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-slate-100">{t.salesInvoices}</h2>}

            {pageType === 'suppliers' && renderSuppliers()}
            {pageType === 'purchaseInvoices' && renderPurchaseInvoices()}
            {pageType === 'salesInvoices' && renderSalesInvoices()}
            
            {editingSupplier && <SupplierEditModal supplier={editingSupplier === 'new' ? null : editingSupplier} onClose={() => setEditingSupplier(null)} />}
            
            {isInvoiceModalOpen && <PurchaseInvoiceModal onClose={() => setIsInvoiceModalOpen(false)} />}
            {editingInvoice && <PurchaseInvoiceModal invoiceToEdit={editingInvoice} onClose={() => setEditingInvoice(null)} />}
            {viewingInvoice && <PurchaseInvoiceDetailsModal 
                invoice={viewingInvoice} 
                onClose={() => setViewingInvoice(null)}
                onEdit={setEditingInvoice}
                onDelete={handleDeletePurchaseInvoice}
                canManage={canManagePurchaseInvoices}
             />}
            
            {isSalesInvoiceModalOpen && <SalesInvoiceModal onClose={() => setIsSalesInvoiceModalOpen(false)} />}
            {editingSalesInvoice && <SalesInvoiceModal invoiceToEdit={editingSalesInvoice} onClose={() => setEditingSalesInvoice(null)} />}
            {viewingSalesInvoice && <SalesInvoiceDetailsModal 
                invoice={viewingSalesInvoice} 
                onClose={() => setViewingSalesInvoice(null)}
                onEdit={setEditingSalesInvoice}
                onDelete={handleDeleteSalesInvoice}
                canManage={canManageSalesInvoices}
            />}
        </div>
    );
};