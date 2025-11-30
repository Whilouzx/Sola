import { useState, useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import { useSupabase } from '@/context/SupabaseContext';
import { FuturisticCard } from '@/components/ui/futuristic-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FlowiBarChart, FlowiLineChart, FlowiPieChart } from '@/components/ui/charts';
import { FlowiAnalytics, formatCurrency } from '@/lib/analytics';
import { 
  BarChart3, 
  Download, 
  Calendar, 
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  FileText,
  Filter
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportData {
  name: string;
  value: number;
}

function Reports() {
  const { state } = useSupabase();
  const [dateRange, setDateRange] = useState('30');
  const [reportType, setReportType] = useState('sales');

  // Initialize analytics
  const analytics = useMemo(() => {
    return new FlowiAnalytics(state.sales, state.products, state.customers || []);
  }, [state.sales, state.products, state.customers]);

  const analyticsData = useMemo(() => {
    return analytics.getAnalyticsData();
  }, [analytics]);

  // Filter data based on date range
  const filteredSales = useMemo(() => {
    const days = parseInt(dateRange);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return state.sales.filter(sale => 
      new Date(sale.createdAt) >= cutoffDate
    );
  }, [state.sales, dateRange]);

  // Generate report data based on type
  const reportData: ReportData[] = useMemo(() => {
    switch (reportType) {
      case 'sales':
        return analyticsData.salesTrend.map(item => ({
          name: item.date,
          value: item.revenue
        }));
      
      case 'products':
        return analyticsData.topProducts.map(product => ({
          name: product.name,
          value: product.revenue
        }));
      
      case 'customers':
        return analyticsData.customerSegments.map(segment => ({
          name: segment.name,
          value: segment.value
        }));
      
      default:
        return [];
    }
  }, [reportType, analyticsData]);

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.totalUSD, 0);
    const totalSales = filteredSales.length;
    const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;
    
    return {
      totalRevenue,
      totalSales,
      averageOrderValue,
      totalProducts: state.products.length,
      totalCustomers: state.customers?.length || 0
    };
  }, [filteredSales, state.products.length, state.customers?.length]);

  const generatePDFReport = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('Flowi Admin - Reporte de Ventas', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Período: Últimos ${dateRange} días`, 20, 35);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, 20, 45);
    
    // Summary metrics
    doc.setFontSize(14);
    doc.text('Resumen Ejecutivo', 20, 65);
    
    const summaryData = [
      ['Métrica', 'Valor'],
      ['Ingresos Totales', formatCurrency(summaryMetrics.totalRevenue)],
      ['Total de Ventas', summaryMetrics.totalSales.toString()],
      ['Ticket Promedio', formatCurrency(summaryMetrics.averageOrderValue)],
      ['Total Productos', summaryMetrics.totalProducts.toString()],
      ['Total Clientes', summaryMetrics.totalCustomers.toString()],
    ];

    autoTable(doc, {
      head: [summaryData[0]],
      body: summaryData.slice(1),
      startY: 75,
      theme: 'grid',
      headStyles: { fillColor: [249, 115, 22] },
    });

    // Sales data
    if (filteredSales.length > 0) {
      const salesData = filteredSales.slice(0, 20).map(sale => [
        new Date(sale.createdAt).toLocaleDateString('es-ES'),
        sale.userName,
        formatCurrency(sale.totalUSD),
        sale.paymentMethod.toUpperCase()
      ]);

      autoTable(doc, {
        head: [['Fecha', 'Usuario', 'Total', 'Método de Pago']],
        body: salesData,
        startY: (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20,
        theme: 'grid',
        headStyles: { fillColor: [249, 115, 22] },
      });
    }

    doc.save(`flowi-reporte-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportToCSV = () => {
    const headers = ['Fecha', 'Usuario', 'Total USD', 'Método de Pago', 'Items'];
    const csvData = filteredSales.map(sale => [
      new Date(sale.createdAt).toLocaleDateString('es-ES'),
      sale.userName,
      sale.totalUSD.toString(),
      sale.paymentMethod,
      sale.items.length.toString()
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flowi-ventas-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gradient">
            Reportes y Análisis
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Análisis detallado de ventas y rendimiento del negocio
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button onClick={exportToCSV} variant="outline" className="flowi-button-outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          <Button onClick={generatePDFReport} className="flowi-button">
            <FileText className="h-4 w-4 mr-2" />
            Generar PDF
          </Button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <FuturisticCard variant="glass" className="p-6 flowi-card">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Período de Tiempo
              </label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="flowi-input">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Últimos 7 días</SelectItem>
                  <SelectItem value="30">Últimos 30 días</SelectItem>
                  <SelectItem value="90">Últimos 90 días</SelectItem>
                  <SelectItem value="365">Último año</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Tipo de Reporte
              </label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="flowi-input">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">Ventas por Tiempo</SelectItem>
                  <SelectItem value="products">Productos Top</SelectItem>
                  <SelectItem value="customers">Segmentos de Clientes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </FuturisticCard>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {[
          {
            title: 'Ingresos Totales',
            value: formatCurrency(summaryMetrics.totalRevenue),
            icon: DollarSign,
            color: 'text-green-600'
          },
          {
            title: 'Total Ventas',
            value: summaryMetrics.totalSales.toString(),
            icon: ShoppingCart,
            color: 'text-blue-600'
          },
          {
            title: 'Ticket Promedio',
            value: formatCurrency(summaryMetrics.averageOrderValue),
            icon: TrendingUp,
            color: 'text-orange-600'
          },
          {
            title: 'Productos',
            value: summaryMetrics.totalProducts.toString(),
            icon: Package,
            color: 'text-purple-600'
          },
          {
            title: 'Clientes',
            value: summaryMetrics.totalCustomers.toString(),
            icon: Users,
            color: 'text-indigo-600'
          }
        ].map((metric, index) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
          >
            <FuturisticCard variant="glass" className="p-6 flowi-card text-center">
              <div className="flex justify-center mb-3">
                <div className="p-3 rounded-xl bg-orange-100 dark:bg-orange-900/30">
                  <metric.icon className={`h-6 w-6 ${metric.color}`} />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-1">
                {metric.value}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                {metric.title}
              </p>
            </FuturisticCard>
          </motion.div>
        ))}
      </div>

      {/* Main Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <FuturisticCard variant="glass" className="p-6 flowi-card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-3">
              <BarChart3 className="h-6 w-6 text-orange-500" />
              {reportType === 'sales' && 'Tendencia de Ventas'}
              {reportType === 'products' && 'Productos Más Vendidos'}
              {reportType === 'customers' && 'Segmentación de Clientes'}
            </h2>
            <Badge className="bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800">
              Últimos {dateRange} días
            </Badge>
          </div>
          
          {reportType === 'sales' && (
            <FlowiLineChart data={reportData} height={400} />
          )}
          {reportType === 'products' && (
            <FlowiBarChart data={reportData} height={400} />
          )}
          {reportType === 'customers' && (
            <FlowiPieChart data={reportData} height={400} />
          )}
        </FuturisticCard>
      </motion.div>

      {/* Recent Sales Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <FuturisticCard variant="glass" className="flowi-card">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-3">
              <ShoppingCart className="h-6 w-6 text-orange-500" />
              Ventas Recientes
              <Badge className="bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800">
                {filteredSales.length} ventas
              </Badge>
            </h2>
          </div>
          
          <div className="p-6">
            {filteredSales.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 text-lg">No hay ventas en este período</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-semibold text-gray-800 dark:text-gray-200">Fecha</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-800 dark:text-gray-200">Usuario</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-800 dark:text-gray-200">Total</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-800 dark:text-gray-200">Método</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-800 dark:text-gray-200">Items</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSales.slice(0, 10).map((sale, index) => (
                      <motion.tr
                        key={sale.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.9 + index * 0.05 }}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-colors"
                      >
                        <td className="py-3 px-4 text-gray-800 dark:text-gray-200">
                          {new Date(sale.createdAt).toLocaleDateString('es-ES')}
                        </td>
                        <td className="py-3 px-4 text-gray-800 dark:text-gray-200">
                          {sale.userName}
                        </td>
                        <td className="py-3 px-4 font-semibold text-orange-600 dark:text-orange-400">
                          {formatCurrency(sale.totalUSD)}
                        </td>
                        <td className="py-3 px-4">
                          <Badge 
                            className={`text-xs ${
                              sale.paymentMethod === 'usd' ? 'bg-green-100 text-green-700 border-green-200' :
                              sale.paymentMethod === 'ves' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                              'bg-purple-100 text-purple-700 border-purple-200'
                            }`}
                          >
                            {sale.paymentMethod.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                          {sale.items.length} productos
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </FuturisticCard>
      </motion.div>
    </div>
  );
}

export default memo(Reports);
