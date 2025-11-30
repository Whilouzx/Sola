import { FuturisticCard } from '@/components/ui/futuristic-card';
import { Button } from '@/components/ui/button';
import { ShoppingCart as ShoppingCartIcon, Trash2, Plus, Minus, Calculator } from 'lucide-react';
import { motion } from 'framer-motion';

interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  priceUSD: number;
  priceVES: number;
}

interface ShoppingCartProps {
  cart: CartItem[];
  onRemoveFromCart: (productId: string) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onOpenProcessDialog: () => void;
  totalUSD: number;
  totalVES: number;
}

export function ShoppingCart({ 
  cart, 
  onRemoveFromCart, 
  onUpdateQuantity, 
  onOpenProcessDialog,
  totalUSD,
  totalVES 
}: ShoppingCartProps) {
  return (
    <div className="space-y-6 sticky top-24">
      <FuturisticCard variant="glass" className="p-6 flowi-card">
        <div className="flex items-center gap-2 mb-4">
          <ShoppingCartIcon className="h-6 w-6 text-orange-500" />
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
            Carrito de Compras
          </h2>
        </div>
        
        {cart.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCartIcon className="h-16 w-16 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400 font-medium">Carrito vacío</p>
            <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">
              Selecciona productos para comenzar
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Cart Items - Scrollable */}
            <div className="max-h-64 overflow-y-auto space-y-3 pr-2">
              {cart.map((item, index) => (
                <motion.div 
                  key={item.productId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-3 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-800/30 border border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-600 transition-all"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200 text-sm line-clamp-2">
                      {item.productName}
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveFromCart(item.productId)}
                      className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 flex-shrink-0 ml-2"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 bg-white dark:bg-gray-700 rounded-md p-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
                        className="h-5 w-5 p-0 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600"
                      >
                        <Minus className="h-2.5 w-2.5" />
                      </Button>
                      <span className="text-gray-800 dark:text-gray-200 font-bold w-6 text-center text-sm">
                        {item.quantity}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                        className="h-5 w-5 p-0 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600"
                      >
                        <Plus className="h-2.5 w-2.5" />
                      </Button>
                    </div>
                    
                    <div className="text-right text-xs">
                      <div className="text-green-600 dark:text-green-400 font-bold">
                        ${(item.priceUSD * item.quantity).toFixed(2)}
                      </div>
                      <div className="text-blue-600 dark:text-blue-400 font-medium text-xs">
                        Bs. {(item.priceVES * item.quantity).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            
            {/* Totals */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3">
              <div className="space-y-2 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400 font-medium text-sm">Total USD:</span>
                  <span className="text-green-600 dark:text-green-400 font-bold text-lg">
                    ${totalUSD.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400 font-medium text-sm">Total VES:</span>
                  <span className="text-blue-600 dark:text-blue-400 font-bold text-lg">
                    Bs. {totalVES.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Items count */}
              <div className="text-center text-xs text-gray-500 dark:text-gray-400">
                {cart.length} {cart.length === 1 ? 'producto' : 'productos'} en el carrito
              </div>
              
              <Button 
                onClick={onOpenProcessDialog}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 h-10"
              >
                <Calculator className="h-4 w-4 mr-2" />
                Procesar Venta
              </Button>
            </div>
          </div>
        )}
      </FuturisticCard>
    </div>
  );
}
