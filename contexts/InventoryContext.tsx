import React, { createContext, useState, useCallback, useContext, useEffect } from 'react';
import type { Supplier, PurchaseInvoice, SalesInvoice } from '../types';
import { APP_CONFIG } from '../utils/config';
import { useUI } from './UIContext';
import { useAuth } from './AuthContext';
import { useData } from './DataContext';
import { useTreasury } from './TreasuryContext';

interface InventoryContextType {
    suppliers: Supplier[];
    purchaseInvoices: PurchaseInvoice[];
    salesInvoices: SalesInvoice[];
    isInventoryLoading: boolean;
    fetchInventoryData: () => Promise<void>;
    addSupplier: (supplierData: Omit<Supplier, 'id'>) => Promise<void>;
    updateSupplier: (supplierData: Supplier) => Promise<void>;
    deleteSupplier: (supplierId: number) => Promise<void>;
    addPurchaseInvoice: (invoiceData: Omit<PurchaseInvoice, 'id'|'invoice_number'|'supplier_name'|'invoice_date'> & { treasury_id: number }) => Promise<void>;
    updatePurchaseInvoice: (invoiceData: PurchaseInvoice) => Promise<void>;
    deletePurchaseInvoice: (invoiceId: number) => Promise<void>;
    addSalesInvoice: (invoiceData: Omit<SalesInvoice, 'id' | 'invoice_number' | 'created_by_name' | 'invoice_date' | 'created_by'> & { treasury_id: number }) => Promise<void>;
    updateSalesInvoice: (invoiceData: SalesInvoice) => Promise<void>;
    deleteSalesInvoice: (invoiceId: number) => Promise<void>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { setIsProcessing, showToast, t } = useUI();
    const { currentUser, hasPermission } = useAuth();
    const { fetchAllData } = useData();
    const { fetchTreasuryData } = useTreasury();

    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [purchaseInvoices, setPurchaseInvoices] = useState<PurchaseInvoice[]>([]);
    const [salesInvoices, setSalesInvoices] = useState<SalesInvoice[]>([]);
    const [isInventoryLoading, setIsInventoryLoading] = useState(true);
    
    const fetchInventoryData = useCallback(async () => {
        if (!currentUser || !hasPermission('view_inventory_page')) {
            setSuppliers([]);
            setPurchaseInvoices([]);
            setSalesInvoices([]);
            setIsInventoryLoading(false);
            return;
        }
        setIsInventoryLoading(true);
        try {
            const [suppliersRes, pInvoicesRes, sInvoicesRes] = await Promise.all([
                fetch(`${APP_CONFIG.API_BASE_URL}get_suppliers.php`),
                fetch(`${APP_CONFIG.API_BASE_URL}get_purchase_invoices.php`),
                fetch(`${APP_CONFIG.API_BASE_URL}get_sales_invoices.php`)
            ]);
            if (suppliersRes.ok) setSuppliers(await suppliersRes.json() || []);
            if (pInvoicesRes.ok) setPurchaseInvoices(await pInvoicesRes.json() || []);
            if (sInvoicesRes.ok) setSalesInvoices(await sInvoicesRes.json() || []);
        } catch (e) {
            console.error("Failed to load inventory data:", e);
            showToast("Failed to load inventory data.");
        } finally {
            setIsInventoryLoading(false);
        }
    }, [currentUser, hasPermission, showToast]);
    
    useEffect(() => {
        fetchInventoryData();
    }, [fetchInventoryData]);

    const addSupplier = useCallback(async (supplierData: Omit<Supplier, 'id'>) => {
        if (!hasPermission('manage_suppliers')) { showToast(t.permissionDenied); return; }
        setIsProcessing(true);
        try {
            const response = await fetch(`${APP_CONFIG.API_BASE_URL}add_supplier.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(supplierData) });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.error || t.supplierAddFailed);
            setSuppliers(prev => [...prev, result.supplier].sort((a,b) => a.name.localeCompare(b.name)));
            showToast(t.supplierAddedSuccess);
        } catch (error: any) { showToast(error.message || t.supplierAddFailed); }
        finally { setIsProcessing(false); }
    }, [hasPermission, showToast, t, setIsProcessing]);

    const updateSupplier = useCallback(async (supplierData: Supplier) => {
        if (!hasPermission('manage_suppliers')) { showToast(t.permissionDenied); return; }
        setIsProcessing(true);
        try {
            const response = await fetch(`${APP_CONFIG.API_BASE_URL}update_supplier.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(supplierData) });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.error || t.supplierUpdateFailed);
            setSuppliers(prev => prev.map(s => s.id === supplierData.id ? supplierData : s));
            showToast(t.supplierUpdatedSuccess);
        } catch (error: any) {
            showToast(error.message || t.supplierUpdateFailed);
        } finally { setIsProcessing(false); }
    }, [hasPermission, showToast, t, setIsProcessing]);

    const deleteSupplier = useCallback(async (supplierId: number) => {
        if (!hasPermission('manage_suppliers') || !window.confirm(t.confirmDeleteSupplier)) return;
        setIsProcessing(true);
        try {
            const response = await fetch(`${APP_CONFIG.API_BASE_URL}delete_supplier.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: supplierId }) });
            const result = await response.json();
            if (!response.ok || !result.success) {
                if (response.status === 409) throw new Error(t.deleteSupplierError);
                throw new Error(result.error || t.supplierDeleteFailed);
            }
            setSuppliers(prev => prev.filter(s => s.id !== supplierId));
            showToast(t.supplierDeletedSuccess);
        } catch (error: any) { showToast(error.message || t.supplierDeleteFailed); }
        finally { setIsProcessing(false); }
    }, [hasPermission, showToast, t, setIsProcessing]);
    
    const addPurchaseInvoice = useCallback(async (invoiceData: Omit<PurchaseInvoice, 'id' | 'invoice_number' | 'supplier_name' | 'invoice_date'> & { treasury_id: number }) => {
        if (!hasPermission('add_purchase_invoice')) { showToast(t.permissionDenied); return; }
        setIsProcessing(true);
        try {
            const payload = { ...invoiceData, created_by: currentUser?.id };
            const response = await fetch(`${APP_CONFIG.API_BASE_URL}add_purchase_invoice.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.error || t.invoiceAddFailed);
            showToast(t.invoiceAddedSuccess);
            await Promise.all([fetchInventoryData(), fetchAllData(), fetchTreasuryData()]);
        } catch (error: any) { 
// FIX: Removed second argument from showToast call.
showToast(error.message || t.invoiceAddFailed); }
        finally { setIsProcessing(false); }
    }, [hasPermission, showToast, t, setIsProcessing, currentUser, fetchAllData, fetchInventoryData, fetchTreasuryData]);

    const updatePurchaseInvoice = useCallback(async (invoiceData: PurchaseInvoice) => {
        if (!hasPermission('add_purchase_invoice')) { showToast(t.permissionDenied); return; }
        setIsProcessing(true);
        try {
            const response = await fetch(`${APP_CONFIG.API_BASE_URL}update_purchase_invoice.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(invoiceData) });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.error || t.invoiceUpdateFailed);
            showToast(t.invoiceUpdatedSuccess);
            await Promise.all([fetchInventoryData(), fetchAllData(), fetchTreasuryData()]);
        } catch (error: any) { 
// FIX: Removed second argument from showToast call.
showToast(error.message || t.invoiceUpdateFailed); }
        finally { setIsProcessing(false); }
    }, [hasPermission, showToast, t, setIsProcessing, fetchInventoryData, fetchAllData, fetchTreasuryData]);

    const deletePurchaseInvoice = useCallback(async (invoiceId: number) => {
        if (!hasPermission('add_purchase_invoice') || !window.confirm(t.confirmDeleteInvoice)) return;
        setIsProcessing(true);
        try {
            const response = await fetch(`${APP_CONFIG.API_BASE_URL}delete_purchase_invoice.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: invoiceId }) });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.error || t.invoiceDeleteFailed);
            showToast(t.invoiceDeletedSuccess);
            await Promise.all([fetchInventoryData(), fetchAllData(), fetchTreasuryData()]);
        } catch (error: any) { 
// FIX: Removed second argument from showToast call.
showToast(error.message || t.invoiceDeleteFailed); }
        finally { setIsProcessing(false); }
    }, [hasPermission, showToast, t, setIsProcessing, fetchInventoryData, fetchAllData, fetchTreasuryData]);
    
    const addSalesInvoice = useCallback(async (invoiceData: Omit<SalesInvoice, 'id' | 'invoice_number' | 'invoice_date' | 'created_by' | 'created_by_name'> & { treasury_id: number }) => {
        if (!hasPermission('manage_sales_invoices')) { showToast(t.permissionDenied); return; }
        setIsProcessing(true);
        try {
            const payload = { ...invoiceData, created_by: currentUser?.id };
            const response = await fetch(`${APP_CONFIG.API_BASE_URL}add_sales_invoice.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.error || t.salesInvoiceAddFailed);
            showToast(t.salesInvoiceAddedSuccess);
            await Promise.all([fetchInventoryData(), fetchAllData(), fetchTreasuryData()]);
        } catch (error: any) { 
// FIX: Removed second argument from showToast call.
showToast(error.message || t.salesInvoiceAddFailed); }
        finally { setIsProcessing(false); }
    }, [hasPermission, showToast, t, setIsProcessing, currentUser, fetchAllData, fetchInventoryData, fetchTreasuryData]);

    const updateSalesInvoice = useCallback(async (invoiceData: SalesInvoice) => {
        if (!hasPermission('manage_sales_invoices')) { showToast(t.permissionDenied); return; }
        setIsProcessing(true);
        try {
            const response = await fetch(`${APP_CONFIG.API_BASE_URL}update_sales_invoice.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(invoiceData) });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.error || t.salesInvoiceUpdateFailed);
            showToast(t.salesInvoiceUpdatedSuccess);
            await Promise.all([fetchInventoryData(), fetchAllData(), fetchTreasuryData()]);
        } catch (error: any) { 
// FIX: Removed second argument from showToast call.
showToast(error.message || t.salesInvoiceUpdateFailed); }
        finally { setIsProcessing(false); }
    }, [hasPermission, showToast, t, setIsProcessing, fetchInventoryData, fetchAllData, fetchTreasuryData]);

    const deleteSalesInvoice = useCallback(async (invoiceId: number) => {
        if (!hasPermission('manage_sales_invoices') || !window.confirm(t.confirmDeleteSalesInvoice)) return;
        setIsProcessing(true);
        try {
            const response = await fetch(`${APP_CONFIG.API_BASE_URL}delete_sales_invoice.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: invoiceId }) });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.error || t.invoiceDeleteFailed);
            showToast(t.invoiceDeletedSuccess);
            await Promise.all([fetchInventoryData(), fetchAllData(), fetchTreasuryData()]);
        } catch (error: any) { 
// FIX: Removed second argument from showToast call.
showToast(error.message || t.invoiceDeleteFailed); }
        finally { setIsProcessing(false); }
    }, [hasPermission, showToast, t, setIsProcessing, fetchInventoryData, fetchAllData, fetchTreasuryData]);
    
    const value: InventoryContextType = { suppliers, purchaseInvoices, salesInvoices, isInventoryLoading, fetchInventoryData, addSupplier, updateSupplier, deleteSupplier, addPurchaseInvoice, updatePurchaseInvoice, deletePurchaseInvoice, addSalesInvoice, updateSalesInvoice, deleteSalesInvoice };
    
    return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
};

export const useInventory = () => {
    const context = useContext(InventoryContext);
    if (context === undefined) throw new Error('useInventory must be used within an InventoryProvider');
    return context;
};
