import React, { useState, useMemo } from 'react';
import { ReportHeader } from './ReportHeader';
import { DataTable } from './DataTable';
import { useUI } from '../../../contexts/UIContext';
import { useOrders } from '../../../contexts/OrderContext';
import { useUserManagement } from '../../../contexts/UserManagementContext';
import { useAuth } from '../../../contexts/AuthContext';
import { getStartAndEndDates } from '../../../utils/helpers';
import type { User } from '../../../types';


export const UserActivityReportPage: React.FC = () => {
    const { t, language } = useUI();
    const { orders } = useOrders();
    const { users } = useUserManagement();
    const { roles } = useAuth();
    const [dateRange, setDateRange] = useState('thisMonth');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    const activityData = useMemo(() => {
        const userStats: { [userId: string]: { ordersCreated: number; totalSalesValue: number } } = {};

        const { startDate, endDate } = getStartAndEndDates(dateRange, customStartDate, customEndDate);

        orders
            .filter(o => {
                const orderDate = new Date(o.timestamp);
                return o.createdBy && orderDate >= startDate && orderDate <= endDate;
            })
            .forEach(order => {
                const userId = order.createdBy!.toString();
                if (!userStats[userId]) {
                    userStats[userId] = { ordersCreated: 0, totalSalesValue: 0 };
                }
                userStats[userId].ordersCreated += 1;
                userStats[userId].totalSalesValue += order.total;
            });
        
        return users
            .map(user => ({
                ...user,
                roleName: roles.find(r => r.key === user.role)?.name[language] || user.role,
                ordersCreated: userStats[user.id]?.ordersCreated || 0,
                totalSalesValue: userStats[user.id]?.totalSalesValue || 0,
            }))
            .filter(u => u.ordersCreated > 0);

    }, [orders, users, roles, dateRange, language, customStartDate, customEndDate]);

    const columns = useMemo(() => [
        { Header: t.user, accessor: 'name' },
        { Header: t.role, accessor: 'roleName' },
        { Header: t.ordersCreated, accessor: 'ordersCreated' },
        { Header: t.totalSalesValue, accessor: 'totalSalesValue', Cell: (row: any) => `${row.totalSalesValue.toFixed(2)} ${t.currency}` },
    ], [t]);

    return (
        <div>
            <ReportHeader 
                title={t.userActivityReport} 
                dateRange={dateRange} 
                setDateRange={setDateRange}
                customStartDate={customStartDate}
                setCustomStartDate={setCustomStartDate}
                customEndDate={customEndDate}
                setCustomEndDate={setCustomEndDate}
            />
            <DataTable columns={columns} data={activityData} />
        </div>
    );
};
