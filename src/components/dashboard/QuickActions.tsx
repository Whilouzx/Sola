import { motion } from 'framer-motion';
import { FuturisticCard } from '@/components/ui/futuristic-card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Package, Target, Building2, BarChart3, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

export function QuickActions() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.0 }}
    >
      <FuturisticCard variant="glass" className="p-6 flowi-card">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-6 flex items-center gap-3">
          <Zap className="h-6 w-6 text-orange-500" />
          Acciones Rápidas
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Link to="/sales">
            <Button className="w-full h-12 flowi-button transform hover:scale-105">
              <ShoppingCart className="h-5 w-5 mr-2" />
              Nueva Venta
            </Button>
          </Link>
          
          <Link to="/products">
            <Button className="w-full h-12 bg-gradient-to-r from-blue-600 to-cyan-700 hover:from-blue-700 hover:to-cyan-800 text-white font-bold shadow-flowi hover:shadow-flowi-lg transition-all duration-300 transform hover:scale-105">
              <Package className="h-5 w-5 mr-2" />
              Inventario
            </Button>
          </Link>
          
          <Link to="/marketing">
            <Button className="w-full h-12 bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white font-bold shadow-flowi hover:shadow-flowi-lg transition-all duration-300 transform hover:scale-105">
              <Target className="h-5 w-5 mr-2" />
              Marketing
            </Button>
          </Link>

          <Link to="/banks">
            <Button className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white font-bold shadow-flowi hover:shadow-flowi-lg transition-all duration-300 transform hover:scale-105">
              <Building2 className="h-5 w-5 mr-2" />
              Bancos
            </Button>
          </Link>
          
          <Link to="/reports">
            <Button className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold shadow-flowi hover:shadow-flowi-lg transition-all duration-300 transform hover:scale-105">
              <BarChart3 className="h-5 w-5 mr-2" />
              Reportes
            </Button>
          </Link>
        </div>
      </FuturisticCard>
    </motion.div>
  );
}