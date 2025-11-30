import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Package, 
  Barcode,
  DollarSign,
  Hash,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import {
  ProductVariant,
  ProductAttribute,
  CreateVariantRequest,
  UpdateVariantRequest
} from '@/types/inventory';
import {
  createProductVariant,
  getProductVariants,
  updateProductVariant,
  getProductAttributes
} from '@/lib/inventory/products';

interface ProductVariantManagerProps {
  productId: string;
  productName: string;
  categoryId?: string;
  onVariantsChange?: (variants: ProductVariant[]) => void;
}

export default function ProductVariantManager({
  productId,
  productName,
  categoryId,
  onVariantsChange
}: ProductVariantManagerProps) {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [attributes, setAttributes] = useState<ProductAttribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  
  const [variantForm, setVariantForm] = useState<CreateVariantRequest>({
    sku: '',
    barcode: '',
    attributes: {},
    priceUSD: 0,
    priceVES: 0,
    stock: 0,
    reorderLevel: 0
  });

  useEffect(() => {
    loadData();
  }, [productId, categoryId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [variantsData, attributesData] = await Promise.all([
        getProductVariants(productId),
        getProductAttributes(categoryId)
      ]);
      
      setVariants(variantsData);
      setAttributes(attributesData);
      onVariantsChange?.(variantsData);
    } catch (error) {
      toast.error('Error cargando variantes');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setVariantForm({
      sku: '',
      barcode: '',
      attributes: {},
      priceUSD: 0,
      priceVES: 0,
      stock: 0,
      reorderLevel: 0
    });
    setSelectedVariant(null);
  };

  const handleCreateVariant = async () => {
    if (!variantForm.sku.trim()) {
      toast.error('El SKU es requerido');
      return;
    }

    // Validate that required attributes are filled
    const requiredAttributes = attributes.filter(attr => attr.required);
    const missingAttributes = requiredAttributes.filter(attr => !variantForm.attributes[attr.id]);
    
    if (missingAttributes.length > 0) {
      toast.error(`Complete los atributos requeridos: ${missingAttributes.map(a => a.name).join(', ')}`);
      return;
    }

    try {
      const newVariant = await createProductVariant(productId, variantForm);
      setVariants(prev => [...prev, newVariant]);
      setIsCreateDialogOpen(false);
      resetForm();
      toast.success('Variante creada exitosamente');
      onVariantsChange?.([...variants, newVariant]);
    } catch (error) {
      toast.error('Error creando variante');
      console.error(error);
    }
  };

  const handleEditVariant = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    setVariantForm({
      sku: variant.sku,
      barcode: variant.barcode || '',
      attributes: variant.attributes,
      priceUSD: variant.priceUSD,
      priceVES: variant.priceVES,
      stock: variant.stock,
      reorderLevel: variant.reorderLevel
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateVariant = async () => {
    if (!selectedVariant || !variantForm.sku.trim()) {
      toast.error('El SKU es requerido');
      return;
    }

    try {
      const updatedVariant = await updateProductVariant(selectedVariant.id, variantForm);
      setVariants(prev => prev.map(v => v.id === selectedVariant.id ? updatedVariant : v));
      setIsEditDialogOpen(false);
      resetForm();
      toast.success('Variante actualizada exitosamente');
      
      const updatedVariants = variants.map(v => v.id === selectedVariant.id ? updatedVariant : v);
      onVariantsChange?.(updatedVariants);
    } catch (error) {
      toast.error('Error actualizando variante');
      console.error(error);
    }
  };

  const handleDeleteVariant = async (variant: ProductVariant) => {
    if (!confirm(`¿Está seguro de eliminar la variante "${variant.sku}"?`)) {
      return;
    }

    try {
      await updateProductVariant(variant.id, { isActive: false });
      setVariants(prev => prev.filter(v => v.id !== variant.id));
      toast.success('Variante eliminada exitosamente');
      
      const updatedVariants = variants.filter(v => v.id !== variant.id);
      onVariantsChange?.(updatedVariants);
    } catch (error) {
      toast.error('Error eliminando variante');
      console.error(error);
    }
  };

  const getAttributeDisplayValue = (attributeId: string, valueId: string) => {
    const attribute = attributes.find(a => a.id === attributeId);
    if (!attribute) return valueId;
    
    const value = attribute.values.find(v => v.id === valueId);
    return value?.value || valueId;
  };

  const renderAttributeInputs = () => {
    return attributes.map(attribute => (
      <div key={attribute.id} className="space-y-2">
        <Label className="text-gray-700 dark:text-gray-300">
          {attribute.name}
          {attribute.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        
        {attribute.type === 'select' ? (
          <Select
            value={variantForm.attributes[attribute.id] || ''}
            onValueChange={(value) => 
              setVariantForm(prev => ({
                ...prev,
                attributes: { ...prev.attributes, [attribute.id]: value }
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder={`Seleccionar ${attribute.name.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {attribute.values.map(value => (
                <SelectItem key={value.id} value={value.id}>
                  {value.value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            type={attribute.type === 'number' ? 'number' : 'text'}
            value={variantForm.attributes[attribute.id] || ''}
            onChange={(e) => 
              setVariantForm(prev => ({
                ...prev,
                attributes: { ...prev.attributes, [attribute.id]: e.target.value }
              }))
            }
            placeholder={`Ingrese ${attribute.name.toLowerCase()}`}
          />
        )}
      </div>
    ));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-gray-200">
            <Package className="h-5 w-5" />
            Variantes de Producto
          </CardTitle>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                size="sm"
                className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700"
                onClick={resetForm}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nueva Variante
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-gray-800 dark:text-gray-200">
                  Crear Variante - {productName}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-700 dark:text-gray-300">SKU *</Label>
                    <Input
                      value={variantForm.sku}
                      onChange={(e) => setVariantForm(prev => ({ ...prev, sku: e.target.value }))}
                      placeholder="SKU único para la variante"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700 dark:text-gray-300">Código de Barras</Label>
                    <Input
                      value={variantForm.barcode}
                      onChange={(e) => setVariantForm(prev => ({ ...prev, barcode: e.target.value }))}
                      placeholder="Código de barras"
                    />
                  </div>
                </div>

                {attributes.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">Atributos</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {renderAttributeInputs()}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-700 dark:text-gray-300">Precio USD *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={variantForm.priceUSD}
                      onChange={(e) => setVariantForm(prev => ({ ...prev, priceUSD: parseFloat(e.target.value) || 0 }))}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700 dark:text-gray-300">Precio VES *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={variantForm.priceVES}
                      onChange={(e) => setVariantForm(prev => ({ ...prev, priceVES: parseFloat(e.target.value) || 0 }))}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-700 dark:text-gray-300">Stock Inicial</Label>
                    <Input
                      type="number"
                      value={variantForm.stock}
                      onChange={(e) => setVariantForm(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700 dark:text-gray-300">Nivel de Reorden</Label>
                    <Input
                      type="number"
                      value={variantForm.reorderLevel}
                      onChange={(e) => setVariantForm(prev => ({ ...prev, reorderLevel: parseInt(e.target.value) || 0 }))}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCreateVariant}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700"
                  >
                    Crear Variante
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Cargando variantes...</p>
          </div>
        ) : variants.length === 0 ? (
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">No hay variantes creadas</p>
            <p className="text-gray-500 text-sm mt-1">
              Las variantes permiten manejar diferentes versiones del mismo producto
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {variants.map((variant) => (
                <motion.div
                  key={variant.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border hover:border-cyan-400/50 transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Hash className="h-4 w-4 text-gray-500" />
                      <span className="font-medium text-gray-800 dark:text-gray-200">{variant.sku}</span>
                      
                      {variant.stock <= variant.reorderLevel && (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Stock Bajo
                        </Badge>
                      )}
                    </div>

                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditVariant(variant)}
                        className="h-8 w-8 p-0 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteVariant(variant)}
                        className="h-8 w-8 p-0 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {variant.barcode && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Barcode className="h-3 w-3" />
                        <span>{variant.barcode}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-green-600">
                      <DollarSign className="h-3 w-3" />
                      <span>${variant.priceUSD}</span>
                    </div>

                    <div className="flex items-center gap-2 text-blue-600">
                      <span>Bs. {variant.priceVES.toLocaleString()}</span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Package className="h-3 w-3" />
                      <span>{variant.stock} en stock</span>
                    </div>
                  </div>

                  {Object.keys(variant.attributes).length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {Object.entries(variant.attributes).map(([attrId, valueId]) => {
                        const attribute = attributes.find(a => a.id === attrId);
                        if (!attribute) return null;
                        
                        return (
                          <Badge key={attrId} variant="outline" className="text-xs">
                            {attribute.name}: {getAttributeDisplayValue(attrId, valueId)}
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-gray-800 dark:text-gray-200">
              Editar Variante - {selectedVariant?.sku}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 max-h-96 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700 dark:text-gray-300">SKU *</Label>
                <Input
                  value={variantForm.sku}
                  onChange={(e) => setVariantForm(prev => ({ ...prev, sku: e.target.value }))}
                  placeholder="SKU único para la variante"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700 dark:text-gray-300">Código de Barras</Label>
                <Input
                  value={variantForm.barcode}
                  onChange={(e) => setVariantForm(prev => ({ ...prev, barcode: e.target.value }))}
                  placeholder="Código de barras"
                />
              </div>
            </div>

            {attributes.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">Atributos</h3>
                <div className="grid grid-cols-2 gap-4">
                  {renderAttributeInputs()}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700 dark:text-gray-300">Precio USD *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={variantForm.priceUSD}
                  onChange={(e) => setVariantForm(prev => ({ ...prev, priceUSD: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700 dark:text-gray-300">Precio VES *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={variantForm.priceVES}
                  onChange={(e) => setVariantForm(prev => ({ ...prev, priceVES: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700 dark:text-gray-300">Stock Actual</Label>
                <Input
                  type="number"
                  value={variantForm.stock}
                  onChange={(e) => setVariantForm(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700 dark:text-gray-300">Nivel de Reorden</Label>
                <Input
                  type="number"
                  value={variantForm.reorderLevel}
                  onChange={(e) => setVariantForm(prev => ({ ...prev, reorderLevel: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  resetForm();
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUpdateVariant}
                className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700"
              >
                Actualizar Variante
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}