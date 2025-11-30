import { Sale, Product, Customer } from '@/types';

export interface AnalyticsData {
  totalRevenue: number;
  totalSales: number;
  averageOrderValue: number;
  topProducts: Array<{
    id: string;
    name: string;
    sales: number;
    revenue: number;
  }>;
  salesTrend: Array<{
    date: string;
    sales: number;
    revenue: number;
    orders: number;
  }>;
  customerSegments: Array<{
    name: string;
    value: number;
    count: number;
  }>;
  monthlyComparison: {
    currentMonth: number;
    previousMonth: number;
    growth: number;
  };
}

export class FlowiAnalytics {
  private sales: Sale[];
  private products: Product[];
  private customers: Customer[];

  constructor(sales: Sale[], products: Product[], customers: Customer[]) {
    this.sales = sales;
    this.products = products;
    this.customers = customers;
  }

  // Calculate total revenue
  getTotalRevenue(): number {
    return this.sales.reduce((sum, sale) => sum + sale.totalUSD, 0);
  }

  // Calculate average order value
  getAverageOrderValue(): number {
    if (this.sales.length === 0) return 0;
    return this.getTotalRevenue() / this.sales.length;
  }

  // Get top performing products
  getTopProducts(limit: number = 5): Array<{
    id: string;
    name: string;
    sales: number;
    revenue: number;
  }> {
    const productStats = new Map<string, { sales: number; revenue: number }>();

    // Count sales and revenue per product
    this.sales.forEach(sale => {
      sale.items.forEach(item => {
        const current = productStats.get(item.productId) || { sales: 0, revenue: 0 };
        productStats.set(item.productId, {
          sales: current.sales + item.quantity,
          revenue: current.revenue + (item.priceUSD * item.quantity)
        });
      });
    });

    // Convert to array and sort by revenue
    const topProducts = Array.from(productStats.entries())
      .map(([productId, stats]) => {
        const product = this.products.find(p => p.id === productId);
        return {
          id: productId,
          name: product?.name || 'Producto Desconocido',
          sales: stats.sales,
          revenue: stats.revenue
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);

    return topProducts;
  }

  // Get sales trend over time
  getSalesTrend(days: number = 30): Array<{
    date: string;
    sales: number;
    revenue: number;
    orders: number;
  }> {
    const today = new Date();
    const startDate = new Date(today.getTime() - (days * 24 * 60 * 60 * 1000));
    
    const trendData = new Map<string, { sales: number; revenue: number; orders: number }>();

    // Initialize all dates with zero values
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + (i * 24 * 60 * 60 * 1000));
      const dateKey = date.toISOString().split('T')[0];
      trendData.set(dateKey, { sales: 0, revenue: 0, orders: 0 });
    }

    // Aggregate sales data
    this.sales.forEach(sale => {
      const saleDate = new Date(sale.createdAt).toISOString().split('T')[0];
      const current = trendData.get(saleDate);
      
      if (current) {
        const totalQuantity = sale.items.reduce((sum, item) => sum + item.quantity, 0);
        trendData.set(saleDate, {
          sales: current.sales + totalQuantity,
          revenue: current.revenue + sale.totalUSD,
          orders: current.orders + 1
        });
      }
    });

    // Convert to array and format dates
    return Array.from(trendData.entries())
      .map(([date, data]) => ({
        date: new Date(date).toLocaleDateString('es-ES', { 
          month: 'short', 
          day: 'numeric' 
        }),
        ...data
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  // Get customer segments
  getCustomerSegments(): Array<{
    name: string;
    value: number;
    count: number;
  }> {
    const segments = {
      vip: { value: 0, count: 0 },
      loyal: { value: 0, count: 0 },
      active: { value: 0, count: 0 },
      inactive: { value: 0, count: 0 },
      new: { value: 0, count: 0 }
    };

    this.customers.forEach(customer => {
      const customerSales = this.sales.filter(sale => sale.customerId === customer.id);
      const totalSpent = customerSales.reduce((sum, sale) => sum + sale.totalUSD, 0);
      const totalOrders = customerSales.length;
      
      const lastPurchase = customerSales.length > 0 
        ? new Date(Math.max(...customerSales.map(sale => new Date(sale.createdAt).getTime())))
        : null;
      
      const daysSinceLastPurchase = lastPurchase 
        ? Math.floor((new Date().getTime() - lastPurchase.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      // Determine segment
      let segment = 'new';
      if (totalOrders === 0) segment = 'new';
      else if (totalOrders >= 10 && totalSpent >= 1000) segment = 'vip';
      else if (totalOrders >= 5 || totalSpent >= 500) segment = 'loyal';
      else if (daysSinceLastPurchase && daysSinceLastPurchase > 90) segment = 'inactive';
      else segment = 'active';

      segments[segment as keyof typeof segments].value += totalSpent;
      segments[segment as keyof typeof segments].count += 1;
    });

    return Object.entries(segments).map(([name, data]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value: data.value,
      count: data.count
    }));
  }

  // Get monthly comparison
  getMonthlyComparison(): {
    currentMonth: number;
    previousMonth: number;
    growth: number;
  } {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const currentMonthSales = this.sales.filter(sale => {
      const saleDate = new Date(sale.createdAt);
      return saleDate >= currentMonthStart;
    });

    const previousMonthSales = this.sales.filter(sale => {
      const saleDate = new Date(sale.createdAt);
      return saleDate >= previousMonthStart && saleDate <= previousMonthEnd;
    });

    const currentMonth = currentMonthSales.reduce((sum, sale) => sum + sale.totalUSD, 0);
    const previousMonth = previousMonthSales.reduce((sum, sale) => sum + sale.totalUSD, 0);
    
    const growth = previousMonth > 0 ? ((currentMonth - previousMonth) / previousMonth) * 100 : 0;

    return {
      currentMonth,
      previousMonth,
      growth
    };
  }

  // Get inventory value
  getInventoryValue(): number {
    return this.products.reduce((sum, product) => sum + (product.priceUSD * product.stock), 0);
  }

  // Get low stock products
  getLowStockProducts(threshold: number = 5): Product[] {
    return this.products.filter(product => product.stock <= threshold);
  }

  // Get complete analytics data
  getAnalyticsData(): AnalyticsData {
    return {
      totalRevenue: this.getTotalRevenue(),
      totalSales: this.sales.length,
      averageOrderValue: this.getAverageOrderValue(),
      topProducts: this.getTopProducts(),
      salesTrend: this.getSalesTrend(),
      customerSegments: this.getCustomerSegments(),
      monthlyComparison: this.getMonthlyComparison()
    };
  }
}

// Utility functions for formatting
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
};

export const formatPercentage = (value: number): string => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
};

export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('es-ES').format(value);
};