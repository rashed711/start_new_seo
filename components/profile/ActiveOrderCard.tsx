
import React from 'react';
import type { Order } from '../../types';
import { useUI } from '../../contexts/UIContext';
import { useData } from '../../contexts/DataContext';
import { formatDateTime } from '../../utils/helpers';
import { OrderStatusTracker } from '../OrderStatusTracker';

interface ActiveOrderCardProps {
    order: Order;
}

export const ActiveOrderCard: React.FC<ActiveOrderCardProps> = ({ order }) => {
    const { t } = useUI();
    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <p className="font-bold text-slate-800 dark:text-slate-100">{t.orderId}: <span className="font-mono text-primary-600">{order.id}</span></p>
                    <p className="text-xs text-slate-500">{formatDateTime(order.timestamp)}</p>
                </div>
                <div className="text-end">
                    <p className="text-2xl font-extrabold text-primary-600 dark:text-primary-400">{order.total.toFixed(2)}</p>
                    <p className="text-xs text-slate-500 -mt-1">{t.currency}</p>
                </div>
            </div>
            <OrderStatusTracker orderStatus={order.status} />
        </div>
    );
};