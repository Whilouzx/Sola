import { motion } from 'framer-motion';
import { FuturisticCard } from '@/components/ui/futuristic-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, Plus, Image as ImageIcon } from 'lucide-react';
import { Product } from '@/types';

interface ProductsGridProps {
  products: Product[];
  onAddToCart: (productId: string) => void;
}

export function ProductsGrid({ products, onAddToCart }: ProductsGridProps) {
  const availableProducts = products.filter(p => p.stock > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
          Productos Disponibles
        </h2>
        <Badge className="bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
          {availableProducts.length} productos
        </Badge>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto pr-2">
        {availableProducts.map((product, index) => {
          const mainImage = product.images?.find(img => img.isMain) || product.images?.[0];
          
          return (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FuturisticCard 
                variant="glass" 
                className="p-3 h-full flex flex-col cursor-pointer hover:shadow-lg transition-all group"
                onClick={() => onAddToCart(product.id)}
              >
                {/* Product Image with Placeholder */}
                <div className="w-full h-24 sm:h-28 bg-gradient-to-br from-orange-100 to-orange-50 dark:from-orange-900/30 dark:to-orange-900/10 rounded-lg mb-3 flex items-center justify-center group-hover:from-orange-200 group-hover:to-orange-100 dark:group-hover:from-orange-800/50 dark:group-hover:to-orange-800/20 transition-all overflow-hidden">
                  {mainImage ? (
                    <img
                      src={mainImage.url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center">
                      <ImageIcon className="h-8 w-8 text-orange-400 mx-auto mb-1" />
                      <div className="text-xs text-orange-500">Sin imagen</div>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-1 flex flex-col">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-sm line-clamp-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                    {product.name}
                  </h3>

                  {/* Prices */}
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3 text-green-600" />
                      <span className="text-green-600 font-bold text-sm">
                        ${product.priceUSD}
                      </span>
                    </div>
                    <div className="text-blue-600 dark:text-blue-400 text-xs font-medium">
                      Bs. {product.priceVES.toLocaleString()}
                    </div>
                  </div>

                  {/* Stock Badge */}
                  <div className="mt-2">
                    <Badge className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800 text-xs w-full text-center justify-center">
                      {product.stock} disponibles
                    </Badge>
                  </div>
                </div>

                {/* Add Button */}
                <Button
                  size="sm"
                  className="w-full mt-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold text-xs h-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToCart(product.id);
                  }}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Agregar
                </Button>
              </FuturisticCard>
            </motion.div>
          );
        })}
      </div>

      {availableProducts.length === 0 && (
        <FuturisticCard variant="glass" className="p-12 text-center">
          <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400">
            No hay productos disponibles
          </p>
        </FuturisticCard>
      )}
    </div>
  );
}
