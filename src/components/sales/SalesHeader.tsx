import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Receipt } from 'lucide-react';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';

interface SalesHeaderProps {
  cartItemsCount: number;
  onOpenCashClosure: () => void;
}

export function SalesHeader({ cartItemsCount, onOpenCashClosure }: SalesHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between"
    >
      <div>
        <h1 className="text-3xl md:text-4xl dark:text-gray-200 bg-[#00000000] mt-[0px] mr-[0px] mb-[0px] ml-[0px] pt-[0px] pr-[0px] pb-[0px] pl-[0px] font-bold opacity-100 text-[#EA580CFF]">
          Nueva Venta
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Procesa una nueva venta
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Badge className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800 px-3 py-1">
          <ShoppingCart className="h-4 w-4 mr-2" />
          {cartItemsCount} productos
        </Badge>
        
        <Button 
          onClick={onOpenCashClosure}
          className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
        >
          <Receipt className="h-4 w-4 mr-2" />
          Cerrar Caja
        </Button>
      </div>
    </motion.div>
  );
}
