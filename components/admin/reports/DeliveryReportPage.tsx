import React, { useState, useMemo } from 'react';
import { ReportHeader } from './ReportHeader';
import { DataTable } from './DataTable';
import { useUI } from '../../../contexts/UIContext';
import { useOrders } from '../../../contexts/OrderContext';
import { useData } from '../../../contexts/DataContext';
import { formatDateTime, getStartAndEndDates } from '../../../utils/helpers';
import type { Order } from '../../../types';

export const DeliveryReportPage: React.FC = () => {
    const { t, language } = useUI();
    const { orders, setViewingOrder } = useOrders();
    const { restaurantInfo } = useData();
    const [dateRange, setDateRange] = useState('thisMonth');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    const deliveryData = useMemo(() => {
        const { startDate, endDate } = getStartAndEndDates(dateRange, customStartDate, customEndDate);
        return orders.filter(o => {
            const orderDate = new Date(o.timestamp);
            return o.orderType === 'Delivery' && orderDate >= startDate && orderDate <= endDate;
        });
    }, [orders, dateRange, customStartDate, customEndDate]);

    const columns = useMemo(() => {
        const getStatusChipColor = (statusId: string) => {
            const color = restaurantInfo?.orderStatusColumns.find(s => s.id === statusId)?.color || 'slate';
            return `bg-${color}-100 text-${color}-800 dark:bg-${color}-900/50 dark:text-${color}-300`;
        };
        return [
            { Header: t.orderId, accessor: 'id' },
            { Header: t.date, accessor: 'timestamp', Cell: (row: Order) => formatDateTime(row.timestamp) },
            { Header: t.customer, accessor: 'customer', Cell: (row: Order) => row.customer.name },
            { Header: t.address, accessor: 'address', Cell: (row: Order) => row.customer.address },
            { Header: t.status, accessor: 'status', Cell: (row: Order) => (
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusChipColor(row.status)}`}>
                    {restaurantInfo?.orderStatusColumns.find(s => s.id === row.status)?.name[language] || row.status}
                </span>
            )},
            { Header: t.total, accessor: 'total', Cell: (row: Order) => `${row.total.toFixed(2)} ${t.currency}` },
        ];
    }, [t, language, restaurantInfo]);

    return (
        <div>
            <ReportHeader 
                title={t.deliveryReport} 
                dateRange={dateRange} 
                setDateRange={setDateRange}
                customStartDate={customStartDate}
                setCustomStartDate={setCustomStartDate}
                customEndDate={customEndDate}
                setCustomEndDate={setCustomEndDate}
            />
            <DataTable columns={columns} data={deliveryData} onRowClick={setViewingOrder} />
        </div>
    );
};
