import React, { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, useLocation, Navigate, useNavigate, useParams } from 'react-router-dom';
import { UIProvider, useUI } from './contexts/UIContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider, useData } from './contexts/DataContext';
import { CartProvider } from './contexts/CartContext';
import { OrderProvider } from './contexts/OrderContext';
import { UserManagementProvider } from './contexts/UserManagementContext';
import { TreasuryProvider } from './contexts/TreasuryContext';
import { InventoryProvider } from './contexts/InventoryContext';
import { APP_CONFIG } from './utils/config';

// Lazy load page components
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

import { ToastNotification } from './components/ToastNotification';
import { TopProgressBar } from './components/TopProgressBar';
import { ChangePasswordModal } from './components/profile/ChangePasswordModal';
import { LoadingOverlay } from './components/LoadingOverlay';
import { DeactivatedScreen } from './components/DeactivatedScreen';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Error Boundary
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) { console.error("Uncaught error:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-gray-100">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong.</h1>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">Reload Page</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Wrapper for AdminArea to extract params
const AdminRoute = () => {
    const params = useParams();
    // In React Router v6 *, the params are available as '*'
    const wildCard = params['*']; 
    const parts = wildCard ? wildCard.split('/') : [];
    const activeSubRoute = parts[0] || 'dashboard';
    const reportSubRoute = parts[1];
    
    return <AdminArea activeSubRoute={activeSubRoute} reportSubRoute={reportSubRoute} />;
};

const AppContent = () => {
  const { language, toast, isChangePasswordModalOpen, setIsChangePasswordModalOpen, isLoading, isProcessing, transitionStage, progress, showProgress } = useUI();
  const { currentUser, roles, isCompletingProfile } = useAuth();
  const { restaurantInfo } = useData();
  const location = useLocation();

  // Redirect legacy hash links
  const navigate = useNavigate();
  useEffect(() => {
    if (window.location.hash.startsWith('#/')) {
        const path = window.location.hash.substring(1);
        navigate(path, { replace: true });
    }
  }, []);

  useEffect(() => {
    if (restaurantInfo) document.title = restaurantInfo.name[language];
  }, [language, restaurantInfo]);
  
  const renderRoutes = () => {
    if (isCompletingProfile) return <CompleteProfilePage />;
    if (isLoading && !restaurantInfo) return <LoadingOverlay isVisible={true} />;
    if (!restaurantInfo && !isLoading) return <div className="text-center p-10">Failed to load data.</div>;
    if (!restaurantInfo) return null;

    const isDeactivated = restaurantInfo.activationEndDate && new Date() > new Date(restaurantInfo.activationEndDate);
    const superAdminRole = roles.find(r => r.name.en.toLowerCase() === 'superadmin');
    const isSuperAdmin = currentUser?.role === superAdminRole?.key;
    const canBypass = (isSuperAdmin && location.pathname.startsWith('/admin')) || location.pathname.startsWith('/login');

    if (isDeactivated && !canBypass) return <DeactivatedScreen />;
    
    const DefaultPage = restaurantInfo.defaultPage === 'social' ? SocialPage : MenuPage;
    
    return (
        <Routes>
            <Route path="/admin/*" element={<AdminRoute />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/track" element={<OrderTrackingPage />} />
            <Route path="/social" element={<SocialPage />} />
            <Route path="/action" element={<ActionHandlerPage />} />
            <Route path="/payment-status" element={<PaymentStatusPage />} />
            <Route path="/product/:slug" element={<ProductPage />} />
            <Route path="/" element={<DefaultPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
  };
  
  return (
     <>
      <TopProgressBar progress={progress} show={showProgress} />
      <div className={`transition-opacity duration-300 ${transitionStage === 'in' ? 'opacity-100' : 'opacity-0'}`}>
        <Suspense fallback={<LoadingOverlay isVisible={true} />}>
          {renderRoutes()}
        </Suspense>
      </div>
      <ToastNotification message={toast.message} isVisible={toast.isVisible} />
      <LoadingOverlay isVisible={isProcessing && !isLoading} />
      {isChangePasswordModalOpen && currentUser && <ChangePasswordModal onClose={() => setIsChangePasswordModalOpen(false)} />}
    </>
  );
};

const App = () => {
  return (
    <ErrorBoundary>
      <UIProvider>
        <AuthProvider>
          <DataProvider>
            <CartProvider>
              <UserManagementProvider>
                <TreasuryProvider>
                  <InventoryProvider>
                    <OrderProvider>
                      <AppContent />
                    </OrderProvider>
                  </InventoryProvider>
                </TreasuryProvider>
              </UserManagementProvider>
            </CartProvider>
          </DataProvider>
        </AuthProvider>
      </UIProvider>
    </ErrorBoundary>
  );
};

export default App;