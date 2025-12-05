
import React, { useState, useMemo } from 'react';
import { ReportHeader } from './ReportHeader';
import { DataTable } from './DataTable';
import { useUI } from '../../../contexts/UIContext';
import { useOrders } from '../../../contexts/OrderContext';
import { useData } from '../../../contexts/DataContext';
import { formatDateTime, getStartAndEndDates } from '../../../utils/helpers';
import type { Order } from '../../../types';

export const OrdersReportPage: React.FC = () => {
    const { t, language } = useUI();
    const { orders, setViewingOrder } = useOrders();
    const { restaurantInfo } = useData();
    const [dateRange, setDateRange] = useState('thisMonth');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    const ordersData = useMemo(() => {
        const { startDate, endDate } = getStartAndEndDates(dateRange, customStartDate, customEndDate);
        return orders.filter(o => {
            const orderDate = new Date(o.timestamp);
            return orderDate >= startDate && orderDate <= endDate;
        }).map(o => ({
            ...o,
            // Flatten fields to ensure they are picked up by the simple text search
            searchCustomerName: o.customer.name,
            searchCustomerMobile: o.customer.mobile,
            searchNotes: o.notes,
            searchTable: o.tableNumber
        }));
    }, [orders, dateRange, customStartDate, customEndDate]);

    const columns = useMemo(() => {
         const getStatusChipColor = (statusId: string) => {
            const color = restaurantInfo?.orderStatusColumns.find(s => s.id === statusId)?.color || 'slate';
            return `bg-${color}-100 text-${color}-800 dark:bg-${color}-900/50 dark:text-${color}-300`;
        };
        
        return [
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
                Header: t.status, 
                accessor: 'status',
                Cell: (row: Order) => (
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusChipColor(row.status)}`}>
                        {restaurantInfo?.orderStatusColumns.find(s => s.id === row.status)?.name[language] || row.status}
                    </span>
                )
            },
            { 
                Header: t.orderType, 
                accessor: 'orderType',
                Cell: (row: Order) => t[row.orderType === 'Dine-in' ? 'dineIn' : row.orderType === 'Delivery' ? 'delivery' : 'takeaway']
            },
            { 
                Header: t.total, 
                accessor: 'total',
                Cell: (row: Order) => `${row.total.toFixed(2)} ${t.currency}`
            },
        ];
    }, [t, language, restaurantInfo]);

    return (
        <div>
            <ReportHeader 
                title={t.ordersReport} 
                dateRange={dateRange} 
                setDateRange={setDateRange}
                customStartDate={customStartDate}
                setCustomStartDate={setCustomStartDate}
                customEndDate={customEndDate}
                setCustomEndDate={setCustomEndDate}
            />
            <DataTable columns={columns} data={ordersData} onRowClick={setViewingOrder} />
        </div>
    );
};
