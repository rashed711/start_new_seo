import React, { useState } from 'react';
import type { Order } from '../../types';
import { useUI } from '../../contexts/UIContext';
import { ActiveOrderCard } from './ActiveOrderCard';
import { PastOrderCard } from './PastOrderCard';

interface OrderHistoryProps {
    activeOrders: Order[];
    pastOrders: Order[];
    onLeaveFeedback: (order: Order) => void;
    onShareInvoice: (order: Order) => void;
}

export const OrderHistory: React.FC<OrderHistoryProps> = ({ activeOrders, pastOrders, onLeaveFeedback, onShareInvoice }) => {
    const { t } = useUI();
    const [activeTab, setActiveTab] = useState<'active' | 'past'>('active');

    return (
        <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <div className="mb-6 border-b border-slate-300 dark:border-slate-700">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('active')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                            activeTab === 'active'
                                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:hover:text-slate-200 dark:hover:border-slate-600'
                        }`}
                    >
                        {t.activeOrders} ({activeOrders.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('past')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                            activeTab === 'past'
                                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:hover:text-slate-200 dark:hover:border-slate-600'
                        }`}
                    >
                        {t.pastOrders}
                    </button>
                </nav>
            </div>
            
            <div className="space-y-6">
                {activeTab === 'active' && (
                    activeOrders.length > 0
                        ? activeOrders.map(order => <ActiveOrderCard key={order.id} order={order} />)
                        : <p className="text-slate-500 text-center py-8">You have no active orders.</p>
                )}

                {activeTab === 'past' && (
                    pastOrders.length > 0
                        ? pastOrders.map(order => <PastOrderCard key={order.id} order={order} onLeaveFeedback={onLeaveFeedback} onShareInvoice={onShareInvoice} />)
                        : <p className="text-slate-500 text-center py-8">You have no past orders.</p>
                )}
            </div>
        </div>
    );
};