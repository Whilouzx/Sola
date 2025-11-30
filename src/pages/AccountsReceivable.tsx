import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FuturisticCard } from '@/components/ui/futuristic-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, Search, Edit, Trash2, FileText, DollarSign, Clock,
  User, AlertTriangle, Building2, TrendingUp, CheckCircle,
  BarChart3, PieChart
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { PieChart as RechartsPieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { getCustomers } from '@/lib/accounts/customers';
import { getSuppliers } from '@/lib/accounts/suppliers';
import { getReceivables, saveReceivable, updateReceivable, deleteReceivable } from '@/lib/accounts/receivable-service';
import type { AccountReceivable } from '@/lib/accounts/receivable-service';

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  creditLimit: number;
  paymentTerms: number;
  isActive: boolean;
  created_at: string;
  updated_at: string;
}

interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone: string;
  address?: string;
  rif_ci: string;
  payment_terms_days: number;
  bank: string;
  bank_account?: string;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

const PAYMENT_TERMS_OPTIONS = [
  { value: 15, label: '15 días' },
  { value: 30, label: '30 días' },
  { value: 45, label: '45 días' },
  { value: 60, label: '60 días' },
  { value: 90, label: '90 días' }
];

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD - Dólar Estadounidense', symbol: '$' },
  { value: 'VES', label: 'VES - Bolívar Venezolano', symbol: 'Bs.' }
];

export default function AccountsReceivable() {
  const [receivables, setReceivables] = useState<AccountReceivable[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currencyFilter, setCurrencyFilter] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedReceivable, setSelectedReceivable] = useState<AccountReceivable | null>(null);

  const [formData, setFormData] = useState({
    invoice_number: '',
    entity_type: 'customer' as 'customer' | 'supplier',
    customer_id: '',
    supplier_id: '',
    amount: 0,
    currency: 'USD' as 'USD' | 'VES',
    payment_terms: 30,
    description: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [customersData, suppliersData, receivablesData] = await Promise.all([
        getCustomers(),
        getSuppliers(),
        getReceivables()
      ]);
      
      setCustomers(customersData);
      setSuppliers(suppliersData);
      setReceivables(receivablesData);
      
      if (suppliersData.length === 0) {
        const sampleSuppliers = [
          {
            id: 'supplier-1',
            name: 'Proveedor Ejemplo 1',
            email: 'proveedor1@example.com',
            phone: '+58-412-1234567',
            address: 'Caracas, Venezuela',
            rif_ci: 'J-12345678-9',
            payment_terms_days: 30,
            bank: 'Banco Venezuela',
            bank_account: '0102-1234-56-1234567890',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'supplier-2',
            name: 'Proveedor Ejemplo 2',
            email: 'proveedor2@example.com',
            phone: '+58-414-7654321',
            address: 'Valencia, Venezuela',
            rif_ci: 'J-87654321-0',
            payment_terms_days: 15,
            bank: 'Banco Nacional',
            bank_account: '0108-9876-54-0987654321',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];
        localStorage.setItem('sales-app-suppliers', JSON.stringify(sampleSuppliers));
        setSuppliers(sampleSuppliers);
      }
    } catch (error) {
      console.error('❌ Error loading data:', error);
      toast.error('Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      invoice_number: '',
      entity_type: 'customer',
      customer_id: '',
      supplier_id: '',
      amount: 0,
      currency: 'USD',
      payment_terms: 30,
      description: ''
    });
    setSelectedReceivable(null);
  };

  const generateInvoiceNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `INV-${year}${month}${day}-${random}`;
  };

  const calculateDueDate = (paymentTerms: number) => {
    const now = new Date();
    const dueDate = new Date(now.getTime() + paymentTerms * 24 * 60 * 60 * 1000);
    return dueDate.toISOString().split('T')[0];
  };

  const validateForm = (): boolean => {
    if (!formData.invoice_number.trim()) {
      toast.error('El número de factura es obligatorio');
      return false;
    }
    if (formData.entity_type === 'customer' && !formData.customer_id) {
      toast.error('Debe seleccionar un cliente');
      return false;
    }
    if (formData.entity_type === 'supplier' && !formData.supplier_id) {
      toast.error('Debe seleccionar un proveedor');
      return false;
    }
    if (formData.amount <= 0) {
      toast.error('El monto debe ser mayor a 0');
      return false;
    }
    return true;
  };

  const getEntityInfo = () => {
    if (formData.entity_type === 'customer' && formData.customer_id) {
      return customers.find(c => c.id === formData.customer_id);
    } else if (formData.entity_type === 'supplier' && formData.supplier_id) {
      return suppliers.find(s => s.id === formData.supplier_id);
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      const entityInfo = getEntityInfo();
      if (!entityInfo) {
        toast.error('Entidad no encontrada');
        return;
      }

      const dueDate = calculateDueDate(formData.payment_terms);
      
      if (selectedReceivable) {
        const result = await updateReceivable(selectedReceivable.id, {
          invoice_number: formData.invoice_number,
          entity_type: formData.entity_type,
          customer_id: formData.entity_type === 'customer' ? formData.customer_id : undefined,
          supplier_id: formData.entity_type === 'supplier' ? formData.supplier_id : undefined,
          entity_name: entityInfo.name,
          amount: formData.amount,
          currency: formData.currency,
          payment_terms: formData.payment_terms,
          due_date: dueDate,
          description: formData.description
        });
        
        if (result) {
          const updated = receivables.map(r => r.id === selectedReceivable.id ? result : r);
          setReceivables(updated);
          localStorage.setItem('sales-app-receivables', JSON.stringify(updated));
          toast.success('Factura actualizada exitosamente');
          setIsEditDialogOpen(false);
        }
      } else {
        const result = await saveReceivable({
          invoice_number: formData.invoice_number,
          entity_type: formData.entity_type,
          customer_id: formData.entity_type === 'customer' ? formData.customer_id : undefined,
          supplier_id: formData.entity_type === 'supplier' ? formData.supplier_id : undefined,
          entity_name: entityInfo.name,
          amount: formData.amount,
          currency: formData.currency,
          payment_terms: formData.payment_terms,
          due_date: dueDate,
          status: 'pending',
          description: formData.description
        });
        
        if (result) {
          const updated = [...receivables, result];
          setReceivables(updated);
          localStorage.setItem('sales-app-receivables', JSON.stringify(updated));
          toast.success('Factura creada exitosamente');
          setIsCreateDialogOpen(false);
        }
      }
      
      resetForm();
    } catch (error) {
      console.error('Error saving receivable:', error);
      toast.error('Error al guardar la factura');
    }
  };

  const handleEdit = (receivable: AccountReceivable) => {
    setSelectedReceivable(receivable);
    setFormData({
      invoice_number: receivable.invoice_number,
      entity_type: receivable.entity_type,
      customer_id: receivable.customer_id || '',
      supplier_id: receivable.supplier_id || '',
      amount: receivable.amount,
      currency: receivable.currency,
      payment_terms: receivable.payment_terms,
      description: receivable.description || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta factura?')) return;

    try {
      const success = await deleteReceivable(id);
      if (success) {
        const updated = receivables.filter(r => r.id !== id);
        setReceivables(updated);
        localStorage.setItem('sales-app-receivables', JSON.stringify(updated));
        toast.success('Factura eliminada exitosamente');
      }
    } catch (error) {
      console.error('Error deleting receivable:', error);
      toast.error('Error al eliminar la factura');
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    try {
      const result = await updateReceivable(id, { status: 'paid' });
      if (result) {
        const updated = receivables.map(r => r.id === id ? result : r);
        setReceivables(updated);
        localStorage.setItem('sales-app-receivables', JSON.stringify(updated));
        toast.success('Factura marcada como pagada');
      }
    } catch (error) {
      console.error('Error updating receivable:', error);
      toast.error('Error al actualizar la factura');
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300';
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300';
      case 'overdue': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300';
      case 'cancelled': return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-300';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return 'Pagada';
      case 'pending': return 'Pendiente';
      case 'overdue': return 'Vencida';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };

  const getCurrencySymbol = (currency: string) => {
    return CURRENCY_OPTIONS.find(c => c.value === currency)?.symbol || '$';
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
  };

  useEffect(() => {
    const updatedReceivables = receivables.map(r => {
      if (r.status === 'pending' && isOverdue(r.due_date)) {
        updateReceivable(r.id, { status: 'overdue' });
        return { ...r, status: 'overdue' as const };
      }
      return r;
    });
    
    if (JSON.stringify(updatedReceivables) !== JSON.stringify(receivables)) {
      setReceivables(updatedReceivables);
      localStorage.setItem('sales-app-receivables', JSON.stringify(updatedReceivables));
    }
  }, [receivables]);

  const filteredReceivables = receivables.filter(r => {
    const matchesSearch = r.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.entity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchesCurrency = currencyFilter === 'all' || r.currency === currencyFilter;
    return matchesSearch && matchesStatus && matchesCurrency;
  });

  const totalPendingUSD = receivables.filter(r => (r.status === 'pending' || r.status === 'overdue') && r.currency === 'USD').reduce((sum, r) => sum + r.amount, 0);
  const totalPendingVES = receivables.filter(r => (r.status === 'pending' || r.status === 'overdue') && r.currency === 'VES').reduce((sum, r) => sum + r.amount, 0);
  const totalOverdueUSD = receivables.filter(r => r.status === 'overdue' && r.currency === 'USD').reduce((sum, r) => sum + r.amount, 0);
  const totalOverdueVES = receivables.filter(r => r.status === 'overdue' && r.currency === 'VES').reduce((sum, r) => sum + r.amount, 0);
  const totalPaidUSD = receivables.filter(r => r.status === 'paid' && r.currency === 'USD').reduce((sum, r) => sum + r.amount, 0);
  const totalPaidVES = receivables.filter(r => r.status === 'paid' && r.currency === 'VES').reduce((sum, r) => sum + r.amount, 0);

  const donutDataUSD = [
    { name: 'EN PLAZO', value: receivables.filter(r => r.status === 'pending' && r.currency === 'USD').reduce((sum, r) => sum + r.amount, 0), fill: '#f97316' },
    { name: 'VENCIDAS', value: totalOverdueUSD, fill: '#dc2626' }
  ];

  const donutDataVES = [
    { name: 'EN PLAZO', value: receivables.filter(r => r.status === 'pending' && r.currency === 'VES').reduce((sum, r) => sum + r.amount, 0), fill: '#f97316' },
    { name: 'VENCIDAS', value: totalOverdueVES, fill: '#dc2626' }
  ];

  const generateTrendData = () => {
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
      
      const dayReceivables = receivables.filter(r => {
        const created = new Date(r.created_at);
        return created.toDateString() === date.toDateString();
      });
      
      days.push({
        date: dateStr,
        pendiente: dayReceivables.filter(r => r.status === 'pending' && r.currency === 'USD').reduce((sum, r) => sum + r.amount, 0),
        vencida: dayReceivables.filter(r => r.status === 'overdue' && r.currency === 'USD').reduce((sum, r) => sum + r.amount, 0),
        pagada: dayReceivables.filter(r => r.status === 'paid' && r.currency === 'USD').reduce((sum, r) => sum + r.amount, 0)
      });
    }
    return days;
  };

  const trendData = generateTrendData();

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-500 via-orange-400 to-amber-500 bg-clip-text text-transparent">
            Gestión de Crédito
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
            Monitorea facturas pendientes, vencidas y pagadas en tiempo real
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flowi-button text-white font-semibold shadow-lg hover:shadow-xl transition-all" onClick={() => {
              resetForm();
              setFormData(prev => ({ ...prev, invoice_number: generateInvoiceNumber() }));
              setIsCreateDialogOpen(true);
            }}>
              <Plus className="h-5 w-5 mr-2" />
              Nueva Factura
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gradient">
                {selectedReceivable ? 'Editar Factura' : 'Crear Nueva Factura'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invoice_number" className="font-semibold">Número de Factura *</Label>
                  <Input
                    id="invoice_number"
                    value={formData.invoice_number}
                    onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                    placeholder="INV-20240101-001"
                    required
                    className="flowi-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="entity_type" className="font-semibold">Tipo de Entidad *</Label>
                  <Select 
                    value={formData.entity_type} 
                    onValueChange={(value: 'customer' | 'supplier') => {
                      setFormData({ 
                        ...formData, 
                        entity_type: value,
                        customer_id: '',
                        supplier_id: ''
                      });
                    }}
                  >
                    <SelectTrigger className="flowi-input">
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Cliente
                        </div>
                      </SelectItem>
                      <SelectItem value="supplier">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          Proveedor
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="entity_id" className="font-semibold">
                    {formData.entity_type === 'customer' ? 'Cliente' : 'Proveedor'} *
                  </Label>
                  <Select 
                    value={formData.entity_type === 'customer' ? formData.customer_id : formData.supplier_id} 
                    onValueChange={(value) => {
                      if (formData.entity_type === 'customer') {
                        setFormData({ ...formData, customer_id: value });
                      } else {
                        setFormData({ ...formData, supplier_id: value });
                      }
                    }}
                  >
                    <SelectTrigger className="flowi-input">
                      <SelectValue placeholder={`Seleccionar ${formData.entity_type === 'customer' ? 'cliente' : 'proveedor'}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.entity_type === 'customer' ? (
                        customers.length === 0 ? (
                          <SelectItem value="no-customers" disabled>No hay clientes registrados</SelectItem>
                        ) : (
                          customers.filter(c => c.isActive).map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name} {c.email && `(${c.email})`}</SelectItem>
                          ))
                        )
                      ) : (
                        suppliers.length === 0 ? (
                          <SelectItem value="no-suppliers" disabled>No hay proveedores registrados</SelectItem>
                        ) : (
                          suppliers.filter(s => s.is_active !== false).map(s => (
                            <SelectItem key={s.id} value={s.id}>{s.name} {s.rif_ci && `(${s.rif_ci})`}</SelectItem>
                          ))
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency" className="font-semibold">Moneda *</Label>
                  <Select 
                    value={formData.currency} 
                    onValueChange={(value: 'USD' | 'VES') => setFormData({ ...formData, currency: value })}
                  >
                    <SelectTrigger className="flowi-input">
                      <SelectValue placeholder="Seleccionar moneda" />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCY_OPTIONS.map(c => (
                        <SelectItem key={c.value} value={c.value}>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold">{c.symbol}</span>
                            {c.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount" className="font-semibold">Monto ({getCurrencySymbol(formData.currency)}) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    required
                    className="flowi-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_terms" className="font-semibold">Términos de Pago *</Label>
                  <Select 
                    value={formData.payment_terms.toString()} 
                    onValueChange={(value) => setFormData({ ...formData, payment_terms: parseInt(value) })}
                  >
                    <SelectTrigger className="flowi-input">
                      <SelectValue placeholder="Seleccionar términos" />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_TERMS_OPTIONS.map(o => (
                        <SelectItem key={o.value} value={o.value.toString()}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="font-semibold">Descripción (opcional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripción de los productos o servicios facturados"
                  className="flowi-input"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button type="button" variant="outline" onClick={() => { setIsCreateDialogOpen(false); setIsEditDialogOpen(false); }}>
                  Cancelar
                </Button>
                <Button type="submit" className="flowi-button">
                  {selectedReceivable ? 'Actualizar' : 'Crear'} Factura
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[
          { title: 'Total Facturas', value: receivables.length, icon: FileText, color: 'blue' },
          { title: 'Pendiente USD', value: `$${totalPendingUSD.toFixed(2)}`, icon: Clock, color: 'amber' },
          { title: 'Vencido USD', value: `$${totalOverdueUSD.toFixed(2)}`, icon: AlertTriangle, color: 'red' },
          { title: 'Pendiente VES', value: `Bs. ${totalPendingVES.toFixed(0)}`, icon: DollarSign, color: 'amber' },
          { title: 'Vencido VES', value: `Bs. ${totalOverdueVES.toFixed(0)}`, icon: AlertTriangle, color: 'red' },
          { title: 'Pagado Total', value: `$${totalPaidUSD.toFixed(2)}`, icon: CheckCircle, color: 'emerald' }
        ].map((metric, idx) => (
          <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
            <FuturisticCard variant="glass" className={`p-6 flowi-card border-l-4 border-l-${metric.color}-500`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">{metric.title}</p>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{metric.value}</h3>
                </div>
                <div className={`p-3 rounded-xl bg-${metric.color}-100 dark:bg-${metric.color}-900/30`}>
                  <metric.icon className={`h-6 w-6 text-${metric.color}-600 dark:text-${metric.color}-400`} />
                </div>
              </div>
            </FuturisticCard>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[
          { title: 'Facturas Pendientes (USD)', data: donutDataUSD },
          { title: 'Facturas Pendientes (VES)', data: donutDataVES }
        ].map((chart, idx) => (
          <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + idx * 0.1 }}>
            <FuturisticCard variant="glass" className="p-6 flowi-card">
              <div className="flex items-center gap-2 mb-6">
                <PieChart className="h-5 w-5 text-orange-500" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{chart.title}</h3>
              </div>
              {chart.data.some(d => d.value > 0) ? (
                <div className="flex flex-col items-center justify-center">
                  <ResponsiveContainer width="100%" height={280}>
                    <RechartsPieChart>
                      <Pie data={chart.data} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                        {chart.data.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${idx === 0 ? '$' : 'Bs. '}${value.toFixed(idx === 0 ? 2 : 0)}`} />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-4 mt-4 w-full">
                    <div className="text-center p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">EN PLAZO</p>
                      <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{idx === 0 ? '$' : 'Bs. '}{chart.data[0].value.toFixed(idx === 0 ? 2 : 0)}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{chart.data[0].value + chart.data[1].value > 0 ? Math.round((chart.data[0].value / (chart.data[0].value + chart.data[1].value)) * 100) : 0}%</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">VENCIDAS</p>
                      <p className="text-lg font-bold text-red-600 dark:text-red-400">{idx === 0 ? '$' : 'Bs. '}{chart.data[1].value.toFixed(idx === 0 ? 2 : 0)}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{chart.data[0].value + chart.data[1].value > 0 ? Math.round((chart.data[1].value / (chart.data[0].value + chart.data[1].value)) * 100) : 0}%</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">No hay facturas</p>
                </div>
              )}
            </FuturisticCard>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <FuturisticCard variant="glass" className="p-6 flowi-card">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="h-5 w-5 text-orange-500" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Tendencia de Facturas (Últimos 7 días)</h3>
          </div>
          {trendData.some(d => d.pendiente > 0 || d.vencida > 0 || d.pagada > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} formatter={(value) => `$${value.toFixed(2)}`} />
                <Legend />
                <Line type="monotone" dataKey="pendiente" stroke="#f97316" strokeWidth={2} name="Pendiente" dot={{ fill: '#f97316', r: 4 }} />
                <Line type="monotone" dataKey="vencida" stroke="#dc2626" strokeWidth={2} name="Vencida" dot={{ fill: '#dc2626', r: 4 }} />
                <Line type="monotone" dataKey="pagada" stroke="#16a34a" strokeWidth={2} name="Pagada" dot={{ fill: '#16a34a', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No hay datos de tendencia</p>
            </div>
          )}
        </FuturisticCard>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <FuturisticCard variant="glass" className="p-4 flowi-card">
          <div className="flex flex-col md:flex-row gap-3 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Buscar facturas, clientes, proveedores..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 flowi-input" />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48 flowi-input">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="overdue">Vencida</SelectItem>
                  <SelectItem value="paid">Pagada</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
              <Select value={currencyFilter} onValueChange={setCurrencyFilter}>
                <SelectTrigger className="w-full md:w-32 flowi-input">
                  <SelectValue placeholder="Moneda" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="VES">VES</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </FuturisticCard>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <FuturisticCard variant="glass" className="p-6 flowi-card">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-orange-200 border-t-orange-500 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Cargando facturas...</p>
            </div>
          ) : filteredReceivables.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                {searchTerm || statusFilter !== 'all' || currencyFilter !== 'all' ? 'No se encontraron facturas' : 'No hay facturas registradas'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReceivables.map((r, idx) => (
                <motion.div key={r.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }} className="p-5 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border border-gray-200 dark:border-gray-600 hover:border-orange-400/50 hover:shadow-md transition-all">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    <div className="md:col-span-3">
                      <h4 className="font-bold text-gray-900 dark:text-white text-lg">{r.invoice_number}</h4>
                      <div className="flex items-center gap-2 mt-1 text-sm">
                        {r.entity_type === 'customer' ? <User className="h-4 w-4 text-blue-500" /> : <Building2 className="h-4 w-4 text-purple-500" />}
                        <span className="text-gray-600 dark:text-gray-400">{r.entity_name}</span>
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Monto</p>
                      <p className="font-bold text-lg text-gray-900 dark:text-white">{getCurrencySymbol(r.currency)}{r.amount.toFixed(2)}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Vencimiento</p>
                      <p className={`font-semibold ${isOverdue(r.due_date) && r.status === 'pending' ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                        {new Date(r.due_date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <Badge className={`${getStatusBadgeColor(r.status)} text-xs font-semibold px-3 py-1`}>
                        {getStatusLabel(r.status)}
                      </Badge>
                    </div>
                    <div className="md:col-span-3 flex justify-end gap-2">
                      {r.status === 'pending' && (
                        <Button size="sm" variant="outline" onClick={() => handleMarkAsPaid(r.id)} className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Pagar
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => handleEdit(r)} className="text-xs">
                        <Edit className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDelete(r.id)} className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </FuturisticCard>
      </motion.div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gradient">Editar Factura</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_invoice_number" className="font-semibold">Número de Factura *</Label>
                <Input id="edit_invoice_number" value={formData.invoice_number} onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })} placeholder="INV-20240101-001" required className="flowi-input" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_entity_type" className="font-semibold">Tipo de Entidad *</Label>
                <Select value={formData.entity_type} onValueChange={(value: 'customer' | 'supplier') => { setFormData({ ...formData, entity_type: value, customer_id: '', supplier_id: '' }); }}>
                  <SelectTrigger className="flowi-input">
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer"><div className="flex items-center gap-2"><User className="h-4 w-4" />Cliente</div></SelectItem>
                    <SelectItem value="supplier"><div className="flex items-center gap-2"><Building2 className="h-4 w-4" />Proveedor</div></SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_entity_id" className="font-semibold">{formData.entity_type === 'customer' ? 'Cliente' : 'Proveedor'} *</Label>
                <Select value={formData.entity_type === 'customer' ? formData.customer_id : formData.supplier_id} onValueChange={(value) => { formData.entity_type === 'customer' ? setFormData({ ...formData, customer_id: value }) : setFormData({ ...formData, supplier_id: value }); }}>
                  <SelectTrigger className="flowi-input">
                    <SelectValue placeholder={`Seleccionar ${formData.entity_type === 'customer' ? 'cliente' : 'proveedor'}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.entity_type === 'customer' ? (
                      customers.length === 0 ? <SelectItem value="no-customers" disabled>No hay clientes</SelectItem> : customers.filter(c => c.isActive).map(c => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))
                    ) : (
                      suppliers.length === 0 ? <SelectItem value="no-suppliers" disabled>No hay proveedores</SelectItem> : suppliers.filter(s => s.is_active !== false).map(s => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_currency" className="font-semibold">Moneda *</Label>
                <Select value={formData.currency} onValueChange={(value: 'USD' | 'VES') => setFormData({ ...formData, currency: value })}>
                  <SelectTrigger className="flowi-input">
                    <SelectValue placeholder="Seleccionar moneda" />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCY_OPTIONS.map(c => (<SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_amount" className="font-semibold">Monto ({getCurrencySymbol(formData.currency)}) *</Label>
                <Input id="edit_amount" type="number" step="0.01" min="0" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })} placeholder="0.00" required className="flowi-input" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_payment_terms" className="font-semibold">Términos de Pago *</Label>
                <Select value={formData.payment_terms.toString()} onValueChange={(value) => setFormData({ ...formData, payment_terms: parseInt(value) })}>
                  <SelectTrigger className="flowi-input">
                    <SelectValue placeholder="Seleccionar términos" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_TERMS_OPTIONS.map(o => (<SelectItem key={o.value} value={o.value.toString()}>{o.label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_description" className="font-semibold">Descripción (opcional)</Label>
              <Textarea id="edit_description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Descripción de los productos o servicios" className="flowi-input" rows={3} />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" className="flowi-button">Actualizar Factura</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
