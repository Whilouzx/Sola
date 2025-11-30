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
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Send,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  ShoppingCart,
  Calendar,
  User,
  DollarSign,
  Package,
  AlertTriangle,
  Download,
  Share
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Quotation,
  QuotationItem,
  CreateQuotationRequest,
  UpdateQuotationRequest,
  QuotationFilters,
  PaginatedResponse
} from '@/types/pos';
import {
  createQuotation,
  getQuotations,
  updateQuotation,
  deleteQuotation,
  convertQuotationToSale,
  getExpiringQuotations,
  markQuotationExpired
} from '@/lib/pos/quotations';
import { useSupabase } from '@/context/SupabaseContext';

export default function QuotationManager() {
  const { state } = useSupabase();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [expiringQuotations, setExpiringQuotations] = useState<Quotation[]>([]);
  
  const [quotationForm, setQuotationForm] = useState<CreateQuotationRequest>({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    validUntil: '',
    items: [],
    notes: '',
    terms: ''
  });

  const [newItem, setNewItem] = useState<Partial<QuotationItem>>({
    productName: '',
    productSku: '',
    quantity: 1,
    unitPriceUSD: 0,
    unitPriceVES: 0,
    discountPercentage: 0
  });

  useEffect(() => {
    loadQuotations();
    loadExpiringQuotations();
    // Check for expired quotations periodically
    const interval = setInterval(() => {
      markQuotationExpired();
      loadExpiringQuotations();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  const loadQuotations = async () => {
    try {
      setLoading(true);
      const filters: QuotationFilters = {
        limit: 100,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      };

      if (statusFilter !== 'all') {
        filters.status = statusFilter as 'draft' | 'pending' | 'approved' | 'expired' | 'converted' | 'cancelled';
      }

      if (searchTerm) {
        filters.search = searchTerm;
      }

      const result = await getQuotations(filters);
      setQuotations(result.data);
    } catch (error) {
      toast.error('Error cargando cotizaciones');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadExpiringQuotations = async () => {
    try {
      const expiring = await getExpiringQuotations(7); // Next 7 days
      setExpiringQuotations(expiring);
    } catch (error) {
      console.error('Error loading expiring quotations:', error);
    }
  };

  const resetForm = () => {
    setQuotationForm({
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      customerAddress: '',
      validUntil: '',
      items: [],
      notes: '',
      terms: ''
    });
    setNewItem({
      productName: '',
      productSku: '',
      quantity: 1,
      unitPriceUSD: 0,
      unitPriceVES: 0,
      discountPercentage: 0
    });
    setSelectedQuotation(null);
  };

  const addItemToQuotation = () => {
    if (!newItem.productName || !newItem.productSku || !newItem.quantity || !newItem.unitPriceUSD) {
      toast.error('Complete todos los campos del producto');
      return;
    }

    const item: Omit<QuotationItem, 'id' | 'quotationId'> = {
      productId: 'temp-' + Date.now(),
      productName: newItem.productName!,
      productSku: newItem.productSku!,
      quantity: newItem.quantity!,
      unitPriceUSD: newItem.unitPriceUSD!,
      unitPriceVES: newItem.unitPriceVES!,
      discountPercentage: newItem.discountPercentage || 0,
      totalPriceUSD: (newItem.unitPriceUSD! * newItem.quantity!) * (1 - (newItem.discountPercentage || 0) / 100),
      totalPriceVES: (newItem.unitPriceVES! * newItem.quantity!) * (1 - (newItem.discountPercentage || 0) / 100)
    };

    setQuotationForm(prev => ({
      ...prev,
      items: [...prev.items, item]
    }));

    setNewItem({
      productName: '',
      productSku: '',
      quantity: 1,
      unitPriceUSD: 0,
      unitPriceVES: 0,
      discountPercentage: 0
    });
  };

  const removeItemFromQuotation = (index: number) => {
    setQuotationForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleCreateQuotation = async () => {
    if (!quotationForm.customerName || !quotationForm.validUntil || quotationForm.items.length === 0) {
      toast.error('Complete todos los campos requeridos');
      return;
    }

    try {
      const newQuotation = await createQuotation(quotationForm);
      setQuotations(prev => [newQuotation, ...prev]);
      setIsCreateDialogOpen(false);
      resetForm();
      toast.success('Cotización creada exitosamente');
    } catch (error) {
      toast.error('Error creando cotización');
      console.error(error);
    }
  };

  const handleEditQuotation = (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    setQuotationForm({
      customerId: quotation.customerId,
      customerName: quotation.customerName,
      customerEmail: quotation.customerEmail || '',
      customerPhone: quotation.customerPhone || '',
      customerAddress: quotation.customerAddress || '',
      validUntil: quotation.validUntil,
      items: quotation.items,
      notes: quotation.notes || '',
      terms: quotation.terms || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateQuotation = async () => {
    if (!selectedQuotation) return;

    try {
      const updatedQuotation = await updateQuotation(selectedQuotation.id, quotationForm);
      setQuotations(prev => prev.map(q => q.id === selectedQuotation.id ? updatedQuotation : q));
      setIsEditDialogOpen(false);
      resetForm();
      toast.success('Cotización actualizada exitosamente');
    } catch (error) {
      toast.error('Error actualizando cotización');
      console.error(error);
    }
  };

  const handleDeleteQuotation = async (quotation: Quotation) => {
    if (!confirm(`¿Está seguro de eliminar la cotización ${quotation.quotationNumber}?`)) {
      return;
    }

    try {
      await deleteQuotation(quotation.id);
      setQuotations(prev => prev.filter(q => q.id !== quotation.id));
      toast.success('Cotización eliminada exitosamente');
    } catch (error) {
      toast.error('Error eliminando cotización');
      console.error(error);
    }
  };

  const handleConvertToSale = async (quotation: Quotation) => {
    if (!confirm(`¿Convertir la cotización ${quotation.quotationNumber} en una venta?`)) {
      return;
    }

    try {
      const saleId = await convertQuotationToSale(quotation.id);
      setQuotations(prev => prev.map(q => 
        q.id === quotation.id 
          ? { ...q, status: 'converted', convertedToSaleId: saleId, convertedAt: new Date().toISOString() }
          : q
      ));
      toast.success('Cotización convertida a venta exitosamente');
    } catch (error) {
      toast.error('Error convirtiendo cotización');
      console.error(error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return Clock;
      case 'pending': return Send;
      case 'approved': return CheckCircle;
      case 'expired': return XCircle;
      case 'converted': return ShoppingCart;
      case 'cancelled': return XCircle;
      default: return FileText;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
      case 'pending': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
      case 'approved': return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
      case 'expired': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
      case 'converted': return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800';
      case 'cancelled': return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
      default: return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
    }
  };

  const calculateQuotationTotal = () => {
    return quotationForm.items.reduce((sum, item) => sum + item.totalPriceUSD, 0);
  };

  const filteredQuotations = quotations.filter(quotation => {
    const matchesSearch = quotation.quotationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quotation.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || quotation.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-200">
            Cotizaciones
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Gestiona cotizaciones y conviértelas en ventas
          </p>
        </div>

        <div className="flex gap-3">
          <Badge className="bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800 px-3 py-1">
            <FileText className="h-4 w-4 mr-2" />
            {quotations.length} cotizaciones
          </Badge>
          {expiringQuotations.length > 0 && (
            <Badge className="bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800 px-3 py-1">
              <AlertTriangle className="h-4 w-4 mr-2" />
              {expiringQuotations.length} por vencer
            </Badge>
          )}
        </div>
      </motion.div>

      {/* Filters and Actions */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex gap-4 flex-1">
              <div className="relative flex-1">
                <Input
                  placeholder="Buscar cotizaciones..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-4"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="draft">Borrador</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="approved">Aprobada</SelectItem>
                  <SelectItem value="expired">Vencida</SelectItem>
                  <SelectItem value="converted">Convertida</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                  onClick={resetForm}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Cotización
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-gray-800 dark:text-gray-200">Crear Cotización</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6">
                  {/* Customer Information */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-gray-700 dark:text-gray-300">Nombre del Cliente *</Label>
                      <Input
                        value={quotationForm.customerName}
                        onChange={(e) => setQuotationForm(prev => ({ ...prev, customerName: e.target.value }))}
                        placeholder="Nombre completo"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-700 dark:text-gray-300">Email</Label>
                      <Input
                        type="email"
                        value={quotationForm.customerEmail}
                        onChange={(e) => setQuotationForm(prev => ({ ...prev, customerEmail: e.target.value }))}
                        placeholder="email@ejemplo.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-700 dark:text-gray-300">Teléfono</Label>
                      <Input
                        value={quotationForm.customerPhone}
                        onChange={(e) => setQuotationForm(prev => ({ ...prev, customerPhone: e.target.value }))}
                        placeholder="+58-XXX-XXX-XXXX"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-700 dark:text-gray-300">Válida hasta *</Label>
                      <Input
                        type="date"
                        value={quotationForm.validUntil}
                        onChange={(e) => setQuotationForm(prev => ({ ...prev, validUntil: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700 dark:text-gray-300">Dirección</Label>
                    <Textarea
                      value={quotationForm.customerAddress}
                      onChange={(e) => setQuotationForm(prev => ({ ...prev, customerAddress: e.target.value }))}
                      placeholder="Dirección completa del cliente"
                      rows={2}
                    />
                  </div>

                  {/* Add Product */}
                  <div className="border rounded-lg p-4 space-y-4">
                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">Agregar Producto</h3>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-gray-700 dark:text-gray-300">Producto *</Label>
                        <Input
                          value={newItem.productName}
                          onChange={(e) => setNewItem(prev => ({ ...prev, productName: e.target.value }))}
                          placeholder="Nombre del producto"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-gray-700 dark:text-gray-300">SKU *</Label>
                        <Input
                          value={newItem.productSku}
                          onChange={(e) => setNewItem(prev => ({ ...prev, productSku: e.target.value }))}
                          placeholder="SKU del producto"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-gray-700 dark:text-gray-300">Cantidad *</Label>
                        <Input
                          type="number"
                          min="1"
                          value={newItem.quantity}
                          onChange={(e) => setNewItem(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-gray-700 dark:text-gray-300">Precio USD *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={newItem.unitPriceUSD}
                          onChange={(e) => setNewItem(prev => ({ ...prev, unitPriceUSD: parseFloat(e.target.value) || 0 }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-gray-700 dark:text-gray-300">Precio VES</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={newItem.unitPriceVES}
                          onChange={(e) => setNewItem(prev => ({ ...prev, unitPriceVES: parseFloat(e.target.value) || 0 }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-gray-700 dark:text-gray-300">Descuento %</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={newItem.discountPercentage}
                          onChange={(e) => setNewItem(prev => ({ ...prev, discountPercentage: parseFloat(e.target.value) || 0 }))}
                        />
                      </div>
                    </div>

                    <Button
                      type="button"
                      onClick={addItemToQuotation}
                      className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Producto
                    </Button>
                  </div>

                  {/* Items List */}
                  {quotationForm.items.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">Productos en la Cotización</h3>
                      
                      <div className="space-y-2">
                        {quotationForm.items.map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="flex-1">
                              <div className="font-medium text-gray-800 dark:text-gray-200">{item.productName}</div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {item.productSku} • Cantidad: {item.quantity} • ${item.unitPriceUSD} c/u
                                {item.discountPercentage > 0 && ` • ${item.discountPercentage}% desc.`}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-medium text-green-600">${item.totalPriceUSD.toFixed(2)}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeItemFromQuotation(index)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="text-right">
                        <div className="text-xl font-bold text-gray-800 dark:text-gray-200">
                          Total: ${calculateQuotationTotal().toFixed(2)} USD
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notes and Terms */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-gray-700 dark:text-gray-300">Notas</Label>
                      <Textarea
                        value={quotationForm.notes}
                        onChange={(e) => setQuotationForm(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Notas adicionales"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-700 dark:text-gray-300">Términos y Condiciones</Label>
                      <Textarea
                        value={quotationForm.terms}
                        onChange={(e) => setQuotationForm(prev => ({ ...prev, terms: e.target.value }))}
                        placeholder="Términos y condiciones"
                        rows={3}
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
                      onClick={handleCreateQuotation}
                      className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                    >
                      Crear Cotización
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Quotations List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-800 dark:text-gray-200">Lista de Cotizaciones</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto"></div>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Cargando cotizaciones...</p>
            </div>
          ) : filteredQuotations.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">No se encontraron cotizaciones</p>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {filteredQuotations.map((quotation) => {
                  const StatusIcon = getStatusIcon(quotation.status);
                  const isExpiring = new Date(quotation.validUntil) <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
                  
                  return (
                    <motion.div
                      key={quotation.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border hover:border-cyan-400/50 transition-all"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <StatusIcon className="h-5 w-5 text-gray-500" />
                          <div>
                            <h3 className="font-medium text-gray-800 dark:text-gray-200">
                              {quotation.quotationNumber}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {quotation.customerName}
                            </p>
                          </div>
                          
                          <Badge className={getStatusColor(quotation.status)}>
                            {quotation.status === 'draft' && 'Borrador'}
                            {quotation.status === 'pending' && 'Pendiente'}
                            {quotation.status === 'approved' && 'Aprobada'}
                            {quotation.status === 'expired' && 'Vencida'}
                            {quotation.status === 'converted' && 'Convertida'}
                            {quotation.status === 'cancelled' && 'Cancelada'}
                          </Badge>

                          {isExpiring && quotation.status !== 'expired' && quotation.status !== 'converted' && (
                            <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Por vencer
                            </Badge>
                          )}
                        </div>

                        <div className="flex gap-1">
                          {quotation.status !== 'converted' && quotation.status !== 'expired' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditQuotation(quotation)}
                                className="h-8 w-8 p-0 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              
                              {quotation.status === 'approved' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleConvertToSale(quotation)}
                                  className="h-8 w-8 p-0 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                                >
                                  <ShoppingCart className="h-3 w-3" />
                                </Button>
                              )}
                            </>
                          )}
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteQuotation(quotation)}
                            className="h-8 w-8 p-0 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-green-600">
                          <DollarSign className="h-3 w-3" />
                          <span>${quotation.totalUSD.toFixed(2)} USD</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Package className="h-3 w-3" />
                          <span>{quotation.items.length} productos</span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Calendar className="h-3 w-3" />
                          <span>Válida hasta: {new Date(quotation.validUntil).toLocaleDateString()}</span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <User className="h-3 w-3" />
                          <span>{new Date(quotation.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {quotation.notes && (
                        <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                          <strong>Notas:</strong> {quotation.notes}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}