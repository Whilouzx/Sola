import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FuturisticCard } from '@/components/ui/futuristic-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Receipt, 
  Plus, 
  DollarSign,
  Calendar,
  Truck,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  CreditCard,
  Building2,
  Zap,
  Landmark,
  FileText
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  AccountPayable, 
  BillData, 
  Supplier, 
  Currency, 
  AccountStatus,
  PaymentData,
  EntityType
} from '@/types/accounts';
import { 
  createBill, 
  getAccountsPayable, 
  getOverduePayables,
  getEntityDisplayName
} from '@/lib/accounts/payable';
import { getSuppliers } from '@/lib/accounts/suppliers';
import { recordPayment } from '@/lib/accounts/payments';
import { 
  formatCurrency, 
  getStatusColor, 
  getStatusText, 
  generateBillNumber,
  addDaysToDate,
  calculateDaysOverdue
} from '@/lib/accounts/utils';

// Entity type options with icons and descriptions
const entityTypeOptions = [
  {
    value: 'supplier' as EntityType,
    label: 'Proveedor',
    icon: Truck,
    description: 'Proveedores registrados'
  },
  {
    value: 'company' as EntityType,
    label: 'Empresa/Servicio',
    icon: Building2,
    description: 'Empresas de servicios'
  },
  {
    value: 'utility' as EntityType,
    label: 'Servicios Públicos',
    icon: Zap,
    description: 'Luz, agua, internet, etc.'
  },
  {
    value: 'institution' as EntityType,
    label: 'Instituciones',
    icon: Landmark,
    description: 'Gobierno, bancos, etc.'
  },
  {
    value: 'general' as EntityType,
    label: 'General',
    icon: FileText,
    description: 'Otros gastos'
  }
];

export default function AccountsPayable() {
  const [payables, setPayables] = useState<AccountPayable[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<AccountStatus | 'all'>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedPayable, setSelectedPayable] = useState<AccountPayable | null>(null);
  
  const [billForm, setBillForm] = useState<BillData>({
    entityType: 'supplier',
    supplierId: '',
    entityName: '',
    billNumber: '',
    amount: 0,
    currency: 'USD',
    dueDate: '',
    description: '',
    category: ''
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    currency: 'USD' as Currency,
    paymentMethod: 'usd' as const,
    reference: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [payablesData, suppliersData] = await Promise.all([
        getAccountsPayable(),
        getSuppliers()
      ]);
      setPayables(payablesData);
      setSuppliers(suppliersData);
    } catch (error) {
      toast.error('Error cargando datos');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const resetBillForm = () => {
    setBillForm({
      entityType: 'supplier',
      supplierId: '',
      entityName: '',
      billNumber: generateBillNumber(),
      amount: 0,
      currency: 'USD',
      dueDate: addDaysToDate(new Date(), 30),
      description: '',
      category: ''
    });
  };

  const handleCreateBill = async () => {
    // Validation based on entity type
    const isSupplierType = billForm.entityType === 'supplier';
    const hasRequiredEntity = isSupplierType ? billForm.supplierId : billForm.entityName;
    
    if (!hasRequiredEntity || !billForm.billNumber || billForm.amount <= 0) {
      toast.error('Complete todos los campos requeridos');
      return;
    }

    try {
      await createBill(billForm);
      toast.success('Factura por pagar creada exitosamente');
      setIsCreateDialogOpen(false);
      resetBillForm();
      loadData();
    } catch (error) {
      toast.error('Error creando factura');
      console.error(error);
    }
  };

  const handleRecordPayment = async () => {
    if (!selectedPayable || paymentForm.amount <= 0) {
      toast.error('Complete todos los campos requeridos');
      return;
    }

    try {
      const paymentData: PaymentData = {
        accountId: selectedPayable.id,
        accountType: 'payable',
        amount: paymentForm.amount,
        currency: paymentForm.currency,
        paymentMethod: paymentForm.paymentMethod,
        reference: paymentForm.reference || undefined,
        notes: paymentForm.notes || undefined
      };

      await recordPayment(paymentData);
      toast.success('Pago registrado exitosamente');
      setIsPaymentDialogOpen(false);
      setSelectedPayable(null);
      setPaymentForm({
        amount: 0,
        currency: 'USD',
        paymentMethod: 'usd',
        reference: '',
        notes: ''
      });
      loadData();
    } catch (error) {
      toast.error('Error registrando pago');
      console.error(error);
    }
  };

  const openPaymentDialog = (payable: AccountPayable) => {
    setSelectedPayable(payable);
    setPaymentForm({
      amount: payable.amount,
      currency: payable.currency,
      paymentMethod: payable.currency === 'USD' ? 'usd' : 'ves',
      reference: '',
      notes: ''
    });
    setIsPaymentDialogOpen(true);
  };

  const handleEntityTypeChange = (entityType: EntityType) => {
    setBillForm(prev => ({
      ...prev,
      entityType,
      supplierId: '',
      entityName: ''
    }));
  };

  const filteredPayables = payables.filter(payable => {
    const entityName = getEntityDisplayName(payable);
    const matchesSearch = entityName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payable.billNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payable.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || payable.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const totalPayable = payables.reduce((sum, p) => {
    if (p.status !== 'paid') {
      return p.currency === 'USD' ? sum + p.amount : sum;
    }
    return sum;
  }, 0);

  const overdueCount = payables.filter(p => p.status === 'overdue').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl md:text-4xl dark:text-gray-200 bg-[#00000000] mt-[0px] mr-[0px] mb-[0px] ml-[0px] pt-[0px] pr-[0px] pb-[0px] pl-[0px] font-bold text-center opacity-100 text-[#EA580CFF]">
            Cuentas por Pagar
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Gestiona las facturas pendientes de pago
          </p>
        </div>

        <div className="flex gap-3">
          <Badge className="bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800 px-3 py-1">
            <DollarSign className="h-4 w-4 mr-2" />
            {formatCurrency(totalPayable, 'USD')} por pagar
          </Badge>
          {overdueCount > 0 && (
            <Badge className="bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800 px-3 py-1">
              <AlertTriangle className="h-4 w-4 mr-2" />
              {overdueCount} vencidas
            </Badge>
          )}
        </div>
      </motion.div>

      {/* Filters and Actions */}
      <FuturisticCard variant="glass" className="p-6 light-card">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex gap-4 flex-1">
            <div className="relative flex-1">
              <Input
                placeholder="Buscar facturas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={(value: AccountStatus | 'all') => setStatusFilter(value)}>
              <SelectTrigger className="w-40 form-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="partial">Parcial</SelectItem>
                <SelectItem value="paid">Pagado</SelectItem>
                <SelectItem value="overdue">Vencido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="flowi-gradient text-white hover:opacity-90"
                onClick={resetBillForm}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nueva Factura
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card border-white/20 max-w-md light-card">
              <DialogHeader>
                <DialogTitle className="text-gray-800 dark:text-gray-200">Crear Factura por Pagar</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                {/* Entity Type Selector */}
                <div className="space-y-2">
                  <Label className="text-gray-700 dark:text-gray-300">Tipo de Entidad *</Label>
                  <Select value={billForm.entityType} onValueChange={handleEntityTypeChange}>
                    <SelectTrigger className="form-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {entityTypeOptions.map(option => {
                        const IconComponent = option.icon;
                        return (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <IconComponent className="h-4 w-4" />
                              <div>
                                <div className="font-medium">{option.label}</div>
                                <div className="text-xs text-gray-500">{option.description}</div>
                              </div>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Conditional Entity Selection */}
                {billForm.entityType === 'supplier' ? (
                  <div className="space-y-2">
                    <Label className="text-gray-700 dark:text-gray-300">Proveedor *</Label>
                    <Select value={billForm.supplierId} onValueChange={(value) => setBillForm(prev => ({ ...prev, supplierId: value }))}>
                      <SelectTrigger className="form-input">
                        <SelectValue placeholder="Seleccionar proveedor" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map(supplier => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label className="text-gray-700 dark:text-gray-300">Nombre de la Entidad *</Label>
                    <Input
                      value={billForm.entityName}
                      onChange={(e) => setBillForm(prev => ({ ...prev, entityName: e.target.value }))}
                      className="form-input"
                      placeholder={
                        billForm.entityType === 'utility' ? 'Ej: CANTV, Hidrocapital, Electricidad' :
                        billForm.entityType === 'institution' ? 'Ej: SENIAT, Banco Provincial' :
                        billForm.entityType === 'company' ? 'Ej: Empresa de Limpieza, Seguridad' :
                        'Nombre de la entidad'
                      }
                    />
                  </div>
                )}

                {/* Category field for non-supplier types */}
                {billForm.entityType !== 'supplier' && (
                  <div className="space-y-2">
                    <Label className="text-gray-700 dark:text-gray-300">Categoría</Label>
                    <Input
                      value={billForm.category}
                      onChange={(e) => setBillForm(prev => ({ ...prev, category: e.target.value }))}
                      className="form-input"
                      placeholder={
                        billForm.entityType === 'utility' ? 'Ej: Internet, Electricidad, Agua' :
                        billForm.entityType === 'institution' ? 'Ej: Impuestos, Servicios bancarios' :
                        'Categoría del gasto'
                      }
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-gray-700 dark:text-gray-300">Número de Factura *</Label>
                  <Input
                    value={billForm.billNumber}
                    onChange={(e) => setBillForm(prev => ({ ...prev, billNumber: e.target.value }))}
                    className="form-input"
                    placeholder="BILL-2024-001"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-700 dark:text-gray-300">Monto *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={billForm.amount}
                      onChange={(e) => setBillForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                      className="form-input"
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700 dark:text-gray-300">Moneda</Label>
                    <Select value={billForm.currency} onValueChange={(value: Currency) => setBillForm(prev => ({ ...prev, currency: value }))}>
                      <SelectTrigger className="form-input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="VES">VES</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700 dark:text-gray-300">Fecha de Vencimiento *</Label>
                  <Input
                    type="date"
                    value={billForm.dueDate}
                    onChange={(e) => setBillForm(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="form-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700 dark:text-gray-300">Descripción</Label>
                  <Input
                    value={billForm.description}
                    onChange={(e) => setBillForm(prev => ({ ...prev, description: e.target.value }))}
                    className="form-input"
                    placeholder="Descripción de la factura"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                    className="flex-1 border-gray-300 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCreateBill}
                    className="flex-1 flowi-gradient text-white hover:opacity-90"
                  >
                    Crear Factura
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </FuturisticCard>

      {/* Payables List */}
      <FuturisticCard variant="glass" className="p-6 light-card">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-6">Facturas por Pagar</h2>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Cargando facturas...</p>
          </div>
        ) : filteredPayables.length === 0 ? (
          <div className="text-center py-8">
            <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">No se encontraron facturas</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPayables.map((payable) => {
              const daysOverdue = calculateDaysOverdue(payable.dueDate);
              const StatusIcon = payable.status === 'paid' ? CheckCircle :
                               payable.status === 'overdue' ? XCircle :
                               payable.status === 'partial' ? Clock : AlertTriangle;

              const entityTypeOption = entityTypeOptions.find(opt => opt.value === payable.entityType);
              const EntityIcon = entityTypeOption?.icon || FileText;

              return (
                <motion.div
                  key={payable.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border hover:border-orange-300 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <StatusIcon className={`h-4 w-4 ${
                          payable.status === 'paid' ? 'text-green-600' :
                          payable.status === 'overdue' ? 'text-red-600' :
                          payable.status === 'partial' ? 'text-orange-600' : 'text-blue-600'
                        }`} />
                        <h3 className="font-medium text-gray-800 dark:text-gray-200">{payable.billNumber}</h3>
                        <Badge className={getStatusColor(payable.status)}>
                          {getStatusText(payable.status)}
                        </Badge>
                        {payable.category && (
                          <Badge variant="outline" className="text-xs">
                            {payable.category}
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <EntityIcon className="h-3 w-3" />
                          <span>{getEntityDisplayName(payable)}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-red-600">
                          <DollarSign className="h-3 w-3" />
                          <span>{formatCurrency(payable.amount, payable.currency)}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(payable.dueDate).toLocaleDateString()}</span>
                          {daysOverdue > 0 && (
                            <span className="text-red-600">({daysOverdue} días vencida)</span>
                          )}
                        </div>

                        {payable.description && (
                          <div className="text-gray-600 dark:text-gray-400 truncate">
                            {payable.description}
                          </div>
                        )}
                      </div>
                    </div>

                    {payable.status !== 'paid' && (
                      <Button
                        onClick={() => openPaymentDialog(payable)}
                        size="sm"
                        className="flowi-gradient text-white hover:opacity-90"
                      >
                        <CreditCard className="h-3 w-3 mr-1" />
                        Registrar Pago
                      </Button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </FuturisticCard>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="glass-card border-white/20 max-w-md light-card">
          <DialogHeader>
            <DialogTitle className="text-gray-800 dark:text-gray-200">Registrar Pago</DialogTitle>
          </DialogHeader>
          
          {selectedPayable && (
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border">
                <p className="text-gray-600 dark:text-gray-400 text-sm">Factura: {selectedPayable.billNumber}</p>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Entidad: {getEntityDisplayName(selectedPayable)}</p>
                <p className="text-gray-800 dark:text-gray-200 font-medium">
                  Monto: {formatCurrency(selectedPayable.amount, selectedPayable.currency)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-700 dark:text-gray-300">Monto del Pago *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                    className="form-input"
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700 dark:text-gray-300">Moneda</Label>
                  <Select value={paymentForm.currency} onValueChange={(value: Currency) => setPaymentForm(prev => ({ ...prev, currency: value }))}>
                    <SelectTrigger className="form-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="VES">VES</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700 dark:text-gray-300">Referencia</Label>
                <Input
                  value={paymentForm.reference}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, reference: e.target.value }))}
                  className="form-input"
                  placeholder="Referencia del pago"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700 dark:text-gray-300">Notas</Label>
                <Input
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="form-input"
                  placeholder="Notas adicionales"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsPaymentDialogOpen(false)}
                  className="flex-1 border-gray-300 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleRecordPayment}
                  className="flex-1 flowi-gradient text-white hover:opacity-90"
                >
                  Registrar Pago
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}