import React from 'react';
import { useUI } from '../../../contexts/UIContext';
import { useAuth } from '../../../contexts/AuthContext';
import { ChartBarIcon, ClipboardListIcon, CollectionIcon, CurrencyDollarIcon, ShoppingCartIcon, TruckIcon, UserGroupIcon, UserIcon } from '../../icons/Icons'; // Assuming CurrencyDollarIcon etc are created
import type { Permission } from '../../../types';

// A simple placeholder for icons that might not exist yet
const PlaceholderIcon: React.FC<{className?: string}> = ({className}) => <div className={`w-5 h-5 bg-slate-300 rounded ${className}`} />;

const navItems: { id: string, labelKey: string, icon: React.FC<any>, permission: Permission }[] = [
    { id: 'dashboard', labelKey: 'reportsDashboard', icon: ChartBarIcon, permission: 'view_reports_page' },
    { id: 'sales', labelKey: 'salesReport', icon: CurrencyDollarIcon, permission: 'view_sales_report' },
    { id: 'orders', labelKey: 'ordersReport', icon: ShoppingCartIcon, permission: 'view_orders_report' },
    { id: 'profit', labelKey: 'profitReport', icon: PlaceholderIcon, permission: 'view_profit_report' },
    { id: 'customers', labelKey: 'customersReport', icon: UserGroupIcon, permission: 'view_customers_report' },
    { id: 'products', labelKey: 'productsReport', icon: CollectionIcon, permission: 'view_products_report' },
    { id: 'payments', labelKey: 'paymentsReport', icon: PlaceholderIcon, permission: 'view_payments_report' },
    { id: 'delivery', labelKey: 'deliveryReport', icon: TruckIcon, permission: 'view_delivery_report' },
    { id: 'userActivity', labelKey: 'userActivityReport', icon: UserIcon, permission: 'view_user_activity_report' },
];

interface ReportsSidebarProps {
    activeReport: string;
}

export const ReportsSidebar: React.FC<ReportsSidebarProps> = ({ activeReport }) => {
    const { t } = useUI();
    const { hasPermission } = useAuth();

    const handleNav = (e: React.MouseEvent, path: string) => {
        e.preventDefault();
        window.location.hash = `#/admin/reports/${path}`;
    };

    return (
        <aside className="w-full md:w-60 bg-white dark:bg-slate-800 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-700 p-4 shrink-0">
             <nav className="flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible space-x-2 md:space-x-0 md:space-y-1">
                {navItems.map(item => (
                    hasPermission(item.permission) && (
                        <a
                            key={item.id}
                            href={`#/admin/reports/${item.id}`}
                            onClick={(e) => handleNav(e, item.id)}
                            className={`flex items-center p-3 my-1 rounded-lg transition-colors duration-200 text-sm font-medium shrink-0 ${
                                activeReport === item.id
                                    ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300'
                                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                        >
                            <item.icon className="w-5 h-5" />
                            <span className="mx-3">{t[item.labelKey as keyof typeof t]}</span>
                        </a>
                    )
                ))}
             </nav>
        </aside>
    );
};
