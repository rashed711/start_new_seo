import React, { useState } from 'react';
import type { Order } from '../../types';
import { useUI } from '../../contexts/UIContext';
import { useData } from '../../contexts/DataContext';
import { formatDateTime, calculateItemTotal, calculateOriginalItemTotal } from '../../utils/helpers';
import { StarRating } from '../StarRating';
import { ChevronDownIcon, ShareIcon } from '../icons/Icons';

interface PastOrderCardProps {
    order: Order;
    onLeaveFeedback: (order: Order) => void;
    onShareInvoice: (order: Order) => void;
}

export const PastOrderCard: React.FC<PastOrderCardProps> = ({ order, onLeaveFeedback, onShareInvoice }) => {
    const { language, t } = useUI();
    const { restaurantInfo } = useData();
    const [isExpanded, setIsExpanded] = useState(false);

    const getStatusChipColor = (statusId: string) => {
        if (!restaurantInfo) return 'bg-slate-100 text-slate-800';
        const color = restaurantInfo.orderStatusColumns.find(s => s.id === statusId)?.color || 'slate';
        return `bg-${color}-100 text-${color}-800 dark:bg-${color}-900/50 dark:text-${color}-300`;
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden transition-all duration-300">
            <div className="p-4 cursor-pointer group" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div className="flex-1 space-y-1">
                        <p className="font-semibold text-slate-800 dark:text-slate-100">{t.orderId}: <span className="font-mono text-slate-500">{order.id}</span></p>
                        <p className="text-sm text-slate-500">{formatDateTime(order.timestamp)}</p>
                        <p className="text-sm text-slate-500">{order.items.length} {t.items} - <span className="font-bold">{order.total.toFixed(2)} {t.currency}</span></p>
                    </div>
                    <div className="flex flex-col items-start sm:items-end gap-2 w-full sm:w-auto">
                        <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusChipColor(order.status)}`}>
                            {restaurantInfo?.orderStatusColumns.find(s => s.id === order.status)?.name[language] || order.status}
                        </span>
                        <div className="flex items-center gap-2">
                             <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">{isExpanded ? t.hideDetails : t.showDetails}</span>
                            <ChevronDownIcon className={`w-5 h-5 text-slate-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                    </div>
                </div>
            </div>
            
            <div className={`transition-all duration-300 ease-in-out grid ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-t border-slate-200 dark:border-slate-700">
                        <h4 className="font-bold text-slate-700 dark:text-slate-200 mb-3">{t.orderDetails}</h4>
                        <div className="space-y-2">
                            {order.items.map((item, index) => {
                                const finalTotal = calculateItemTotal(item);
                                const originalTotal = calculateOriginalItemTotal(item);
                                return (
                                <div key={index} className="flex justify-between items-center text-sm">
                                    <div className="text-slate-600 dark:text-slate-300">
                                        <span className="font-semibold">{item.quantity} x</span> {item.product.name[language]}
                                    </div>
                                    {item.appliedDiscountPercent ? (
                                        <div className="text-end">
                                            <div className="font-medium text-slate-800 dark:text-slate-100">
                                                {finalTotal.toFixed(2)}
                                            </div>
                                            <div className="text-xs text-slate-500 line-through">
                                                {originalTotal.toFixed(2)}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="font-medium text-slate-800 dark:text-slate-100">
                                            {finalTotal.toFixed(2)}
                                        </div>
                                    )}
                                </div>
                            )})}
                        </div>
                        {order.orderType === 'Delivery' && order.customer.address && (
                            <p className="text-xs text-slate-500 pt-2 border-t border-slate-200 dark:border-slate-700 mt-3">{t.address}: {order.customer.address}</p>
                        )}
                        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                {order.status === 'completed' && !order.customerFeedback && (
                                    <button onClick={() => onLeaveFeedback(order)} className="text-sm font-semibold text-white bg-primary-500 hover:bg-primary-600 px-4 py-2 rounded-lg transition-colors shadow-sm">
                                        {t.leaveFeedback}
                                    </button>
                                )}
                                {order.customerFeedback && (
                                    <div className="flex items-center gap-2">
                                        <StarRating rating={order.customerFeedback.rating} size="sm" />
                                        <span className="text-xs text-slate-500">({t.customerFeedback})</span>
                                    </div>
                                )}
                                <button 
                                    onClick={() => onShareInvoice(order)} 
                                    className="text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 hover:bg-blue-200 dark:hover:bg-blue-900 px-3 py-2 rounded-lg transition-colors shadow-sm flex items-center gap-2"
                                >
                                    <ShareIcon className="w-4 h-4" />
                                    {t.share}
                                </button>
                            </div>
                            <div className="text-end">
                                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{t.total}: </span>
                                <span className="font-bold text-lg text-slate-800 dark:text-slate-100">{order.total.toFixed(2)} {t.currency}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};