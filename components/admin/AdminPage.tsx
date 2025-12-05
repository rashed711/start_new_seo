
import React, { useState, useMemo, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import type { Language, Product, RestaurantInfo, Order, OrderStatus, User, UserRole, Promotion, Permission, Category, Tag, CartItem, SocialLink, LocalizedString, OrderStatusColumn, OrderType, Role } from '../../types';
import { MenuAlt2Icon, BellIcon, BellSlashIcon, ShieldCheckIcon, UserIcon, HomeIcon, LogoutIcon } from '../icons/Icons';

// Lazy-load all modals and sub-pages to split the code into smaller chunks
const OrderDetailsModal = lazy(() => import('./OrderDetailsModal').then(module => ({ default: module.OrderDetailsModal })));
const ProductEditModal = lazy(() => import('./ProductEditModal').then(module => ({ default: module.ProductEditModal })));
const ProductDetailsModal = lazy(() => import('./ProductDetailsModal').then(module => ({ default: module.ProductDetailsModal })));
const PromotionEditModal = lazy(() => import('./PromotionEditModal').then(module => ({ default: module.PromotionEditModal })));
const AdminSidebar = lazy(() => import('./AdminSidebar').then(module => ({ default: module.AdminSidebar })));
const UserEditModal = lazy(() => import('./UserEditModal').then(module => ({ default: module.UserEditModal })));
const PermissionsEditModal = lazy(() => import('./PermissionsEditModal').then(module => ({ default: module.PermissionsEditModal })));
const CategoryEditModal = lazy(() => import('./CategoryEditModal').then(module => ({ default: module.CategoryEditModal })));
const TagEditModal = lazy(() => import('./TagEditModal').then(module => ({ default: module.TagEditModal })));
const RefusalReasonModal = lazy(() => import('./RefusalReasonModal').then(module => ({ default: module.RefusalReasonModal })));
const OrderEditModal = lazy(() => import('./OrderEditModal').then(module => ({ default: module.OrderEditModal })));
const RoleEditModal = lazy(() => import('./RoleEditModal').then(module => ({ default: module.RoleEditModal })));

// Lazy load page components
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(module => ({ default: module.DashboardPage })));
const OrdersPage = lazy(() => import('./pages/OrdersPage').then(module => ({ default: module.OrdersPage })));
const ProductsAndPromotionsPage = lazy(() => import('./pages/ProductsAndPromotionsPage').then(module => ({ default: module.ProductsAndPromotionsPage })));
const StaffAndRolesPage = lazy(() => import('./pages/StaffAndRolesPage').then(module => ({ default: module.StaffAndRolesPage })));
const UsersPage = lazy(() => import('./pages/UsersPage').then(module => ({ default: module.UsersPage })));
const SettingsPage = lazy(() => import('./SettingsPage').then(module => ({ default: module.SettingsPage })));
const InventoryPage = lazy(() => import('./InventoryPage').then(module => ({ default: module.InventoryPage })));
const ReportsRootPage = lazy(() => import('./reports/ReportsRootPage').then(module => ({ default: module.ReportsRootPage })));
const TreasuryPage = lazy(() => import('./pages/TreasuryPage').then(module => ({ default: module.TreasuryPage })));

import { normalizeArabic, getDescendantCategoryIds } from '../../utils/helpers';
import { useUI } from '../../contexts/UIContext';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { useOrders } from '../../contexts/OrderContext';
import { useUserManagement } from '../../contexts/UserManagementContext';
import { usePushNotifications } from '../../hooks/usePushNotifications';

interface AdminPageProps {
    activeSubRoute: string;
    reportSubRoute?: string;
}

type AdminTab = 'dashboard' | 'orders' | 'cashier' | 'reports' | 'productList' | 'classifications' | 'promotions' | 'staff' | 'roles' | 'settings' | 'treasury' | 'customers' | 'suppliers' | 'purchaseInvoices' | 'salesInvoices';

type DateFilter = 'today' | 'yesterday' | 'week' | 'month' | 'custom';

const NAV_ITEMS_WITH_PERMS = [
    { id: 'dashboard', permission: 'view_reports_page' },
    { id: 'orders', permission: 'view_orders_page' },
    { id: 'reports', permission: 'view_reports_page' },
    { id: 'customers', permission: 'view_users_page' },
    { id: 'suppliers', permission: 'manage_suppliers' },
    { id: 'salesInvoices', permission: 'manage_sales_invoices' },
    { id: 'purchaseInvoices', permission: 'add_purchase_invoice' },
    { id: 'treasury', permission: 'view_treasury_page' },
    { id: 'productList', permission: 'view_products_page' },
    { id: 'classifications', permission: 'view_classifications_page' },
    { id: 'promotions', permission: 'view_promotions_page' },
    { id: 'staff', permission: 'view_users_page' },
    { id: 'roles', permission: 'view_roles_page' },
    { id: 'settings', permission: 'view_settings_page' },
];

const LoadingSpinner: React.FC = () => (
    <div className="flex justify-center items-center p-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
    </div>
);

export const AdminPage: React.FC<AdminPageProps> = ({ activeSubRoute, reportSubRoute }) => {
    const { language, t, showToast, setProgress, setShowProgress, setIsChangePasswordModalOpen } = useUI();
    const { currentUser, hasPermission, roles, logout } = useAuth();
    const { 
        products: allProducts, 
        promotions: allPromotions, 
        restaurantInfo, 
        categories,
        tags,
        addProduct, updateProduct, deleteProduct,
        addPromotion, updatePromotion, deletePromotion,
        addCategory, updateCategory, deleteCategory,
        addTag, updateTag, deleteTag,
    } = useData();
    const {
        orders: allOrders, 
        updateOrder, deleteOrder,
        viewingOrder, setViewingOrder,
        refusingOrder, setRefusingOrder,
    } = useOrders();
     const {
        users: allUsers,
        addUser, updateUser, deleteUser,
        updateRolePermissions, addRole, updateRole, deleteRole
    } = useUserManagement();
    const { isSubscribed: isPushSubscribed, toggleSubscription: togglePushSubscription, isLoading: isPushLoading, isSupported: isPushSupported } = usePushNotifications();

    const [activeTab, setActiveTab] = useState<AdminTab>((activeSubRoute || 'dashboard') as AdminTab);
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    
    const [editingOrder, setEditingOrder] = useState<Order | null>(null);
    const [editingProduct, setEditingProduct] = useState<Product | 'new' | null>(null);
    const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
    const [editingPromotion, setEditingPromotion] = useState<Promotion | 'new' | null>(null);
    const [editingUser, setEditingUser] = useState<User | 'new' | null>(null);
    const [editingPermissionsForRole, setEditingPermissionsForRole] = useState<UserRole | null>(null);
    const [editingRole, setEditingRole] = useState<Role | 'new' | null>(null);
    const [editingCategory, setEditingCategory] = useState<Category | 'new' | null>(null);
    const [editingTag, setEditingTag] = useState<Tag | 'new' | null>(null);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);

    // Order Filters
    const [orderSearchTerm, setOrderSearchTerm] = useState('');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [activeDateFilter, setActiveDateFilter] = useState<DateFilter>('today');
    const [orderFilterType, setOrderFilterType] = useState<'all' | 'Dine-in' | 'Delivery' | 'Takeaway'>('all');
    const [orderFilterCreator, setOrderFilterCreator] = useState<string>('all');
    const [isOrderFilterExpanded, setIsOrderFilterExpanded] = useState(false);

    // Product Filters
    const [productSearchTerm, setProductSearchTerm] = useState('');
    const [productFilterCategory, setProductFilterCategory] = useState<number | null>(null);
    const [productFilterTags, setProductFilterTags] = useState<string[]>([]);
    const [openCategoryDropdown, setOpenCategoryDropdown] = useState<number | null>(null);
    const categoryDropdownRef = useRef<HTMLDivElement>(null);
    
    // User Filters
    const [userSearchTerm, setUserSearchTerm] = useState('');


    const [transitionStage, setTransitionStage] = useState<'in' | 'out'>('in');
    const [displayedTab, setDisplayedTab] = useState(activeTab);

     const handleNav = (e: React.MouseEvent, path: string) => {
        e.preventDefault();
        setIsUserMenuOpen(false); // Close menu on navigation
        window.location.hash = path;
    };


    // Handle viewing order from notification click
     useEffect(() => {
        const checkUrlForOrder = () => {
            const hash = window.location.hash;
            if (hash.includes('?view=')) {
                const orderId = hash.split('?view=')[1];
                if (orderId) {
                    if (allOrders.length > 0) {
                        const orderToView = allOrders.find(o => o.id === orderId);
                        if (orderToView) {
                            setViewingOrder(orderToView);
                            // Clean up URL to prevent modal from re-opening on every render
                            window.history.replaceState(null, document.title, window.location.pathname + window.location.search + '#/admin/orders');
                        }
                    }
                }
            }
        };
        // Run on initial load and whenever orders are updated
        checkUrlForOrder();
    }, [allOrders, setViewingOrder]);

    useEffect(() => {
        if (viewingProduct) {
            const updatedProductInList = allProducts.find(p => p.id === viewingProduct.id);
            if (updatedProductInList && JSON.stringify(viewingProduct) !== JSON.stringify(updatedProductInList)) {
                setViewingProduct(updatedProductInList);
            }
        }
    }, [allProducts, viewingProduct]);

     useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
          if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
            setOpenCategoryDropdown(null);
          }
          if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
            setIsUserMenuOpen(false);
          }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
          document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        setActiveTab((activeSubRoute || 'dashboard') as AdminTab);
    }, [activeSubRoute]);

    const setTab = (tab: AdminTab) => {
        window.location.hash = `#/admin/${tab}`;
    };

    const onChangePasswordClick = () => setIsChangePasswordModalOpen(true);
    
    const isCategoryOrChildSelected = useCallback((category: Category): boolean => {
        if (productFilterCategory === null) return false;
        const categoryIdsToMatch = getDescendantCategoryIds(category.id, categories);
        return categoryIdsToMatch.includes(productFilterCategory);
    }, [productFilterCategory, categories]);

    useEffect(() => {
        const currentTabInfo = NAV_ITEMS_WITH_PERMS.find(item => item.id === activeTab);
        if (currentTabInfo && !hasPermission(currentTabInfo.permission as Permission)) {
            const firstAvailableTab = NAV_ITEMS_WITH_PERMS.find(item => hasPermission(item.permission as Permission));
            if (firstAvailableTab) {
                setTab(firstAvailableTab.id as AdminTab);
                showToast(t.permissionsUpdatedRedirect);
            } else {
                window.location.hash = '#/profile';
            }
        }
    }, [activeTab, hasPermission, showToast, t.permissionsUpdatedRedirect]);

    const PermissionDeniedComponent = () => (
        <div className="flex flex-col items-center justify-center text-center p-8 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-dashed border-yellow-300 dark:border-yellow-700 rounded-lg max-w-2xl mx-auto mt-10">
            <ShieldCheckIcon className="w-16 h-16 text-yellow-500 mb-4" />
            <h2 className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">{t.permissionDenied}</h2>
            <p className="mt-2 text-yellow-600 dark:text-yellow-300">You do not have the necessary permissions to view this page.</p>
        </div>
    );

    useEffect(() => {
        if (activeTab !== displayedTab) {
            setShowProgress(true);
            setProgress(0);
            setTransitionStage('out');

            const progressInterval = setInterval(() => {
                setProgress(p => Math.min(p + 20, 90));
            }, 60);

            const timer = setTimeout(() => {
                clearInterval(progressInterval);
                setDisplayedTab(activeTab);
                setTransitionStage('in');
                setProgress(100);
                setTimeout(() => setShowProgress(false), 400);
            }, 300);

            return () => {
                clearTimeout(timer);
                clearInterval(progressInterval);
            };
        }
    }, [activeTab, displayedTab, setProgress, setShowProgress]);
    
    const setDateFilter = (filter: DateFilter) => {
        setActiveDateFilter(filter);
        const today = new Date();
        const toISO = (date: Date) => date.toISOString().split('T')[0];

        switch(filter) {
            case 'today': setStartDate(toISO(today)); setEndDate(toISO(today)); break;
            case 'yesterday':
                const yesterday = new Date(today);
                yesterday.setDate(today.getDate() - 1);
                setStartDate(toISO(yesterday)); setEndDate(toISO(yesterday)); break;
            case 'week':
                const startOfWeek = new Date(today);
                startOfWeek.setDate(today.getDate() - today.getDay());
                setStartDate(toISO(startOfWeek)); setEndDate(toISO(today)); break;
            case 'month':
                const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                setStartDate(toISO(startOfMonth)); setEndDate(toISO(today)); break;
            default: break;
        }
    };
    
    const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => { setActiveDateFilter('custom'); setStartDate(e.target.value); };
    const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => { setActiveDateFilter('custom'); setEndDate(e.target.value); };

    const ordersToDisplay = useMemo(() => {
        if (!currentUser || !hasPermission('view_orders_page')) return [];
        let baseOrders: Order[];
        if (currentUser.role === 'waiter') { // Example logic, use role name/key
            baseOrders = allOrders.filter(order => order.createdBy === currentUser.id);
        } else {
            baseOrders = allOrders;
        }
        
        const canViewDineIn = hasPermission('view_dine_in_orders');
        const canViewTakeaway = hasPermission('view_takeaway_orders');
        const canViewDelivery = hasPermission('view_delivery_orders');
        const hasSpecificOrderTypePermission = canViewDineIn || canViewTakeaway || canViewDelivery;
    
        if (!hasSpecificOrderTypePermission) return baseOrders;
    
        const allowedTypes: OrderType[] = [];
        if (canViewDineIn) allowedTypes.push('Dine-in');
        if (canViewTakeaway) allowedTypes.push('Takeaway');
        if (canViewDelivery) allowedTypes.push('Delivery');
    
        return baseOrders.filter(order => allowedTypes.includes(order.orderType));
    
    }, [allOrders, currentUser, hasPermission]);
    
    const orderCreators = useMemo(() => {
        const creatorIds = new Set(allOrders.map(o => o.createdBy).filter((id): id is number => id !== undefined));
        return allUsers.filter(u => creatorIds.has(u.id));
    }, [allOrders, allUsers]);

    const filteredOrders = useMemo(() => {
        const lowercasedTerm = orderSearchTerm.toLowerCase();
        const filtered = ordersToDisplay.filter(order => {
            const orderDateString = new Date(order.timestamp).toISOString().split('T')[0];
            if (orderDateString < startDate || orderDateString > endDate) return false;
            if (orderFilterType !== 'all' && order.orderType !== orderFilterType) return false;
            if (orderFilterCreator !== 'all' && String(order.createdBy) !== orderFilterCreator) return false;
            if (lowercasedTerm) {
                return order.id.toLowerCase().includes(lowercasedTerm) ||
                    (order.customer.name && order.customer.name.toLowerCase().includes(lowercasedTerm)) ||
                    order.customer.mobile.toLowerCase().includes(lowercasedTerm) ||
                    (order.tableNumber && order.tableNumber.includes(lowercasedTerm));
            }
            return true;
        });
        return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [ordersToDisplay, startDate, endDate, orderFilterType, orderFilterCreator, orderSearchTerm]);

    const filteredProducts = useMemo(() => {
        const lowercasedTerm = normalizeArabic(productSearchTerm.toLowerCase());
        const filtered = allProducts.filter(product => {
            const nameEn = normalizeArabic(product.name.en.toLowerCase());
            const nameAr = normalizeArabic(product.name.ar.toLowerCase());
            const code = product.code.toLowerCase();

            const matchesSearch = nameEn.includes(lowercasedTerm) || nameAr.includes(lowercasedTerm) || code.includes(lowercasedTerm);
            
            let matchesCategory = true;
            if (productFilterCategory !== null) {
                const categoryIdsToMatch = getDescendantCategoryIds(productFilterCategory, categories);
                matchesCategory = categoryIdsToMatch.includes(product.categoryId);
            }

            const matchesTags = productFilterTags.length === 0 || productFilterTags.every(tag => product.tags.includes(tag));
            
            return matchesSearch && matchesCategory && matchesTags;
        });

        return filtered.sort((a, b) => a.name[language].localeCompare(b.name[language], language));
    }, [allProducts, productSearchTerm, productFilterCategory, productFilterTags, language, categories]);

    const handleProductTagChange = (tagId: string) => {
        setProductFilterTags(prev => 
            prev.includes(tagId) 
            ? prev.filter(t => t !== tagId) 
            : [...prev, tagId]
        );
    };

    const usersToDisplay = useMemo(() => {
        if (!currentUser) return [];
        let baseUsers = allUsers;

        const lowercasedTerm = userSearchTerm.toLowerCase();
        if (lowercasedTerm) {
            baseUsers = baseUsers.filter(user =>
                user.name.toLowerCase().includes(lowercasedTerm) ||
                user.mobile.toLowerCase().includes(lowercasedTerm) ||
                (user.email && user.email.toLowerCase().includes(lowercasedTerm))
            );
        }
        
        return baseUsers.sort((a, b) => a.name.localeCompare(b.name, language));
    }, [allUsers, currentUser, userSearchTerm, language]);

    const viewingOrderCreatorName = useMemo(() => {
        if (!viewingOrder || !viewingOrder.createdBy) return undefined;
        return allUsers.find(u => u.id === viewingOrder.createdBy)?.name;
    }, [viewingOrder, allUsers]);

    const handleSaveProduct = (productData: Product | Omit<Product, 'id' | 'rating'>, imageFile?: File | null) => {
        if ('id' in productData) {
            updateProduct(productData as Product, imageFile);
        } else {
            addProduct(productData as Omit<Product, 'id' | 'rating'>, imageFile);
        }
        setEditingProduct(null);
    };

    const handleToggleProductFlag = (product: Product, flag: 'isPopular' | 'isNew' | 'isVisible') => {
        updateProduct({ ...product, [flag]: !product[flag] });
    };
    
    const handleSavePromotion = (promotionData: Promotion | Omit<Promotion, 'id'>) => {
        if ('id' in promotionData) updatePromotion(promotionData); else addPromotion(promotionData);
        setEditingPromotion(null);
    };
    
    const handleTogglePromotionStatus = (promotion: Promotion) => {
        updatePromotion({ ...promotion, isActive: !promotion.isActive });
    };
    
    const handleSaveUser = (userData: User | Omit<User, 'id'>) => {
        if ('id' in userData) updateUser(userData as User); else addUser(userData as Omit<User, 'id'>);
        setEditingUser(null);
    };
    
    const handleSavePermissions = (role: UserRole, permissions: Permission[]) => {
        updateRolePermissions(role, permissions);
        setEditingPermissionsForRole(null);
    };

    const handleSaveOrder = (updatedOrderData: {items: CartItem[], notes: string, total: number, tableNumber?: string}) => {
        if (editingOrder) updateOrder(editingOrder.id, updatedOrderData);
        setEditingOrder(null);
    };

    const handleSaveRole = (roleData: Role | Omit<Role, 'isSystem' | 'key'>) => {
        if ('isSystem' in roleData) updateRole(roleData); else addRole(roleData);
        setEditingRole(null);
    };

    const handleSaveCategory = (categoryData: Category | Omit<Category, 'id'>) => {
        if ('id' in categoryData) {
            updateCategory(categoryData);
        } else {
            addCategory(categoryData);
        }
        setEditingCategory(null);
    };
    
    const handleSaveTag = (tagData: Tag | (Omit<Tag, 'id'> & {id: string})) => {
        if (editingTag && editingTag !== 'new') {
            updateTag(tagData as Tag);
        } else {
            addTag(tagData as (Omit<Tag, 'id'> & {id: string}));
        }
        setEditingTag(null);
    };
    
    if (!currentUser || !restaurantInfo) return <div className="p-8 text-center">Loading...</div>;

    const renderContent = () => {
        switch(displayedTab) {
            case 'dashboard':
                if (!hasPermission('view_reports_page')) return <PermissionDeniedComponent />;
                return <DashboardPage />;
            case 'orders':
                if (!hasPermission('view_orders_page')) return <PermissionDeniedComponent />;
                return (
                    <OrdersPage
                        isOrderFilterExpanded={isOrderFilterExpanded}
                        setIsOrderFilterExpanded={setIsOrderFilterExpanded}
                        orderSearchTerm={orderSearchTerm}
                        setOrderSearchTerm={setOrderSearchTerm}
                        activeDateFilter={activeDateFilter}
                        setDateFilter={setDateFilter}
                        startDate={startDate}
                        handleStartDateChange={handleStartDateChange}
                        endDate={endDate}
                        handleEndDateChange={handleEndDateChange}
                        orderFilterType={orderFilterType}
                        setOrderFilterType={setOrderFilterType}
                        orderFilterCreator={orderFilterCreator}
                        setOrderFilterCreator={setOrderFilterCreator}
                        orderCreators={orderCreators}
                        restaurantInfo={restaurantInfo}
                        filteredOrders={filteredOrders}
                    />
                );
            case 'productList':
            case 'classifications':
            case 'promotions':
                const canViewProducts = hasPermission('view_products_page');
                const canViewClassifications = hasPermission('view_classifications_page');
                const canViewPromotions = hasPermission('view_promotions_page');
                if (!canViewProducts && !canViewClassifications && !canViewPromotions) return <PermissionDeniedComponent />;
                return (
                    <ProductsAndPromotionsPage
                        initialTab={displayedTab}
                        onViewProduct={setViewingProduct}
                        // Products Props
                        setEditingProduct={setEditingProduct}
                        productSearchTerm={productSearchTerm}
                        setProductSearchTerm={setProductSearchTerm}
                        productFilterTags={productFilterTags}
                        handleProductTagChange={handleProductTagChange}
                        productFilterCategory={productFilterCategory}
                        setProductFilterCategory={setProductFilterCategory}
                        categories={categories}
                        tags={tags}
                        isCategoryOrChildSelected={isCategoryOrChildSelected}
                        openCategoryDropdown={openCategoryDropdown}
                        setOpenCategoryDropdown={setOpenCategoryDropdown}
                        categoryDropdownRef={categoryDropdownRef}
                        filteredProducts={filteredProducts}
                        handleToggleProductFlag={handleToggleProductFlag}
                        deleteProduct={deleteProduct}
                        // Classifications Props
                        onAddCategory={() => setEditingCategory('new')}
                        onEditCategory={setEditingCategory}
                        onAddTag={() => setEditingTag('new')}
                        onEditTag={setEditingTag}
                        // Promotions Props
                        setEditingPromotion={setEditingPromotion}
                        allPromotions={allPromotions}
                        allProducts={allProducts}
                        handleTogglePromotionStatus={handleTogglePromotionStatus}
                        deletePromotion={deletePromotion}
                    />
                );
            case 'staff':
                if (!hasPermission('view_users_page') && !hasPermission('view_roles_page')) return <PermissionDeniedComponent />;
                return (
                    <StaffAndRolesPage
                        setEditingUser={setEditingUser}
                        userSearchTerm={userSearchTerm}
                        setUserSearchTerm={setUserSearchTerm}
                        usersToDisplay={usersToDisplay}
                        deleteUser={deleteUser}
                        setEditingRole={setEditingRole}
                        setEditingPermissionsForRole={setEditingPermissionsForRole}
                        roles={roles}
                        deleteRole={deleteRole}
                    />
                );
            case 'customers':
                if (!hasPermission('view_users_page')) return <PermissionDeniedComponent />;
                return (
                    <UsersPage
                        pageType="customers"
                        hasPermission={hasPermission}
                        setEditingUser={setEditingUser}
                        userSearchTerm={userSearchTerm}
                        setUserSearchTerm={setUserSearchTerm}
                        usersToDisplay={usersToDisplay}
                        roles={roles}
                        deleteUser={deleteUser}
                    />
                );
            case 'cashier': return <PermissionDeniedComponent />; // Cashier page removed or needs permission
            case 'reports': return hasPermission('view_reports_page') ? <ReportsRootPage activeSubRoute={reportSubRoute} /> : <PermissionDeniedComponent />;
            case 'treasury': return hasPermission('view_treasury_page') ? <TreasuryPage /> : <PermissionDeniedComponent />;
            case 'suppliers': return hasPermission('manage_suppliers') ? <InventoryPage pageType="suppliers" /> : <PermissionDeniedComponent />;
            case 'purchaseInvoices': return hasPermission('add_purchase_invoice') ? <InventoryPage pageType="purchaseInvoices" /> : <PermissionDeniedComponent />;
            case 'salesInvoices': return hasPermission('manage_sales_invoices') ? <InventoryPage pageType="salesInvoices" /> : <PermissionDeniedComponent />;
            case 'settings': return hasPermission('view_settings_page') ? <SettingsPage /> : <PermissionDeniedComponent />;
            default: return <DashboardPage />;
        }
    };

    return (
        <div className="h-screen flex flex-col">
            <header className="flex items-center justify-between px-4 h-20 bg-white dark:bg-slate-800 border-b dark:border-slate-700 z-20 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => setSidebarOpen(true)} className="p-2 md:hidden">
                        <MenuAlt2Icon className="w-6 h-6"/>
                    </button>
                    <a href="#/admin" onClick={(e) => handleNav(e, '/admin')}>
                        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">{t.adminPanel}</h1>
                    </a>
                </div>
                <div className="flex items-center gap-4">
                    { isPushSupported && (
                        <button 
                            onClick={togglePushSubscription}
                            disabled={isPushLoading}
                            className={`p-2 rounded-full transition-colors ${isPushSubscribed ? 'bg-green-100 dark:bg-green-900/50' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                            title={isPushSubscribed ? t.disablePushNotifications : t.enablePushNotifications}
                        >
                            { isPushSubscribed ? <BellIcon className="w-6 h-6 text-green-600 dark:text-green-400"/> : <BellSlashIcon className="w-6 h-6 text-slate-500 dark:text-slate-400"/> }
                        </button>
                    )}
                     <div className="relative" ref={userMenuRef}>
                        <button 
                            onClick={() => setIsUserMenuOpen(prev => !prev)}
                            className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 p-2 rounded-lg transition-colors"
                        >
                            <img src={currentUser.profilePicture} alt="User" className="w-8 h-8 rounded-full object-cover" />
                            <span className="hidden sm:inline">{currentUser.name}</span>
                        </button>
                        {isUserMenuOpen && (
                             <div className="absolute top-full mt-2 end-0 w-56 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-fade-in py-1">
                                <a href="#/profile" onClick={(e) => handleNav(e, '/profile')} className="flex items-center gap-3 w-full text-start px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                    <UserIcon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                                    <span>{t.myProfile}</span>
                                </a>
                                <a href="#/" onClick={(e) => handleNav(e, '/')} className="flex items-center gap-3 w-full text-start px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                    <HomeIcon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                                    <span>{t.backToMenu}</span>
                                </a>
                                <div className="my-1 border-t border-slate-200 dark:border-slate-700"></div>
                                <button onClick={() => { logout(); setIsUserMenuOpen(false); }} className="flex items-center gap-3 w-full text-start px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 transition-colors">
                                    <LogoutIcon className="w-5 h-5" />
                                    <span>{t.logout}</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                 <Suspense fallback={<div className="w-64 bg-white dark:bg-slate-800"></div>}>
                    <AdminSidebar activeTab={activeTab} setActiveTab={setTab} isOpen={isSidebarOpen} setIsOpen={setSidebarOpen} onChangePasswordClick={onChangePasswordClick} />
                </Suspense>
                <main className={`flex-1 transition-all duration-300 overflow-y-auto p-4 sm:p-6 lg:p-8 ${language === 'ar' ? 'md:mr-64' : 'md:ml-64'}`}>
                   <div className={`transition-opacity duration-300 ${transitionStage === 'in' ? 'opacity-100' : 'opacity-0'}`}>
                        <Suspense fallback={<LoadingSpinner />}>
                            {renderContent()}
                        </Suspense>
                   </div>
                </main>
            </div>
            
            <Suspense fallback={<div />}>
                {viewingOrder && <OrderDetailsModal order={viewingOrder} onClose={() => setViewingOrder(null)} canEdit={hasPermission('edit_order_content')} onEdit={setEditingOrder} canDelete={hasPermission('delete_order')} onDelete={deleteOrder} creatorName={viewingOrderCreatorName} />}
                {editingProduct !== null && <ProductEditModal product={editingProduct === 'new' ? null : editingProduct} onClose={() => setEditingProduct(null)} onSave={handleSaveProduct} />}
                {viewingProduct && (
                    <ProductDetailsModal
                        product={viewingProduct}
                        onClose={() => setViewingProduct(null)}
                        onEdit={(product) => {
                            setEditingProduct(product);
                            setViewingProduct(null);
                        }}
                        onDelete={(productId) => {
                            deleteProduct(productId);
                            setViewingProduct(null);
                        }}
                        onToggleFlag={handleToggleProductFlag}
                        canEdit={hasPermission('edit_product')}
                        canDelete={hasPermission('delete_product')}
                    />
                )}
                {editingPromotion !== null && <PromotionEditModal promotion={editingPromotion === 'new' ? null : editingPromotion} onClose={() => setEditingPromotion(null)} onSave={handleSavePromotion} />}
                {editingUser !== null && <UserEditModal user={editingUser === 'new' ? null : editingUser} onClose={() => setEditingUser(null)} onSave={handleSaveUser} />}
                {editingPermissionsForRole !== null && <PermissionsEditModal roleId={editingPermissionsForRole} onClose={() => setEditingPermissionsForRole(null)} onSave={handleSavePermissions} />}
                {editingRole !== null && <RoleEditModal role={editingRole === 'new' ? null : editingRole} onClose={() => setEditingRole(null)} onSave={handleSaveRole} />}
                {refusingOrder && <RefusalReasonModal order={refusingOrder} onClose={() => setRefusingOrder(null)} onSave={(reason) => { updateOrder(refusingOrder.id, { status: 'refused', refusalReason: reason }); setRefusingOrder(null); }} />}
                {editingOrder && <OrderEditModal order={editingOrder} onClose={() => setEditingOrder(null)} onSave={handleSaveOrder} />}
                {editingCategory !== null && <CategoryEditModal category={editingCategory === 'new' ? null : editingCategory} categories={categories} onClose={() => setEditingCategory(null)} onSave={handleSaveCategory} />}
                {editingTag !== null && <TagEditModal tag={editingTag === 'new' ? null : editingTag} onClose={() => setEditingTag(null)} onSave={handleSaveTag} />}
            </Suspense>
        </div>
    );
};
