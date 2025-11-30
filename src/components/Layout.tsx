import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSupabase } from '@/context/SupabaseContext';
import { useTheme } from '@/components/ThemeProvider';
import { MobileNav } from '@/components/ui/mobile-nav';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  ShoppingCart, 
  BarChart3, 
  Package,
  Users, 
  Settings,
  LogOut,
  Wifi,
  WifiOff,
  Truck,
  FileText,
  Receipt,
  Target,
  Moon,
  Sun,
  Monitor,
  Building2,
  Tags
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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

export default function Layout() {
  const { state, logout } = useSupabase();
  const { theme, setTheme } = useTheme();
  const location = useLocation();

  const filteredNavItems = navItems.filter(item => 
    !item.adminOnly || state.user?.role === 'admin'
  );

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Sesión cerrada exitosamente');
    } catch (error: any) {
      console.error('Logout error:', error);
      toast.error('Error cerrando sesión');
    }
  };

  const getThemeIcon = () => {
    return theme === 'light' ? Sun : Moon;
  };

  const ThemeIcon = getThemeIcon();

  const cycleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Mobile Navigation */}
      <MobileNav />

      {/* Desktop Sidebar */}
      <aside className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow flowi-card flowi-card-dark m-4 rounded-2xl overflow-hidden shadow-flowi">
          {/* Logo - Matching Login Design Exactly */}
          <div className="flex items-center gap-3 p-6 border-b border-orange-100 dark:border-orange-900/30">
            <div className="w-12 h-12 rounded-xl bg-white shadow-lg border border-orange-200 flex items-center justify-center">
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
          <div className="p-4 border-b border-orange-100 dark:border-orange-900/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flowi-gradient shadow-flowi flex items-center justify-center">
                <span className="text-sm font-bold text-white">
                  {getInitials()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate" title={getDisplayName()}>
                  {getDisplayName()}
                </p>
                <div className="flex items-center gap-2">
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
          </div>

          {/* Connection Status & Theme Toggle */}
          <div className="px-4 py-3 border-b border-orange-100 dark:border-orange-900/30">
            <div className="flex items-center justify-between">
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
              <Button
                variant="ghost"
                size="sm"
                onClick={cycleTheme}
                className="h-8 w-8 p-0 hover:bg-orange-100 dark:hover:bg-orange-900/30"
              >
                <ThemeIcon className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto custom-scrollbar">
            <ul className="space-y-1">
              {filteredNavItems.map((item) => {
                const isActive = location.pathname === item.to;
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className={cn(
                        "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group text-sm font-medium",
                        isActive
                          ? "flowi-gradient text-white shadow-flowi transform scale-105"
                          : "text-gray-600 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-600 dark:hover:text-orange-400 hover:shadow-soft"
                      )}
                    >
                      <item.icon className={cn(
                        "h-5 w-5 transition-all duration-300 flex-shrink-0",
                        isActive ? "text-white" : "group-hover:text-orange-500 group-hover:scale-110"
                      )} />
                      <span className={cn(
                        "truncate font-medium text-left transition-colors duration-300",
                        isActive ? "text-white" : "text-gray-600 dark:text-gray-300 group-hover:text-orange-600 dark:group-hover:text-orange-400"
                      )}>
                        {item.label}
                      </span>
                      {isActive && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="ml-auto w-2 h-2 rounded-full bg-white flex-shrink-0 animate-pulse-soft"
                        />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-orange-100 dark:border-orange-900/30">
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full justify-start gap-3 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-medium py-3 rounded-xl transition-all duration-300"
            >
              <LogOut className="h-5 w-5" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:pl-72 min-h-screen">
        <div className="p-4 md:p-8 pt-16 md:pt-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="max-w-7xl mx-auto"
          >
            <Outlet />
          </motion.div>
        </div>
      </main>
    </div>
  );
}