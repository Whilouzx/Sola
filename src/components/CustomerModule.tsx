/**
 * FLOWI ADMIN - MÓDULO COMPLETO DE CLIENTES (VERSIÓN EXACTA - RESPONSIVE)
 * 
 * Módulo autocontenido idéntico al proyecto original con mejoras responsive
 * Incluye: Interfaz exacta, estilos Flowi, componentes UI, funcionalidades completas
 * 
 * INSTALACIÓN:
 * 1. Copiar este archivo a src/components/CustomerModule.tsx
 * 2. Importar: import { CustomerModule } from './components/CustomerModule'
 * 3. Usar: <CustomerModule />
 * 
 * DEPENDENCIAS REQUERIDAS:
 * - @supabase/supabase-js
 * - lucide-react
 * - framer-motion
 * - sonner
 * - tailwindcss
 * - @radix-ui/react-*
 * 
 * CONFIGURACIÓN SUPABASE:
 * Ejecutar este SQL en tu base de datos:
 * 
 * CREATE TABLE IF NOT EXISTS customers (
 *   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
 *   name VARCHAR(255) NOT NULL,
 *   email VARCHAR(255),
 *   phone VARCHAR(50),
 *   sector VARCHAR(255),
 *   credit_limit DECIMAL(10,2) DEFAULT 0,
 *   payment_terms INTEGER DEFAULT 30,
 *   marketing_source VARCHAR(50),
 *   campaign_id VARCHAR(255),
 *   referral_code VARCHAR(255),
 *   total_points INTEGER DEFAULT 0,
 *   customer_level VARCHAR(20) DEFAULT 'bronze',
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
 *   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
 * );
 */

import React, { useState, useEffect, createContext, useContext } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { motion } from 'framer-motion';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Calendar,
  Star,
  Trophy,
  Activity,
  TrendingUp,
  Search,
  X,
  Save,
  AlertCircle,
  CheckCircle,
  Loader2,
  UserPlus,
  ChevronDown,
  MoreVertical
} from 'lucide-react';

// ==================== TIPOS Y INTERFACES EXACTAS ====================

// Marketing types
export type MarketingSource = 
  | 'organic' 
  | 'google_ads' 
  | 'facebook' 
  | 'instagram' 
  | 'referral' 
  | 'email' 
  | 'direct';

// Customer interfaces
export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  sector?: string;
  creditLimit: number;
  paymentTerms: number;
  marketingSource?: MarketingSource;
  campaignId?: string;
  referralCode?: string;
  totalPoints?: number;
  customerLevel?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerData {
  name: string;
  email: string;
  phone: string;
  sector: string;
  creditLimit: number;
  paymentTerms: number;
  marketingSource?: MarketingSource;
  campaignId?: string;
  referralCode?: string;
}

interface EnhancedCustomerData extends CustomerData {
  marketingSource?: MarketingSource;
  campaignId?: string;
  referralCode?: string;
}

// ==================== CONFIGURACIÓN SUPABASE ====================

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabase: SupabaseClient;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

// ==================== UTILIDADES ====================

// Format currency function
export const formatCurrency = (amount: number, currency: 'USD' | 'VES' = 'USD'): string => {
  const formatter = new Intl.NumberFormat('es-VE', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  return formatter.format(amount);
};

// Customer points utilities
export const formatPoints = (points: number): string => {
  if (points >= 1000000) {
    return `${(points / 1000000).toFixed(1)}M`;
  } else if (points >= 1000) {
    return `${(points / 1000).toFixed(1)}K`;
  }
  return points.toString();
};

export const getLevelConfig = (level: string) => {
  const configs = {
    bronze: {
      level: 'Bronce',
      icon: '🥉',
      color: 'bg-amber-100 text-amber-700 border-amber-200',
      minPoints: 0
    },
    silver: {
      level: 'Plata',
      icon: '🥈',
      color: 'bg-gray-100 text-gray-700 border-gray-200',
      minPoints: 1000
    },
    gold: {
      level: 'Oro',
      icon: '🥇',
      color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      minPoints: 5000
    },
    platinum: {
      level: 'Platino',
      icon: '💎',
      color: 'bg-purple-100 text-purple-700 border-purple-200',
      minPoints: 10000
    }
  };
  
  return configs[level as keyof typeof configs] || configs.bronze;
};

// Toast utility (simplified)
const toast = {
  success: (message: string) => console.log('✅', message),
  error: (message: string) => console.error('❌', message),
  info: (message: string) => console.log('ℹ️', message)
};

// ==================== COMPONENTES UI EXACTOS ====================

// FuturisticCard Component (exact replica)
interface FuturisticCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'glass' | 'gradient';
}

const FuturisticCard: React.FC<FuturisticCardProps> = ({ 
  children, 
  className = '', 
  variant = 'default' 
}) => {
  const baseClasses = 'rounded-xl border backdrop-blur-sm transition-all duration-300';
  
  const variants = {
    default: 'bg-white/80 border-gray-200/50 shadow-lg hover:shadow-xl',
    glass: 'bg-white/10 border-white/20 shadow-2xl backdrop-blur-md',
    gradient: 'bg-gradient-to-br from-orange-50/80 to-red-50/80 border-orange-200/50 shadow-lg'
  };

  return (
    <div className={`${baseClasses} ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
};

// Button Component (exact replica)
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  className = '', 
  variant = 'default', 
  size = 'default',
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
  
  const variants = {
    default: 'bg-orange-500 text-white hover:bg-orange-600 shadow-md',
    destructive: 'bg-red-500 text-white hover:bg-red-600 shadow-md',
    outline: 'border border-orange-200 bg-white hover:bg-orange-50 hover:text-orange-600 text-orange-600',
    secondary: 'bg-orange-100 text-orange-700 hover:bg-orange-200 shadow-sm',
    ghost: 'hover:bg-orange-50 hover:text-orange-600 text-gray-600',
    link: 'text-orange-600 underline-offset-4 hover:underline'
  };

  const sizes = {
    default: 'h-10 px-4 py-2',
    sm: 'h-9 rounded-md px-3',
    lg: 'h-11 rounded-md px-8',
    icon: 'h-10 w-10'
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

// Input Component (exact replica)
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input: React.FC<InputProps> = ({ className = '', ...props }) => {
  return (
    <input
      className={`flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 form-input ${className}`}
      {...props}
    />
  );
};

// Label Component
interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

const Label: React.FC<LabelProps> = ({ className = '', ...props }) => {
  return (
    <label
      className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}
      {...props}
    />
  );
};

// Badge Component (exact replica)
interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

const Badge: React.FC<BadgeProps> = ({ 
  children, 
  className = '', 
  variant = 'default' 
}) => {
  const baseClasses = 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';
  
  const variants = {
    default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
    secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
    destructive: 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
    outline: 'text-foreground'
  };

  return (
    <div className={`${baseClasses} ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
};

// Dialog Components (exact replica)
interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={() => onOpenChange(false)} 
      />
      <div className="relative z-50 w-full max-w-lg">
        {children}
      </div>
    </div>
  );
};

const DialogTrigger: React.FC<{ asChild?: boolean; children: React.ReactNode }> = ({ 
  children 
}) => {
  return <>{children}</>;
};

const DialogContent: React.FC<{ 
  className?: string; 
  children: React.ReactNode 
}> = ({ className = '', children }) => {
  return (
    <div className={`grid w-full gap-4 border bg-background p-4 sm:p-6 shadow-lg duration-200 rounded-lg max-h-[90vh] overflow-y-auto ${className}`}>
      {children}
    </div>
  );
};

const DialogHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex flex-col space-y-1.5 text-center sm:text-left">
      {children}
    </div>
  );
};

const DialogTitle: React.FC<{ className?: string; children: React.ReactNode }> = ({ 
  className = '', 
  children 
}) => {
  return (
    <h3 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>
      {children}
    </h3>
  );
};

// Mobile Action Menu Component
interface MobileActionMenuProps {
  customer: Customer;
  onEdit: () => void;
  onDelete: () => void;
  onViewActivity: () => void;
}

const MobileActionMenu: React.FC<MobileActionMenuProps> = ({ 
  customer, 
  onEdit, 
  onDelete, 
  onViewActivity 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
      >
        <MoreVertical className="h-4 w-4" />
      </Button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-8 z-20 w-48 rounded-md border bg-white shadow-lg">
            <div className="py-1">
              <button
                onClick={() => {
                  onViewActivity();
                  setIsOpen(false);
                }}
                className="flex w-full items-center px-4 py-2 text-sm text-green-600 hover:bg-green-50"
              >
                <Activity className="mr-2 h-4 w-4" />
                Ver actividad
              </button>
              <button
                onClick={() => {
                  onEdit();
                  setIsOpen(false);
                }}
                className="flex w-full items-center px-4 py-2 text-sm text-blue-600 hover:bg-blue-50"
              >
                <Edit className="mr-2 h-4 w-4" />
                Editar cliente
              </button>
              <button
                onClick={() => {
                  onDelete();
                  setIsOpen(false);
                }}
                className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar cliente
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ==================== FUNCIONES DE NEGOCIO EXACTAS ====================

// Customer validation
export const validateCustomerData = (data: CustomerData): string[] => {
  const errors: string[] = [];
  
  if (!data.name || data.name.trim().length === 0) {
    errors.push('El nombre es requerido');
  }
  
  if (!data.phone || data.phone.trim().length === 0) {
    errors.push('El teléfono es requerido');
  }
  
  if (data.email && data.email.trim().length > 0) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      errors.push('El email no tiene un formato válido');
    }
  }
  
  if (data.creditLimit < 0) {
    errors.push('El límite de crédito no puede ser negativo');
  }
  
  if (data.paymentTerms < 1) {
    errors.push('Los términos de pago deben ser al menos 1 día');
  }
  
  return errors;
};

// Customer CRUD operations
export const createCustomer = async (customerData: CustomerData): Promise<Customer> => {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }

  const newCustomer = {
    ...customerData,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    totalPoints: 0,
    customerLevel: 'bronze'
  };

  const { data, error } = await supabase
    .from('customers')
    .insert([{
      id: newCustomer.id,
      name: newCustomer.name,
      email: newCustomer.email || null,
      phone: newCustomer.phone || null,
      sector: newCustomer.sector || null,
      credit_limit: newCustomer.creditLimit,
      payment_terms: newCustomer.paymentTerms,
      marketing_source: newCustomer.marketingSource || null,
      campaign_id: newCustomer.campaignId || null,
      referral_code: newCustomer.referralCode || null,
      total_points: newCustomer.totalPoints,
      customer_level: newCustomer.customerLevel,
      created_at: newCustomer.createdAt,
      updated_at: newCustomer.updatedAt
    }])
    .select()
    .single();

  if (error) throw error;
  
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    phone: data.phone,
    sector: data.sector,
    creditLimit: data.credit_limit,
    paymentTerms: data.payment_terms,
    marketingSource: data.marketing_source,
    campaignId: data.campaign_id,
    referralCode: data.referral_code,
    totalPoints: data.total_points,
    customerLevel: data.customer_level,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
};

export const getCustomers = async (): Promise<Customer[]> => {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map(item => ({
    id: item.id,
    name: item.name,
    email: item.email,
    phone: item.phone,
    sector: item.sector,
    creditLimit: item.credit_limit || 0,
    paymentTerms: item.payment_terms || 30,
    marketingSource: item.marketing_source,
    campaignId: item.campaign_id,
    referralCode: item.referral_code,
    totalPoints: item.total_points || 0,
    customerLevel: item.customer_level || 'bronze',
    createdAt: item.created_at,
    updatedAt: item.updated_at
  }));
};

export const updateCustomer = async (id: string, customerData: CustomerData): Promise<Customer> => {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }

  const { data, error } = await supabase
    .from('customers')
    .update({
      name: customerData.name,
      email: customerData.email || null,
      phone: customerData.phone || null,
      sector: customerData.sector || null,
      credit_limit: customerData.creditLimit,
      payment_terms: customerData.paymentTerms,
      marketing_source: customerData.marketingSource || null,
      campaign_id: customerData.campaignId || null,
      referral_code: customerData.referralCode || null,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    name: data.name,
    email: data.email,
    phone: data.phone,
    sector: data.sector,
    creditLimit: data.credit_limit,
    paymentTerms: data.payment_terms,
    marketingSource: data.marketing_source,
    campaignId: data.campaign_id,
    referralCode: data.referral_code,
    totalPoints: data.total_points,
    customerLevel: data.customer_level,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
};

export const deleteCustomer = async (id: string): Promise<void> => {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }

  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const searchCustomers = async (searchTerm: string): Promise<Customer[]> => {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,sector.ilike.%${searchTerm}%`)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map(item => ({
    id: item.id,
    name: item.name,
    email: item.email,
    phone: item.phone,
    sector: item.sector,
    creditLimit: item.credit_limit || 0,
    paymentTerms: item.payment_terms || 30,
    marketingSource: item.marketing_source,
    campaignId: item.campaign_id,
    referralCode: item.referral_code,
    totalPoints: item.total_points || 0,
    customerLevel: item.customer_level || 'bronze',
    createdAt: item.created_at,
    updatedAt: item.updated_at
  }));
};

// ==================== COMPONENTE PRINCIPAL EXACTO ====================

// Marketing source options (exact replica)
const marketingSourceOptions: { value: MarketingSource; label: string }[] = [
  { value: 'organic', label: 'Orgánico' },
  { value: 'google_ads', label: 'Google Ads' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'referral', label: 'Referencia' },
  { value: 'email', label: 'Email Marketing' },
  { value: 'direct', label: 'Directo' }
];

export const CustomerModule: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<EnhancedCustomerData>({
    name: '',
    email: '',
    phone: '',
    sector: '',
    creditLimit: 0,
    paymentTerms: 30,
    marketingSource: 'organic',
    campaignId: '',
    referralCode: ''
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await getCustomers();
      setCustomers(data);
    } catch (error) {
      toast.error('Error cargando clientes');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadCustomers();
      return;
    }

    try {
      setLoading(true);
      const data = await searchCustomers(searchTerm);
      setCustomers(data);
    } catch (error) {
      toast.error('Error buscando clientes');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      sector: '',
      creditLimit: 0,
      paymentTerms: 30,
      marketingSource: 'organic',
      campaignId: '',
      referralCode: ''
    });
    setSelectedCustomer(null);
  };

  const handleCreate = async () => {
    // Validate form data
    const errors = validateCustomerData(formData);
    if (errors.length > 0) {
      toast.error(errors[0]);
      return;
    }

    try {
      await createCustomer(formData);
      toast.success('Cliente creado exitosamente');
      setIsCreateDialogOpen(false);
      resetForm();
      loadCustomers();
    } catch (error) {
      toast.error('Error creando cliente');
      console.error(error);
    }
  };

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      sector: customer.sector || '',
      creditLimit: customer.creditLimit,
      paymentTerms: customer.paymentTerms,
      marketingSource: (customer as any).marketingSource || 'organic',
      campaignId: (customer as any).campaignId || '',
      referralCode: (customer as any).referralCode || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedCustomer) return;

    // Validate form data
    const errors = validateCustomerData(formData);
    if (errors.length > 0) {
      toast.error(errors[0]);
      return;
    }

    try {
      await updateCustomer(selectedCustomer.id, formData);
      toast.success('Cliente actualizado exitosamente');
      setIsEditDialogOpen(false);
      resetForm();
      loadCustomers();
    } catch (error) {
      toast.error('Error actualizando cliente');
      console.error(error);
    }
  };

  const handleDelete = async (customer: Customer) => {
    if (!confirm(`¿Está seguro de eliminar el cliente "${customer.name}"?`)) {
      return;
    }

    try {
      await deleteCustomer(customer.id);
      toast.success('Cliente eliminado exitosamente');
      loadCustomers();
    } catch (error) {
      toast.error('Error eliminando cliente');
      console.error(error);
    }
  };

  const viewCustomerActivity = (customerId: string) => {
    // Navigate to customer activity (placeholder)
    console.log('Navigate to customer activity:', customerId);
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm) ||
    customer.sector?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate stats
  const totalCustomers = customers.length;
  const totalPoints = customers.reduce((sum, c) => sum + ((c as any).totalPoints || 0), 0);
  const averagePoints = totalCustomers > 0 ? Math.round(totalPoints / totalCustomers) : 0;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header - Responsive */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#EA580CFF]">
            Clientes
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 sm:mt-2 text-sm sm:text-base">
            Gestiona tu base de clientes, puntos y actividad
          </p>
        </div>

        <div className="flex flex-wrap gap-2 sm:gap-3">
          <Badge className="bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800 px-2 sm:px-3 py-1 text-xs">
            <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            {totalCustomers} clientes
          </Badge>
          <Badge className="bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800 px-2 sm:px-3 py-1 text-xs">
            <Star className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            {formatPoints(averagePoints)} promedio
          </Badge>
        </div>
      </motion.div>

      {/* Search and Actions - Responsive */}
      <FuturisticCard variant="glass" className="p-4 sm:p-6 light-card">
        <div className="flex flex-col gap-4">
          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                placeholder="Buscar clientes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="form-input text-sm sm:text-base"
              />
            </div>
            <Button
              onClick={handleSearch}
              variant="outline"
              className="shrink-0 px-3 sm:px-4"
            >
              <Search className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Buscar</span>
            </Button>
          </div>

          {/* New Customer Button */}
          <Button 
            onClick={() => setIsCreateDialogOpen(true)}
            className="flowi-gradient text-white hover:opacity-90 shadow-lg w-full sm:w-auto"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Nuevo Cliente
          </Button>
        </div>
      </FuturisticCard>

      {/* Customers List - Responsive */}
      <FuturisticCard variant="glass" className="p-4 sm:p-6 light-card">
        <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 sm:mb-6">Lista de Clientes</h2>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm sm:text-base">Cargando clientes...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">No se encontraron clientes</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filteredCustomers.map((customer) => {
              const enhancedCustomer = customer as any;
              const totalPoints = enhancedCustomer.totalPoints || 0;
              const customerLevel = enhancedCustomer.customerLevel || 'bronze';
              const levelConfig = getLevelConfig(customerLevel);

              return (
                <motion.div
                  key={customer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 sm:p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border hover:border-orange-300 transition-all"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <h3 className="font-medium text-gray-800 dark:text-gray-200 text-sm sm:text-base truncate">
                        {customer.name}
                      </h3>
                      <Badge className={levelConfig.color + ' text-xs flex-shrink-0'}>
                        <span className="mr-1">{levelConfig.icon}</span>
                        <span className="hidden sm:inline">{levelConfig.level}</span>
                      </Badge>
                    </div>
                    
                    {/* Desktop Actions */}
                    <div className="hidden sm:flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => viewCustomerActivity(customer.id)}
                        className="h-9 w-9 p-0 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20"
                        title="Ver actividad"
                      >
                        <Activity className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(customer)}
                        className="h-9 w-9 p-0 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        title="Editar cliente"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(customer)}
                        className="h-9 w-9 p-0 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="Eliminar cliente"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Mobile Actions */}
                    <div className="sm:hidden">
                      <MobileActionMenu
                        customer={customer}
                        onEdit={() => handleEdit(customer)}
                        onDelete={() => handleDelete(customer)}
                        onViewActivity={() => viewCustomerActivity(customer.id)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 text-xs sm:text-sm">
                    {customer.email && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Mail className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{customer.email}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Phone className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{customer.phone}</span>
                    </div>
                    
                    {customer.sector && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{customer.sector}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-green-600">
                      <CreditCard className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">Límite: {formatCurrency(customer.creditLimit, 'USD')}</span>
                    </div>

                    <div className="flex items-center gap-2 text-blue-600">
                      <Calendar className="h-3 w-3 flex-shrink-0" />
                      <span>{customer.paymentTerms} días</span>
                    </div>

                    {totalPoints > 0 && (
                      <div className="flex items-center gap-2 text-orange-600">
                        <Star className="h-3 w-3 flex-shrink-0" />
                        <span>{formatPoints(totalPoints)}</span>
                      </div>
                    )}

                    {enhancedCustomer.marketingSource && (
                      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                        <Badge variant="outline" className="text-xs">
                          {marketingSourceOptions.find(opt => opt.value === enhancedCustomer.marketingSource)?.label}
                        </Badge>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </FuturisticCard>

      {/* Create Dialog - Responsive */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="glass-card border-white/20 light-card">
          <DialogHeader>
            <DialogTitle className="text-gray-800 dark:text-gray-200">Crear Cliente</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300">Nombre *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nombre del cliente"
                className="form-input"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300">Email (opcional)</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@ejemplo.com"
                className="form-input"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300">Teléfono *</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+58-XXX-XXX-XXXX"
                className="form-input"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300">Sector</Label>
              <Input
                value={formData.sector}
                onChange={(e) => setFormData(prev => ({ ...prev, sector: e.target.value }))}
                placeholder="Ej: Centro, Este, Oeste, Norte, Sur"
                className="form-input"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700 dark:text-gray-300">Límite de Crédito (USD) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.creditLimit}
                  onChange={(e) => setFormData(prev => ({ ...prev, creditLimit: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                  className="form-input"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700 dark:text-gray-300">Términos de Pago (días) *</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.paymentTerms}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentTerms: parseInt(e.target.value) || 30 }))}
                  placeholder="30"
                  className="form-input"
                />
              </div>
            </div>

            {/* Marketing Fields */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Información de Marketing
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-700 dark:text-gray-300">Fuente de Marketing</Label>
                  <select 
                    value={formData.marketingSource} 
                    onChange={(e) => setFormData(prev => ({ ...prev, marketingSource: e.target.value as MarketingSource }))}
                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 form-input"
                  >
                    {marketingSourceOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700 dark:text-gray-300">ID de Campaña (opcional)</Label>
                  <Input
                    value={formData.campaignId}
                    onChange={(e) => setFormData(prev => ({ ...prev, campaignId: e.target.value }))}
                    placeholder="Ej: SUMMER2024, FB-001"
                    className="form-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700 dark:text-gray-300">Código de Referencia (opcional)</Label>
                  <Input
                    value={formData.referralCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, referralCode: e.target.value }))}
                    placeholder="Código del cliente que refirió"
                    className="form-input"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  resetForm();
                }}
                className="flex-1 border-gray-300 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreate}
                className="flex-1 flowi-gradient text-white hover:opacity-90"
              >
                Crear Cliente
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog - Similar to Create Dialog but Responsive */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="glass-card border-white/20 light-card">
          <DialogHeader>
            <DialogTitle className="text-gray-800 dark:text-gray-200">Editar Cliente</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300">Nombre *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nombre del cliente"
                className="form-input"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300">Email (opcional)</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@ejemplo.com"
                className="form-input"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300">Teléfono *</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+58-XXX-XXX-XXXX"
                className="form-input"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300">Sector</Label>
              <Input
                value={formData.sector}
                onChange={(e) => setFormData(prev => ({ ...prev, sector: e.target.value }))}
                placeholder="Ej: Centro, Este, Oeste, Norte, Sur"
                className="form-input"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700 dark:text-gray-300">Límite de Crédito (USD) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.creditLimit}
                  onChange={(e) => setFormData(prev => ({ ...prev, creditLimit: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                  className="form-input"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700 dark:text-gray-300">Términos de Pago (días) *</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.paymentTerms}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentTerms: parseInt(e.target.value) || 30 }))}
                  placeholder="30"
                  className="form-input"
                />
              </div>
            </div>

            {/* Marketing Fields */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Información de Marketing
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-700 dark:text-gray-300">Fuente de Marketing</Label>
                  <select 
                    value={formData.marketingSource} 
                    onChange={(e) => setFormData(prev => ({ ...prev, marketingSource: e.target.value as MarketingSource }))}
                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 form-input"
                  >
                    {marketingSourceOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700 dark:text-gray-300">ID de Campaña (opcional)</Label>
                  <Input
                    value={formData.campaignId}
                    onChange={(e) => setFormData(prev => ({ ...prev, campaignId: e.target.value }))}
                    placeholder="Ej: SUMMER2024, FB-001"
                    className="form-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700 dark:text-gray-300">Código de Referencia (opcional)</Label>
                  <Input
                    value={formData.referralCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, referralCode: e.target.value }))}
                    placeholder="Código del cliente que refirió"
                    className="form-input"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  resetForm();
                }}
                className="flex-1 border-gray-300 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUpdate}
                className="flex-1 flowi-gradient text-white hover:opacity-90"
              >
                Actualizar Cliente
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerModule;