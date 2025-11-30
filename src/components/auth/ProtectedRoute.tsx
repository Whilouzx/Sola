import { ReactNode } from 'react';
import { useSupabase } from '@/context/SupabaseContext';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'user' | 'admin';
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { state } = useSupabase();

  if (state.isAuthLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50/30 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600">Cargando...</p>
        </motion.div>
      </div>
    );
  }

  if (!state.user) {
    // This will be handled by the App component routing
    return null;
  }

  // Check role permissions
  if (requiredRole && state.user.role !== requiredRole && state.user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50/30 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center bg-white rounded-lg shadow-lg p-8 max-w-md"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Acceso Denegado</h2>
          <p className="text-gray-600 mb-4">
            No tienes permisos suficientes para acceder a esta sección.
          </p>
          <p className="text-sm text-gray-500">
            Rol requerido: <span className="font-medium">{requiredRole}</span><br />
            Tu rol actual: <span className="font-medium">{state.user.role}</span>
          </p>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
}