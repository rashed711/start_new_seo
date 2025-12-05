
import React, { useState, useMemo } from 'react';
import { ReportHeader } from './ReportHeader';
import { useUI } from '../../../contexts/UIContext';
import { useOrders } from '../../../contexts/OrderContext';
import { useData } from '../../../contexts/DataContext';
import { useAuth } from '../../../contexts/AuthContext';
import { formatNumber, getStartAndEndDates } from '../../../utils/helpers';
import { ArrowDownIcon, ArrowUpIcon, InformationCircleIcon } from '../../icons/Icons';
import type { Product, OrderType } from '../../../types';

// Simple, dependency-free components for data visualization
const KpiCard: React.FC<{ title: string; value: string; change?: number; tooltip: string }> = ({ title, value, change, tooltip }) => {
    const { t } = useUI();
    const isPositive = change !== undefined && change >= 0;

    return (
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200/80 dark:border-slate-700/80 h-full">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400">{title}</h3>
                <div className="relative group">
                    <InformationCircleIcon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <div className="absolute bottom-full mb-2 -translate-x-1/2 left-1/2 w-60 p-2 text-xs text-white bg-slate-900 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        {tooltip}
                    </div>
                </div>
            </div>
            <p className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-2">{value}</p>
            {change !== undefined && (
                <div className={`mt-1 flex items-center gap-1 text-xs font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {isPositive ? <ArrowUpIcon className="w-3 h-3" /> : <ArrowDownIcon className="w-3 h-3" />}
                    <span>{Math.abs(change).toFixed(1)}%</span>
                    <span className="text-slate-500 font-normal">{t.vsPreviousPeriod}</span>
                </div>
            )}
        </div>
    );
};

const BarChart: React.FC<{ data: { label: string, value: number }[], valueFormatter?: (value: number) => string }> = ({ data, valueFormatter = formatNumber }) => {
    const maxValue = Math.max(...data.map(d => d.value), 1);
    return (
        <div className="space-y-3">
            {data.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-x-2 sm:gap-x-3 items-center text-sm">
                    <div className="col-span-5 sm:col-span-4 truncate font-medium text-slate-600 dark:text-slate-300" title={item.label}>
                        {item.label}
                    </div>
                    <div className="col-span-5 sm:col-span-6 bg-slate-200 dark:bg-slate-700 rounded-full h-4">
                        <div
                            className="bg-primary-500 h-4 rounded-full"
                            style={{ width: `${(item.value / maxValue) * 100}%` }}
                        />
                    </div>
                    <div className="col-span-2 text-right font-semibold text-slate-800 dark:text-slate-100">
                        {valueFormatter(item.value)}
                    </div>
                </div>
            ))}
        </div>
    );
};

const DonutChart: React.FC<{ data: { label: string, value: number, color: string }[] }> = ({ data }) => {
    const { t } = useUI();
    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) return <div className="flex items-center justify-center h-full text-slate-500">{t.noDataForPeriod}</div>;
    
    let accumulatedAngle = 0;
    const circumference = 2 * Math.PI * 45; // r=45
    
    return (
        <div className="flex flex-col sm:flex-row items-center gap-6 h-full">
            <div className="relative w-40 h-40 flex-shrink-0">
                <svg viewBox="0 0 100 100" className="-rotate-90">
                    {data.map((segment, index) => {
                        const percentage = (segment.value / total) * 100;
                        const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
                        const strokeDashoffset = -accumulatedAngle * (circumference / 100);
                        accumulatedAngle += percentage;
                        return (
                            <circle key={index} cx="50" cy="50" r="45" fill="transparent" stroke={segment.color} strokeWidth="10" strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} />
                        );
                    })}
                </svg>
            </div>
            <div className="space-y-3 text-sm w-full">
                {data.map((segment, index) => {
                     const percentage = total > 0 ? (segment.value / total) * 100 : 0;
                     const displayPercentage = isNaN(percentage) ? 0 : percentage;
                    return (
                    <div key={index} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: segment.color }}></div>
                            <span className="font-semibold text-slate-700 dark:text-slate-200">{segment.label}</span>
                        </div>
                        <div className="text-right">
                           <span className="font-bold text-slate-800 dark:text-slate-100">{formatNumber(segment.value)}</span>
                           <span className="text-xs font-medium text-slate-500 dark:text-slate-400 ms-1">{t.orders}</span>
                           <span className="text-slate-500 dark:text-slate-400 text-xs ms-1.5">({displayPercentage.toFixed(1)}%)</span>
                        </div>
                    </div>
                )})}
            </div>
        </div>
    );
};

const tailwindColorMap: { [key: string]: string } = {
  slate: '#64748b',
  red: '#ef4444',
  orange: '#f97316',
  yellow: '#f59e0b',
  green: '#10b981',
  cyan: '#06b6d4',
  blue: '#3b82f6',
  indigo: '#4f46e5',
  purple: '#8b5cf6',
  pink: '#ec4899',
};

export const DashboardPage: React.FC = () => {
    const { language, t } = useUI();
    const { orders: allOrders } = useOrders();
    const { products: allProducts, restaurantInfo } = useData();
    const { currentUser, hasPermission } = useAuth();
    const [dateRange, setDateRange] = useState('thisMonth');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    const completedStatusId = useMemo(() => {
        // Fallback to 'completed' but prioritize the configured green status
        return restaurantInfo?.orderStatusColumns.find(col => col.color === 'green')?.id || 'completed';
    }, [restaurantInfo]);

    const permissionFilteredOrders = useMemo(() => {
        if (!currentUser || !hasPermission('view_reports_page')) return [];

        const canViewDineIn = hasPermission('view_dine_in_orders');
        const canViewTakeaway = hasPermission('view_takeaway_orders');
        const canViewDelivery = hasPermission('view_delivery_orders');
        
        const hasSpecificOrderTypePermission = canViewDineIn || canViewTakeaway || canViewDelivery;
        
        if (!hasSpecificOrderTypePermission) {
            return allOrders;
        }
    
        const allowedTypes: OrderType[] = [];
        if (canViewDineIn) allowedTypes.push('Dine-in');
        if (canViewTakeaway) allowedTypes.push('Takeaway');
        if (canViewDelivery) allowedTypes.push('Delivery');
    
        return allOrders.filter(order => allowedTypes.includes(order.orderType));
    }, [allOrders, currentUser, hasPermission]);

    const filteredOrders = useMemo(() => {
        const { startDate, endDate } = getStartAndEndDates(dateRange, customStartDate, customEndDate);
        return permissionFilteredOrders.filter(o => {
            const orderDate = new Date(o.timestamp);
            return orderDate >= startDate && orderDate <= endDate;
        });
    }, [permissionFilteredOrders, dateRange, customStartDate, customEndDate]);

    const metrics = useMemo(() => {
        const completed = filteredOrders.filter(o => o.status === completedStatusId || o.status === 'completed');
        const revenue = completed.reduce((sum, order) => sum + order.total, 0);
        return {
            totalRevenue: revenue,
            totalOrders: filteredOrders.length,
            avgOrderValue: completed.length > 0 ? revenue / completed.length : 0,
            completedOrders: completed.length,
        };
    }, [filteredOrders, completedStatusId]);

    const topProducts = useMemo(() => {
        const stats: { [key: number]: number } = {};
        
        filteredOrders
            .filter(o => o.status === completedStatusId || o.status === 'completed')
            .forEach(order => {
                let items = order.items;
                // Robustly parse items if it's a JSON string or not an array
                if (typeof items === 'string') {
                    try { items = JSON.parse(items); } catch (e) { items = []; }
                }
                
                // Handle cases where items might be an object (PHP associative array encoded as object)
                const itemsList = Array.isArray(items) ? items : (items && typeof items === 'object' ? Object.values(items) : []);

                itemsList.forEach((item: any) => {
                    if (item && item.product && item.product.id) {
                        // Robustly parse quantity to ensure we are summing numbers
                        let qty = 0;
                        if (typeof item.quantity === 'number') {
                            qty = item.quantity;
                        } else if (typeof item.quantity === 'string') {
                            // Parse float handles "1" and "1.5" correctly
                            qty = parseFloat(item.quantity);
                        }
                        
                        if (!isNaN(qty) && qty > 0) {
                            const productId = Number(item.product.id);
                            const currentCount = stats[productId] || 0;
                            stats[productId] = currentCount + qty;
                        }
                    }
                });
            });

        return Object.entries(stats)
            .map(([id, quantity]) => ({ 
                product: allProducts.find(p => p.id === Number(id)), 
                quantity 
            }))
            .filter((p): p is { product: Product; quantity: number } => !!p.product && p.quantity > 0)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5)
            .map(p => ({ label: p.product.name[language], value: p.quantity }));
    }, [filteredOrders, allProducts, completedStatusId, language]);
    
    const topGovernorates = useMemo(() => {
        const stats: { [key: string]: number } = {};
        filteredOrders
            .filter(o => (o.status === completedStatusId || o.status === 'completed') && o.customer.address)
            .forEach(order => {
                const addressParts = order.customer.address!.split(',');
                const governorate = addressParts.pop()?.trim();
                if (governorate) {
                    stats[governorate] = (stats[governorate] || 0) + order.total;
                }
            });

        return Object.entries(stats)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5) // Top 5
            .map(([label, value]) => ({ label, value }));
    }, [filteredOrders, completedStatusId]);


    const orderStatusDistribution = useMemo(() => {
        if (!restaurantInfo) return [];

        return restaurantInfo.orderStatusColumns
            .map(status => {
                const count = filteredOrders.filter(o => 
                    o.status === status.id || 
                    (status.id === 'cancelled' && o.status === 'refused')
                ).length;
                
                return {
                    label: status.name[language],
                    value: count,
                    color: tailwindColorMap[status.color] || '#64748b' // fallback to slate
                };
            })
            .filter(item => item.value > 0); // Only show statuses with orders

    }, [filteredOrders, restaurantInfo, language]);
    
    return (
        <div className="space-y-6 animate-fade-in">
             <ReportHeader 
                title={t.reportsDashboard}
                dateRange={dateRange}
                setDateRange={setDateRange}
                customStartDate={customStartDate}
                setCustomStartDate={setCustomStartDate}
                customEndDate={customEndDate}
                setCustomEndDate={setCustomEndDate}
            />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                
                <div className="order-1 lg:order-1">
                    <KpiCard title={t.totalRevenue} value={`${metrics.totalRevenue.toFixed(2)} ${t.currency}`} tooltip={t.totalRevenueTooltip} />
                </div>
                <div className="order-2 lg:order-2">
                    <KpiCard title={t.totalOrders} value={formatNumber(metrics.totalOrders)} tooltip={t.totalOrdersTooltip} />
                </div>
                <div className="order-3 lg:order-3">
                    <KpiCard title={t.completedOrders} value={formatNumber(metrics.completedOrders)} tooltip={""} />
                </div>
                <div className="order-4 lg:order-4">
                    <KpiCard title={t.avgOrderValue} value={`${metrics.avgOrderValue.toFixed(2)} ${t.currency}`} tooltip={t.avgOrderValueTooltip} />
                </div>

                <div className="order-6 sm:col-span-2 lg:col-span-4 lg:order-5 bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border dark:border-slate-700/80">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4">
                        <h3 className="font-semibold text-slate-800 dark:text-slate-100">{t.topSellingProducts}</h3>
                    </div>
                    {topProducts.length > 0 ? <BarChart data={topProducts} /> : <div className="flex items-center justify-center h-40 text-slate-500">{t.noDataForPeriod}</div>}
                </div>
                
                <div className="order-5 sm:col-span-2 lg:col-span-2 lg:order-6 bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border dark:border-slate-700/80">
                    <h3 className="font-semibold mb-4 text-slate-800 dark:text-slate-100">{t.orderStatusDistribution}</h3>
                    <DonutChart data={orderStatusDistribution} />
                </div>
                
                <div className="order-7 sm:col-span-2 lg:col-span-2 lg:order-7 bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border dark:border-slate-700/80">
                    <h3 className="font-semibold mb-4 text-slate-800 dark:text-slate-100">{t.topGovernoratesBySales}</h3>
                    {topGovernorates.length > 0 ? <BarChart data={topGovernorates} valueFormatter={v => v.toFixed(2)} /> : <div className="flex items-center justify-center h-40 text-slate-500">{t.noDataForPeriod}</div>}
                </div>

            </div>

        </div>
    );
};
