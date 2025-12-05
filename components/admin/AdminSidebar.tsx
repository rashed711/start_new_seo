import React from 'react';
import type { Permission, User, UserRole, Role } from '../../types';
import { ClipboardListIcon, CollectionIcon, UsersIcon, CloseIcon, ShieldCheckIcon, BookmarkAltIcon, ChartBarIcon, TagIcon, CogIcon, CashRegisterIcon, LogoutIcon, HomeIcon, BellIcon, ArchiveIcon, CurrencyDollarIcon, UserGroupIcon, BankIcon } from '../icons/Icons';
import { useUI } from '../../contexts/UIContext';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';

type AdminTab = 'dashboard' | 'orders' | 'cashier' | 'reports' | 'productList' | 'classifications' | 'promotions' | 'staff' | 'roles' | 'settings' | 'treasury' | 'customers' | 'suppliers' | 'purchaseInvoices' | 'salesInvoices';

interface AdminSidebarProps {
    activeTab: AdminTab;
    setActiveTab: (tab: AdminTab) => void;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    onChangePasswordClick: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = (props) => {
    const { activeTab, setActiveTab, isOpen, setIsOpen, onChangePasswordClick } = props;
    const { language, t } = useUI();
    const { currentUser, logout, hasPermission, roles } = useAuth();
    const { restaurantInfo } = useData();

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

    const handleNav = (e: React.MouseEvent, path: string) => {
        e.preventDefault();
        window.location.hash = path;
        setIsOpen(false);
    };

    const handleTabChange = (e: React.MouseEvent, tab: AdminTab) => {
        e.preventDefault();
        setActiveTab(tab); 
        setIsOpen(false);
    };
    
    if (!currentUser || !restaurantInfo) return null;

    const userRoleName = roles.find(r => r.key === currentUser?.role)?.name[language] || currentUser?.role;

    return (
        <>
            <div
                className={`fixed inset-0 bg-black/50 z-30 md:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsOpen(false)}
            ></div>

            <aside className={`fixed top-0 bottom-0 flex flex-col w-64 h-screen bg-white dark:bg-slate-800 border-e dark:border-slate-700 transition-transform z-40 start-0 md:translate-x-0 ${
                isOpen ? 'translate-x-0' : (language === 'ar' ? 'translate-x-full' : '-translate-x-full')
            }`}>
                <div className="flex items-center justify-between px-4 h-20 border-b dark:border-slate-700">
                    <a href="#/" onClick={(e) => handleNav(e, '/')} className="flex items-center gap-3">
                        <img src={restaurantInfo.logo} alt="Logo" className="h-10 w-10 rounded-full" />
                        <span className="text-lg font-bold text-slate-800 dark:text-slate-100">{restaurantInfo.name[language]}</span>
                    </a>
                    <button onClick={() => setIsOpen(false)} className="p-2 md:hidden">
                        <CloseIcon className="w-6 h-6"/>
                    </button>
                </div>
                 
                 <div className="flex-1 overflow-y-auto">
                    <nav className="p-4 space-y-4">
                        {Object.entries(navItems).map(([groupKey, groupItems], index) => {
                            const visibleItems = groupItems.filter(item => {
                                // Special handling for staff link to show if user can see roles
                                if (item.id === 'staff') {
                                    return hasPermission('view_users_page') || hasPermission('view_roles_page');
                                }
                                // Special handling for the combined products link
                                if (item.id === 'productList') {
                                    return hasPermission('view_products_page') || hasPermission('view_classifications_page') || hasPermission('view_promotions_page');
                                }
                                return hasPermission(item.permission)
                            });

                            if (visibleItems.length === 0) return null;
                            
                            return (
                                <div key={index}>
                                   <h3 className="px-3 text-xs font-semibold uppercase text-slate-400 mb-2">{t[`permission_group_${groupKey}` as keyof typeof t] || groupKey}</h3>
                                   {visibleItems.map(item => (
                                        <a
                                            key={item.id}
                                            href={`#/admin/${item.id}`}
                                            onClick={(e) => handleTabChange(e, item.id as AdminTab)}
                                            className={`w-full flex items-center p-3 my-1 rounded-lg transition-colors duration-200 text-sm font-medium border-s-4 text-start ${
                                                activeTab === item.id || (activeTab === 'classifications' && item.id === 'productList') || (activeTab === 'promotions' && item.id === 'productList')
                                                    ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-300 border-primary-500 font-semibold'
                                                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border-transparent'
                                            }`}
                                        >
                                            <item.icon className="w-5 h-5" />
                                            <span className="mx-4">{item.label}</span>
                                        </a>
                                   ))}
                                </div>
                            );
                        })}
                    </nav>
                </div>
            </aside>
        </>
    );
};