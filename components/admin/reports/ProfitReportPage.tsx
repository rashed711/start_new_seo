
import React, { useState, useMemo } from 'react';
import { ReportHeader } from './ReportHeader';
import { DataTable } from './DataTable';
import { useUI } from '../../../contexts/UIContext';
import { useOrders } from '../../../contexts/OrderContext';
import { useData } from '../../../contexts/DataContext';
import { formatDateTime, getStartAndEndDates } from '../../../utils/helpers';
import type { Order } from '../../../types';

export const ProfitReportPage: React.FC = () => {
    const { t, language } = useUI();
    const { orders, setViewingOrder } = useOrders();
    const { restaurantInfo, products } = useData(); 
    const [dateRange, setDateRange] = useState('thisMonth');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    
    const completedStatusId = useMemo(() => {
        return restaurantInfo?.orderStatusColumns.find(col => col.color === 'green')?.id || 'completed';
    }, [restaurantInfo]);

    const profitData = useMemo(() => {
        const { startDate, endDate } = getStartAndEndDates(dateRange, customStartDate, customEndDate);

        return orders
            .filter(o => {
                const orderDate = new Date(o.timestamp);
                return o.status === completedStatusId && orderDate >= startDate && orderDate <= endDate;
            })
            .map(o => {
                const cogs = o.items.reduce((sum, item) => {
                    const currentProduct = products?.find(p => p.id === item.product.id);
                    const cost = currentProduct?.cost_price || 0;
                    return sum + (cost * item.quantity);
                }, 0);
                const profit = o.total - cogs;
                
                return {
                    id: o.id,
                    timestamp: o.timestamp,
                    revenue: o.total,
                    cogs: cogs,
                    profit: profit,
                    // Flatten data for search
                    customerName: o.customer.name,
                    customerMobile: o.customer.mobile,
                    notes: o.notes,
                    itemsSearch: o.items.map(i => i.product.name[language] || i.product.name.en).join(' ')
                };
            });
    }, [orders, dateRange, completedStatusId, customStartDate, customEndDate, products, language]); 
    
    const totals = useMemo(() => profitData.reduce((acc, curr) => ({
        revenue: acc.revenue + curr.revenue,
        cogs: acc.cogs + curr.cogs,
        profit: acc.profit + curr.profit
    }), { revenue: 0, cogs: 0, profit: 0 }), [profitData]);

    const columns = useMemo(() => [
        { Header: t.orderId, accessor: 'id' },
        { Header: t.date, accessor: 'timestamp', Cell: (row: any) => formatDateTime(row.timestamp) },
        { Header: t.grossRevenue, accessor: 'revenue', Cell: (row: any) => `${row.revenue.toFixed(2)} ${t.currency}` },
        { Header: t.costOfGoodsSold, accessor: 'cogs', Cell: (row: any) => `${row.cogs.toFixed(2)} ${t.currency}` },
        { Header: t.actualProfit, accessor: 'profit', Cell: (row: any) => <span className="font-bold text-green-600 dark:text-green-400">{row.profit.toFixed(2)} {t.currency}</span> },
    ], [t]);

    const handleRowClick = (row: { id: string }) => {
        const fullOrder = orders.find(o => o.id === row.id);
        if (fullOrder) {
            setViewingOrder(fullOrder);
        }
    };

    return (
        <div>
            <ReportHeader 
                title={t.profitReport} 
                dateRange={dateRange} 
                setDateRange={setDateRange}
                customStartDate={customStartDate}
                setCustomStartDate={setCustomStartDate}
                customEndDate={customEndDate}
                setCustomEndDate={setCustomEndDate}
            />
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm"><h4 className="text-sm text-slate-500">{t.grossRevenue}</h4><p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{totals.revenue.toFixed(2)}</p></div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm"><h4 className="text-sm text-slate-500">{t.costOfGoodsSold}</h4><p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{totals.cogs.toFixed(2)}</p></div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm"><h4 className="text-sm text-green-600">{t.actualProfit}</h4><p className="text-2xl font-bold text-green-600 dark:text-green-400">{totals.profit.toFixed(2)}</p></div>
            </div>
             <div className="p-3 mb-6 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 text-yellow-800 dark:text-yellow-200 text-sm">
                {t.profitNotice}
            </div>
            <DataTable columns={columns} data={profitData} onRowClick={handleRowClick} />
        </div>
    );
};
