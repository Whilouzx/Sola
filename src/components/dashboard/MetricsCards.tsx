import { motion } from 'framer-motion';
import { FuturisticCard } from '@/components/ui/futuristic-card';
import { Badge } from '@/components/ui/badge';
import { Eye, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatPercentage } from '@/lib/analytics';

interface MetricCardData {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  link: string;
  growth?: number;
}

interface MetricsCardsProps {
  metrics: MetricCardData[];
}

export function MetricsCards({ metrics }: MetricsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => (
        <motion.div
          key={metric.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Link to={metric.link}>
            <FuturisticCard variant="glass" className="p-6 flowi-card card-hover hover:scale-105 transition-all duration-300 cursor-pointer group">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${metric.gradient} shadow-flowi`}>
                  <metric.icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex items-center gap-2">
                  {metric.growth !== undefined && (
                    <div className={`flex items-center gap-1 text-xs font-medium ${
                      metric.growth >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {metric.growth >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownLeft className="h-3 w-3" />}
                      {formatPercentage(metric.growth)}
                    </div>
                  )}
                  <Eye className="h-4 w-4 text-gray-400 group-hover:text-orange-600 transition-colors" />
                </div>
              </div>
              
              <div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-1">
                  {metric.value}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">
                  {metric.title}
                </p>
                {metric.subtitle && (
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {metric.subtitle}
                  </p>
                )}
              </div>
            </FuturisticCard>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}