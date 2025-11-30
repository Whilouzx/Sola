import { motion } from 'framer-motion';
import { FuturisticCard } from '@/components/ui/futuristic-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';

interface SearchActionsProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onCreateProduct: () => void;
}

export function SearchActions({ searchTerm, onSearchChange, onCreateProduct }: SearchActionsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <FuturisticCard variant="glass" className="p-6 flowi-card">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1">
            <Input
              placeholder="Buscar productos por nombre..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="flowi-input"
            />
          </div>
          
          <Button 
            className="flowi-button"
            onClick={onCreateProduct}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Producto
          </Button>
        </div>
      </FuturisticCard>
    </motion.div>
  );
}