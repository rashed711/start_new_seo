import React, { useState, useMemo } from 'react';
import { ReportHeader } from './ReportHeader';
import { DataTable } from './DataTable';
import { useUI } from '../../../contexts/UIContext';
import { useOrders } from '../../../contexts/OrderContext';
import { useData } from '../../../contexts/DataContext';
import { formatDateTime, getStartAndEndDates } from '../../../utils/helpers';
import type { Order } from '../../../types';

export const PaymentsReportPage: React.FC = () => {
    const { t, language } = useUI();
    const { orders, setViewingOrder } = useOrders();
    const { restaurantInfo } = useData();
    const [dateRange, setDateRange] = useState('thisMonth');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    const paymentData = useMemo(() => {
        const { startDate, endDate } = getStartAndEndDates(dateRange, customStartDate, customEndDate);
        return orders.filter(o => {
            const orderDate = new Date(o.timestamp);
            return orderDate >= startDate && orderDate <= endDate;
        });
    }, [orders, dateRange, customStartDate, customEndDate]);

    const columns = useMemo(() => {
        const getPaymentStatusText = (order: Order) => {
            // If a specific payment detail is recorded (and it's not just the default COD placeholder),
            // it means the payment has been collected or confirmed, so it's "Paid".
            if (order.paymentDetail && order.paymentDetail !== t.cashOnDelivery) {
                return t.paymentStatusPaidOnline; // Using this as a generic "Paid" status.
            }
            
            // For orders initiated as "Online Payment", we consider them in a "paid" state.
            if (order.paymentMethod === 'online') {
                return t.paymentStatusPaidOnline;
            }
            
            // For "Cash on Delivery" orders where payment hasn't been specifically recorded yet.
            if (order.paymentMethod === 'cod') {
                return t.paymentStatusCod;
            }

            // Default for orders without a predefined payment method (like Dine-in) and no recorded payment.
            return t.paymentStatusUnpaid;
        };

        return [
            { Header: t.orderId, accessor: 'id' },
            { Header: t.date, accessor: 'timestamp', Cell: (row: Order) => formatDateTime(row.timestamp) },
            { 
                Header: t.paymentMethod, 
                accessor: 'paymentMethod', 
                Cell: (row: Order) => {
                    // Priority 1: Show the specific, recorded payment detail if it exists.
                    if (row.paymentDetail) {
                        return row.paymentDetail;
                    }
                    // Priority 2: Fallback to the general method selected at checkout.
                    if (row.paymentMethod === 'cod') {
                        return t.cashOnDelivery;
                    }
                    if (row.paymentMethod === 'online') {
                        return t.onlinePayment;
                    }
                    // Fallback for types like Dine-in before payment is recorded.
                    return 'N/A';
                }
            },
            { Header: t.paymentStatus, accessor: 'status', Cell: getPaymentStatusText },
            { Header: t.total, accessor: 'total', Cell: (row: Order) => `${row.total.toFixed(2)} ${t.currency}` },
        ];
    }, [t]);
    
    const { totals, onlineBreakdown, codBreakdown } = useMemo(() => {
        const onlineMethodNames = restaurantInfo?.onlinePaymentMethods.map(m => m.name[language]) || [];
        const onlineBreakdown: { [methodName: string]: number } = {};
        const codBreakdown: { [methodName: string]: number } = {};

        const totalsResult = paymentData.reduce((acc, order) => {
            const isOnlinePaymentRecordedByStaff = order.paymentDetail && onlineMethodNames.includes(order.paymentDetail);

            if (order.paymentMethod === 'online' || isOnlinePaymentRecordedByStaff) {
                const detail = order.paymentDetail || t.onlinePayment; // Fallback for online orders without detail
                acc.online += order.total;
                if (!onlineBreakdown[detail]) onlineBreakdown[detail] = 0;
                onlineBreakdown[detail] += order.total;
            } else {
                // This covers all other cases: COD, Dine-in/Takeaway paid with Cash, or still Unpaid
                acc.cod += order.total;
                // If payment detail exists (e.g., 'Cash'), use it. Otherwise, categorize based on method or status.
                const detail = order.paymentDetail || (order.paymentMethod === 'cod' ? t.cashOnDelivery : t.paymentStatusUnpaid);
                if (!codBreakdown[detail]) codBreakdown[detail] = 0;
                codBreakdown[detail] += order.total;
            }
            return acc;
        }, { online: 0, cod: 0 });

        const sortedOnlineBreakdown = Object.entries(onlineBreakdown)
            .sort(([, a], [, b]) => b - a)
            .map(([name, total]) => ({ name, total }));
            
        const sortedCodBreakdown = Object.entries(codBreakdown)
            .sort(([, a], [, b]) => b - a)
            .map(([name, total]) => ({ name, total }));

        return { totals: totalsResult, onlineBreakdown: sortedOnlineBreakdown, codBreakdown: sortedCodBreakdown };
    }, [paymentData, restaurantInfo, language, t.onlinePayment, t.cashOnDelivery, t.paymentStatusUnpaid]);


    return (
        <div>
            <ReportHeader 
                title={t.paymentsReport} 
                dateRange={dateRange} 
                setDateRange={setDateRange}
                customStartDate={customStartDate}
                setCustomStartDate={setCustomStartDate}
                customEndDate={customEndDate}
                setCustomEndDate={setCustomEndDate}
            />
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm">
                    <h4 className="text-sm text-slate-500">{t.totalPaidOnline}</h4>
                    <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{totals.online.toFixed(2)}</p>
                    {onlineBreakdown.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2">
                            {onlineBreakdown.map(method => (
                                <div key={method.name} className="flex justify-between items-center text-sm">
                                    <span className="text-slate-600 dark:text-slate-300">{method.name}</span>
                                    <span className="font-semibold text-slate-800 dark:text-slate-100">{method.total.toFixed(2)} {t.currency}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm">
                    <h4 className="text-sm text-slate-500">{t.totalCOD}</h4>
                    <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{totals.cod.toFixed(2)}</p>
                     {codBreakdown.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2">
                            {codBreakdown.map(method => (
                                <div key={method.name} className="flex justify-between items-center text-sm">
                                    <span className="text-slate-600 dark:text-slate-300">{method.name}</span>
                                    <span className="font-semibold text-slate-800 dark:text-slate-100">{method.total.toFixed(2)} {t.currency}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <DataTable columns={columns} data={paymentData} onRowClick={setViewingOrder} />
        </div>
    );
};
