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
import { Calendar } from '@/components/ui/calendar';
import { 
  Truck, 
  Plus, 
  Edit, 
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MapPin,
  User,
  Calendar as CalendarIcon,
  Route,
  Camera,
  FileText,
  Phone
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Delivery,
  DeliveryItem,
  CreateDeliveryRequest,
  UpdateDeliveryRequest,
  DeliveryFilters
} from '@/types/pos';
import { Customer } from '@/types/accounts';
import { EnhancedProduct } from '@/types/inventory';
import {
  createDelivery,
  getDeliveries,
  updateDelivery,
  deleteDelivery,
  startDelivery,
  completeDelivery,
  failDelivery,
  getAvailableTimeSlots,
  getTodaysDeliveries,
  getDeliveriesByDriver
} from '@/lib/pos/deliveries';
import { getCustomers } from '@/lib/accounts/customers';
import { getEnhancedProducts } from '@/lib/inventory/products';

interface DeliverySchedulerProps {
  onDeliveryStatusChange?: (deliveryId: string, status: string) => void;
}

export default function DeliveryScheduler({ onDeliveryStatusChange }: DeliverySchedulerProps) {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<EnhancedProduct[]>([]);
  const [todaysDeliveries, setTodaysDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  
  const [deliveryForm, setDeliveryForm] = useState<CreateDeliveryRequest>({
    customerId: '',
    scheduledDate: new Date().toISOString().split('T')[0],
    deliveryAddress: '',
    items: [],
    deliveryFee: 0,
    priority: 'medium'
  });

  const [currentItem, setCurrentItem] = useState<Partial<DeliveryItem>>({
    productId: '',
    quantity: 1
  });

  const [deliveryProof, setDeliveryProof] = useState({
    signature: '',
    photo: '',
    notes: '',
    recipientName: ''
  });

  const drivers = [
    { id: 'driver1', name: 'Carlos Rodríguez', phone: '+58-412-123-4567' },
    { id: 'driver2', name: 'María González', phone: '+58-414-765-4321' },
    { id: 'driver3', name: 'José Martínez', phone: '+58-416-987-6543' }
  ];

  const timeSlots = [
    { id: '09:00-12:00', label: '9:00 AM - 12:00 PM' },
    { id: '12:00-15:00', label: '12:00 PM - 3:00 PM' },
    { id: '15:00-18:00', label: '3:00 PM - 6:00 PM' },
    { id: '18:00-21:00', label: '6:00 PM - 9:00 PM' }
  ];

  useEffect(() => {
    loadData();
    loadTodaysDeliveries();
  }, [selectedDate, statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [deliveriesData, customersData, productsData] = await Promise.all([
        getDeliveries({
          scheduledDateFrom: selectedDate.toISOString().split('T')[0],
          scheduledDateTo: selectedDate.toISOString().split('T')[0],
          status: statusFilter !== 'all' ? statusFilter as 'scheduled' | 'in_transit' | 'delivered' | 'failed' | 'cancelled' : undefined,
          limit: 100
        }),
        getCustomers(),
        getEnhancedProducts({ limit: 1000 })
      ]);
      
      setDeliveries(deliveriesData.data);
      setCustomers(customersData);
      setProducts(productsData.data);
    } catch (error) {
      toast.error('Error cargando entregas');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadTodaysDeliveries = async () => {
    try {
      const todaysData = await getTodaysDeliveries();
      setTodaysDeliveries(todaysData);
    } catch (error) {
      console.error('Error loading today\'s deliveries:', error);
    }
  };

  const resetForm = () => {
    setDeliveryForm({
      customerId: '',
      scheduledDate: selectedDate.toISOString().split('T')[0],
      deliveryAddress: '',
      items: [],
      deliveryFee: 0,
      priority: 'medium'
    });
    setCurrentItem({
      productId: '',
      quantity: 1
    });
    setSelectedDelivery(null);
  };

  const addItemToDelivery = () => {
    if (!currentItem.productId || !currentItem.quantity) {
      toast.error('Seleccione un producto y cantidad');
      return;
    }

    const product = products.find(p => p.id === currentItem.productId);
    if (!product) return;

    const newItem: Omit<DeliveryItem, 'id' | 'deliveryId' | 'deliveredQuantity' | 'status'> = {
      productId: product.id,
      productName: product.name,
      variantId: currentItem.variantId,
      quantity: currentItem.quantity!,
      notes: currentItem.notes
    };

    setDeliveryForm(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));

    setCurrentItem({
      productId: '',
      quantity: 1
    });
  };

  const removeItemFromDelivery = (index: number) => {
    setDeliveryForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleCreateDelivery = async () => {
    if (!deliveryForm.customerId || !deliveryForm.deliveryAddress || deliveryForm.items.length === 0) {
      toast.error('Complete todos los campos requeridos');
      return;
    }

    try {
      const newDelivery = await createDelivery(deliveryForm);
      setDeliveries(prev => [newDelivery, ...prev]);
      setIsCreateDialogOpen(false);
      resetForm();
      toast.success('Entrega programada exitosamente');
      loadTodaysDeliveries();
    } catch (error) {
      toast.error('Error programando entrega');
      console.error(error);
    }
  };

  const handleEditDelivery = (delivery: Delivery) => {
    setSelectedDelivery(delivery);
    setDeliveryForm({
      customerId: delivery.customerId || '',
      scheduledDate: delivery.scheduledDate.split('T')[0],
      scheduledTimeSlot: delivery.scheduledTimeSlot,
      deliveryAddress: delivery.deliveryAddress,
      deliveryInstructions: delivery.deliveryInstructions,
      assignedDriverId: delivery.assignedDriverId,
      items: delivery.items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        variantId: item.variantId,
        quantity: item.quantity,
        notes: item.notes
      })),
      deliveryFee: delivery.deliveryFee,
      priority: delivery.priority
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateDelivery = async () => {
    if (!selectedDelivery) return;

    try {
      const updatedDelivery = await updateDelivery(selectedDelivery.id, deliveryForm);
      setDeliveries(prev => prev.map(d => d.id === selectedDelivery.id ? updatedDelivery : d));
      setIsEditDialogOpen(false);
      resetForm();
      toast.success('Entrega actualizada exitosamente');
    } catch (error) {
      toast.error('Error actualizando entrega');
      console.error(error);
    }
  };

  const handleDeleteDelivery = async (delivery: Delivery) => {
    if (!confirm(`¿Está seguro de eliminar la entrega ${delivery.deliveryNumber}?`)) {
      return;
    }

    try {
      await deleteDelivery(delivery.id);
      setDeliveries(prev => prev.filter(d => d.id !== delivery.id));
      toast.success('Entrega eliminada exitosamente');
      loadTodaysDeliveries();
    } catch (error) {
      toast.error('Error eliminando entrega');
      console.error(error);
    }
  };

  const handleStartDelivery = async (delivery: Delivery) => {
    if (!confirm(`¿Iniciar entrega ${delivery.deliveryNumber}?`)) {
      return;
    }

    try {
      const updatedDelivery = await startDelivery(delivery.id);
      setDeliveries(prev => prev.map(d => d.id === delivery.id ? updatedDelivery : d));
      toast.success('Entrega iniciada');
      onDeliveryStatusChange?.(delivery.id, 'in_transit');
      loadTodaysDeliveries();
    } catch (error) {
      toast.error('Error iniciando entrega');
      console.error(error);
    }
  };

  const handleCompleteDelivery = async () => {
    if (!selectedDelivery) return;

    try {
      const updatedDelivery = await completeDelivery(selectedDelivery.id, deliveryProof);
      setDeliveries(prev => prev.map(d => d.id === selectedDelivery.id ? updatedDelivery : d));
      setIsCompleteDialogOpen(false);
      setDeliveryProof({ signature: '', photo: '', notes: '', recipientName: '' });
      toast.success('Entrega completada exitosamente');
      onDeliveryStatusChange?.(selectedDelivery.id, 'delivered');
      loadTodaysDeliveries();
    } catch (error) {
      toast.error('Error completando entrega');
      console.error(error);
    }
  };

  const handleFailDelivery = async (delivery: Delivery, reason: string) => {
    try {
      const updatedDelivery = await failDelivery(delivery.id, reason);
      setDeliveries(prev => prev.map(d => d.id === delivery.id ? updatedDelivery : d));
      toast.success('Entrega marcada como fallida');
      onDeliveryStatusChange?.(delivery.id, 'failed');
      loadTodaysDeliveries();
    } catch (error) {
      toast.error('Error marcando entrega como fallida');
      console.error(error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Clock className="h-4 w-4" />;
      case 'in_transit':
        return <Truck className="h-4 w-4" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />;
      case 'failed':
        return <XCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'in_transit':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'delivered':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'Programada';
      case 'in_transit':
        return 'En Tránsito';
      case 'delivered':
        return 'Entregada';
      case 'failed':
        return 'Fallida';
      case 'cancelled':
        return 'Cancelada';
      default:
        return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const filteredDeliveries = deliveries.filter(delivery =>
    delivery.deliveryNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    delivery.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    delivery.deliveryAddress.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            Programación de Entregas
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Gestiona entregas, asigna conductores y rastrea el progreso
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge className="bg-blue-100 text-blue-700 border-blue-200 px-3 py-1">
            <Truck className="h-4 w-4 mr-2" />
            {todaysDeliveries.length} hoy
          </Badge>
          <Badge className="bg-green-100 text-green-700 border-green-200 px-3 py-1">
            <CheckCircle className="h-4 w-4 mr-2" />
            {todaysDeliveries.filter(d => d.status === 'delivered').length} completadas
          </Badge>
        </div>
      </motion.div>

      {/* Today's Deliveries Summary */}
      {todaysDeliveries.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Entregas de Hoy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {todaysDeliveries.filter(d => d.status === 'scheduled').length}
                  </div>
                  <div className="text-xs text-blue-600">Programadas</div>
                </div>
                
                <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {todaysDeliveries.filter(d => d.status === 'in_transit').length}
                  </div>
                  <div className="text-xs text-yellow-600">En Tránsito</div>
                </div>
                
                <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {todaysDeliveries.filter(d => d.status === 'delivered').length}
                  </div>
                  <div className="text-xs text-green-600">Entregadas</div>
                </div>
                
                <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {todaysDeliveries.filter(d => d.status === 'failed').length}
                  </div>
                  <div className="text-xs text-red-600">Fallidas</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Calendar and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-4 gap-6"
      >
        {/* Calendar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Calendario</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md border"
              />
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="flex gap-4 flex-1">
                    <div className="relative flex-1">
                      <Input
                        placeholder="Buscar entregas..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los estados</SelectItem>
                        <SelectItem value="scheduled">Programada</SelectItem>
                        <SelectItem value="in_transit">En Tránsito</SelectItem>
                        <SelectItem value="delivered">Entregada</SelectItem>
                        <SelectItem value="failed">Fallida</SelectItem>
                        <SelectItem value="cancelled">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                        onClick={resetForm}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Nueva Entrega
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-gray-800 dark:text-gray-200">Programar Entrega</DialogTitle>
                      </DialogHeader>
                      
                      <div className="space-y-6">
                        {/* Customer and Schedule */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-gray-700 dark:text-gray-300">Cliente *</Label>
                            <Select value={deliveryForm.customerId} onValueChange={(value) => setDeliveryForm(prev => ({ ...prev, customerId: value }))}>
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

                          <div className="space-y-2">
                            <Label className="text-gray-700 dark:text-gray-300">Fecha de Entrega *</Label>
                            <Input
                              type="date"
                              value={deliveryForm.scheduledDate}
                              onChange={(e) => setDeliveryForm(prev => ({ ...prev, scheduledDate: e.target.value }))}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-gray-700 dark:text-gray-300">Horario</Label>
                            <Select value={deliveryForm.scheduledTimeSlot} onValueChange={(value) => setDeliveryForm(prev => ({ ...prev, scheduledTimeSlot: value }))}>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar horario" />
                              </SelectTrigger>
                              <SelectContent>
                                {timeSlots.map(slot => (
                                  <SelectItem key={slot.id} value={slot.id}>
                                    {slot.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-gray-700 dark:text-gray-300">Conductor</Label>
                            <Select value={deliveryForm.assignedDriverId} onValueChange={(value) => setDeliveryForm(prev => ({ ...prev, assignedDriverId: value }))}>
                              <SelectTrigger>
                                <SelectValue placeholder="Asignar conductor" />
                              </SelectTrigger>
                              <SelectContent>
                                {drivers.map(driver => (
                                  <SelectItem key={driver.id} value={driver.id}>
                                    {driver.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-gray-700 dark:text-gray-300">Dirección de Entrega *</Label>
                          <Textarea
                            value={deliveryForm.deliveryAddress}
                            onChange={(e) => setDeliveryForm(prev => ({ ...prev, deliveryAddress: e.target.value }))}
                            placeholder="Dirección completa de entrega"
                            rows={2}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-gray-700 dark:text-gray-300">Instrucciones Especiales</Label>
                          <Textarea
                            value={deliveryForm.deliveryInstructions}
                            onChange={(e) => setDeliveryForm(prev => ({ ...prev, deliveryInstructions: e.target.value }))}
                            placeholder="Instrucciones adicionales para la entrega"
                            rows={2}
                          />
                        </div>

                        {/* Add Items */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">Agregar Productos</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                              <div className="space-y-2">
                                <Label className="text-gray-700 dark:text-gray-300">Producto</Label>
                                <Select 
                                  value={currentItem.productId} 
                                  onValueChange={(value) => setCurrentItem(prev => ({ ...prev, productId: value }))}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar producto" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {products.map(product => (
                                      <SelectItem key={product.id} value={product.id}>
                                        {product.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label className="text-gray-700 dark:text-gray-300">Cantidad</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  value={currentItem.quantity}
                                  onChange={(e) => setCurrentItem(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label className="text-gray-700 dark:text-gray-300">Acción</Label>
                                <Button onClick={addItemToDelivery} className="w-full">
                                  <Plus className="h-4 w-4 mr-2" />
                                  Agregar
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Items List */}
                        {deliveryForm.items.length > 0 && (
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-base">Productos para Entrega</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                {deliveryForm.items.map((item, index) => (
                                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <div className="flex-1">
                                      <div className="font-medium">{item.productName}</div>
                                      <div className="text-sm text-gray-600 dark:text-gray-400">
                                        Cantidad: {item.quantity}
                                      </div>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeItemFromDelivery(index)}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* Additional Details */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-gray-700 dark:text-gray-300">Costo de Entrega</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={deliveryForm.deliveryFee}
                              onChange={(e) => setDeliveryForm(prev => ({ ...prev, deliveryFee: parseFloat(e.target.value) || 0 }))}
                              placeholder="0.00"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-gray-700 dark:text-gray-300">Prioridad</Label>
                            <Select value={deliveryForm.priority} onValueChange={(value: 'low' | 'medium' | 'high' | 'urgent') => setDeliveryForm(prev => ({ ...prev, priority: value }))}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">Baja</SelectItem>
                                <SelectItem value="medium">Media</SelectItem>
                                <SelectItem value="high">Alta</SelectItem>
                                <SelectItem value="urgent">Urgente</SelectItem>
                              </SelectContent>
                            </Select>
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
                            onClick={handleCreateDelivery}
                            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                          >
                            Programar Entrega
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Deliveries List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Entregas para {selectedDate.toLocaleDateString()}
              <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                {filteredDeliveries.length} entregas
              </Badge>
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto"></div>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Cargando entregas...</p>
              </div>
            ) : filteredDeliveries.length === 0 ? (
              <div className="text-center py-8">
                <Truck className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400">No hay entregas programadas para esta fecha</p>
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {filteredDeliveries.map((delivery) => (
                    <motion.div
                      key={delivery.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border hover:border-cyan-400/50 transition-all"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                            <Truck className="h-6 w-6 text-green-600" />
                          </div>
                          
                          <div>
                            <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-lg">
                              {delivery.deliveryNumber}
                            </h3>
                            <div className="flex items-center gap-3 mt-1">
                              <Badge className={getStatusColor(delivery.status)}>
                                {getStatusIcon(delivery.status)}
                                <span className="ml-1">{getStatusLabel(delivery.status)}</span>
                              </Badge>
                              <Badge className={getPriorityColor(delivery.priority)}>
                                {delivery.priority === 'urgent' && <AlertTriangle className="h-3 w-3 mr-1" />}
                                {delivery.priority.charAt(0).toUpperCase() + delivery.priority.slice(1)}
                              </Badge>
                              {delivery.customer && (
                                <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 text-sm">
                                  <User className="h-3 w-3" />
                                  <span>{delivery.customer.name}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {delivery.status === 'scheduled' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStartDelivery(delivery)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Truck className="h-4 w-4" />
                            </Button>
                          )}
                          {delivery.status === 'in_transit' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedDelivery(delivery);
                                setIsCompleteDialogOpen(true);
                              }}
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditDelivery(delivery)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteDelivery(delivery)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <MapPin className="h-4 w-4" />
                          <span className="text-sm truncate">{delivery.deliveryAddress}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Clock className="h-4 w-4" />
                          <span className="text-sm">
                            {delivery.scheduledTimeSlot || 'Sin horario específico'}
                          </span>
                        </div>
                        
                        <div className="text-gray-600 dark:text-gray-400 text-sm">
                          {delivery.items.length} productos
                        </div>
                        
                        {delivery.assignedDriver && (
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <User className="h-4 w-4" />
                            <span className="text-sm">{delivery.assignedDriver.name}</span>
                          </div>
                        )}
                      </div>

                      {delivery.deliveryInstructions && (
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                          <strong>Instrucciones:</strong> {delivery.deliveryInstructions}
                        </p>
                      )}

                      {/* Items Preview */}
                      <div className="bg-white dark:bg-gray-900/50 rounded-lg p-3">
                        <div className="space-y-2">
                          {delivery.items.slice(0, 3).map((item, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span>{item.productName}</span>
                              <span>Cantidad: {item.quantity}</span>
                            </div>
                          ))}
                          {delivery.items.length > 3 && (
                            <div className="text-gray-500 text-xs">
                              +{delivery.items.length - 3} productos más
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Complete Delivery Dialog */}
      <Dialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-gray-800 dark:text-gray-200">
              Completar Entrega - {selectedDelivery?.deliveryNumber}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300">Nombre de quien recibe</Label>
              <Input
                value={deliveryProof.recipientName}
                onChange={(e) => setDeliveryProof(prev => ({ ...prev, recipientName: e.target.value }))}
                placeholder="Nombre completo"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300">Firma Digital</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Funcionalidad de firma digital próximamente
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300">Foto de Entrega</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Funcionalidad de cámara próximamente
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300">Notas de Entrega</Label>
              <Textarea
                value={deliveryProof.notes}
                onChange={(e) => setDeliveryProof(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Observaciones sobre la entrega"
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsCompleteDialogOpen(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCompleteDelivery}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              >
                Completar Entrega
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}