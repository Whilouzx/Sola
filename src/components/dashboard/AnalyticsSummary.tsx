import { motion } from 'framer-motion';
import { FuturisticCard } from '@/components/ui/futuristic-card';
import { Button } from '@/components/ui/button';
import { BarChart3, Target, DollarSign, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatUSD, formatVES } from '@/lib/exchange-rate';
import { formatPercentage } from '@/lib/analytics';

interface AnalyticsSummaryProps {
  averageOrderValue: number;
  exchangeRate: number;
  totalProducts: number;
  totalSales: number;
  vesPayments: number;
  usdPayments: number;
  monthlyGrowth: number;
}

export function AnalyticsSummary({ 
  averageOrderValue, 
  exchangeRate, 
  totalProducts, 
  totalSales, 
  vesPayments, 
  usdPayments, 
  monthlyGrowth 
}: AnalyticsSummaryProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.9 }}
    >
      <FuturisticCard variant="glass" className="p-6 flowi-card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-3">
            <BarChart3 className="h-6 w-6 text-orange-500" />
            Resumen Analítico
          </h2>
          <Link to="/marketing">
            <Button variant="outline" size="sm" className="flowi-button-outline">
              <Target className="h-4 w-4 mr-2" />
              Marketing
            </Button>
          </Link>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-900/30 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Ticket Promedio</p>
              <p className="text-lg font-bold text-orange-600">
                {formatUSD(averageOrderValue)}
              </p>
              <p className="text-sm text-blue-600">
                {formatVES(averageOrderValue * exchangeRate)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-orange-500" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-center">
              <p className="text-xs text-gray-600 dark:text-gray-400">Productos</p>
              <p className="text-lg font-bold text-gray-800 dark:text-gray-200">{totalProducts}</p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-center">
              <p className="text-xs text-gray-600 dark:text-gray-400">Ventas</p>
              <p className="text-lg font-bold text-gray-800 dark:text-gray-200">{totalSales}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
              <p className="text-xs text-blue-600">Pagos VES</p>
              <p className="text-lg font-bold text-blue-700">{vesPayments}</p>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
              <p className="text-xs text-green-600">Pagos USD</p>
              <p className="text-lg font-bold text-green-700">{usdPayments}</p>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Crecimiento Mensual</p>
            <div className={`flex items-center gap-2 ${
              monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {monthlyGrowth >= 0 ? 
                <ArrowUpRight className="h-4 w-4" /> : 
                <ArrowDownLeft className="h-4 w-4" />
              }
              <span className="font-bold text-lg">
                {formatPercentage(monthlyGrowth)}
              </span>
            </div>
          </div>
        </div>
      </FuturisticCard>
    </motion.div>
  );
}