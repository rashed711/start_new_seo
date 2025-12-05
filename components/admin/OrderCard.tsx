import React from 'react';
import type { Order, User, RestaurantInfo, Language, Permission, OrderStatus, OrderType } from '../../types';
import { HomeIcon, TakeawayIcon, TruckIcon, ClockIcon, UserCircleIcon, EyeIcon, ChevronDownIcon } from '../icons/Icons';
import { useTimeAgo } from '../../hooks/useTimeAgo';
import { useUI } from '../../contexts/UIContext';
import { useOrders } from '../../contexts/OrderContext';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { formatNumber } from '../../utils/helpers';

interface OrderCardProps {
    order: Order;
    style?: React.CSSProperties;
    className?: string;
}

export const OrderCard: React.FC<OrderCardProps> = ({ order, style, className }) => {
    const { language, t } = useUI();
    const { currentUser, hasPermission } = useAuth();
    const { restaurantInfo } = useData();
    const { updateOrder, setRefusingOrder, setViewingOrder } = useOrders();

    const isDriver = currentUser?.role === 'driver';
    const canManage = hasPermission('manage_order_status');
    const timeAgo = useTimeAgo(order.timestamp, language);

    const currentStatusDetails = restaurantInfo?.orderStatusColumns.find(s => s.id === order.status);
    const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
    
    const renderActions = () => {
        if (!restaurantInfo) return null;
        if (isDriver && order.status === 'out_for_delivery') {
            return (
                <div className="flex gap-2">
                    <button onClick={(e) => { e.stopPropagation(); updateOrder(order.id, { status: 'completed' }); }} className="text-xs font-bold bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600">{t.markAsDelivered}</button>
                    <button onClick={(e) => { e.stopPropagation(); setRefusingOrder(order); }} className="text-xs font-bold bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600">{t.markAsRefused}</button>
                </div>
            );
        }
        if (canManage) {
            return (
                 <div className="relative">
                    <select
                        value={order.status}
                        onChange={(e) => {
                            e.stopPropagation();
                            const newStatus = e.target.value as OrderStatus;
                            if (newStatus === 'refused' && order.status !== 'refused') {
                                setRefusingOrder(order);
                            } else {
                                updateOrder(order.id, { status: newStatus });
                            }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="appearance-none text-sm rounded-full border-transparent focus:ring-2 focus:ring-primary-500 ps-3 pe-8 py-1 font-semibold bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100"
                    >
                    {restaurantInfo.orderStatusColumns.map(status => (
                            <option key={status.id} value={status.id}>{status.name[language]}</option>
                    ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center px-2 text-slate-700 dark:text-slate-200">
                        <ChevronDownIcon className="w-4 h-4" />
                    </div>
                </div>
            );
        }
        return null;
    };
    
    // Dynamically set border color based on status
    const statusColor = currentStatusDetails?.color || 'slate';
    const borderColorClass = `border-${statusColor}-500`;
    
    const getOrderTypeColorClasses = (orderType: OrderType): string => {
        switch (orderType) {
            case 'Dine-in':
                return 'bg-indigo-50 dark:bg-indigo-950 hover:bg-indigo-100 dark:hover:bg-indigo-900';
            case 'Takeaway':
                return 'bg-amber-50 dark:bg-amber-950 hover:bg-amber-100 dark:hover:bg-amber-900';
            case 'Delivery':
                return 'bg-green-50 dark:bg-green-950 hover:bg-green-100 dark:hover:bg-green-900';
            default:
                return 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50';
        }
    };
    
    const customerName = order.orderType === 'Dine-in' && order.tableNumber ? (
        `${t.table}: ${formatNumber(parseInt(order.tableNumber, 10))}`
    ) : (
        order.customer.name || 'Guest'
    );
    
    return (
        <div 
            onClick={() => setViewingOrder(order)} 
            style={style} 
            className={`rounded-lg shadow-md p-3 cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 border-s-4 ${borderColorClass} ${getOrderTypeColorClasses(order.orderType)} ${className || ''}`}
        >
            <div className="space-y-2.5">
                {/* Top Row: Price and Order ID */}
                <div className={`flex justify-between items-center ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                    <p className="font-extrabold text-xl text-slate-800 dark:text-slate-100">
                        {order.total.toFixed(2)}
                        <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 ms-1">{t.currency}</span>
                    </p>
                    <p className="font-mono text-xs text-slate-500 dark:text-slate-400">{order.id}</p>
                </div>

                {/* Middle Row: Time and Customer */}
                <div className={`flex justify-between items-center ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <ClockIcon className="w-4 h-4" />
                        <span>{timeAgo}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-bold text-base text-slate-700 dark:text-slate-200">
                        {language === 'ar' ? (
                            <>
                                <UserCircleIcon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                                <span className="truncate" title={customerName}>{customerName}</span>
                            </>
                        ) : (
                            <>
                                <span className="truncate" title={customerName}>{customerName}</span>
                                <UserCircleIcon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                            </>
                        )}
                    </div>
                </div>

                {/* Bottom Row: Actions and Item Count */}
                <div className={`flex justify-between items-center pt-2 border-t border-slate-200/80 dark:border-slate-700/80 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                    <div className="flex items-center gap-1">
                        <button onClick={(e) => { e.stopPropagation(); setViewingOrder(order); }} className="p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full" title={t.viewOrderDetails}>
                            <EyeIcon className="w-5 h-5" />
                        </button>
                        {renderActions()}
                    </div>
                    <span className="text-xs font-semibold bg-slate-200 dark:bg-slate-700 px-2.5 py-1 rounded-full text-slate-700 dark:text-slate-200">
                        {totalItems} {t.items}
                    </span>
                </div>
            </div>
        </div>
    );
};
