import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useSupabase } from '@/context/SupabaseContext';
import { FuturisticCard } from '@/components/ui/futuristic-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  TrendingUp, 
  Mail, 
  MessageSquare, 
  Target, 
  Calendar,
  Filter,
  Star,
  ShoppingBag,
  DollarSign,
  Send,
  UserPlus,
  BarChart3,
  Heart,
  Gift,
  Smartphone,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  TrendingDown,
  Zap,
  Activity
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface CustomerAnalytics {
  customerId: string;
  totalSpent: number;
  totalOrders: number;
  avgOrderValue: number;
  lastPurchase: Date | null;
  daysSinceLastPurchase: number | null;
  firstPurchase: Date | null;
  segment: 'vip' | 'loyal' | 'active' | 'inactive' | 'prospect' | 'new';
  lifetimeValue: number;
  purchaseFrequency: number;
}

interface SMSCampaign {
  id: string;
  name: string;
  message: string;
  targetSegments: string[];
  status: 'draft' | 'sending' | 'completed' | 'failed';
  recipientCount: number;
  sentCount: number;
  deliveredCount: number;
  failedCount: number;
  createdAt: string;
  sentAt?: string;
}

export default function Marketing() {
  const { state } = useSupabase();
  const [searchTerm, setSearchTerm] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('all');
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [promotionMessage, setPromotionMessage] = useState('');
  const [activeTab, setActiveTab] = useState('customers');
  const [campaigns, setCampaigns] = useState<SMSCampaign[]>([]);
  const [isCreateCampaignOpen, setIsCreateCampaignOpen] = useState(false);
  
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    message: '',
    targetSegments: [] as string[],
    scheduledAt: ''
  });

  // Enhanced customer analytics with purchase history
  const customerAnalytics = useMemo(() => {
    const customers = state.customers || [];
    const sales = state.sales || [];

    return customers.map(customer => {
      const customerSales = sales.filter(sale => sale.customerId === customer.id);
      const totalSpent = customerSales.reduce((sum, sale) => sum + sale.totalUSD, 0);
      const totalOrders = customerSales.length;
      const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
      
      const lastPurchase = customerSales.length > 0 
        ? new Date(Math.max(...customerSales.map(sale => new Date(sale.createdAt).getTime())))
        : null;
      
      const firstPurchase = customerSales.length > 0 
        ? new Date(Math.min(...customerSales.map(sale => new Date(sale.createdAt).getTime())))
        : null;
      
      const daysSinceLastPurchase = lastPurchase 
        ? Math.floor((new Date().getTime() - lastPurchase.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      // Calculate purchase frequency (purchases per month)
      const daysSinceFirst = firstPurchase 
        ? Math.floor((new Date().getTime() - firstPurchase.getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      const monthsSinceFirst = Math.max(daysSinceFirst / 30, 1);
      const purchaseFrequency = totalOrders / monthsSinceFirst;

      // Enhanced customer segmentation
      let segment: CustomerAnalytics['segment'] = 'new';
      if (totalOrders === 0) {
        segment = 'prospect';
      } else if (totalOrders >= 15 && totalSpent >= 2000) {
        segment = 'vip';
      } else if (totalOrders >= 8 && totalSpent >= 800) {
        segment = 'loyal';
      } else if (daysSinceLastPurchase && daysSinceLastPurchase > 120) {
        segment = 'inactive';
      } else if (totalOrders >= 3) {
        segment = 'active';
      } else {
        segment = 'new';
      }

      // Calculate lifetime value (CLV) - simple prediction
      const lifetimeValue = avgOrderValue * purchaseFrequency * 12; // Annual prediction

      return {
        ...customer,
        totalSpent,
        totalOrders,
        avgOrderValue,
        lastPurchase,
        daysSinceLastPurchase,
        firstPurchase,
        segment,
        lifetimeValue,
        purchaseFrequency,
        analytics: {
          customerId: customer.id,
          totalSpent,
          totalOrders,
          avgOrderValue,
          lastPurchase,
          daysSinceLastPurchase,
          firstPurchase,
          segment,
          lifetimeValue,
          purchaseFrequency
        } as CustomerAnalytics
      };
    });
  }, [state.customers, state.sales]);

  // Filter customers based on search and segment
  const filteredCustomers = useMemo(() => {
    return customerAnalytics.filter(customer => {
      const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (customer.phone && customer.phone.includes(searchTerm));
      const matchesSegment = segmentFilter === 'all' || customer.segment === segmentFilter;
      return matchesSearch && matchesSegment;
    });
  }, [customerAnalytics, searchTerm, segmentFilter]);

  // Enhanced segment statistics
  const segmentStats = useMemo(() => {
    const stats = {
      total: customerAnalytics.length,
      vip: customerAnalytics.filter(c => c.segment === 'vip').length,
      loyal: customerAnalytics.filter(c => c.segment === 'loyal').length,
      active: customerAnalytics.filter(c => c.segment === 'active').length,
      inactive: customerAnalytics.filter(c => c.segment === 'inactive').length,
      prospect: customerAnalytics.filter(c => c.segment === 'prospect').length,
      new: customerAnalytics.filter(c => c.segment === 'new').length,
    };

    // Calculate revenue by segment
    const revenueBySegment = {
      vip: customerAnalytics.filter(c => c.segment === 'vip').reduce((sum, c) => sum + c.totalSpent, 0),
      loyal: customerAnalytics.filter(c => c.segment === 'loyal').reduce((sum, c) => sum + c.totalSpent, 0),
      active: customerAnalytics.filter(c => c.segment === 'active').reduce((sum, c) => sum + c.totalSpent, 0),
      inactive: customerAnalytics.filter(c => c.segment === 'inactive').reduce((sum, c) => sum + c.totalSpent, 0),
    };

    return { ...stats, revenueBySegment };
  }, [customerAnalytics]);

  const getSegmentColor = (segment: string) => {
    switch (segment) {
      case 'vip': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'loyal': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'active': return 'bg-green-100 text-green-700 border-green-200';
      case 'inactive': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'prospect': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'new': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getSegmentIcon = (segment: string) => {
    switch (segment) {
      case 'vip': return Star;
      case 'loyal': return Heart;
      case 'active': return TrendingUp;
      case 'inactive': return TrendingDown;
      case 'prospect': return UserPlus;
      case 'new': return Zap;
      default: return Users;
    }
  };

  const handleCustomerSelect = (customerId: string) => {
    setSelectedCustomers(prev => 
      prev.includes(customerId) 
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  const handleSelectAllInSegment = (segment: string) => {
    const segmentCustomers = filteredCustomers
      .filter(c => segment === 'all' || c.segment === segment)
      .map(c => c.id);
    setSelectedCustomers(segmentCustomers);
  };

  const handleCreateCampaign = async () => {
    if (!campaignForm.name || !campaignForm.message || selectedCustomers.length === 0) {
      toast.error('Complete todos los campos requeridos y seleccione clientes');
      return;
    }

    try {
      const newCampaign: SMSCampaign = {
        id: Date.now().toString(),
        name: campaignForm.name,
        message: campaignForm.message,
        targetSegments: campaignForm.targetSegments,
        status: 'sending',
        recipientCount: selectedCustomers.length,
        sentCount: 0,
        deliveredCount: 0,
        failedCount: 0,
        createdAt: new Date().toISOString(),
        sentAt: new Date().toISOString()
      };

      setCampaigns(prev => [newCampaign, ...prev]);
      
      // Simulate SMS sending process
      setTimeout(() => {
        setCampaigns(prev => prev.map(c => 
          c.id === newCampaign.id 
            ? { 
                ...c, 
                status: 'completed', 
                sentCount: selectedCustomers.length,
                deliveredCount: Math.floor(selectedCustomers.length * 0.95), // 95% delivery rate
                failedCount: Math.ceil(selectedCustomers.length * 0.05)
              }
            : c
        ));
      }, 3000);

      setIsCreateCampaignOpen(false);
      resetCampaignForm();
      setSelectedCustomers([]);
      toast.success(`Campaña SMS enviada a ${selectedCustomers.length} clientes`);
    } catch (error) {
      toast.error('Error enviando campaña SMS');
      console.error(error);
    }
  };

  const resetCampaignForm = () => {
    setCampaignForm({
      name: '',
      message: '',
      targetSegments: [],
      scheduledAt: ''
    });
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gradient">
            Marketing & CRM
          </h1>
          <p className="text-gray-600 mt-2">
            Gestiona clientes, segmentación automática y campañas SMS
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Dialog open={isCreateCampaignOpen} onOpenChange={setIsCreateCampaignOpen}>
            <DialogTrigger asChild>
              <Button className="flowi-button" onClick={resetCampaignForm}>
                <Smartphone className="h-4 w-4 mr-2" />
                Nueva Campaña SMS
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Crear Campaña SMS</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Nombre de la Campaña</label>
                  <Input
                    placeholder="Ej: Promoción Black Friday 2024"
                    value={campaignForm.name}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, name: e.target.value }))}
                    className="flowi-input"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Mensaje SMS ({campaignForm.message.length}/160)
                  </label>
                  <Textarea
                    placeholder="¡Oferta especial! 20% descuento en todos nuestros productos. Válido hasta el 30/11. ¡No te lo pierdas!"
                    value={campaignForm.message}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, message: e.target.value.slice(0, 160) }))}
                    className="flowi-input"
                    rows={3}
                  />
                  <p className="text-xs text-gray-500">
                    Máximo 160 caracteres para SMS estándar
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Clientes seleccionados: {selectedCustomers.length}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['all', 'vip', 'loyal', 'active', 'inactive'].map(segment => (
                      <Button
                        key={segment}
                        size="sm"
                        variant="outline"
                        onClick={() => handleSelectAllInSegment(segment)}
                        className="text-xs"
                      >
                        Seleccionar {segment === 'all' ? 'Todos' : segment.toUpperCase()}
                      </Button>
                    ))}
                  </div>
                </div>

                <Button 
                  onClick={handleCreateCampaign}
                  disabled={selectedCustomers.length === 0 || !campaignForm.name || !campaignForm.message}
                  className="flowi-button w-full"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Enviar SMS a {selectedCustomers.length} Clientes
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Enhanced Segment Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
        {[
          { key: 'total', label: 'Total', value: segmentStats.total, icon: Users, color: 'bg-gray-100 text-gray-700', revenue: null },
          { key: 'vip', label: 'VIP', value: segmentStats.vip, icon: Star, color: 'bg-purple-100 text-purple-700', revenue: segmentStats.revenueBySegment.vip },
          { key: 'loyal', label: 'Leales', value: segmentStats.loyal, icon: Heart, color: 'bg-blue-100 text-blue-700', revenue: segmentStats.revenueBySegment.loyal },
          { key: 'active', label: 'Activos', value: segmentStats.active, icon: TrendingUp, color: 'bg-green-100 text-green-700', revenue: segmentStats.revenueBySegment.active },
          { key: 'inactive', label: 'Inactivos', value: segmentStats.inactive, icon: TrendingDown, color: 'bg-gray-100 text-gray-700', revenue: segmentStats.revenueBySegment.inactive },
          { key: 'prospect', label: 'Prospectos', value: segmentStats.prospect, icon: UserPlus, color: 'bg-orange-100 text-orange-700', revenue: null },
          { key: 'new', label: 'Nuevos', value: segmentStats.new, icon: Zap, color: 'bg-yellow-100 text-yellow-700', revenue: null },
        ].map((stat, index) => (
          <motion.div
            key={stat.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <FuturisticCard variant="glass" className="p-4 flowi-card text-center cursor-pointer hover:scale-105 transition-transform"
              onClick={() => setSegmentFilter(stat.key === 'total' ? 'all' : stat.key)}
            >
              <div className={`inline-flex p-2 rounded-lg ${stat.color} mb-2`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
              <p className="text-sm text-gray-600">{stat.label}</p>
              {stat.revenue !== null && (
                <p className="text-xs text-green-600 font-medium">
                  {formatCurrency(stat.revenue)}
                </p>
              )}
            </FuturisticCard>
          </motion.div>
        ))}
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="customers">Base de Clientes</TabsTrigger>
          <TabsTrigger value="campaigns">Campañas SMS</TabsTrigger>
          <TabsTrigger value="analytics">Analíticas</TabsTrigger>
        </TabsList>

        <TabsContent value="customers" className="space-y-6">
          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <FuturisticCard variant="glass" className="p-6 flowi-card">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Input
                      placeholder="Buscar clientes por nombre, email o teléfono..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flowi-input"
                    />
                  </div>
                </div>
                <div className="w-full md:w-48">
                  <Select value={segmentFilter} onValueChange={setSegmentFilter}>
                    <SelectTrigger className="flowi-input">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filtrar por segmento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los segmentos</SelectItem>
                      <SelectItem value="vip">VIP</SelectItem>
                      <SelectItem value="loyal">Leales</SelectItem>
                      <SelectItem value="active">Activos</SelectItem>
                      <SelectItem value="inactive">Inactivos</SelectItem>
                      <SelectItem value="prospect">Prospectos</SelectItem>
                      <SelectItem value="new">Nuevos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </FuturisticCard>
          </motion.div>

          {/* Customer List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <FuturisticCard variant="glass" className="flowi-card">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                    <Users className="h-6 w-6 text-orange-500" />
                    Base de Clientes
                    <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                      {filteredCustomers.length} clientes
                    </Badge>
                  </h2>
                  
                  {selectedCustomers.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-100 text-blue-700">
                        {selectedCustomers.length} seleccionados
                      </Badge>
                      <Button
                        size="sm"
                        onClick={() => setSelectedCustomers([])}
                        variant="outline"
                      >
                        Limpiar
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-6">
                {filteredCustomers.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg">No se encontraron clientes</p>
                    <p className="text-gray-500">Ajusta los filtros o agrega nuevos clientes</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredCustomers.map((customer, index) => {
                      const SegmentIcon = getSegmentIcon(customer.segment);
                      const isSelected = selectedCustomers.includes(customer.id);
                      
                      return (
                        <motion.div
                          key={customer.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`p-4 rounded-lg border transition-all duration-200 cursor-pointer ${
                            isSelected 
                              ? 'border-orange-300 bg-orange-50' 
                              : 'border-gray-200 bg-gray-50 hover:border-orange-200 hover:bg-orange-50/50'
                          }`}
                          onClick={() => handleCustomerSelect(customer.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="flex-shrink-0">
                                <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                  {customer.name.charAt(0).toUpperCase()}
                                </div>
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-gray-800 truncate">{customer.name}</h3>
                                  <Badge className={`text-xs ${getSegmentColor(customer.segment)}`}>
                                    <SegmentIcon className="h-3 w-3 mr-1" />
                                    {customer.segment.toUpperCase()}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600 truncate">{customer.email}</p>
                                {customer.phone && (
                                  <p className="text-sm text-gray-500 flex items-center gap-1">
                                    <Smartphone className="h-3 w-3" />
                                    {customer.phone}
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-6 text-right">
                              <div>
                                <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                                  <ShoppingBag className="h-4 w-4" />
                                  {customer.totalOrders} pedidos
                                </div>
                                <div className="flex items-center gap-1 text-sm font-semibold text-orange-600">
                                  <DollarSign className="h-4 w-4" />
                                  {formatCurrency(customer.totalSpent)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  CLV: {formatCurrency(customer.lifetimeValue)}
                                </div>
                              </div>
                              
                              <div className="text-sm text-gray-500">
                                {customer.lastPurchase ? (
                                  <>
                                    <p>Última compra:</p>
                                    <p>{customer.lastPurchase.toLocaleDateString('es-ES')}</p>
                                    {customer.daysSinceLastPurchase !== null && (
                                      <p className="text-xs">
                                        Hace {customer.daysSinceLastPurchase} días
                                      </p>
                                    )}
                                  </>
                                ) : (
                                  <p>Sin compras</p>
                                )}
                              </div>
                              
                              <div className="flex flex-col gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flowi-button-outline text-xs"
                                >
                                  <Mail className="h-3 w-3 mr-1" />
                                  Email
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flowi-button-outline text-xs"
                                  disabled={!customer.phone}
                                >
                                  <MessageSquare className="h-3 w-3 mr-1" />
                                  SMS
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* Additional customer metrics */}
                          <div className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-3 gap-4 text-xs text-gray-600">
                            <div>
                              <span className="font-medium">Frecuencia:</span>
                              <br />
                              {customer.purchaseFrequency.toFixed(1)} compras/mes
                            </div>
                            <div>
                              <span className="font-medium">Ticket promedio:</span>
                              <br />
                              {formatCurrency(customer.avgOrderValue)}
                            </div>
                            <div>
                              <span className="font-medium">Cliente desde:</span>
                              <br />
                              {customer.firstPurchase?.toLocaleDateString('es-ES') || 'N/A'}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </FuturisticCard>
          </motion.div>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          <FuturisticCard variant="glass" className="p-6 flowi-card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                <Smartphone className="h-6 w-6 text-orange-500" />
                Campañas SMS
              </h2>
              <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                {campaigns.length} campañas
              </Badge>
            </div>

            {campaigns.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">No hay campañas SMS</p>
                <p className="text-gray-500">Crea tu primera campaña para comenzar</p>
              </div>
            ) : (
              <div className="space-y-4">
                {campaigns.map((campaign, index) => (
                  <motion.div
                    key={campaign.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 rounded-lg border bg-gray-50"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-800">{campaign.name}</h3>
                        <p className="text-sm text-gray-600">
                          {new Date(campaign.createdAt).toLocaleString('es-ES')}
                        </p>
                      </div>
                      
                      <Badge className={`${
                        campaign.status === 'completed' ? 'bg-green-100 text-green-700 border-green-200' :
                        campaign.status === 'sending' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                        campaign.status === 'failed' ? 'bg-red-100 text-red-700 border-red-200' :
                        'bg-gray-100 text-gray-700 border-gray-200'
                      }`}>
                        {campaign.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                        {campaign.status === 'sending' && <Clock className="h-3 w-3 mr-1" />}
                        {campaign.status === 'failed' && <XCircle className="h-3 w-3 mr-1" />}
                        {campaign.status.toUpperCase()}
                      </Badge>
                    </div>

                    <p className="text-sm text-gray-700 mb-3 p-2 bg-white rounded border">
                      {campaign.message}
                    </p>

                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <p className="font-medium text-gray-800">{campaign.recipientCount}</p>
                        <p className="text-gray-600">Destinatarios</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-blue-600">{campaign.sentCount}</p>
                        <p className="text-gray-600">Enviados</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-green-600">{campaign.deliveredCount}</p>
                        <p className="text-gray-600">Entregados</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-red-600">{campaign.failedCount}</p>
                        <p className="text-gray-600">Fallidos</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </FuturisticCard>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue by Segment */}
            <FuturisticCard variant="glass" className="p-6 flowi-card">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-orange-500" />
                Ingresos por Segmento
              </h3>
              <div className="space-y-3">
                {Object.entries(segmentStats.revenueBySegment).map(([segment, revenue]) => (
                  <div key={segment} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="font-medium capitalize">{segment}</span>
                    <span className="text-green-600 font-bold">{formatCurrency(revenue)}</span>
                  </div>
                ))}
              </div>
            </FuturisticCard>

            {/* Customer Lifecycle */}
            <FuturisticCard variant="glass" className="p-6 flowi-card">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5 text-orange-500" />
                Ciclo de Vida del Cliente
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                  <span className="font-medium">Nuevos Clientes</span>
                  <span className="text-yellow-600 font-bold">{segmentStats.new}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                  <span className="font-medium">Clientes Activos</span>
                  <span className="text-green-600 font-bold">{segmentStats.active}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                  <span className="font-medium">Clientes Leales</span>
                  <span className="text-blue-600 font-bold">{segmentStats.loyal}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-purple-50 rounded">
                  <span className="font-medium">Clientes VIP</span>
                  <span className="text-purple-600 font-bold">{segmentStats.vip}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="font-medium">Clientes Inactivos</span>
                  <span className="text-gray-600 font-bold">{segmentStats.inactive}</span>
                </div>
              </div>
            </FuturisticCard>
          </div>
        </TabsContent>
      </Tabs>

      {/* Selected Customers Summary */}
      {selectedCustomers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <FuturisticCard variant="glass" className="p-4 flowi-card shadow-flowi-lg">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-orange-500" />
                <span className="font-semibold text-gray-800">
                  {selectedCustomers.length} clientes seleccionados
                </span>
              </div>
              <Button 
                size="sm" 
                className="flowi-button"
                onClick={() => setIsCreateCampaignOpen(true)}
              >
                <Smartphone className="h-4 w-4 mr-2" />
                Enviar SMS
              </Button>
            </div>
          </FuturisticCard>
        </motion.div>
      )}
    </div>
  );
}