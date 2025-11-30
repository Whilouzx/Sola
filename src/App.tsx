import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, useEffect, useState, lazy } from 'react';
import { Toaster } from 'sonner';
import { SupabaseProvider } from '@/context/SupabaseContext';
import { ThemeProvider } from '@/components/ThemeProvider';
import { useSupabase } from '@/context/SupabaseContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Login from '@/pages/Login';
import Layout from '@/components/Layout';
import '@/styles/globals.css';

// Lazy load heavy components
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Products = lazy(() => import('@/pages/Products'));
const Sales = lazy(() => import('@/pages/Sales'));
const Reports = lazy(() => import('@/pages/Reports'));
const Suppliers = lazy(() => import('@/pages/Suppliers'));
const AccountsReceivable = lazy(() => import('@/pages/AccountsReceivable'));
const Banks = lazy(() => import('@/pages/Banks'));
const Customers = lazy(() => import('@/pages/Customers'));
const UnderConstruction = lazy(() => import('@/pages/UnderConstruction'));

const LoadingFallback = () => (
  <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50/30 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
  </div>
);

function AppRoutes() {
  const { state } = useSupabase();
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Add a timeout to prevent infinite loading
  useEffect(() => {
    if (state.isAuthLoading) {
      const timeout = setTimeout(() => {
        console.warn('⚠️ Loading timeout reached, forcing app to continue');
        setLoadingTimeout(true);
      }, 10000); // 10 second timeout

      return () => clearTimeout(timeout);
    } else {
      setLoadingTimeout(false);
    }
  }, [state.isAuthLoading]);

  // Show loading screen only if still loading and timeout hasn't been reached
  if (state.isAuthLoading && !loadingTimeout) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando aplicación...</p>
          <p className="text-gray-400 text-sm mt-2">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // If timeout reached or not authenticated, show login
  if (!state.user || loadingTimeout) {
    return <Login />;
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route 
            path="dashboard" 
            element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback />}>
                  <Dashboard />
                </Suspense>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="products" 
            element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback />}>
                  <Products />
                </Suspense>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="categories" 
            element={
              <ProtectedRoute>
                <UnderConstruction title="Categorías" section="Categorías" />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="customers" 
            element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback />}>
                  <Customers />
                </Suspense>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="sales" 
            element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback />}>
                  <Sales />
                </Suspense>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="reports" 
            element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback />}>
                  <Reports />
                </Suspense>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="suppliers" 
            element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback />}>
                  <Suppliers />
                </Suspense>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="accounts-receivable" 
            element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback />}>
                  <AccountsReceivable />
                </Suspense>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="accounts-payable" 
            element={
              <ProtectedRoute>
                <UnderConstruction title="Cuentas por Pagar" section="Cuentas por Pagar" />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="marketing" 
            element={
              <ProtectedRoute>
                <UnderConstruction title="Marketing" section="Marketing" />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="banks" 
            element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback />}>
                  <Banks />
                </Suspense>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="settings" 
            element={
              <ProtectedRoute>
                <UnderConstruction title="Configuración" section="Configuración" />
              </ProtectedRoute>
            } 
          />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="flowi-admin-theme">
      <SupabaseProvider>
        <Router>
          <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            <AppRoutes />
            <Toaster 
              position="top-right" 
              theme="light"
              className="toaster group"
              toastOptions={{
                classNames: {
                  toast: "group-[.toaster]:bg-white group-[.toaster]:text-gray-900 group-[.toaster]:border-orange-200 group-[.toaster]:shadow-flowi group-[.toaster]:backdrop-blur-sm",
                  description: "group-[.toast]:text-gray-600",
                  actionButton: "group-[.toast]:bg-orange-500 group-[.toast]:text-white",
                  cancelButton: "group-[.toast]:bg-gray-100 group-[.toast]:text-gray-600",
                },
              }}
            />
          </div>
        </Router>
      </SupabaseProvider>
    </ThemeProvider>
  );
}
