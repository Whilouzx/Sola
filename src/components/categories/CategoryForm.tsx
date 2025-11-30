import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  ProductCategory, 
  CreateCategoryRequest, 
  UpdateCategoryRequest 
} from '@/types/inventory';

interface CategoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCategoryRequest | UpdateCategoryRequest) => Promise<void>;
  category?: ProductCategory;
  categories: ProductCategory[];
  title: string;
}

export default function CategoryForm({
  isOpen,
  onClose,
  onSubmit,
  category,
  categories,
  title
}: CategoryFormProps) {
  const [formData, setFormData] = useState<CreateCategoryRequest>({
    name: '',
    description: '',
    parentId: '',
    imageUrl: '',
    sortOrder: 0,
    isActive: true
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description || '',
        parentId: category.parentId || '',
        imageUrl: category.imageUrl || '',
        sortOrder: category.sortOrder,
        isActive: category.isActive
      });
    } else {
      setFormData({
        name: '',
        description: '',
        parentId: '',
        imageUrl: '',
        sortOrder: 0,
        isActive: true
      });
    }
  }, [category, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('El nombre es requerido');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
      onClose();
      toast.success(category ? 'Categoría actualizada' : 'Categoría creada');
    } catch (error) {
      toast.error('Error al guardar categoría');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Filter out current category and its descendants from parent options
  const availableParents = categories.filter(cat => 
    cat.id !== category?.id && 
    cat.parentId !== category?.id
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-gray-800 dark:text-gray-200">
            {title}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gray-700 dark:text-gray-300">Nombre *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Nombre de la categoría"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-700 dark:text-gray-300">Descripción</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descripción opcional"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-700 dark:text-gray-300">Categoría Padre</Label>
            <Select 
              value={formData.parentId || 'none'} 
              onValueChange={(value) => setFormData(prev => ({ 
                ...prev, 
                parentId: value === 'none' ? '' : value 
              }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar categoría padre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin categoría padre</SelectItem>
                {availableParents.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-700 dark:text-gray-300">URL de Imagen</Label>
            <Input
              type="url"
              value={formData.imageUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
              placeholder="https://ejemplo.com/imagen.jpg"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-700 dark:text-gray-300">Orden</Label>
            <Input
              type="number"
              value={formData.sortOrder}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                sortOrder: parseInt(e.target.value) || 0 
              }))}
              placeholder="0"
              min="0"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData(prev => ({ 
                ...prev, 
                isActive: checked as boolean 
              }))}
            />
            <Label htmlFor="isActive" className="text-gray-700 dark:text-gray-300">
              Categoría activa
            </Label>
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
              {loading ? 'Guardando...' : (category ? 'Actualizar' : 'Crear')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
