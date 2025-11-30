import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, Smartphone, CreditCard, Zap } from 'lucide-react';
import { PaymentMethod } from '@/types';

interface PaymentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  paidUSD: string;
  onPaidUSDChange: (value: string) => void;
  paidVES: string;
  onPaidVESChange: (value: string) => void;
  reference: string;
  onReferenceChange: (value: string) => void;
  lastFourDigits: string;
  onLastFourDigitsChange: (value: string) => void;
  zelleEmail: string;
  onZelleEmailChange: (value: string) => void;
  zellePhone: string;
  onZellePhoneChange: (value: string) => void;
  totalUSD: number;
  totalVES: number;
  onConfirmSale: () => void;
  onCancel: () => void;
}

export function PaymentDialog({
  isOpen,
  onOpenChange,
  paymentMethod,
  onPaymentMethodChange,
  paidUSD,
  onPaidUSDChange,
  paidVES,
  onPaidVESChange,
  reference,
  onReferenceChange,
  lastFourDigits,
  onLastFourDigitsChange,
  zelleEmail,
  onZelleEmailChange,
  zellePhone,
  onZellePhoneChange,
  totalUSD,
  totalVES,
  onConfirmSale,
  onCancel
}: PaymentDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-white/20 max-w-md light-card">
        <DialogHeader>
          <DialogTitle className="text-gray-800 dark:text-gray-200">Procesar Venta</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-gray-700 dark:text-gray-300">Método de Pago</Label>
            <Select value={paymentMethod} onValueChange={onPaymentMethodChange}>
              <SelectTrigger className="form-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="usd">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Dólares (USD)
                  </div>
                </SelectItem>
                <SelectItem value="ves">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    Bolívares (VES)
                  </div>
                </SelectItem>
                <SelectItem value="mixed">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Mixto (USD + VES)
                  </div>
                </SelectItem>
                <SelectItem value="zelle">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Zelle
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {paymentMethod === 'mixed' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700 dark:text-gray-300">Pagado en USD</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={paidUSD}
                  onChange={(e) => onPaidUSDChange(e.target.value)}
                  className="form-input"
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700 dark:text-gray-300">Pagado en VES</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={paidVES}
                  onChange={(e) => onPaidVESChange(e.target.value)}
                  className="form-input"
                  placeholder="0.00"
                />
              </div>
            </div>
          )}

          {paymentMethod === 'zelle' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-700 dark:text-gray-300">Email de Zelle</Label>
                <Input
                  type="email"
                  value={zelleEmail}
                  onChange={(e) => onZelleEmailChange(e.target.value)}
                  className="form-input"
                  placeholder="usuario@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700 dark:text-gray-300">Teléfono de Zelle (opcional)</Label>
                <Input
                  type="tel"
                  value={zellePhone}
                  onChange={(e) => onZellePhoneChange(e.target.value)}
                  className="form-input"
                  placeholder="+58-XXX-XXX-XXXX"
                />
              </div>
            </div>
          )}

          {(paymentMethod === 'ves' || paymentMethod === 'mixed' || paymentMethod === 'zelle') && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-700 dark:text-gray-300">Referencia (opcional)</Label>
                <Input
                  value={reference}
                  onChange={(e) => onReferenceChange(e.target.value)}
                  className="form-input"
                  placeholder="Referencia del pago"
                />
              </div>
              {paymentMethod !== 'zelle' && (
                <div className="space-y-2">
                  <Label className="text-gray-700 dark:text-gray-300">Últimos 4 dígitos (opcional)</Label>
                  <Input
                    value={lastFourDigits}
                    onChange={(e) => onLastFourDigitsChange(e.target.value)}
                    className="form-input"
                    placeholder="1234"
                    maxLength={4}
                  />
                </div>
              )}
            </div>
          )}

          <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg space-y-2 border">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Total USD:</span>
              <span className="text-green-600 font-bold">${totalUSD.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Total VES:</span>
              <span className="text-blue-600 font-bold">Bs. {totalVES.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1 border-gray-300 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium"
            >
              Cancelar
            </Button>
            <Button
              onClick={onConfirmSale}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Confirmar Venta
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}