import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSupabase } from '@/context/SupabaseContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Menu, 
  X, 
  Home, 
  Package, 
  ShoppingCart, 
  BarChart3, 
  Users, 
  Settings,
  LogOut,
  Wifi,
  WifiOff,
  Truck,
  FileText,
  Receipt,
  Target,
  Building2,
  Tags
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  to: string;
  icon: any;
  label: string;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { to: '/dashboard', icon: Home, label: 'Dashboard' },
  { to: '/sales', icon: ShoppingCart, label: 'Ventas' },
  { to: '/products', icon: Package, label: 'Inventario' },
  { to: '/categories', icon: Tags, label: 'Categorías' },
  { to: '/customers', icon: Users, label: 'Clientes' },
  { to: '/suppliers', icon: Truck, label: 'Proveedores', adminOnly: true },
  { to: '/accounts-receivable', icon: FileText, label: 'Por Cobrar', adminOnly: true },
  { to: '/accounts-payable', icon: Receipt, label: 'Por Pagar', adminOnly: true },
  { to: '/marketing', icon: Target, label: 'Marketing' },
  { to: '/banks', icon: Building2, label: 'Bancos', adminOnly: true },
  { to: '/reports', icon: BarChart3, label: 'Reportes', adminOnly: true },
  { to: '/settings', icon: Settings, label: 'Configuración', adminOnly: true },
];

export function MobileNav() {
  const { state, logout } = useSupabase();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const filteredNavItems = navItems.filter(item => 
    !item.adminOnly || state.user?.role === 'admin'
  );

  const toggleNav = () => setIsOpen(!isOpen);
  const closeNav = () => setIsOpen(false);

  // Helper function to get display name with proper fallback
  const getDisplayName = () => {
    if (!state.user) return 'Usuario';
    
    // Priority: name (full_name from Supabase) > email username > 'Usuario'
    if (state.user.name && state.user.name !== state.user.email?.split('@')[0]) {
      return state.user.name;
    }
    
    if (state.user.email) {
      return state.user.email.split('@')[0];
    }
    
    return 'Usuario';
  };

  // Helper function to get initials for avatar
  const getInitials = () => {
    if (!state.user) return 'U';
    
    const displayName = getDisplayName();
    
    // If it's a full name (contains space), get first letter of each word
    if (displayName.includes(' ')) {
      return displayName
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    
    // Otherwise, just get the first letter
    return displayName.charAt(0).toUpperCase();
  };

  return (
    <>
      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-orange-200 shadow-sm dark:bg-gray-900/95 dark:border-orange-800">
        <div className="flex items-center justify-between p-4">
          {/* Logo - Matching Login Design Exactly */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white shadow-lg border border-orange-200 flex items-center justify-center dark:bg-gray-800 dark:border-orange-700">
              <img 
                src="/flowi-logo.png" 
                alt="Flowi Logo" 
                className="w-6 h-6 object-contain"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  const nextElement = target.nextElementSibling as HTMLElement;
                  if (nextElement) {
                    nextElement.style.display = 'block';
                  }
                }}
              />
              <div className="hidden w-6 h-6 text-orange-600 font-bold text-sm flex items-center justify-center">
                F
              </div>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">Flowi</h1>
            </div>
          </div>

          {/* Connection Status & Menu Button */}
          <div className="flex items-center gap-3">
            {state.isConnected ? (
              <Wifi className="h-5 w-5 text-orange-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-orange-500" />
            )}
            
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleNav}
              className="text-gray-900 hover:bg-orange-50 dark:text-white dark:hover:bg-orange-900/30"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={closeNav}
            />

            {/* Slide-out Menu */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="md:hidden fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-white/95 backdrop-blur-xl border-r border-orange-200 z-50 flex flex-col shadow-2xl dark:bg-gray-900/95 dark:border-orange-800"
            >
              {/* Header - Matching Login Design */}
              <div className="p-6 border-b border-orange-200 dark:border-orange-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-white shadow-lg border border-orange-200 flex items-center justify-center dark:bg-gray-800 dark:border-orange-700">
                    <img 
                      src="/flowi-logo.png" 
                      alt="Flowi Logo" 
                      className="w-8 h-8 object-contain"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.style.display = 'none';
                        const nextElement = target.nextElementSibling as HTMLElement;
                        if (nextElement) {
                          nextElement.style.display = 'block';
                        }
                      }}
                    />
                    <div className="hidden w-8 h-8 text-orange-600 font-bold text-lg flex items-center justify-center">
                      F
                    </div>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">Flowi</h1>
                    <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">Sistema de Ventas</p>
                  </div>
                </div>

                {/* User Info */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
                    <span className="text-sm font-bold text-white">
                      {getInitials()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate" title={getDisplayName()}>
                      {getDisplayName()}
                    </p>
                    <Badge 
                      variant="secondary" 
                      className={cn(
                        "text-xs px-2 py-0.5",
                        state.user?.role === 'admin' 
                          ? "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800" 
                          : "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800"
                      )}
                    >
                      {state.user?.role === 'admin' ? 'Admin' : 'Usuario'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Connection Status */}
              <div className="px-6 py-3 border-b border-orange-200 dark:border-orange-800">
                <div className="flex items-center gap-2">
                  {state.isConnected ? (
                    <>
                      <Wifi className="h-4 w-4 text-orange-500" />
                      <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800">
                        Supabase
                      </Badge>
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-4 w-4 text-orange-500" />
                      <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800">
                        Local
                      </Badge>
                    </>
                  )}
                </div>
              </div>

              {/* Navigation */}
              <nav className="flex-1 p-6 overflow-y-auto">
                <ul className="space-y-2">
                  {filteredNavItems.map((item) => {
                    const isActive = location.pathname === item.to;
                    return (
                      <li key={item.to}>
                        <Link
                          to={item.to}
                          onClick={closeNav}
                          className={cn(
                            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                            isActive
                              ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg"
                              : "text-gray-600 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-600 dark:hover:text-orange-400"
                          )}
                        >
                          <item.icon className={cn(
                            "h-5 w-5 transition-colors",
                            isActive ? "text-white" : "group-hover:text-orange-500"
                          )} />
                          <span className="font-medium">{item.label}</span>
                          {isActive && (
                            <motion.div
                              layoutId="mobileActiveIndicator"
                              className="ml-auto w-2 h-2 rounded-full bg-white"
                            />
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              {/* Logout */}
              <div className="p-6 border-t border-orange-200 dark:border-orange-800">
                <Button
                  onClick={() => {
                    logout();
                    closeNav();
                  }}
                  variant="ghost"
                  className="w-full justify-start gap-3 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <LogOut className="h-5 w-5" />
                  Cerrar Sesión
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}