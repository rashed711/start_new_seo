import React, { useMemo, useEffect, lazy, Suspense } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { UIProvider, useUI } from './contexts/UIContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider, useData } from './contexts/DataContext';
import { CartProvider } from './contexts/CartContext';
import { OrderProvider } from './contexts/OrderContext';
import { APP_CONFIG } from './utils/config';

// Lazy load page components for better performance
const MenuPage = lazy(() => import('./components/MenuPage').then(module => ({ default: module.MenuPage })));
const ProductPage = lazy(() => import('./components/ProductPage').then(module => ({ default: module.ProductPage })));
const LoginPage = lazy(() => import('./components/auth/LoginPage').then(module => ({ default: module.LoginPage })));
const ProfilePage = lazy(() => import('./components/profile/ProfilePage').then(module => ({ default: module.ProfilePage })));
const AdminArea = lazy(() => import('./components/admin/AdminArea'));
const SocialPage = lazy(() => import('./components/SocialPage').then(module => ({ default: module.SocialPage })));
const CheckoutPage = lazy(() => import('./components/checkout/CheckoutPage').then(module => ({ default: module.CheckoutPage })));
const OrderTrackingPage = lazy(() => import('./components/OrderTrackingPage').then(module => ({ default: module.OrderTrackingPage })));
const ForgotPasswordPage = lazy(() => import('./components/auth/ForgotPasswordPage').then(module => ({ default: module.ForgotPasswordPage })));
const ActionHandlerPage = lazy(() => import('./components/auth/ActionHandlerPage').then(module => ({ default: module.ActionHandlerPage })));
const CompleteProfilePage = lazy(() => import('./components/auth/CompleteProfilePage').then(module => ({ default: module.CompleteProfilePage })));
const PaymentStatusPage = lazy(() => import('./components/checkout/PaymentStatusPage'));


// Non-page components can be imported directly
import { ToastNotification } from './components/ToastNotification';
import { TopProgressBar } from './components/TopProgressBar';
import { ChangePasswordModal } from './components/profile/ChangePasswordModal';
import { LoadingOverlay } from './components/LoadingOverlay';
import { DeactivatedScreen } from './components/DeactivatedScreen';


const AppContent: React.FC = () => {
  const {
    language,
    toast,
    isChangePasswordModalOpen,
    setIsChangePasswordModalOpen,
    isLoading,
    isProcessing,
    transitionStage,
    progress,
    showProgress
  } = useUI();
  const { currentUser, roles, isCompletingProfile } = useAuth();
  const { restaurantInfo } = useData();
  
  // React Router Hooks
  const location = useLocation();
  const navigate = useNavigate();

  const displayedRoute = useMemo(() => {
      // Default to /social if configured, else /
      if (location.pathname === '/' && restaurantInfo?.defaultPage === 'social') {
          return '/social';
      }
      return location.pathname || '/';
  }, [location.pathname, restaurantInfo]);

  // Set document title dynamically from config
  useEffect(() => {
    document.title = restaurantInfo ? restaurantInfo.name[language] : APP_CONFIG.APP_NAME[language];
  }, [language, restaurantInfo]);

  const renderPage = () => {
    const routeParts = displayedRoute.split('/').filter(Boolean); // Split and remove empty strings
    // Reconstruct base routes logic. 
    // /admin/orders -> parts=['admin', 'orders']
    
    if (isCompletingProfile) {
        return <CompleteProfilePage />;
    }

    if (isLoading || !restaurantInfo) {
      return <LoadingOverlay isVisible={true} />;
    }
    
    // System Activation Check Logic
    const isDeactivated = restaurantInfo.activationEndDate && new Date() > new Date(restaurantInfo.activationEndDate);
    const superAdminRole = roles.find(r => r.name.en.toLowerCase() === 'superadmin');
    const isSuperAdmin = currentUser?.role === superAdminRole?.key;

    const baseRoute = '/' + (routeParts[0] || '');

    // A super admin can access any admin page even if deactivated. Anyone can access login.
    const canBypassDeactivation = 
        (isSuperAdmin && baseRoute.startsWith('/admin')) || 
        baseRoute.startsWith('/login');

    if (isDeactivated && !canBypassDeactivation) {
        return <DeactivatedScreen />;
    }

    if (baseRoute.startsWith('/admin')) {
        const adminSubRoute = routeParts[1] || 'dashboard'; // /admin/dashboard
        const reportSubRoute = routeParts[2] || 'dashboard'; // /admin/reports/sales
        return <AdminArea activeSubRoute={adminSubRoute} reportSubRoute={reportSubRoute} />;
    }
    if (baseRoute.startsWith('/login')) return <LoginPage />;
    if (baseRoute.startsWith('/forgot-password')) return <ForgotPasswordPage />;
    if (baseRoute.startsWith('/profile')) return <ProfilePage />;
    if (baseRoute.startsWith('/checkout')) return <CheckoutPage />;
    if (baseRoute.startsWith('/track')) return <OrderTrackingPage />;
    if (baseRoute.startsWith('/social')) return <SocialPage />;
    if (baseRoute.startsWith('/action')) return <ActionHandlerPage />;
    if (baseRoute.startsWith('/payment-status')) return <PaymentStatusPage />;
    if (baseRoute.startsWith('/product')) return <ProductPage />;

    // Fallback to menu page (root /)
    return <MenuPage />;
  };
  
  return (
     <>
      <TopProgressBar progress={progress} show={showProgress} />
      <div className={`transition-opacity duration-300 ${transitionStage === 'in' ? 'opacity-100' : 'opacity-0'}`}>
        <Suspense fallback={<LoadingOverlay isVisible={true} />}>
          {renderPage()}
        </Suspense>
      </div>
      <ToastNotification message={toast.message} isVisible={toast.isVisible} />
      <LoadingOverlay isVisible={isProcessing && !isLoading} />
      {isChangePasswordModalOpen && currentUser && (
          <ChangePasswordModal
              onClose={() => setIsChangePasswordModalOpen(false)}
          />
      )}
    </>
  );
};


const App: React.FC = () => {
  return (
    <UIProvider>
      <AuthProvider>
        <DataProvider>
          <CartProvider>
            <OrderProvider>
              <AppContent />
            </OrderProvider>
          </CartProvider>
        </DataProvider>
      </AuthProvider>
    </UIProvider>
  );
};

export default App;