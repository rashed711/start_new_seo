import React, { useMemo } from 'react';
import type { SalesInvoice } from '../../types';
import { Modal } from '../Modal';
import { useUI } from '../../contexts/UIContext';
import { useData } from '../../contexts/DataContext';
import { formatDateTime, generateSalesInvoiceImage, imageUrlToBlob } from '../../utils/helpers';
import { PencilIcon, TrashIcon, ShareIcon } from '../icons/Icons';

interface SalesInvoiceDetailsModalProps {
    invoice: SalesInvoice;
    onClose: () => void;
    onEdit: (invoice: SalesInvoice) => void;
    onDelete: (invoiceId: number) => void;
    canManage: boolean;
}

export const SalesInvoiceDetailsModal: React.FC<SalesInvoiceDetailsModalProps> = ({ invoice, onClose, onEdit, onDelete, canManage }) => {
    const { t, language, setIsProcessing, isProcessing, showToast } = useUI();
    const { restaurantInfo, products, promotions } = useData();
    
    const parsedInvoice = useMemo(() => {
        if (!invoice) return null;
        let itemsArray = invoice.items;
        if (typeof itemsArray === 'string') {
            try {
                itemsArray = JSON.parse(itemsArray);
            } catch (e) {
                console.error("Failed to parse invoice items:", e);
                itemsArray = [];
            }
        }
        return { ...invoice, items: Array.isArray(itemsArray) ? itemsArray : [] };
    }, [invoice]);

    const { totalSavings, originalTotal } = useMemo(() => {
        if (!parsedInvoice?.items) return { totalSavings: 0, originalTotal: 0 };

        let calculatedOriginalTotal = 0;
        for (const item of parsedInvoice.items as any[]) {
            const quantity = Number(item.quantity) || 0;
            const salePrice = Number(item.price ?? item.sale_price);

            if (isNaN(salePrice) || isNaN(quantity)) continue;

            // If original_price is provided and valid (greater than sale price), use it. 
            // Otherwise, assume the sale price was the original price for that item.
            const originalPricePerItem = (item.original_price != null && Number(item.original_price) > salePrice) 
                ? Number(item.original_price) 
                : salePrice;

            calculatedOriginalTotal += originalPricePerItem * quantity;
        }
        
        const finalTotal = parsedInvoice.total_amount;
        const calculatedSavings = calculatedOriginalTotal - finalTotal;

        return {
            totalSavings: calculatedSavings > 0.01 ? calculatedSavings : 0,
            originalTotal: calculatedOriginalTotal
        };
    }, [parsedInvoice]);


    const handleShare = async () => {
        if (!restaurantInfo || !parsedInvoice) return;
        setIsProcessing(true);
        try {
            const imageUrl = await generateSalesInvoiceImage(parsedInvoice, restaurantInfo, t, language, products, promotions);
            const blob = await imageUrlToBlob(imageUrl);
            const file = new File([blob], `sales-invoice-${parsedInvoice.invoice_number}.png`, { type: 'image/png' });

            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: `${t.salesInvoice} - #${parsedInvoice.invoice_number}`,
                });
            } else {
                showToast('Web Share API is not supported in this browser.');
            }
        } catch (error) {
            console.error('Error sharing invoice:', error);
            if ((error as DOMException)?.name !== 'AbortError') {
                 showToast(language === 'ar' ? 'فشلت المشاركة.' : 'Sharing failed.');
            }
        } finally {
            setIsProcessing(false);
        }
    };

    if (!parsedInvoice) {
        return null;
    }

    return (
        <Modal title={`${t.invoiceDetails} - #${parsedInvoice.invoice_number}`} onClose={onClose} size="2xl">
            <div className="p-5 space-y-6 max-h-[80vh] overflow-y-auto">
                {/* Invoice Summary */}
                <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t.customer}</p>
                        <p className="font-semibold text-slate-800 dark:text-slate-100">{parsedInvoice.customer_name} ({parsedInvoice.customer_mobile})</p>
                    </div>
                     <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t.invoiceDate}</p>
                        <p className="font-semibold text-slate-800 dark:text-slate-100">{formatDateTime(parsedInvoice.invoice_date)}</p>
                    </div>
                    <div>
                         {parsedInvoice.created_by_name && (
                            <>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t.createdBy}</p>
                                <p className="font-semibold text-slate-800 dark:text-slate-100">{parsedInvoice.created_by_name}</p>
                            </>
                        )}
                    </div>
                    {parsedInvoice.notes && (
                        <div className="sm:col-span-3">
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t.orderNotes}</p>
                            <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">{parsedInvoice.notes}</p>
                        </div>
                    )}
                </div>

                {/* Items Table */}
                <div>
                     <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">{t.invoiceItems}</h3>
                     <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg">
                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                            <thead className="bg-slate-100 dark:bg-slate-700/50">
                                <tr>
                                    <th className="px-4 py-2 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">{t.product}</th>
                                    <th className="px-4 py-2 text-end text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">{t.quantity}</th>
                                    <th className="px-4 py-2 text-end text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">{t.salePrice}</th>
                                    <th className="px-4 py-2 text-end text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">{t.subtotal}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {parsedInvoice.items.map((item: any, index: number) => {
                                    const normalizedPrice = item.price ?? item.sale_price;

                                    if (!item || normalizedPrice == null || item.subtotal == null) {
                                        console.warn('Skipping rendering of invalid invoice item:', item);
                                        return null;
                                    }
                                    
                                    const price = Number(normalizedPrice);
                                    const original_price = item.original_price != null ? Number(item.original_price) : null;
                                    const subtotal = Number(item.subtotal);
                                    const discount_percent = item.discount_percent != null ? Number(item.discount_percent) : null;
                                    const hasDiscount = original_price != null && original_price > price;
                                    
                                    return (
                                    <tr key={item.id || index}>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-800 dark:text-slate-100">{item.product_name?.[language] || `Product ID: ${item.product_id}`}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-end text-slate-600 dark:text-slate-300">{item.quantity}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-end text-slate-600 dark:text-slate-300">
                                            {hasDiscount ? (
                                                <div className="flex flex-col items-end">
                                                    <span>{price.toFixed(2)}</span>
                                                    <span className="text-xs text-slate-400 line-through">{original_price?.toFixed(2)}</span>
                                                </div>
                                            ) : (
                                                price.toFixed(2)
                                            )}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-end font-semibold text-slate-800 dark:text-slate-100">
                                             <div className="flex flex-col items-end">
                                                <span>{subtotal.toFixed(2)}</span>
                                                {hasDiscount && discount_percent != null && discount_percent > 0 && (
                                                    <span className="text-xs text-red-500 font-normal">(-{discount_percent.toFixed(0)}%)</span>
                                                )}
                                             </div>
                                        </td>
                                    </tr>
                                )})}
                            </tbody>
                        </table>
                     </div>
                </div>
            </div>
             <div className="p-4 border-t border-slate-200 dark:border-slate-700 shrink-0 bg-slate-50/50 dark:bg-slate-800/50 rounded-b-2xl">
                <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-end gap-4">
                    <div className="flex items-center gap-2">
                        {canManage && (
                            <>
                                <button
                                    onClick={() => onEdit(parsedInvoice)}
                                    className="p-2 text-indigo-600 hover:bg-indigo-100 dark:text-indigo-400 dark:hover:bg-indigo-900/50 rounded-full transition-colors"
                                    title={t.edit}
                                >
                                    <PencilIcon className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => { onDelete(parsedInvoice.id); onClose(); }}
                                    className="p-2 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/50 rounded-full transition-colors"
                                    title={t.delete}
                                >
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </>
                        )}
                         <button
                            onClick={handleShare}
                            disabled={isProcessing}
                            className="p-2 text-green-600 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/50 rounded-full transition-colors disabled:opacity-50"
                            title={t.share}
                        >
                            <ShareIcon className="w-5 h-5" />
                        </button>
                    </div>
                    
                     <div className="text-end space-y-1 w-full sm:max-w-xs">
                        {totalSavings > 0 && (
                            <div className="flex justify-between items-baseline text-sm">
                                <span className="text-slate-500 dark:text-slate-400">{t.subtotal}:</span>
                                <span className="font-medium text-slate-700 dark:text-slate-200">{originalTotal.toFixed(2)} {t.currency}</span>
                            </div>
                        )}
                        {totalSavings > 0 && (
                            <div className="flex justify-between items-baseline text-sm">
                                <span className="text-red-600 dark:text-red-400">{t.discount}:</span>
                                <span className="font-medium text-red-600 dark:text-red-400">-{totalSavings.toFixed(2)} {t.currency}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-baseline pt-1 border-t border-slate-200 dark:border-slate-700">
                            <span className="font-bold text-slate-700 dark:text-slate-200 text-base">{t.total}:</span>
                            <span className="font-extrabold text-2xl text-primary-600 dark:text-primary-400">{parsedInvoice.total_amount.toFixed(2)} {t.currency}</span>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};