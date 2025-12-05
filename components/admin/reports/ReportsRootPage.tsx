import React from 'react';
import { ReportsSidebar } from './ReportsSidebar';
import { DashboardPage } from './DashboardPage';
import { SalesReportPage } from './SalesReportPage'; 
import { OrdersReportPage } from './OrdersReportPage';
import { ProfitReportPage } from './ProfitReportPage';
import { CustomersReportPage } from './CustomersReportPage';
import { ProductsReportPage } from './ProductsReportPage';
import { PaymentsReportPage } from './PaymentsReportPage';
import { DeliveryReportPage } from './DeliveryReportPage';
import { UserActivityReportPage } from './UserActivityReportPage';
import { useAuth } from '../../../contexts/AuthContext';
import { useUI } from '../../../contexts/UIContext';
import { ShieldCheckIcon } from '../../icons/Icons';
import type { Permission } from '../../../types';

interface ReportsRootPageProps {
  activeSubRoute?: string;
}

const reportPermissions: Record<string, Permission> = {
  dashboard: 'view_reports_page',
  sales: 'view_sales_report',
  orders: 'view_orders_report',
  profit: 'view_profit_report',
  customers: 'view_customers_report',
  products: 'view_products_report',
  payments: 'view_payments_report',
  delivery: 'view_delivery_report',
  userActivity: 'view_user_activity_report',
};

export const ReportsRootPage: React.FC<ReportsRootPageProps> = ({ activeSubRoute = 'dashboard' }) => {
  const { hasPermission } = useAuth();
  const { t } = useUI();

  const PermissionDeniedComponent = () => (
    <div className="flex flex-col items-center justify-center text-center p-8 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-dashed border-yellow-300 dark:border-yellow-700 rounded-lg max-w-2xl mx-auto mt-10">
        <ShieldCheckIcon className="w-16 h-16 text-yellow-500 mb-4" />
        <h2 className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">{t.permissionDenied}</h2>
        <p className="mt-2 text-yellow-600 dark:text-yellow-300">You do not have permission to view this report.</p>
    </div>
  );

  const renderContent = () => {
    const requiredPermission = reportPermissions[activeSubRoute] || 'view_reports_page';
    if (!hasPermission(requiredPermission)) {
        return <PermissionDeniedComponent />;
    }

    switch (activeSubRoute) {
      case 'dashboard': return <DashboardPage />;
      case 'sales': return <SalesReportPage />;
      case 'orders': return <OrdersReportPage />;
      case 'profit': return <ProfitReportPage />;
      case 'customers': return <CustomersReportPage />;
      case 'products': return <ProductsReportPage />;
      case 'payments': return <PaymentsReportPage />;
      case 'delivery': return <DeliveryReportPage />;
      case 'userActivity': return <UserActivityReportPage />;
      default: return <DashboardPage />;
    }
  };

  return (
    <div className="flex flex-col md:flex-row -mx-4 sm:-mx-6 lg:-mx-8 -my-8 h-[calc(100vh-5rem)]">
        <ReportsSidebar activeReport={activeSubRoute} />
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8">
            {renderContent()}
        </main>
    </div>
  );
};