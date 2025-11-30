import { motion } from 'framer-motion';
import { FuturisticCard } from '@/components/ui/futuristic-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Edit, Trash2, DollarSign, AlertTriangle } from 'lucide-react';
import { Product } from '@/types';

interface ProductsGridProps {
  products: Product[];
  loading: boolean;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (product: Product) => void;
}

export function ProductsGrid({ products, loading, onEditProduct, onDeleteProduct }: ProductsGridProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <FuturisticCard variant="glass" className="p-6 flowi-card">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400 mx-auto"></div>
            <p className="text-gray-600 mt-2">Cargando productos...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No se encontraron productos</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 rounded-xl bg-gray-50 border hover:border-orange-400/50 transition-all"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-800 mb-1">
                      {product.name}
                    </h3>
                    {product.image && (
                      <div className="w-full h-32 bg-gray-200 rounded-lg mb-3 overflow-hidden">
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.currentTarget;
                            target.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditProduct(product)}
                      className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteProduct(product)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Precio USD:</span>
                    <span className="font-medium text-green-600 flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      {product.priceUSD.toFixed(2)}
                    </span>
                  </div>
                  
                  {product.priceVES > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Precio VES:</span>
                      <span className="font-medium text-blue-600">
                        Bs. {product.priceVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Stock:</span>
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${
                        product.stock === 0 ? 'text-red-600' :
                        product.stock <= 5 ? 'text-orange-600' :
                        'text-gray-800'
                      }`}>
                        {product.stock}
                      </span>
                      {product.stock <= 5 && (
                        <AlertTriangle className="h-3 w-3 text-orange-500" />
                      )}
                    </div>
                  </div>
                </div>

                {product.stock <= 5 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <Badge className={`text-xs ${
                      product.stock === 0 
                        ? 'bg-red-100 text-red-700 border-red-200'
                        : 'bg-orange-100 text-orange-700 border-orange-200'
                    }`}>
                      {product.stock === 0 ? 'Sin Stock' : 'Stock Bajo'}
                    </Badge>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </FuturisticCard>
    </motion.div>
  );
}