
import React, { useState, useMemo } from 'react';
import { ReportHeader } from './ReportHeader';
import { DataTable } from './DataTable';
import { useUI } from '../../../contexts/UIContext';
import { useOrders } from '../../../contexts/OrderContext';
import { useData } from '../../../contexts/DataContext';
import { getStartAndEndDates } from '../../../utils/helpers';
import type { Product } from '../../../types';

export const ProductsReportPage: React.FC = () => {
    const { t, language } = useUI();
    const { orders } = useOrders();
    const { products, categories } = useData();
    const [dateRange, setDateRange] = useState('thisMonth');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    const productsData = useMemo(() => {
        const productStats: { [id: string]: { quantitySold: number; revenue: number } } = {};

        const { startDate, endDate } = getStartAndEndDates(dateRange, customStartDate, customEndDate);

        orders
            .filter(o => {
                const orderDate = new Date(o.timestamp);
                return orderDate >= startDate && orderDate <= endDate;
            })
            .forEach(order => {
                if (Array.isArray(order.items)) {
                    order.items.forEach(item => {
                        if (item && item.product) {
                            const pid = item.product.id;
                            if (!productStats[pid]) {
                                productStats[pid] = { quantitySold: 0, revenue: 0 };
                            }
                            // Ensure quantity is a number
                            const qty = typeof item.quantity === 'string' ? parseInt(item.quantity, 10) : item.quantity;
                            const price = typeof item.product.price === 'string' ? parseFloat(item.product.price) : item.product.price;
                            
                            productStats[pid].quantitySold += qty;
                            productStats[pid].revenue += price * qty;
                        }
                    });
                }
            });

        return products.map(product => ({
            ...product,
            // FLATTENED NAME FOR SEARCHING:
            productName: product.name[language], 
            categoryName: categories.find(c => c.id === product.categoryId)?.name[language] || 'N/A',
            quantitySold: productStats[product.id]?.quantitySold || 0,
            revenue: productStats[product.id]?.revenue || 0,
        })).filter(p => p.quantitySold > 0);

    }, [orders, products, categories, dateRange, language, customStartDate, customEndDate]);

    const columns = useMemo(() => [
        // Use the flattened 'productName' field for the accessor
        { Header: t.product, accessor: 'productName' },
        { Header: t.category, accessor: 'categoryName' },
        { Header: t.quantitySold, accessor: 'quantitySold' },
        { Header: t.revenue, accessor: 'revenue', Cell: (row: any) => `${row.revenue.toFixed(2)} ${t.currency}` },
    ], [t, language]);

    return (
        <div>
            <ReportHeader 
                title={t.productsReport} 
                dateRange={dateRange} 
                setDateRange={setDateRange}
                customStartDate={customStartDate}
                setCustomStartDate={setCustomStartDate}
                customEndDate={customEndDate}
                setCustomEndDate={setCustomEndDate}
            />
            <DataTable columns={columns} data={productsData} />
        </div>
    );
};
