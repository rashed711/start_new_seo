import React, { useState, useMemo } from 'react';
import { ReportHeader } from './ReportHeader';
import { DataTable } from './DataTable';
import { useUI } from '../../../contexts/UIContext';
import { useOrders } from '../../../contexts/OrderContext';
import { formatDate, getStartAndEndDates } from '../../../utils/helpers';
import type { Order } from '../../../types';

export const CustomersReportPage: React.FC = () => {
    const { t } = useUI();
    const { orders } = useOrders();
    const [dateRange, setDateRange] = useState('thisMonth');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    const customerData = useMemo(() => {
        const customerMap: { [mobile: string]: { name: string; mobile: string; firstOrder: Date; lastOrder: Date; totalOrders: number; totalSpent: number; } } = {};
        
        const { startDate, endDate } = getStartAndEndDates(dateRange, customStartDate, customEndDate);
        
        const filteredOrders = orders.filter(o => {
            const orderDate = new Date(o.timestamp);
            return orderDate >= startDate && orderDate <= endDate;
        });

        filteredOrders.forEach(order => {
            const mobile = order.customer.mobile;
            if (!mobile || order.orderType === 'Dine-in') return; // Exclude dine-in table "customers"

            const orderDate = new Date(order.timestamp);
            if (!customerMap[mobile]) {
                customerMap[mobile] = {
                    name: order.customer.name || 'N/A',
                    mobile: mobile,
                    firstOrder: orderDate,
                    lastOrder: orderDate,
                    totalOrders: 0,
                    totalSpent: 0,
                };
            }
            
            const customer = customerMap[mobile];
            customer.totalOrders += 1;
            customer.totalSpent += order.total;
            if (orderDate < customer.firstOrder) customer.firstOrder = orderDate;
            if (orderDate > customer.lastOrder) customer.lastOrder = orderDate;
        });

        return Object.values(customerMap);
    }, [orders, dateRange, customStartDate, customEndDate]);

    const columns = useMemo(() => [
        { Header: t.customer, accessor: 'name' },
        { Header: t.mobileNumber, accessor: 'mobile' },
        { Header: t.totalOrders, accessor: 'totalOrders' },
        { Header: t.totalSpent, accessor: 'totalSpent', Cell: (row: any) => `${row.totalSpent.toFixed(2)} ${t.currency}` },
        { Header: t.firstOrderDate, accessor: 'firstOrder', Cell: (row: any) => formatDate(row.firstOrder.toISOString()) },
        { Header: t.lastOrderDate, accessor: 'lastOrder', Cell: (row: any) => formatDate(row.lastOrder.toISOString()) },
    ], [t]);

    return (
        <div>
            <ReportHeader 
                title={t.customersReport} 
                dateRange={dateRange} 
                setDateRange={setDateRange}
                customStartDate={customStartDate}
                setCustomStartDate={setCustomStartDate}
                customEndDate={customEndDate}
                setCustomEndDate={setCustomEndDate}
            />
            <DataTable columns={columns} data={customerData} />
        </div>
    );
};
