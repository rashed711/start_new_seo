
import React, { useState, useMemo, useEffect } from 'react';
import type { SalesInvoiceItem, User, Product, SalesInvoice, Promotion } from '../../types';
import { Modal } from '../Modal';
import { useUI } from '../../contexts/UIContext';
import { useInventory } from '../../contexts/InventoryContext';
import { useUserManagement } from '../../contexts/UserManagementContext';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { useTreasury } from '../../contexts/TreasuryContext';
import { PlusIcon, TrashIcon } from '../icons/Icons';
import { SearchableSelect } from './SearchableSelect';
import { getActivePromotionForProduct } from '../../utils/helpers';

interface SalesInvoiceModalProps {
    invoiceToEdit?: SalesInvoice | null;
    onClose: () => void;
}

type CustomerType = 'guest' | 'registered';

type FormSalesItem = Partial<Omit<SalesInvoiceItem, 'quantity' | 'price'>> & {
    quantity: string | number;
    price: string | number;
};

export const SalesInvoiceModal: React.FC<SalesInvoiceModalProps> = ({ invoiceToEdit, onClose }) => {
    const { t, language } = useUI();
    const { users } = useUserManagement();
    const { roles } = useAuth();
    const { addSalesInvoice, updateSalesInvoice } = useInventory();
    const { products, promotions } = useData();
    const { treasuries, fetchTreasuryData } = useTreasury();
    
    const [customerType, setCustomerType] = useState<CustomerType>('guest');
    const [customerId, setCustomerId] = useState<number | ''>('');
    const [customerName, setCustomerName] = useState('');
    const [customerMobile, setCustomerMobile] = useState('');
    const [treasuryId, setTreasuryId] = useState<number | ''>('');
    const [items, setItems] = useState<FormSalesItem[]>([{ product_id: undefined, quantity: 1, price: 0, original_price: 0, discount_percent: 0 }]);
    const [notes, setNotes] = useState('');

    useEffect(() => {
        fetchTreasuryData();
    }, []);

    useEffect(() => {
        if (invoiceToEdit) {
            setCustomerType(invoiceToEdit.customer_id ? 'registered' : 'guest');
            setCustomerId(invoiceToEdit.customer_id || '');
            setCustomerName(invoiceToEdit.customer_name);
            setCustomerMobile(invoiceToEdit.customer_mobile);
            setNotes(invoiceToEdit.notes || '');
            if (treasuries.length > 0) {
                 setTreasuryId(treasuries[0].id); // Placeholder for edited invoices
            }
            setItems(invoiceToEdit.items.map(item => ({
                product_id: item.product_id,
                quantity: item.quantity,
                price: item.price,
                subtotal: item.subtotal,
                original_price: item.original_price,
                discount_percent: item.discount_percent
            })));
        } else {
            setCustomerType('guest');
            setCustomerId('');
            setCustomerName('');
            setCustomerMobile('');
            setItems([{ product_id: undefined, quantity: 1, price: 0, original_price: 0, discount_percent: 0 }]);
            setNotes('');
            if (treasuries.length > 0 && !treasuryId) {
                setTreasuryId(treasuries[0].id);
            }
        }
    }, [invoiceToEdit, treasuries, treasuryId]);

    const customerUsers = useMemo(() => {
        const customerRole = roles.find(r => r.name.en.toLowerCase() === 'customer');
        return users.filter(u => u.role === customerRole?.key);
    }, [users, roles]);

    const customerOptions = useMemo(() => {
        return customerUsers.map(c => ({
            value: c.id,
            label: `${c.name} (${c.mobile})`
        }));
    }, [customerUsers]);

    const productOptions = useMemo(() => {
        return products.map(p => ({
            value: p.id,
            label: `${p.name[language]} (${t.stockQuantity}: ${p.stock_quantity})`
        })).sort((a, b) => a.label.localeCompare(b.label));
    }, [products, language, t.stockQuantity]);

    const totalAmount = useMemo(() => {
        return items.reduce((total, item) => {
            const quantity = parseFloat(String(item.quantity)) || 0;
            const price = parseFloat(String(item.price)) || 0;
            const subtotal = quantity * price;
            return total + subtotal;
        }, 0);
    }, [items]);

    const handleCustomerTypeChange = (type: CustomerType) => {
        setCustomerType(type);
        setCustomerId('');
        setCustomerName('');
        setCustomerMobile('');
    };

    const handleCustomerSelect = (id: string | number) => {
        const selectedId = typeof id === 'string' ? parseInt(id, 10) : id;
        setCustomerId(selectedId);
        const customer = customerUsers.find(c => c.id === selectedId);
        if (customer) {
            setCustomerName(customer.name);
            setCustomerMobile(customer.mobile);
        }
    };

    const handleAddItem = () => {
        setItems(prev => [...prev, { product_id: undefined, quantity: 1, price: 0, original_price: 0, discount_percent: 0 }]);
    };
    
    const handleRemoveItem = (index: number) => {
        setItems(prev => prev.filter((_, i) => i !== index));
    };

    const handleItemChange = (index: number, field: 'product_id' | 'quantity' | 'price', value: any) => {
        setItems(prev => {
            const newItems = [...prev];
            const currentItem = { ...newItems[index] };
    
            if (field === 'product_id') {
                const productId = typeof value === 'string' ? parseInt(value, 10) : value;
                if (!productId) {
                    currentItem.product_id = undefined;
                    currentItem.price = 0;
                    currentItem.original_price = 0;
                    currentItem.discount_percent = 0;
                    newItems[index] = currentItem;
                    return newItems;
                }
    
                const product = products.find(p => p.id === productId);
                if (!product) return newItems;

                const promotion = getActivePromotionForProduct(product.id, promotions);
                let salePrice = product.price;
                let discountPercent = 0;
                if (promotion) {
                    salePrice = product.price * (1 - promotion.discountPercent / 100);
                    discountPercent = promotion.discountPercent;
                }
                
                currentItem.product_id = productId;
                currentItem.price = salePrice;
                currentItem.original_price = product.price;
                currentItem.discount_percent = discountPercent;
                
                const quantity = parseFloat(String(currentItem.quantity)) || 1;
                currentItem.quantity = Math.min(quantity, product?.stock_quantity || 0);

                currentItem.subtotal = (parseFloat(String(currentItem.quantity)) || 0) * salePrice;
                newItems[index] = currentItem;
                return newItems;
            } else if (field === 'quantity') {
                 const productId = currentItem.product_id;
                 const product = products.find(p => p.id === productId);
                 const stock = product?.stock_quantity || Infinity;

                if (value === '') {
                    currentItem.quantity = '';
                } else {
                    const newQuantity = parseFloat(value);
                    if (!isNaN(newQuantity)) {
                        currentItem.quantity = Math.min(Math.max(0, newQuantity), stock);
                    }
                }
            } else if (field === 'price') {
                currentItem.price = value;
            }
    
            // Recalculate subtotal
            const qty = parseFloat(String(currentItem.quantity)) || 0;
            const prc = parseFloat(String(currentItem.price)) || 0;
            currentItem.subtotal = qty * prc;
            
            newItems[index] = currentItem;
            return newItems;
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!treasuryId || (!customerId && customerType === 'registered') || (!customerName && customerType === 'guest') || items.some(item => !item.product_id || !item.quantity)) {
            alert("Please fill all required fields: treasury, customer, and all product items.");
            return;
        }

        const finalItems: SalesInvoiceItem[] = items.map(item => {
            const quantity = parseFloat(String(item.quantity)) || 0;
            const price = parseFloat(String(item.price)) || 0;
            return {
                product_id: item.product_id!,
                quantity,
                price: price, // Final sale price
                original_price: item.original_price,
                discount_percent: item.discount_percent,
                subtotal: quantity * price,
            };
        }).filter(item => item.product_id && item.quantity > 0);

        if (invoiceToEdit) {
            updateSalesInvoice({
                ...invoiceToEdit,
                customer_id: customerId || null,
                customer_name: customerName,
                customer_mobile: customerMobile,
                total_amount: totalAmount,
                notes,
                items: finalItems,
            });
        } else {
            addSalesInvoice({
                customer_id: customerId || null,
                customer_name: customerName,
                customer_mobile: customerMobile,
                treasury_id: treasuryId,
                total_amount: totalAmount,
                notes,
                items: finalItems,
            });
        }
        
        onClose();
    };
    
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => e.target.select();
    
    const formInputClasses = "w-full p-2 border border-slate-300 rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-70 disabled:bg-slate-100 dark:disabled:bg-slate-800";

    return (
        <Modal title={invoiceToEdit ? t.editSalesInvoice : t.addNewSalesInvoice} onClose={onClose} size="3xl">
            <form onSubmit={handleSubmit}>
                <div className="p-5 space-y-6 max-h-[80vh] overflow-y-auto">
                    {/* Customer Section */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">{t.customerInfo}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.treasury}</label>
                                <select
                                    value={treasuryId}
                                    onChange={(e) => setTreasuryId(Number(e.target.value))}
                                    className={formInputClasses}
                                    required
                                    disabled={!!invoiceToEdit || treasuries.length === 0}
                                >
                                    <option value="" disabled>{t.select + '...'}</option>
                                    {treasuries.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                                {treasuries.length === 0 && !invoiceToEdit && <p className="text-xs text-red-500 mt-1">{t.noTreasuriesFound}</p>}
                            </div>
                            <div className="flex items-center gap-4 self-end">
                                <label className="flex items-center gap-2"><input type="radio" name="customerType" value="guest" checked={customerType === 'guest'} onChange={() => handleCustomerTypeChange('guest')} disabled={!!invoiceToEdit} /> {t.guestCustomer}</label>
                                <label className="flex items-center gap-2"><input type="radio" name="customerType" value="registered" checked={customerType === 'registered'} onChange={() => handleCustomerTypeChange('registered')} disabled={!!invoiceToEdit} /> {t.registeredCustomer}</label>
                            </div>
                        </div>

                        {customerType === 'guest' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">{t.name}</label>
                                    <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className={formInputClasses} required disabled={!!invoiceToEdit} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">{t.mobileNumber}</label>
                                    <input type="tel" value={customerMobile} onChange={(e) => setCustomerMobile(e.target.value)} className={formInputClasses} required disabled={!!invoiceToEdit} />
                                </div>
                            </div>
                        ) : (
                             <div>
                                <label className="block text-sm font-medium mb-1">{t.selectCustomer}</label>
                                <SearchableSelect options={customerOptions} value={customerId} onChange={handleCustomerSelect} placeholder={t.selectCustomer} disabled={!!invoiceToEdit} />
                            </div>
                        )}
                    </div>
                    
                    {/* Items Section */}
                    <div className="mt-6 space-y-4">
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">{t.invoiceItems}</h3>
                         <div className="hidden md:grid grid-cols-12 gap-2 items-center px-2 pb-2">
                            <div className="col-span-5 text-xs font-medium text-slate-500 dark:text-slate-400">{t.product}</div>
                            <div className="col-span-2 text-xs font-medium text-slate-500 dark:text-slate-400">{t.quantity}</div>
                            <div className="col-span-2 text-xs font-medium text-slate-500 dark:text-slate-400">{t.salePrice}</div>
                            <div className="col-span-2 text-center text-xs font-medium text-slate-500 dark:text-slate-400">{t.subtotal}</div>
                            <div className="col-span-1"></div>
                        </div>
                        <div className="space-y-3">
                            {items.map((item, index) => (
                                <div key={index} className="flex flex-col gap-3 md:grid md:grid-cols-12 md:gap-2 items-center p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                                    <div className="w-full md:col-span-5">
                                        <label className="text-xs font-medium text-slate-500 md:hidden">{t.product}</label>
                                        <SearchableSelect options={productOptions} value={item.product_id} onChange={(value) => handleItemChange(index, 'product_id', value)} placeholder={t.selectProduct}/>
                                    </div>
                                    <div className="w-full md:col-span-2">
                                        <label className="text-xs font-medium text-slate-500 md:hidden">{t.quantity}</label>
                                        <input type="number" value={item.quantity} onFocus={handleFocus} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} className={formInputClasses + " text-sm"} min="0" step="any" required />
                                    </div>
                                    <div className="w-full md:col-span-2">
                                        <label className="text-xs font-medium text-slate-500 md:hidden">{t.salePrice}</label>
                                        <div className="flex items-center gap-2">
                                            <input type="number" value={item.price} onFocus={handleFocus} onChange={(e) => handleItemChange(index, 'price', e.target.value)} className={formInputClasses + " text-sm"} step="0.01" min="0" required />
                                            {item.original_price && parseFloat(String(item.price)) < item.original_price && (
                                                <span className="text-xs text-slate-500 line-through whitespace-nowrap">
                                                    {item.original_price.toFixed(2)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="w-full md:col-span-2 text-start md:text-center">
                                        <label className="text-xs font-medium text-slate-500 md:hidden">{t.subtotal}</label>
                                        <p className="font-semibold text-sm text-slate-700 dark:text-slate-200 mt-1 md:mt-0">{((parseFloat(String(item.quantity)) || 0) * (parseFloat(String(item.price)) || 0)).toFixed(2)}</p>
                                    </div>
                                    <div className="w-full md:w-auto md:col-span-1 text-end md:text-center">
                                        <button type="button" onClick={() => handleRemoveItem(index)} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full"><TrashIcon className="w-5 h-5" /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={handleAddItem} className="mt-3 text-sm text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 font-semibold flex items-center gap-1">
                            <PlusIcon className="w-4 h-4" /> {t.addItemToInvoice}
                        </button>
                    </div>
                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.orderNotes}</label>
                        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={formInputClasses}></textarea>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <div>
                        <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">{t.totalAmount}</span>
                        <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{totalAmount.toFixed(2)} {t.currency}</p>
                    </div>
                    <div className="flex gap-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 font-semibold text-slate-800 dark:text-slate-300 transition-colors">{t.cancel}</button>
                        <button type="submit" className="px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 font-semibold transition-colors">{t.save}</button>
                    </div>
                </div>
            </form>
        </Modal>
    );
};
