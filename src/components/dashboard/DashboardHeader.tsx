import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Calendar, RefreshCw, Zap } from 'lucide-react';

interface DashboardHeaderProps {
  userName?: string;
  exchangeRate: number;
}

export function DashboardHeader({ userName, exchangeRate }: DashboardHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col md:flex-row md:items-center justify-between gap-4"
    >
      <div>
        <h1 className="text-3xl md:text-4xl text-gradient bg-[#00000000] mt-[0px] mr-[0px] mb-[0px] ml-[0px] pt-[0px] pr-[0px] pb-[0px] pl-[0px] font-bold text-center opacity-100">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2 flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Bienvenido de vuelta, {userName}
        </p>
      </div>
      
      <div className="flex items-center gap-3">
        <Badge className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800 px-3 py-1 font-medium">
          <RefreshCw className="h-4 w-4 mr-2" />
          USD/VES: {exchangeRate.toFixed(2)}
        </Badge>
        <Badge className="bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800 px-3 py-1 font-medium">
          <Zap className="h-4 w-4 mr-2" />
          {new Date().toLocaleDateString('es-ES')}
        </Badge>
      </div>
    </motion.div>
  );
}