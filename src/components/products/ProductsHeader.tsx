import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Package, TrendingDown, AlertTriangle } from 'lucide-react';
import { Product } from '@/types';

interface ProductsHeaderProps {
  products: Product[];
  lowStockCount: number;
  outOfStockCount: number;
}

export function ProductsHeader({ products, lowStockCount, outOfStockCount }: ProductsHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between"
    >
      <div>
        <h1 className="text-3xl md:text-4xl text-gradient bg-[#00000000] mt-[0px] mr-[0px] mb-[0px] ml-[0px] pt-[0px] pr-[0px] pb-[0px] pl-[0px] font-bold text-center opacity-100">
          Inventario
        </h1>
        <p className="text-gray-600 mt-2">
          Gestiona tus productos de forma simple y eficiente
        </p>
      </div>

      <div className="flex gap-3">
        <Badge className="bg-blue-100 text-blue-700 border-blue-200 px-3 py-1">
          <Package className="h-4 w-4 mr-2" />
          {products.length} productos
        </Badge>
        {lowStockCount > 0 && (
          <Badge className="bg-orange-100 text-orange-700 border-orange-200 px-3 py-1">
            <TrendingDown className="h-4 w-4 mr-2" />
            {lowStockCount} stock bajo
          </Badge>
        )}
        {outOfStockCount > 0 && (
          <Badge className="bg-red-100 text-red-700 border-red-200 px-3 py-1">
            <AlertTriangle className="h-4 w-4 mr-2" />
            {outOfStockCount} sin stock
          </Badge>
        )}
      </div>
    </motion.div>
  );
}
