import { motion } from 'framer-motion';
import { FuturisticCard } from '@/components/ui/futuristic-card';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AlertsSectionProps {
  lowStockCount: number;
}

export function AlertsSection({ lowStockCount }: AlertsSectionProps) {
  if (lowStockCount === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5 }}
    >
      <FuturisticCard variant="glass" className="p-6 flowi-card border-orange-200 bg-orange-50 dark:bg-orange-900/10 dark:border-orange-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-200">Stock Bajo</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {lowStockCount} producto(s) con stock menor a 5 unidades
              </p>
            </div>
          </div>
          <Link to="/products">
            <Button className="flowi-button-outline">
              Ver Productos
            </Button>
          </Link>
        </div>
      </FuturisticCard>
    </motion.div>
  );
}