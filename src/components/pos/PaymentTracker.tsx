import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  CreditCard, 
  Plus, 
  Edit, 
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  DollarSign,
  Calendar,
  User,
  Receipt,
  TrendingUp,
  TrendingDown,
  Banknote,
  Smartphone
} from 'lucide-react';
import { toast } from 'sonner';
import {
  PaymentPlan,
  PaymentInstallment,
  PartialPayment,
  CreatePaymentPlanRequest,
  ProcessPartialPaymentRequest,
  PaymentFilters,
  PaymentSummary
} from '@/types/pos';
import { Customer } from '@/types/accounts';
import { Sale } from '@/types';
import {
  createPaymentPlan,
  getPaymentPlans,
  getPaymentPlanById,
  processPartialPayment,
  getPartialPayments,
  processInstallmentPayment,
  getOverdueInstallments,
  markInstallmentOverdue,
  getPaymentSummary,
  generatePaymentReminders
} from '@/lib/pos/payments';
import { getCustomers } from '@/lib/accounts/customers';
import { getSales } from '@/lib/sales';

interface PaymentTrackerProps {
  onPaymentProcessed?: (paymentId: string) => void;
}

export default function PaymentTracker({ onPaymentProcessed }: PaymentTrackerProps) {
  const [paymentPlans, setPaymentPlans] = useState<PaymentPlan[]>([]);
  const [partialPayments, setPartialPayments] = useState<PartialPayment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [overdueInstallments, setOverdueInstallments] = useState<PaymentInstallment[]>([]);
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'plans' | 'payments' | 'overdue'>('plans');
  const [isCreatePlanDialogOpen, setIsCreatePlanDialogOpen] = useState(false);
  const [isProcessPaymentDialogOpen, setIsProcessPaymentDialogOpen] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<PaymentInstallment | null>(null);
  
  const [paymentPlanForm, setPaymentPlanForm] = useState<CreatePaymentPlanRequest>({
    saleId: '',
    customerId: '',
    totalAmount: 0,
    currency: 'USD',
    numberOfInstallments: 3,
    firstPaymentDate: new Date().toISOString().split('T')[0],
    installmentFrequency: 'monthly'
  });

  const [partialPaymentForm, setPartialPaymentForm] = useState<ProcessPartialPaymentRequest>({
    saleId: '',
    amount: 0,
    currency: 'USD',
    paymentMethod: 'cash',
    reference: '',
    notes: ''
  });

  const [installmentPaymentForm, setInstallmentPaymentForm] = useState({
    amount: 0,
    paymentMethod: 'cash',
    reference: '',
    notes: ''
  });

  const paymentMethods = [
    { id: 'cash', label: 'Efectivo', icon: Banknote },
    { id: 'card', label: 'Tarjeta', icon: CreditCard },
    { id: 'transfer', label: 'Transferencia', icon: TrendingUp },
    { id: 'mobile', label: 'Pago Móvil', icon: Smartphone },
    { id: 'check', label: 'Cheque', icon: Receipt }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [plansData, paymentsData, customersData, salesData, overdueData, summaryData] = await Promise.all([
        getPaymentPlans({ limit: 100 }),
        getPartialPayments({ limit: 100 }),
        getCustomers(),
        getSales(),
        getOverdueInstallments(),
        getPaymentSummary()
      ]);
      
      setPaymentPlans(plansData.data);
      setPartialPayments(paymentsData.data);
      setCustomers(customersData);
      setSales(salesData);
      setOverdueInstallments(overdueData);
      setPaymentSummary(summaryData);
    } catch (error) {
      toast.error('Error cargando datos de pagos');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const resetForms = () => {
    setPaymentPlanForm({
      saleId: '',
      customerId: '',
      totalAmount: 0,
      currency: 'USD',
      numberOfInstallments: 3,
      firstPaymentDate: new Date().toISOString().split('T')[0],
      installmentFrequency: 'monthly'
    });
    setPartialPaymentForm({
      saleId: '',
      amount: 0,
      currency: 'USD',
      paymentMethod: 'cash',
      reference: '',
      notes: ''
    });
    setInstallmentPaymentForm({
      amount: 0,
      paymentMethod: 'cash',
      reference: '',
      notes: ''
    });
    setSelectedInstallment(null);
  };

  const handleCreatePaymentPlan = async () => {
    if (!paymentPlanForm.saleId || paymentPlanForm.totalAmount <= 0) {
      toast.error('Complete todos los campos requeridos');
      return;
    }

    try {
      const newPlan = await createPaymentPlan(paymentPlanForm);
      setPaymentPlans(prev => [newPlan, ...prev]);
      setIsCreatePlanDialogOpen(false);
      resetForms();
      toast.success('Plan de pagos creado exitosamente');
      loadData(); // Refresh summary
    } catch (error) {
      toast.error('Error creando plan de pagos');
      console.error(error);
    }
  };

  const handleProcessPartialPayment = async () => {
    if (!partialPaymentForm.saleId || partialPaymentForm.amount <= 0) {
      toast.error('Complete todos los campos requeridos');
      return;
    }

    try {
      const newPayment = await processPartialPayment(partialPaymentForm);
      setPartialPayments(prev => [newPayment, ...prev]);
      resetForms();
      toast.success('Pago parcial procesado exitosamente');
      onPaymentProcessed?.(newPayment.id);
      loadData(); // Refresh summary
    } catch (error) {
      toast.error('Error procesando pago parcial');
      console.error(error);
    }
  };

  const handleProcessInstallmentPayment = async () => {
    if (!selectedInstallment || installmentPaymentForm.amount <= 0) {
      toast.error('Complete todos los campos requeridos');
      return;
    }

    try {
      await processInstallmentPayment(
        selectedInstallment.id,
        installmentPaymentForm.amount,
        installmentPaymentForm.paymentMethod,
        installmentPaymentForm.reference
      );
      setIsProcessPaymentDialogOpen(false);
      resetForms();
      toast.success('Pago de cuota procesado exitosamente');
      loadData(); // Refresh all data
    } catch (error) {
      toast.error('Error procesando pago de cuota');
      console.error(error);
    }
  };

  const handleMarkOverdue = async () => {
    try {
      const overdueCount = await markInstallmentOverdue();
      if (overdueCount > 0) {
        toast.success(`${overdueCount} cuotas marcadas como vencidas`);
        loadData();
      } else {
        toast.info('No hay cuotas vencidas');
      }
    } catch (error) {
      toast.error('Error actualizando cuotas vencidas');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'paid':
        return <CheckCircle className="h-4 w-4" />;
      case 'overdue':
        return <AlertTriangle className="h-4 w-4" />;
      case 'partial':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'paid':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'overdue':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'partial':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'paid':
        return 'Pagada';
      case 'overdue':
        return 'Vencida';
      case 'partial':
        return 'Parcial';
      default:
        return status;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    const methodData = paymentMethods.find(m => m.id === method);
    return methodData ? methodData.icon : CreditCard;
  };

  const filteredPaymentPlans = paymentPlans.filter(plan => {
    const customer = customers.find(c => c.id === plan.customerId);
    return customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           plan.saleId.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const filteredPartialPayments = partialPayments.filter(payment => {
    const sale = sales.find(s => s.id === payment.saleId);
    return sale?.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           payment.saleId.toLowerCase().includes(searchTerm.toLowerCase()) ||
           payment.reference?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-200">
            Gestión de Pagos
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Administra planes de pago, cuotas y pagos parciales
          </p>
        </div>

        {paymentSummary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">${paymentSummary.totalAmount.usd.toFixed(0)}</div>
              <div className="text-xs text-gray-600">Pagos USD</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">Bs. {paymentSummary.totalAmount.ves.toLocaleString()}</div>
              <div className="text-xs text-gray-600">Pagos VES</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">${paymentSummary.outstandingBalance.usd.toFixed(0)}</div>
              <div className="text-xs text-gray-600">Por Cobrar</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{paymentSummary.overduePayments}</div>
              <div className="text-xs text-gray-600">Vencidas</div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex gap-4 flex-1">
                <div className="relative flex-1">
                  <Input
                    placeholder="Buscar pagos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleMarkOverdue}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Actualizar Vencidas
                </Button>

                <Dialog open={isCreatePlanDialogOpen} onOpenChange={setIsCreatePlanDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
                      onClick={resetForms}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Nuevo Plan de Pagos
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-gray-800 dark:text-gray-200">Crear Plan de Pagos</DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-gray-700 dark:text-gray-300">Venta *</Label>
                          <Select value={paymentPlanForm.saleId} onValueChange={(value) => setPaymentPlanForm(prev => ({ ...prev, saleId: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar venta" />
                            </SelectTrigger>
                            <SelectContent>
                              {sales.map(sale => (
                                <SelectItem key={sale.id} value={sale.id}>
                                  {sale.customerName} - ${sale.totalUSD}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-gray-700 dark:text-gray-300">Cliente</Label>
                          <Select value={paymentPlanForm.customerId} onValueChange={(value) => setPaymentPlanForm(prev => ({ ...prev, customerId: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar cliente" />
                            </SelectTrigger>
                            <SelectContent>
                              {customers.map(customer => (
                                <SelectItem key={customer.id} value={customer.id}>
                                  {customer.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-gray-700 dark:text-gray-300">Monto Total *</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={paymentPlanForm.totalAmount}
                            onChange={(e) => setPaymentPlanForm(prev => ({ ...prev, totalAmount: parseFloat(e.target.value) || 0 }))}
                            placeholder="0.00"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-gray-700 dark:text-gray-300">Moneda</Label>
                          <Select value={paymentPlanForm.currency} onValueChange={(value: unknown) => setPaymentPlanForm(prev => ({ ...prev, currency: value }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="USD">USD</SelectItem>
                              <SelectItem value="VES">VES</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label className="text-gray-700 dark:text-gray-300">Número de Cuotas</Label>
                          <Input
                            type="number"
                            min="2"
                            max="24"
                            value={paymentPlanForm.numberOfInstallments}
                            onChange={(e) => setPaymentPlanForm(prev => ({ ...prev, numberOfInstallments: parseInt(e.target.value) || 3 }))}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-gray-700 dark:text-gray-300">Primer Pago</Label>
                          <Input
                            type="date"
                            value={paymentPlanForm.firstPaymentDate}
                            onChange={(e) => setPaymentPlanForm(prev => ({ ...prev, firstPaymentDate: e.target.value }))}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-gray-700 dark:text-gray-300">Frecuencia</Label>
                          <Select value={paymentPlanForm.installmentFrequency} onValueChange={(value: unknown) => setPaymentPlanForm(prev => ({ ...prev, installmentFrequency: value }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="weekly">Semanal</SelectItem>
                              <SelectItem value="biweekly">Quincenal</SelectItem>
                              <SelectItem value="monthly">Mensual</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Resumen del Plan:</div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Cuota por pago:</span>
                            <span className="ml-2">
                              {paymentPlanForm.currency} {(paymentPlanForm.totalAmount / paymentPlanForm.numberOfInstallments).toFixed(2)}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium">Total a pagar:</span>
                            <span className="ml-2">
                              {paymentPlanForm.currency} {paymentPlanForm.totalAmount.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button
                          variant="outline"
                          onClick={() => setIsCreatePlanDialogOpen(false)}
                          className="flex-1"
                        >
                          Cancelar
                        </Button>
                        <Button
                          onClick={handleCreatePaymentPlan}
                          className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
                        >
                          Crear Plan
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('plans')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'plans'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            Planes de Pago ({paymentPlans.length})
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'payments'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            Pagos Parciales ({partialPayments.length})
          </button>
          <button
            onClick={() => setActiveTab('overdue')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'overdue'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            Cuotas Vencidas ({overdueInstallments.length})
          </button>
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardContent className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto"></div>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Cargando datos...</p>
              </div>
            ) : (
              <>
                {/* Payment Plans Tab */}
                {activeTab === 'plans' && (
                  <div className="space-y-4">
                    {filteredPaymentPlans.length === 0 ? (
                      <div className="text-center py-8">
                        <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600 dark:text-gray-400">No hay planes de pago</p>
                      </div>
                    ) : (
                      <AnimatePresence>
                        {filteredPaymentPlans.map((plan) => {
                          const customer = customers.find(c => c.id === plan.customerId);
                          const pendingInstallments = plan.installments.filter(i => i.status === 'pending' || i.status === 'partial');
                          const paidInstallments = plan.installments.filter(i => i.status === 'paid');
                          
                          return (
                            <motion.div
                              key={plan.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border hover:border-cyan-400/50 transition-all"
                            >
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                                    <CreditCard className="h-6 w-6 text-purple-600" />
                                  </div>
                                  
                                  <div>
                                    <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-lg">
                                      {customer?.name || 'Cliente no encontrado'}
                                    </h3>
                                    <div className="flex items-center gap-3 mt-1">
                                      <Badge className={plan.status === 'active' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-700 border-gray-200'}>
                                        {plan.status === 'active' ? 'Activo' : plan.status}
                                      </Badge>
                                      <span className="text-sm text-gray-600 dark:text-gray-400">
                                        Venta: {plan.saleId}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="text-right">
                                  <div className="text-2xl font-bold text-purple-600">
                                    {plan.currency} {plan.totalAmount.toFixed(2)}
                                  </div>
                                  <div className="text-sm text-gray-600 dark:text-gray-400">
                                    {paidInstallments.length}/{plan.installments.length} cuotas pagadas
                                  </div>
                                </div>
                              </div>

                              {/* Installments */}
                              <div className="space-y-2">
                                <h4 className="font-medium text-gray-800 dark:text-gray-200">Cuotas:</h4>
                                <div className="grid gap-2">
                                  {plan.installments.map((installment) => (
                                    <div key={installment.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-900/50 rounded-lg">
                                      <div className="flex items-center gap-3">
                                        <Badge className={getStatusColor(installment.status)}>
                                          {getStatusIcon(installment.status)}
                                          <span className="ml-1">{getStatusLabel(installment.status)}</span>
                                        </Badge>
                                        <span className="text-sm">
                                          Cuota #{installment.installmentNumber}
                                        </span>
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                          Vence: {new Date(installment.dueDate).toLocaleDateString()}
                                        </span>
                                      </div>
                                      
                                      <div className="flex items-center gap-3">
                                        <span className="font-medium">
                                          {plan.currency} {installment.amount.toFixed(2)}
                                        </span>
                                        {installment.status !== 'paid' && (
                                          <Button
                                            size="sm"
                                            onClick={() => {
                                              setSelectedInstallment(installment);
                                              setInstallmentPaymentForm(prev => ({
                                                ...prev,
                                                amount: installment.amount - installment.paidAmount
                                              }));
                                              setIsProcessPaymentDialogOpen(true);
                                            }}
                                            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                                          >
                                            Pagar
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    )}
                  </div>
                )}

                {/* Partial Payments Tab */}
                {activeTab === 'payments' && (
                  <div className="space-y-4">
                    <div className="flex justify-end">
                      <Button 
                        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                        onClick={() => {
                          resetForms();
                          // Open partial payment dialog (would need to be implemented)
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Procesar Pago Parcial
                      </Button>
                    </div>

                    {filteredPartialPayments.length === 0 ? (
                      <div className="text-center py-8">
                        <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600 dark:text-gray-400">No hay pagos parciales</p>
                      </div>
                    ) : (
                      <AnimatePresence>
                        {filteredPartialPayments.map((payment) => {
                          const sale = sales.find(s => s.id === payment.saleId);
                          const PaymentIcon = getPaymentMethodIcon(payment.paymentMethod);
                          
                          return (
                            <motion.div
                              key={payment.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border hover:border-cyan-400/50 transition-all"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                                    <PaymentIcon className="h-6 w-6 text-green-600" />
                                  </div>
                                  
                                  <div>
                                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                                      {sale?.customerName || 'Cliente no encontrado'}
                                    </h3>
                                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-600 dark:text-gray-400">
                                      <span>Venta: {payment.saleId}</span>
                                      <span>•</span>
                                      <span>{new Date(payment.processedAt).toLocaleDateString()}</span>
                                      {payment.reference && (
                                        <>
                                          <span>•</span>
                                          <span>Ref: {payment.reference}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="text-right">
                                  <div className="text-xl font-bold text-green-600">
                                    {payment.currency} {payment.amount.toFixed(2)}
                                  </div>
                                  <div className="text-sm text-gray-600 dark:text-gray-400">
                                    {paymentMethods.find(m => m.id === payment.paymentMethod)?.label}
                                  </div>
                                </div>
                              </div>

                              {payment.notes && (
                                <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                                  <strong>Notas:</strong> {payment.notes}
                                </div>
                              )}
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    )}
                  </div>
                )}

                {/* Overdue Installments Tab */}
                {activeTab === 'overdue' && (
                  <div className="space-y-4">
                    {overdueInstallments.length === 0 ? (
                      <div className="text-center py-8">
                        <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-3" />
                        <p className="text-gray-600 dark:text-gray-400">No hay cuotas vencidas</p>
                      </div>
                    ) : (
                      <AnimatePresence>
                        {overdueInstallments.map((installment) => {
                          const daysOverdue = Math.floor((new Date().getTime() - new Date(installment.dueDate).getTime()) / (1000 * 60 * 60 * 24));
                          
                          return (
                            <motion.div
                              key={installment.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                                    <AlertTriangle className="h-6 w-6 text-red-600" />
                                  </div>
                                  
                                  <div>
                                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                                      Cuota #{installment.installmentNumber}
                                    </h3>
                                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-600 dark:text-gray-400">
                                      <span>Vencida hace {daysOverdue} días</span>
                                      <span>•</span>
                                      <span>Vencimiento: {new Date(installment.dueDate).toLocaleDateString()}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3">
                                  <div className="text-right">
                                    <div className="text-xl font-bold text-red-600">
                                      ${installment.amount.toFixed(2)}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                      Pagado: ${installment.paidAmount.toFixed(2)}
                                    </div>
                                  </div>
                                  
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setSelectedInstallment(installment);
                                      setInstallmentPaymentForm(prev => ({
                                        ...prev,
                                        amount: installment.amount - installment.paidAmount
                                      }));
                                      setIsProcessPaymentDialogOpen(true);
                                    }}
                                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                                  >
                                    Pagar Ahora
                                  </Button>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    )}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Process Installment Payment Dialog */}
      <Dialog open={isProcessPaymentDialogOpen} onOpenChange={setIsProcessPaymentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gray-800 dark:text-gray-200">
              Procesar Pago de Cuota
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {selectedInstallment && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Cuota #{selectedInstallment.installmentNumber}</div>
                <div className="flex justify-between items-center">
                  <span>Monto total:</span>
                  <span className="font-medium">${selectedInstallment.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Ya pagado:</span>
                  <span className="font-medium">${selectedInstallment.paidAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center border-t pt-2 mt-2">
                  <span className="font-medium">Pendiente:</span>
                  <span className="font-bold text-red-600">
                    ${(selectedInstallment.amount - selectedInstallment.paidAmount).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300">Monto a Pagar *</Label>
              <Input
                type="number"
                step="0.01"
                value={installmentPaymentForm.amount}
                onChange={(e) => setInstallmentPaymentForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300">Método de Pago</Label>
              <Select value={installmentPaymentForm.paymentMethod} onValueChange={(value) => setInstallmentPaymentForm(prev => ({ ...prev, paymentMethod: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map(method => (
                    <SelectItem key={method.id} value={method.id}>
                      <div className="flex items-center gap-2">
                        <method.icon className="h-4 w-4" />
                        {method.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300">Referencia</Label>
              <Input
                value={installmentPaymentForm.reference}
                onChange={(e) => setInstallmentPaymentForm(prev => ({ ...prev, reference: e.target.value }))}
                placeholder="Número de referencia"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300">Notas</Label>
              <Textarea
                value={installmentPaymentForm.notes}
                onChange={(e) => setInstallmentPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Observaciones del pago"
                rows={2}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsProcessPaymentDialogOpen(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleProcessInstallmentPayment}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              >
                Procesar Pago
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}