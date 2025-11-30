import { motion } from 'framer-motion';
import { FuturisticCard } from '@/components/ui/futuristic-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FlowiBarChart, FlowiLineChart } from '@/components/ui/charts';
import { TrendingUp, Star, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ChartData {
  name: string;
  value: number;
}

interface ChartsSectionProps {
  salesTrendData: ChartData[];
  topProductsData: ChartData[];
}

export function ChartsSection({ salesTrendData, topProductsData }: ChartsSectionProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Sales Trend Chart */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.6 }}
      >
        <FuturisticCard variant="glass" className="p-6 flowi-card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-3">
              <TrendingUp className="h-6 w-6 text-orange-500" />
              Tendencia de Ventas
            </h2>
            <Link to="/reports">
              <Button variant="outline" size="sm" className="flowi-button-outline">
                Ver en Reports
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
          
          <FlowiLineChart 
            data={salesTrendData} 
            height={350}
          />
        </FuturisticCard>
      </motion.div>

      {/* Top Products Chart */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.7 }}
      >
        <FuturisticCard variant="glass" className="p-6 flowi-card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-3">
              <Star className="h-6 w-6 text-orange-500" />
              Productos Top
            </h2>
            <Link to="/products">
              <Button variant="outline" size="sm" className="flowi-button-outline">
                Ver Todos
              </Button>
            </Link>
          </div>
          
          <FlowiBarChart 
            data={topProductsData} 
            height={300}
          />
        </FuturisticCard>
      </motion.div>
    </div>
  );
}
