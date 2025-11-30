import { motion } from 'framer-motion';
import { FuturisticCard } from '@/components/ui/futuristic-card';
import { Button } from '@/components/ui/button';
import { Banknote, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatUSD, formatVES } from '@/lib/exchange-rate';

interface ExchangeInfoProps {
  exchangeRate: number;
  totalRevenue: number;
  totalRevenueVES: number;
}

export function ExchangeInfo({ exchangeRate, totalRevenue, totalRevenueVES }: ExchangeInfoProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <FuturisticCard variant="glass" className="p-6 flowi-card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
              <Banknote className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-200">Tasa de Cambio Actual</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                1 USD = {exchangeRate.toFixed(2)} VES
              </p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-sm text-gray-600 dark:text-gray-400">Ingresos Totales</p>
            <p className="text-lg font-bold text-green-600">
              {formatUSD(totalRevenue)}
            </p>
            <p className="text-sm text-blue-600">
              {formatVES(totalRevenueVES)}
            </p>
          </div>
          <Link to="/banks" className="w-full sm:w-auto">
            <Button className="flowi-button-outline w-full sm:w-auto">
              <Building2 className="h-4 w-4 mr-2" />
              Gestionar Bancos
            </Button>
          </Link>
        </div>
      </FuturisticCard>
    </motion.div>
  );
}