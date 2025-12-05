import React, { useState, useEffect } from 'react';
import type { Order, RestaurantInfo, OrderType } from '../../types';
import { DocumentTextIcon, PencilIcon, ShareIcon, PrintIcon, TrashIcon, CloseIcon, StarIcon, UserIcon, ClockIcon, HomeIcon, TakeawayIcon, TruckIcon, UserCircleIcon, CreditCardIcon, CheckIcon, ClipboardListIcon } from '../icons/Icons';
import { StarRating } from '../StarRating';
import { formatDateTime, formatNumber, generateReceiptImage, calculateItemTotal, calculateOriginalItemTotal, calculateTotalSavings, imageUrlToBlob, resolveImageUrl } from '../../utils/helpers';
import { Modal } from '../Modal';
import { useUI } from '../../contexts/UIContext';
import { useData } from '../../contexts/DataContext';
import { useOrders } from '../../contexts/OrderContext';
import { useAuth } from '../../contexts/AuthContext';
import { CopiedButton } from '../CopiedButton';

interface OrderDetailsModalProps {
    order: Order;
    onClose: () => void;
    canEdit: boolean;
    onEdit: (order: Order) => void;
    canDelete: boolean;
    onDelete: (orderId: string) => Promise<boolean>;
    creatorName?: string;
}

const getStatusChipColor = (status: string, restaurantInfo: RestaurantInfo) => {
    const color = restaurantInfo.orderStatusColumns.find((s: any) => s.id === status)?.color || 'slate';
    return `bg-${color}-100 text-${color}-800 dark:bg-${color}-900/50 dark:text-${color}-300 border-${color}-200 dark:border-${color}-500/30`;
};

const InfoCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
        {children}
    </div>
);


const InfoItem: React.FC<{ label: string; icon: React.ReactNode; children: React.ReactNode; className?: string }> = ({ label, icon, children, className }) => (
    <div className={className}>
        <p className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">
            {icon}
            <span>{label}</span>
        </p>
        <div className="ps-7 font-medium text-slate-800 dark:text-slate-100 text-sm">{children}</div>
    </div>
);


export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ order, onClose, canEdit, onEdit, canDelete, onDelete, creatorName }) => {
    const { language, t, isProcessing, setIsProcessing } = useUI();
    const { restaurantInfo } = useData();
    const { updateOrder } = useOrders();
    const { hasPermission } = useAuth();
    
    const [isReceiptViewerOpen, setIsReceiptViewerOpen] = useState(false);
    const [codPaymentDetail, setCodPaymentDetail] = useState('');
    const [isEditingPayment, setIsEditingPayment] = useState(false);

    const canEditPayment = hasPermission('edit_recorded_payment');
    
    const finalTotal = order.total;
    const totalSavings = calculateTotalSavings(order.items);
    const originalTotal = finalTotal + totalSavings;

    useEffect(() => {
        const shouldBeEditing = !order.paymentDetail && canEditPayment && order.paymentMethod !== 'online';
        setIsEditingPayment(shouldBeEditing);
        setCodPaymentDetail(order.paymentDetail || '');
    }, [order, canEditPayment]);

    const handleShare = async () => {
        setIsProcessing(true);
        try {
            if (!restaurantInfo) throw new Error("Restaurant info not available");
            const imageUrl = await generateReceiptImage(order, restaurantInfo, t, language, creatorName);
            const blob = await imageUrlToBlob(imageUrl);
            const file = new File([blob], `order-${order.id}.png`, { type: 'image/png' });

            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: `${t.orderDetails} - ${order.id}`,
                    text: `Order details for ${order.id}`,
                });
            } else {
                alert('Web Share API is not supported in your browser.');
            }
        } catch (error) {
            console.error('Error sharing order:', error);
            if ((error as DOMException)?.name !== 'AbortError') {
                 alert('Could not share order.');
            }
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePrint = async () => {
        setIsProcessing(true);
        try {
            if (!restaurantInfo) throw new Error("Restaurant info not available");
            const imageUrl = await generateReceiptImage(order, restaurantInfo, t, language, creatorName);
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(`
                    <html>
                        <head>
                            <title>Print Order ${order.id}</title>
                            <style>
                                @media print { @page { size: 80mm auto; margin: 0; } body { margin: 0; padding: 10px; } }
                                body { margin: 0; display: flex; justify-content: center; }
                                img { max-width: 100%; }
                            </style>
                        </head>
                        <body>
                            <img src="${imageUrl}" />
                            <script>
                                window.onload = function() { window.print(); window.close(); }
                            </script>
                        </body>
                    </html>
                `);
                printWindow.document.close();
            }
        } catch (error) {
            console.error('Error printing order:', error);
            alert('Could not prepare order for printing.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSaveCodPayment = async () => {
        if (codPaymentDetail) {
            await updateOrder(order.id, { paymentDetail: codPaymentDetail });
        }
    }
    
    const handleDeleteAndClose = async () => {
        const success = await onDelete(order.id);
        if (success) {
            onClose();
        }
    };

    const OrderTypeIcon: React.FC<{ type: Order['orderType'] }> = ({ type }) => {
        switch (type) {
            case 'Dine-in': return <HomeIcon className="w-5 h-5 text-slate-500" />;
            case 'Takeaway': return <TakeawayIcon className="w-5 h-5 text-slate-500" />;
            case 'Delivery': return <TruckIcon className="w-5 h-5 text-slate-500" />;
            default: return null;
        }
    };

    if (!restaurantInfo) return null;
    const statusDetails = restaurantInfo.orderStatusColumns.find(s => s.id === order.status);
    const availableOnlineMethods = restaurantInfo.onlinePaymentMethods?.filter(m => m.isVisible) || [];

    return (
        <>
            <Modal title={`${t.orderDetails} - #${order.id.substring(order.id.length - 6)}`} onClose={onClose} size="4xl">
                <div className="flex flex-col overflow-hidden h-full">
                    <div className="p-4 sm:p-6 overflow-y-auto flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6 bg-slate-50 dark:bg-slate-900/50">
                        {/* Left Column */}
                        <div className="lg:col-span-1 space-y-5">
                            <InfoCard>
                                <InfoItem label={t.orderId} icon={<ClipboardListIcon className="w-5 h-5 text-slate-500" />}>
                                    <div className="flex items-center justify-between">
                                        <span className="font-mono text-base">{order.id}</span>
                                        <CopiedButton textToCopy={order.id} className="text-xs font-semibold py-1 px-2 rounded-md shadow-sm">
                                            {t.copy}
                                        </CopiedButton>
                                    </div>
                                </InfoItem>
                                <InfoItem label={t.orderType} icon={<OrderTypeIcon type={order.orderType}/>}>
                                    {t[order.orderType.toLowerCase() as keyof typeof t]} {order.tableNumber && `(${t.table} ${order.tableNumber})`}
                                </InfoItem>
                                <InfoItem label={t.date} icon={<ClockIcon className="w-5 h-5 text-slate-500" />}>
                                    {formatDateTime(order.timestamp)}
                                </InfoItem>
                                {creatorName && (
                                    <InfoItem label={t.createdBy} icon={<UserCircleIcon className="w-5 h-5 text-slate-500" />}>
                                        {creatorName}
                                    </InfoItem>
                                )}
                            </InfoCard>

                            <InfoCard>
                                <InfoItem label={t.paymentMethod} icon={<CreditCardIcon className="w-5 h-5 text-slate-500" />}>
                                     {order.paymentMethod === 'cod' ? t.cashOnDelivery : order.paymentMethod === 'online' ? t.onlinePayment : "N/A"}
                                </InfoItem>

                                {order.paymentMethod === 'online' ? (
                                    <div className="ps-7 flex items-center justify-between">
                                        <span className="font-medium text-slate-700 dark:text-slate-200">{order.paymentDetail}</span>
                                        {order.paymentReceiptUrl && (
                                            <button onClick={() => setIsReceiptViewerOpen(true)} className="text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400">
                                                {t.viewReceipt}
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        {isEditingPayment ? (
                                            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700/50">
                                                <label className="block text-xs font-semibold mb-2 text-blue-800 dark:text-blue-200">{order.paymentDetail ? t.edit : t.recordPayment}</label>
                                                <div className="flex items-center gap-2">
                                                    <select value={codPaymentDetail} onChange={(e) => setCodPaymentDetail(e.target.value)} className="w-full p-2 text-sm border rounded-md dark:bg-slate-700 dark:border-slate-600">
                                                        <option value="">{t.selectMethod}</option><option value={t.cash}>{t.cash}</option>
                                                        {availableOnlineMethods.map(method => <option key={method.id} value={method.name[language]}>{method.name[language]}</option>)}
                                                    </select>
                                                    <button onClick={handleSaveCodPayment} disabled={!codPaymentDetail || isProcessing} className="bg-blue-500 text-white font-bold p-2 rounded-lg hover:bg-blue-600 disabled:bg-blue-300"><CheckIcon className="w-5 h-5"/></button>
                                                    {order.paymentDetail && <button type="button" onClick={() => setIsEditingPayment(false)} className="bg-slate-200 text-slate-800 p-2 rounded-lg hover:bg-slate-300"><CloseIcon className="w-5 h-5"/></button>}
                                                </div>
                                            </div>
                                        ) : order.paymentDetail ? (
                                            <div className="ps-7 flex items-center gap-2">
                                                <p className="text-sm text-slate-500 dark:text-slate-400">{t.paymentCollectedVia} <span className="font-medium text-slate-700 dark:text-slate-200">{order.paymentDetail}</span></p>
                                                {canEditPayment && <button onClick={() => setIsEditingPayment(true)} className="text-xs text-blue-600 dark:text-blue-400 hover:underline"><PencilIcon className="w-3 h-3" /></button>}
                                            </div>
                                        ) : canEditPayment ? (
                                            <button onClick={() => setIsEditingPayment(true)} className="text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400 w-full text-start p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700/50">
                                                {t.recordPayment}
                                            </button>
                                        ) : null}
                                    </>
                                )}
                            </InfoCard>
                        </div>

                        {/* Right Column */}
                        <div className="lg:col-span-2 space-y-6">
                             <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border dark:border-slate-700">
                                <h3 className="font-bold text-lg mb-3 text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                    <UserIcon className="w-5 h-5 text-slate-500" />
                                    {t.customerInfo}
                                </h3>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-semibold text-slate-800 dark:text-slate-100">{order.customer.name || 'Guest'}</p>
                                        {order.customer.address && (
                                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 whitespace-pre-wrap">{order.customer.address}</p>
                                        )}
                                    </div>
                                    <div className="text-end space-y-2">
                                         <p className="text-sm text-slate-600 dark:text-slate-300 font-mono">{order.customer.mobile}</p>
                                         <span className={`inline-block px-2.5 py-0.5 text-xs font-bold rounded-full border ${getStatusChipColor(order.status, restaurantInfo)}`}>
                                            {statusDetails?.name[language] || order.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                 <div className="flex justify-between items-center mb-3">
                                    <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{t.orderItems}</h3>
                                    <span className="text-sm font-semibold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-full">
                                        {formatNumber(order.items.reduce((acc, i) => acc + i.quantity, 0))} {t.items}
                                    </span>
                                </div>
                                <div className="space-y-3 bg-white dark:bg-slate-800 p-4 rounded-xl border dark:border-slate-700 max-h-80 overflow-y-auto">
                                    {order.items.map((item, index) => {
                                        const finalItemTotal = calculateItemTotal(item);
                                        const originalItemTotal = calculateOriginalItemTotal(item);
                                        return (
                                        <div key={`${item.product.id}-${index}`} className="flex items-start gap-4 py-3 border-b dark:border-slate-700 last:border-b-0">
                                            <div className="text-end shrink-0">
                                                {item.appliedDiscountPercent ? (
                                                    <>
                                                        <p className="font-semibold text-slate-700 dark:text-slate-200">{finalItemTotal.toFixed(2)} {t.currency}</p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 line-through">{originalItemTotal.toFixed(2)} {t.currency}</p>
                                                    </>
                                                ) : (
                                                    <p className="font-semibold text-slate-700 dark:text-slate-200">{finalItemTotal.toFixed(2)} {t.currency}</p>
                                                )}
                                            </div>
                                            <div className="flex-grow text-end">
                                                <p className="font-semibold text-slate-800 dark:text-slate-300">{item.product.name[language]}</p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">{t.quantity}: {formatNumber(item.quantity)}</p>
                                                {item.options && (
                                                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                        {Object.entries(item.options).map(([optionKey, valueKey]) => {
                                                            const option = item.product.options?.find(o => o.name.en === optionKey);
                                                            const value = option?.values.find(v => v.name.en === valueKey);
                                                            if (option && value) return <div key={optionKey}>+ {value.name[language]}</div>
                                                            return null;
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                            <img src={item.product.image} alt={item.product.name[language]} className="w-16 h-16 rounded-lg object-cover" />
                                        </div>
                                        );
                                    })}
                                </div>
                            </div>
                            
                            {order.notes && (
                                <div className="bg-blue-50 dark:bg-blue-900/40 p-4 rounded-lg border border-blue-200 dark:border-blue-500/30">
                                    <h3 className="font-bold text-base mb-2 text-blue-800 dark:text-blue-200 flex items-center gap-2"><DocumentTextIcon className="w-5 h-5" />{t.orderNotes}</h3>
                                    <p className="text-sm text-blue-700 dark:text-blue-200 whitespace-pre-wrap">{order.notes}</p>
                                </div>
                            )}
                            {order.refusalReason && (
                                <div className="bg-red-50 dark:bg-red-900/40 p-4 rounded-lg border border-red-200 dark:border-red-500/30">
                                    <h3 className="font-bold text-base mb-2 text-red-800 dark:text-red-200">{t.refusalInfo}</h3>
                                    <p className="text-sm text-red-700 dark:text-red-200">{order.refusalReason}</p>
                                </div>
                            )}
                            {order.customerFeedback && (
                                 <div className="bg-green-50 dark:bg-green-900/40 p-4 rounded-lg border border-green-200 dark:border-green-500/30">
                                    <h3 className="font-bold text-base mb-2 text-green-800 dark:text-green-200">{t.customerFeedback}</h3>
                                    <div className="flex items-center mb-2"><StarRating rating={order.customerFeedback.rating} /></div>
                                    <p className="text-sm text-green-700 dark:text-green-200 italic">"{order.customerFeedback.comment}"</p>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="p-4 border-t dark:border-slate-700 shrink-0 bg-slate-50/50 dark:bg-slate-800/50 rounded-b-2xl">
                        <div className="flex justify-between items-end flex-row-reverse gap-4">
                            <div className="flex items-center gap-2">
                                {canEdit && <button onClick={() => onEdit(order)} title={t.editOrder} className="p-2 rounded-full text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"><PencilIcon className="w-5 h-5" /></button>}
                                {canDelete && <button onClick={handleDeleteAndClose} title={t.deleteOrder} className="p-2 rounded-full text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"><TrashIcon className="w-5 h-5" /></button>}
                                <button onClick={handleShare} disabled={isProcessing} title={t.share} className="p-2 rounded-full text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors disabled:opacity-50"><ShareIcon className="w-5 h-5" /></button>
                                <button onClick={handlePrint} disabled={isProcessing} title={t.print} className="p-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"><PrintIcon className="w-5 h-5" /></button>
                            </div>
                             <div className="text-start flex-grow">
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
                                <div className="flex justify-between items-baseline mt-1 pt-1 border-t border-slate-200 dark:border-slate-700">
                                    <span className="font-bold text-slate-700 dark:text-slate-200 text-base">{t.total}:</span>
                                    <span className="font-extrabold text-2xl text-primary-600 dark:text-primary-400">{finalTotal.toFixed(2)} {t.currency}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>
            {isReceiptViewerOpen && order.paymentReceiptUrl && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-80 z-[60] flex items-center justify-center p-4 animate-fade-in"
                    onClick={() => setIsReceiptViewerOpen(false)}
                >
                    <button 
                        onClick={() => setIsReceiptViewerOpen(false)}
                        className="absolute top-4 right-4 text-white p-2 rounded-full bg-black/50 hover:bg-black/80 transition-colors"
                        aria-label={t.close}
                    >
                        <CloseIcon className="w-8 h-8"/>
                    </button>
                    <img 
                        src={resolveImageUrl(order.paymentReceiptUrl)} 
                        alt="Payment Receipt" 
                        className="max-w-full max-h-full object-contain rounded-lg"
                        onClick={e => e.stopPropagation()}
                    />
                </div>
            )}
        </>
    );
};