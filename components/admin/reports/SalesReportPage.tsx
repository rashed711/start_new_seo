
import React, { useState, useMemo } from 'react';
import { ReportHeader } from './ReportHeader';
import { DataTable } from './DataTable';
import { useUI } from '../../../contexts/UIContext';
import { useOrders } from '../../../contexts/OrderContext';
import { useData } from '../../../contexts/DataContext';
import { formatDateTime, formatNumber, getStartAndEndDates } from '../../../utils/helpers';
import type { Order } from '../../../types';

export const SalesReportPage: React.FC = () => {
    const { t, language } = useUI();
    const { orders, setViewingOrder } = useOrders();
    const { restaurantInfo } = useData();
    const [dateRange, setDateRange] = useState('thisMonth');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    
    const completedStatusId = useMemo(() => {
        return restaurantInfo?.orderStatusColumns.find(col => col.color === 'green')?.id || 'completed';
    }, [restaurantInfo]);

    const salesData = useMemo(() => {
        const { startDate, endDate } = getStartAndEndDates(dateRange, customStartDate, customEndDate);

        return orders
            .filter(o => {
                const orderDate = new Date(o.timestamp);
                return o.status === completedStatusId && orderDate >= startDate && orderDate <= endDate;
            })
            .map(o => ({
                ...o,
                itemCount: o.items.reduce((sum, item) => sum + item.quantity, 0),
                // Flatten fields for search
                customerName: o.customer.name,
                customerMobile: o.customer.mobile,
                tableNumberSearch: o.tableNumber
            }));
    }, [orders, dateRange, completedStatusId, customStartDate, customEndDate]);

    const columns = useMemo(() => [
        { Header: t.orderId, accessor: 'id' },
        { 
            Header: t.date, 
            accessor: 'timestamp',
            Cell: (row: Order) => formatDateTime(row.timestamp)
        },
        { 
            Header: t.customer, 
            accessor: 'customer',
            Cell: (row: Order) => row.customer.name
        },
        { 
            Header: t.orderType, 
            accessor: 'orderType',
            Cell: (row: Order) => t[row.orderType === 'Dine-in' ? 'dineIn' : row.orderType === 'Delivery' ? 'delivery' : 'takeaway']
        },
        { Header: t.items, accessor: 'itemCount' },
        { 
            Header: t.total, 
            accessor: 'total',
            Cell: (row: Order) => `${row.total.toFixed(2)} ${t.currency}`
        },
    ], [t]);

    return (
        <div>
            <ReportHeader 
                title={t.salesReport} 
                dateRange={dateRange} 
                setDateRange={setDateRange}
                customStartDate={customStartDate}
                setCustomStartDate={setCustomStartDate}
                customEndDate={customEndDate}
                setCustomEndDate={setCustomEndDate}
            />
            <DataTable columns={columns} data={salesData} onRowClick={setViewingOrder} />
        </div>
    );
};
