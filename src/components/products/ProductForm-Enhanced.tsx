import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Product, ProductCategory } from '@/types';
import { getCategories } from '@/lib/categories';

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (productData: any) => Promise<void>;
  product?: Product;
  title: string;
}

export default function ProductFormEnhanced({
  isOpen,
  onClose,
  onSubmit,
  product,
  title
}: ProductFormProps) {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
    priceUSD: 0,
    priceVES: 0,
    stock: 0,
    reorderLevel: 5,
    image: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description || '',
        categoryId: '', // Add category field to Product type
        priceUSD: product.priceUSD,
        priceVES: product.priceVES,
        stock: product.stock,
        reorderLevel: product.reorderLevel || 5,
        image: product.image || ''
      });
    } else {
      setFormData({
        name: '',
        description: '',
        categoryId: '',
        priceUSD: 0,
        priceVES: 0,
        stock: 0,
        reorderLevel: 5,
        image: ''
      });
    }
  }, [product, isOpen]);

  const loadCategories = async () => {
    try {
      const categoriesData = await getCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('El nombre del producto es requerido');
      return;
    }

    if (formData.priceUSD <= 0 && formData.priceVES <= 0) {
      toast.error('El producto debe tener al menos un precio válido');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
      onClose();
      toast.success(product ? 'Producto actualizado' : 'Producto creado');
    } catch (error) {
      toast.error('Error al guardar producto');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-gray-800 dark:text-gray-200">
            {title}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300">Nombre *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nombre del producto"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300">Categoría</Label>
              <Select 
                value={formData.categoryId || 'none'} 
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  categoryId: value === 'none' ? '' : value 
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin categoría</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-700 dark:text-gray-300">Descripción</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descripción del producto"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300">Precio USD *</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.priceUSD}
                onChange={(e) => setFormData(prev => ({ ...prev, priceUSD: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300">Precio VES *</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.priceVES}
                onChange={(e) => setFormData(prev => ({ ...prev, priceVES: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300">Stock Inicial</Label>
              <Input
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300">Nivel de Reorden</Label>
              <Input
                type="number"
                value={formData.reorderLevel}
                onChange={(e) => setFormData(prev => ({ ...prev, reorderLevel: parseInt(e.target.value) || 5 }))}
                placeholder="5"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-700 dark:text-gray-300">URL de Imagen</Label>
            <Input
              type="url"
              value={formData.image}
              onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
              placeholder="https://ejemplo.com/imagen.jpg"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700"
              disabled={loading}
            >
              {loading ? 'Guardando...' : (product ? 'Actualizar' : 'Crear')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}