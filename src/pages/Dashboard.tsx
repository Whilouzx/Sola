import { useSupabase } from '@/context/SupabaseContext';
import { FlowiAnalytics, formatCurrency, formatPercentage } from '@/lib/analytics';
import { 
  DollarSign,
  ShoppingCart,
  Users,
  Warehouse
} from 'lucide-react';
import { useMemo, useState, useEffect, memo } from 'react';
import { exchangeRateManager, formatVES, formatUSD } from '@/lib/exchange-rate';

// Import modular components
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { MetricsCards } from '@/components/dashboard/MetricsCards';
import { ExchangeInfo } from '@/components/dashboard/ExchangeInfo';
import { AlertsSection } from '@/components/dashboard/AlertsSection';
import { ChartsSection } from '@/components/dashboard/ChartsSection';
import { RecentSales } from '@/components/dashboard/RecentSales';
import { AnalyticsSummary } from '@/components/dashboard/AnalyticsSummary';
import { QuickActions } from '@/components/dashboard/QuickActions';

function Dashboard() {
  const { state } = useSupabase();
  const [exchangeRate, setExchangeRate] = useState(36.50);
  const [accountsReceivable, setAccountsReceivable] = useState<any[]>([]);

  useEffect(() => {
    const currentRate = exchangeRateManager.getCurrentRate();
    if (currentRate) {
      setExchangeRate(currentRate.usdToVes);
    }

    const handleExchangeRateUpdate = (event: CustomEvent) => {
      setExchangeRate(event.detail.usdToVes);
    };

    const loadReceivables = async () => {
      try {
        const { getReceivables } = await import('@/lib/accounts/receivable-service');
        const receivablesData = await getReceivables();
        setAccountsReceivable(receivablesData);
      } catch (error) {
        console.warn('Error loading receivables:', error);
        try {
          const saved = localStorage.getItem('sales-app-receivables');
          setAccountsReceivable(saved ? JSON.parse(saved) : []);
        } catch (e) {
          console.error('Error loading from localStorage:', e);
        }
      }
    };

    loadReceivables();
    window.addEventListener('exchangeRateUpdated', handleExchangeRateUpdate as EventListener);
    
    const interval = setInterval(loadReceivables, 5000);
    
    return () => {
      window.removeEventListener('exchangeRateUpdated', handleExchangeRateUpdate as EventListener);
      clearInterval(interval);
    };
  }, []);

  // Initialize analytics
  const analytics = useMemo(() => {
    return new FlowiAnalytics(state.sales, state.products, []);
  }, [state.sales, state.products]);

  const analyticsData = useMemo(() => {
    return analytics.getAnalyticsData();
  }, [analytics]);

  // Enhanced metrics with VES integration
  const enhancedMetrics = useMemo(() => {
    const totalProducts = state.products.length;
    const lowStockProducts = analytics.getLowStockProducts().length;
    const inventoryValue = analytics.getInventoryValue();
    
    // CRITICAL FIX: Calculate total VES revenue by converting USD revenue to VES
    const totalRevenueVES = analyticsData.totalRevenue * exchangeRate;
    
    const inventoryValueVES = inventoryValue * exchangeRate;
    
    // Today's sales
    const todaySales = state.sales.filter(sale => {
      const today = new Date().toDateString();
      const saleDate = new Date(sale.createdAt).toDateString();
      return today === saleDate;
    });
    
    const todaySalesCount = todaySales.length;
    
    // FIXED: Calculate today's REAL USD sales (no conversions)
    const todayRevenueUSD = todaySales.reduce((sum, sale) => {
      // USD and Zelle payments: use totalUSD
      if (sale.paymentMethod === 'usd' || sale.paymentMethod === 'zelle') {
        return sum + sale.totalUSD;
      }
      // Mixed payments: use only the USD portion
      if (sale.paymentMethod === 'mixed') {
        return sum + (sale.paidUSD || 0);
      }
      // VES payments: don't convert, return sum as-is
      return sum;
    }, 0);
    
    // FIXED: Calculate today's REAL VES sales (no conversions)
    const todayRevenueVES = todaySales.reduce((sum, sale) => {
      // VES and Pago Móvil payments: use totalVES
      if (sale.paymentMethod === 'ves' || sale.paymentMethod === 'pago_movil') {
        return sum + (sale.totalVES || 0);
      }
      // Mixed payments: use only the VES portion
      if (sale.paymentMethod === 'mixed') {
        return sum + (sale.paidVES || 0);
      }
      // USD payments: don't convert, return sum as-is
      return sum;
    }, 0);
    
    // Payment method breakdown - UPDATED for "Clientes" card
    const vesPayments = state.sales.filter(sale => 
      sale.paymentMethod === 'ves' || sale.paymentMethod === 'pago_movil'
    ).length;
    
    const usdPayments = state.sales.filter(sale => 
      sale.paymentMethod === 'usd' || sale.paymentMethod === 'zelle'
    ).length;

    const mixedPayments = state.sales.filter(sale => 
      sale.paymentMethod === 'mixed'
    ).length;

    const totalPayments = vesPayments + usdPayments + mixedPayments;

    // Calculate Accounts Receivable Summary
    const totalReceivables = accountsReceivable.length;
    const pendingReceivables = accountsReceivable.filter(r => r.status === 'pending' || r.status === 'overdue').length;
    const overdueReceivables = accountsReceivable.filter(r => r.status === 'overdue').length;

    return {
      totalProducts,
      lowStockProducts,
      inventoryValue,
      inventoryValueVES,
      totalRevenueVES,
      todaySalesCount,
      todayRevenueUSD,
      todayRevenueVES,
      vesPayments,
      usdPayments,
      mixedPayments,
      totalPayments,
      exchangeRate,
      totalReceivables,
      pendingReceivables,
      overdueReceivables
    };
  }, [state.sales, state.products, analyticsData, exchangeRate, accountsReceivable]);

  const recentSales = state.sales.slice(-5).reverse();

  // Prepare metrics data for MetricsCards component
  const metricsData = [
    {
      title: 'Ingresos USD',
      value: formatUSD(analyticsData.totalRevenue),
      subtitle: formatVES(enhancedMetrics.totalRevenueVES),
      icon: DollarSign,
      gradient: 'bg-gradient-to-br from-green-500 to-emerald-600',
      link: '/banks',
      growth: analyticsData.monthlyComparison.growth
    },
    {
      title: 'Ventas Hoy',
      value: enhancedMetrics.todaySalesCount.toString(),
      subtitle: `${formatUSD(enhancedMetrics.todayRevenueUSD)} | ${formatVES(enhancedMetrics.todayRevenueVES)}`,
      icon: ShoppingCart,
      gradient: 'flowi-gradient',
      link: '/sales'
    },
    {
      title: 'Inventario',
      value: formatUSD(enhancedMetrics.inventoryValue),
      subtitle: formatVES(enhancedMetrics.inventoryValueVES),
      icon: Warehouse,
      gradient: 'bg-gradient-to-br from-blue-500 to-cyan-600',
      link: '/products'
    },
    {
      title: 'Cuentas por Cobrar',
      value: enhancedMetrics.totalReceivables.toString(),
      subtitle: `${enhancedMetrics.pendingReceivables} Pendiente | ${enhancedMetrics.overdueReceivables} Vencida`,
      icon: Users,
      gradient: 'bg-gradient-to-br from-purple-500 to-indigo-600',
      link: '/accounts-receivable'
    }
  ];

  // Prepare chart data - Transform sales trend to chart format
  const salesTrendChartData = analyticsData.salesTrend.map(trend => ({
    name: trend.date,
    value: trend.revenue
  }));

  const topProductsChartData = analyticsData.topProducts.map(product => ({
    name: product.name.length > 15 ? product.name.substring(0, 15) + '...' : product.name,
    value: product.revenue
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <DashboardHeader 
        userName={state.user?.name}
        exchangeRate={enhancedMetrics.exchangeRate}
      />

      {/* Enhanced Key Metrics Cards */}
      <MetricsCards metrics={metricsData} />

      {/* Currency Exchange Info */}
      <ExchangeInfo 
        exchangeRate={enhancedMetrics.exchangeRate}
        totalRevenue={analyticsData.totalRevenue}
        totalRevenueVES={enhancedMetrics.totalRevenueVES}
      />

      {/* Alert for Low Stock */}
      <AlertsSection lowStockCount={enhancedMetrics.lowStockProducts} />

      {/* Charts Section */}
      <ChartsSection 
        salesTrendData={salesTrendChartData}
        topProductsData={topProductsChartData}
      />

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Sales */}
        <RecentSales sales={recentSales} />

        {/* Enhanced Analytics Summary */}
        <AnalyticsSummary 
          averageOrderValue={analyticsData.averageOrderValue}
          exchangeRate={enhancedMetrics.exchangeRate}
          totalProducts={enhancedMetrics.totalProducts}
          totalSales={analyticsData.totalSales}
          vesPayments={enhancedMetrics.vesPayments}
          usdPayments={enhancedMetrics.usdPayments}
          monthlyGrowth={analyticsData.monthlyComparison.growth}
        />
      </div>

      {/* Quick Actions */}
      <QuickActions />
    </div>
  );
}

export default memo(Dashboard);
