import React, { useMemo } from 'react';
import { useUI } from '../../../contexts/UIContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useOrders } from '../../../contexts/OrderContext';
import { useData } from '../../../contexts/DataContext';
import { 
    ClipboardListIcon, 
    CollectionIcon, 
    UsersIcon, 
    CogIcon,
    HomeIcon,
    ChartBarIcon,
    BookmarkAltIcon,
    TagIcon,
    ShieldCheckIcon,
    CashRegisterIcon,
    UserGroupIcon,
    CurrencyDollarIcon,
    BankIcon
} from '../../icons/Icons';
import type { Order, Permission } from '../../../types';


// Quick Link Component - Updated for larger size
const QuickLink: React.FC<{ title: string; path: string; icon: React.FC<any>; }> = ({ title, path, icon: Icon }) => {
    const handleNav = (e: React.MouseEvent) => {
        e.preventDefault();
        window.location.hash = path;
    };
    return (
        <a href={path} onClick={handleNav} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:shadow-xl transition-all transform hover:-translate-y-1.5">
            <Icon className="w-10 h-10 text-primary-500" />
            <span className="font-semibold text-base text-slate-700 dark:text-slate-200">{title}</span>
        </a>
    );
};

// Main Dashboard Component
export const DashboardPage: React.FC = () => {
    const { t, language } = useUI();
    const { hasPermission } = useAuth();
    const { orders, setViewingOrder } = useOrders();
    const { restaurantInfo } = useData();

    // Replicating navItems structure for use in Quick Actions
    const navItems = {
        operations: [
            { id: 'dashboard', label: t.dashboard, icon: HomeIcon, permission: 'view_reports_page' as Permission },
            { id: 'orders', label: t.manageOrders, icon: ClipboardListIcon, permission: 'view_orders_page' as Permission },
            { id: 'reports', label: t.reports, icon: ChartBarIcon, permission: 'view_reports_page' as Permission },
        ],
        financials: [
            { id: 'customers', label: t.customers, icon: UserGroupIcon, permission: 'view_users_page' as Permission },
            { id: 'suppliers', label: t.suppliers, icon: UsersIcon, permission: 'manage_suppliers' as Permission },
            { id: 'salesInvoices', label: t.salesInvoices, icon: CashRegisterIcon, permission: 'manage_sales_invoices' as Permission },
            { id: 'purchaseInvoices', label: t.purchaseInvoices, icon: ClipboardListIcon, permission: 'add_purchase_invoice' as Permission },
            { id: 'treasury', label: t.treasury, icon: BankIcon, permission: 'view_treasury_page' as Permission },
        ],
        management: [
            { id: 'productList', label: t.productsAndPromotions, icon: CollectionIcon, permission: 'view_products_page' as Permission },
        ],
        administration: [
            { id: 'staff', label: t.staffAndRoles, icon: UsersIcon, permission: 'view_users_page' as Permission },
            { id: 'settings', label: t.settings, icon: CogIcon, permission: 'view_settings_page' as Permission },
        ]
    };

    const allNavItems = useMemo(() => Object.values(navItems).flat(), [t]);

    // Recent Orders
    const recentOrders = useMemo(() => [...orders].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5), [orders]);

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{t.dashboard}</h1>
            
            {/* Quick Actions - Cards Enlarged */}
            <div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                    {allNavItems.map(item => {
                        if (item.id === 'dashboard') return null;

                        let canView = hasPermission(item.permission);
                        // Special handling for combined pages to match sidebar logic
                        if (item.id === 'productList') {
                            canView = hasPermission('view_products_page') || hasPermission('view_classifications_page') || hasPermission('view_promotions_page');
                        }
                        if (item.id === 'staff') {
                            canView = hasPermission('view_users_page') || hasPermission('view_roles_page');
                        }
                        
                        if (!canView) return null;

                        return (
                            <QuickLink 
                                key={item.id}
                                title={item.label} 
                                path={`#/admin/${item.id}`} 
                                icon={item.icon} 
                            />
                        )
                    })}
                </div>
            </div>

            {/* Recent Orders */}
            {hasPermission('view_orders_page') && (
                 <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t.recentOrders}</h2>
                        <a href="#/admin/orders" onClick={(e) => { e.preventDefault(); window.location.hash = '#/admin/orders'; }} className="text-sm font-semibold text-primary-600 hover:underline">{t.viewAll}</a>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {recentOrders.map(order => {
                                    const statusDetails = restaurantInfo?.orderStatusColumns.find(s => s.id === order.status);
                                    const statusColor = statusDetails?.color || 'slate';
                                    return (
                                        <tr key={order.id} onClick={() => setViewingOrder(order)} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer">
                                            <td className="p-3"><span className="font-semibold text-slate-700 dark:text-slate-200">{order.customer.name || 'Guest'}</span><br/><span className="text-xs text-slate-500">{order.customer.mobile}</span></td>
                                            <td className="p-3 text-center"><span className="text-sm font-semibold text-slate-600 dark:text-slate-300">{order.items.length} {t.items}</span></td>
                                            <td className="p-3 text-center">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full bg-${statusColor}-100 text-${statusColor}-800 dark:bg-${statusColor}-900/50 dark:text-${statusColor}-300`}>
                                                    {statusDetails?.name[language] || order.status}
                                                </span>
                                            </td>
                                            <td className="p-3 text-end font-bold text-slate-800 dark:text-slate-100">{order.total.toFixed(2)} {t.currency}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {recentOrders.length === 0 && <p className="text-center text-slate-500 py-8">{t.noRecentOrders}</p>}
                    </div>
                </div>
            )}
        </div>
    );
};