import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ProductFormData {
  name: string;
  description: string;
  priceUSD: number;
  priceVES: number;
  stock: number;
  reorderLevel: number;
  image: string;
}

interface ProductFormProps {
  formData: ProductFormData;
  onFormChange: (data: ProductFormData) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitLabel: string;
}

export function ProductForm({ formData, onFormChange, onSubmit, onCancel, submitLabel }: ProductFormProps) {
  const updateForm = (field: keyof ProductFormData, value: string | number) => {
    onFormChange({ ...formData, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label>Nombre del Producto *</Label>
          <Input
            value={formData.name}
            onChange={(e) => updateForm('name', e.target.value)}
            placeholder="Nombre del producto"
            className="flowi-input"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Precio USD *</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.priceUSD}
              onChange={(e) => updateForm('priceUSD', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              className="flowi-input"
            />
          </div>

          <div className="space-y-2">
            <Label>Precio VES</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.priceVES}
              onChange={(e) => updateForm('priceVES', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              className="flowi-input"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Stock Inicial</Label>
            <Input
              type="number"
              value={formData.stock}
              onChange={(e) => updateForm('stock', parseInt(e.target.value) || 0)}
              placeholder="0"
              className="flowi-input"
            />
          </div>

          <div className="space-y-2">
            <Label>Nivel de Reorden</Label>
            <Input
              type="number"
              value={formData.reorderLevel}
              onChange={(e) => updateForm('reorderLevel', parseInt(e.target.value) || 5)}
              placeholder="5"
              className="flowi-input"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>URL de Imagen (Opcional)</Label>
          <Input
            value={formData.image}
            onChange={(e) => updateForm('image', e.target.value)}
            placeholder="https://ejemplo.com/imagen.jpg"
            className="flowi-input"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button
          variant="outline"
          onClick={onCancel}
          className="flex-1"
        >
          Cancelar
        </Button>
        <Button
          onClick={onSubmit}
          className="flex-1 flowi-button"
        >
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}