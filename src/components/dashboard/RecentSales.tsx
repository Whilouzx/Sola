import { motion } from 'framer-motion';
import { FuturisticCard } from '@/components/ui/futuristic-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatUSD, formatVES } from '@/lib/exchange-rate';
import { Sale } from '@/types';

interface RecentSalesProps {
  sales: Sale[];
}

export function RecentSales({ sales }: RecentSalesProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.8 }}
    >
      <FuturisticCard variant="glass" className="p-6 flowi-card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-3">
            <ShoppingCart className="h-6 w-6 text-orange-500" />
            Ventas Recientes
          </h2>
          <Link to="/reports">
            <Button variant="outline" size="sm" className="flowi-button-outline">
              Ver Todas
            </Button>
          </Link>
        </div>
        
        {sales.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">No hay ventas recientes</p>
            <Link to="/sales">
              <Button className="mt-3 flowi-button">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Venta
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {sales.map((sale, index) => (
              <motion.div
                key={sale.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + index * 0.1 }}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-soft transition-shadow"
              >
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">{sale.userName}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(sale.createdAt).toLocaleString('es-ES')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-orange-600 dark:text-orange-400">{formatUSD(sale.totalUSD)}</p>
                  {sale.totalVES && (
                    <p className="text-sm text-blue-600">{formatVES(sale.totalVES)}</p>
                  )}
                  <Badge 
                    className={`text-xs font-medium ${
                      sale.paymentMethod === 'usd' || sale.paymentMethod === 'zelle' ? 
                        'bg-green-100 text-green-700 border-green-200' :
                      sale.paymentMethod === 'ves' || sale.paymentMethod === 'pago_movil' ? 
                        'bg-blue-100 text-blue-700 border-blue-200' :
                        'bg-purple-100 text-purple-700 border-purple-200'
                    }`}
                  >
                    {sale.paymentMethod.toUpperCase()}
                  </Badge>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </FuturisticCard>
    </motion.div>
  );
}