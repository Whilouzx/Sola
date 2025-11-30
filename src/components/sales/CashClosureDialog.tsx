import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';

interface DailySummary {
  totalUSD: number;
  totalVES: number;
  salesCount: number;
}

interface CashClosureDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  dailySummary: DailySummary;
  onConfirmClosure: () => void;
  onCancel: () => void;
}

export function CashClosureDialog({
  isOpen,
  onOpenChange,
  dailySummary,
  onConfirmClosure,
  onCancel
}: CashClosureDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-white/20 max-w-md light-card">
        <DialogHeader>
          <DialogTitle className="text-gray-800 dark:text-gray-200">Cierre de Caja</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg space-y-3 border">
            <h3 className="text-gray-800 dark:text-gray-200 font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Resumen del Día
            </h3>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total de ventas:</span>
                <span className="text-gray-800 dark:text-gray-200 font-medium">{dailySummary.salesCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total USD:</span>
                <span className="text-green-600 font-medium">${dailySummary.totalUSD.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total VES:</span>
                <span className="text-blue-600 font-medium">Bs. {dailySummary.totalVES.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400 bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-200 dark:border-orange-800">
            <strong className="text-orange-700 dark:text-orange-400">Atención:</strong> Al cerrar la caja se reiniciará el sistema y todas las ventas del día quedarán registradas en el historial.
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
              onClick={onConfirmClosure}
              className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Cerrar Caja
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}