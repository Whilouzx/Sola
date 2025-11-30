/**
 * FLOWI ADMIN - MÓDULO COMPLETO DE PROVEEDORES (VERSIÓN RESPONSIVE)
 * 
 * Módulo autocontenido con funcionalidad completa + responsividad móvil
 * Incluye: Interfaz exacta, estilos Flowi, componentes UI, funcionalidades completas
 * 
 * INSTALACIÓN:
 * 1. Copiar este archivo a src/components/SupplierModule.tsx
 * 2. Importar: import { SupplierModule } from './components/SupplierModule'
 * 3. Usar: <SupplierModule />
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
 * CREATE TABLE IF NOT EXISTS suppliers (
 *   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
 *   name VARCHAR(255) NOT NULL,
 *   email VARCHAR(255),
 *   phone VARCHAR(50),
 *   address TEXT,
 *   payment_terms INTEGER DEFAULT 30,
 *   tax_id VARCHAR(50),
 *   bank_name VARCHAR(255),
 *   bank_account VARCHAR(100),
 *   is_active BOOLEAN DEFAULT true,
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
 *   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
 * );
 */

import React, { useState, useEffect } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { motion } from 'framer-motion';
import { 
  Truck, 
  Edit, 
  Trash2,
  Mail,
  Phone,
  MapPin,
  Building,
  Calendar,
  Hash,
  Banknote,
  Users,
  Search,
  AlertCircle,
  UserPlus
} from 'lucide-react';

// ==================== TIPOS Y INTERFACES EXACTAS ====================

// Supplier interfaces
export interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  paymentTerms: number;
  taxId?: string;
  bankName?: string;
  bankAccount?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierData {
  name: string;
  email: string;
  phone: string;
  address: string;
  paymentTerms: number;
  taxId: string;
  bankName: string;
  bankAccount: string;
}

// ==================== CONFIGURACIÓN SUPABASE ====================

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabase: SupabaseClient | null = null;

// Initialize Supabase with better error handling
if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing Supabase:', error);
  }
} else {
  console.warn('⚠️ Supabase credentials not found. Please check environment variables:');
  console.warn('VITE_SUPABASE_URL:', supabaseUrl ? 'Found' : 'Missing');
  console.warn('VITE_SUPABASE_ANON_KEY:', supabaseKey ? 'Found' : 'Missing');
}

// ==================== UTILIDADES ====================

// Toast utility (simplified)
const toast = {
  success: (message: string) => {
    console.log('✅', message);
  },
  error: (message: string) => {
    console.error('❌', message);
  },
  info: (message: string) => {
    console.log('ℹ️', message);
  }
};

// ==================== COMPONENTES UI EXACTOS ====================

// FuturisticCard Component
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

// Button Component
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

// Input Component
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

// Badge Component
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

// Dialog Components
interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={() => onOpenChange(false)} 
      />
      <div className="relative z-50 w-full max-w-lg sm:max-w-2xl lg:max-w-4xl">
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

// ==================== FUNCIONES DE NEGOCIO EXACTAS ====================

// Supplier validation
export const validateSupplierData = (data: SupplierData): string[] => {
  const errors: string[] = [];
  
  if (!data.name || data.name.trim().length === 0) {
    errors.push('El nombre es requerido');
  }
  
  if (data.email && data.email.trim().length > 0) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      errors.push('El email no tiene un formato válido');
    }
  }
  
  if (data.paymentTerms < 1) {
    errors.push('Los términos de pago deben ser al menos 1 día');
  }
  
  return errors;
};

// Supplier CRUD operations
export const createSupplier = async (supplierData: SupplierData): Promise<Supplier> => {
  console.log('🔄 Creating supplier:', supplierData);
  
  if (!supabase) {
    throw new Error('Supabase no está configurado. Verifica las variables de entorno.');
  }

  const newSupplier = {
    ...supplierData,
    id: crypto.randomUUID(),
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  try {
    const { data, error } = await supabase
      .from('suppliers')
      .insert([{
        id: newSupplier.id,
        name: newSupplier.name,
        email: newSupplier.email || null,
        phone: newSupplier.phone || null,
        address: newSupplier.address || null,
        payment_terms: newSupplier.paymentTerms,
        tax_id: newSupplier.taxId || null,
        bank_name: newSupplier.bankName || null,
        bank_account: newSupplier.bankAccount || null,
        is_active: newSupplier.isActive,
        created_at: newSupplier.createdAt,
        updated_at: newSupplier.updatedAt
      }])
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase error creating supplier:', error);
      throw error;
    }
    
    console.log('✅ Supplier created successfully:', data);
    
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      paymentTerms: data.payment_terms,
      taxId: data.tax_id,
      bankName: data.bank_name,
      bankAccount: data.bank_account,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error('❌ Error in createSupplier:', error);
    throw error;
  }
};

export const getSuppliers = async (): Promise<Supplier[]> => {
  console.log('🔄 Loading suppliers...');
  
  if (!supabase) {
    console.error('❌ Supabase not initialized');
    throw new Error('Supabase no está configurado. Verifica las variables de entorno.');
  }

  try {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Supabase error loading suppliers:', error);
      throw error;
    }

    console.log('✅ Suppliers loaded successfully:', data?.length || 0, 'suppliers');

    return (data || []).map(item => ({
      id: item.id,
      name: item.name,
      email: item.email,
      phone: item.phone,
      address: item.address,
      paymentTerms: item.payment_terms || 30,
      taxId: item.tax_id,
      bankName: item.bank_name,
      bankAccount: item.bank_account,
      isActive: item.is_active,
      createdAt: item.created_at,
      updatedAt: item.updated_at
    }));
  } catch (error) {
    console.error('❌ Error in getSuppliers:', error);
    throw error;
  }
};

export const updateSupplier = async (id: string, supplierData: SupplierData): Promise<Supplier> => {
  console.log('🔄 Updating supplier:', id, supplierData);
  
  if (!supabase) {
    throw new Error('Supabase no está configurado. Verifica las variables de entorno.');
  }

  try {
    const { data, error } = await supabase
      .from('suppliers')
      .update({
        name: supplierData.name,
        email: supplierData.email || null,
        phone: supplierData.phone || null,
        address: supplierData.address || null,
        payment_terms: supplierData.paymentTerms,
        tax_id: supplierData.taxId || null,
        bank_name: supplierData.bankName || null,
        bank_account: supplierData.bankAccount || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase error updating supplier:', error);
      throw error;
    }

    console.log('✅ Supplier updated successfully:', data);

    return {
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      paymentTerms: data.payment_terms,
      taxId: data.tax_id,
      bankName: data.bank_name,
      bankAccount: data.bank_account,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error('❌ Error in updateSupplier:', error);
    throw error;
  }
};

export const deleteSupplier = async (id: string): Promise<void> => {
  console.log('🔄 Deleting supplier:', id);
  
  if (!supabase) {
    throw new Error('Supabase no está configurado. Verifica las variables de entorno.');
  }

  try {
    const { error } = await supabase
      .from('suppliers')
      .update({ 
        is_active: false, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', id);

    if (error) {
      console.error('❌ Supabase error deleting supplier:', error);
      throw error;
    }

    console.log('✅ Supplier deleted successfully');
  } catch (error) {
    console.error('❌ Error in deleteSupplier:', error);
    throw error;
  }
};

export const searchSuppliers = async (searchTerm: string): Promise<Supplier[]> => {
  console.log('🔍 Searching suppliers:', searchTerm);
  
  if (!supabase) {
    throw new Error('Supabase no está configurado. Verifica las variables de entorno.');
  }

  try {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('is_active', true)
      .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Supabase error searching suppliers:', error);
      throw error;
    }

    console.log('✅ Search completed:', data?.length || 0, 'suppliers found');

    return (data || []).map(item => ({
      id: item.id,
      name: item.name,
      email: item.email,
      phone: item.phone,
      address: item.address,
      paymentTerms: item.payment_terms || 30,
      taxId: item.tax_id,
      bankName: item.bank_name,
      bankAccount: item.bank_account,
      isActive: item.is_active,
      createdAt: item.created_at,
      updatedAt: item.updated_at
    }));
  } catch (error) {
    console.error('❌ Error in searchSuppliers:', error);
    throw error;
  }
};

// ==================== COMPONENTE PRINCIPAL ====================

export const SupplierModule: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<SupplierData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    paymentTerms: 30,
    taxId: '',
    bankName: '',
    bankAccount: ''
  });

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSuppliers();
      setSuppliers(data);
      console.log('✅ Suppliers loaded in component:', data.length);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido cargando proveedores';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('❌ Error in loadSuppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadSuppliers();
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await searchSuppliers(searchTerm);
      setSuppliers(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error buscando proveedores';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('❌ Error in handleSearch:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      paymentTerms: 30,
      taxId: '',
      bankName: '',
      bankAccount: ''
    });
    setSelectedSupplier(null);
  };

  const handleCreate = async () => {
    const errors = validateSupplierData(formData);
    if (errors.length > 0) {
      toast.error(errors[0]);
      return;
    }

    try {
      await createSupplier(formData);
      toast.success('Proveedor creado exitosamente');
      setIsCreateDialogOpen(false);
      resetForm();
      loadSuppliers();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error creando proveedor';
      toast.error(errorMessage);
      console.error('❌ Error in handleCreate:', error);
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setFormData({
      name: supplier.name,
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      paymentTerms: supplier.paymentTerms,
      taxId: supplier.taxId || '',
      bankName: supplier.bankName || '',
      bankAccount: supplier.bankAccount || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedSupplier) return;

    const errors = validateSupplierData(formData);
    if (errors.length > 0) {
      toast.error(errors[0]);
      return;
    }

    try {
      await updateSupplier(selectedSupplier.id, formData);
      toast.success('Proveedor actualizado exitosamente');
      setIsEditDialogOpen(false);
      resetForm();
      loadSuppliers();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error actualizando proveedor';
      toast.error(errorMessage);
      console.error('❌ Error in handleUpdate:', error);
    }
  };

  const handleDelete = async (supplier: Supplier) => {
    if (!confirm(`¿Está seguro de eliminar el proveedor "${supplier.name}"?`)) {
      return;
    }

    try {
      await deleteSupplier(supplier.id);
      toast.success('Proveedor eliminado exitosamente');
      loadSuppliers();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error eliminando proveedor';
      toast.error(errorMessage);
      console.error('❌ Error in handleDelete:', error);
    }
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.phone?.includes(searchTerm) ||
    supplier.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalSuppliers = suppliers.length;
  const activeSuppliers = suppliers.filter(s => s.isActive).length;

  if (!supabase) {
    return (
      <div className="space-y-6 sm:space-y-8 p-2 sm:p-4 lg:p-6">
        <FuturisticCard variant="glass" className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-600 mb-2">Error de Configuración</h2>
          <p className="text-gray-600 mb-4">
            Supabase no está configurado correctamente. Verifica las variables de entorno:
          </p>
          <div className="text-left bg-gray-100 p-4 rounded-lg text-sm font-mono">
            <p>VITE_SUPABASE_URL: {supabaseUrl ? '✅ Configurada' : '❌ Faltante'}</p>
            <p>VITE_SUPABASE_ANON_KEY: {supabaseKey ? '✅ Configurada' : '❌ Faltante'}</p>
          </div>
        </FuturisticCard>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 p-2 sm:p-4 lg:p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#EA580CFF]">
            Proveedores
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm sm:text-base">
            Gestiona tu base de proveedores y sus datos
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Badge className="bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800 px-3 py-1 text-xs sm:text-sm">
            <Truck className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
            {totalSuppliers} proveedores
          </Badge>
          <Badge className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800 px-3 py-1 text-xs sm:text-sm">
            <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
            {activeSuppliers} activos
          </Badge>
        </div>
      </motion.div>

      {/* Search and Actions */}
      <FuturisticCard variant="glass" className="p-4 sm:p-6 light-card">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
          <div className="flex-1 flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Input
                placeholder="Buscar proveedores por nombre, email, teléfono o dirección..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="form-input w-full"
              />
            </div>
            <Button
              onClick={handleSearch}
              variant="outline"
              className="shrink-0 w-full sm:w-auto"
            >
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </Button>
          </div>

          {/* BOTÓN DE EMERGENCIA - GARANTIZADO VISIBLE */}
          <div className="flex justify-end">
            <button 
              onClick={() => {
                console.log('✅ Botón Nuevo Proveedor clickeado!');
                setIsCreateDialogOpen(true);
              }}
              style={{
                background: 'linear-gradient(to right, #f97316, #ef4444)',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: '500',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'linear-gradient(to right, #ea580c, #dc2626)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'linear-gradient(to right, #f97316, #ef4444)';
              }}
            >
              <UserPlus size={16} />
              Nuevo Proveedor
            </button>
          </div>
        </div>
      </FuturisticCard>

      {/* Error Display */}
      {error && (
        <FuturisticCard variant="glass" className="p-4 border-red-200 bg-red-50">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
            <div>
              <p className="text-red-700 font-medium">Error de Conexión</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        </FuturisticCard>
      )}

      {/* Suppliers List */}
      <FuturisticCard variant="glass" className="p-4 sm:p-6 light-card">
        <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 sm:mb-6">Lista de Proveedores</h2>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm sm:text-base">Cargando proveedores...</p>
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="text-center py-8">
            <Truck className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
              {suppliers.length === 0 ? 'No hay proveedores registrados' : 'No se encontraron proveedores con esos criterios'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSuppliers.map((supplier) => (
              <motion.div
                key={supplier.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border hover:border-orange-300 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <h3 className="font-medium text-gray-800 dark:text-gray-200 truncate">{supplier.name}</h3>
                    <Badge className={supplier.isActive ? 'bg-green-100 text-green-700 border-green-200 text-xs' : 'bg-red-100 text-red-700 border-red-200 text-xs'}>
                      {supplier.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(supplier)}
                      className="h-8 w-8 p-0 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(supplier)}
                      className="h-8 w-8 p-0 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  {supplier.email && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Mail className="h-3 w-3 shrink-0" />
                      <span className="truncate">{supplier.email}</span>
                    </div>
                  )}
                  
                  {supplier.phone && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Phone className="h-3 w-3 shrink-0" />
                      <span className="truncate">{supplier.phone}</span>
                    </div>
                  )}
                  
                  {supplier.address && (
                    <div className="flex items-start gap-2 text-gray-600 dark:text-gray-400">
                      <MapPin className="h-3 w-3 shrink-0 mt-0.5" />
                      <span className="text-xs leading-relaxed break-words">{supplier.address}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-blue-600">
                    <Calendar className="h-3 w-3 shrink-0" />
                    <span className="text-xs">{supplier.paymentTerms} días</span>
                  </div>

                  {supplier.taxId && (
                    <div className="flex items-center gap-2 text-purple-600">
                      <Hash className="h-3 w-3 shrink-0" />
                      <span className="text-xs truncate">{supplier.taxId}</span>
                    </div>
                  )}

                  {supplier.bankName && (
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2 text-green-600">
                        <Building className="h-3 w-3 shrink-0" />
                        <span className="truncate text-xs">{supplier.bankName}</span>
                      </div>
                      {supplier.bankAccount && (
                        <div className="flex items-center gap-2 text-green-600 mt-1">
                          <Banknote className="h-3 w-3 shrink-0" />
                          <span className="truncate font-mono text-xs">{supplier.bankAccount}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </FuturisticCard>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="glass-card border-white/20 light-card">
          <DialogHeader>
            <DialogTitle className="text-gray-800 dark:text-gray-200">Crear Proveedor</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700 dark:text-gray-300">Nombre *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nombre del proveedor"
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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700 dark:text-gray-300">Teléfono (opcional)</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+58-XXX-XXX-XXXX"
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

            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300">Dirección (opcional)</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Dirección completa"
                className="form-input"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300">RIF/ID Fiscal (opcional)</Label>
              <Input
                value={formData.taxId}
                onChange={(e) => setFormData(prev => ({ ...prev, taxId: e.target.value }))}
                placeholder="J-12345678-9"
                className="form-input"
              />
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Información Bancaria (Opcional)
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-700 dark:text-gray-300">Nombre del Banco</Label>
                  <Input
                    value={formData.bankName}
                    onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
                    placeholder="Ej: Banco de Venezuela"
                    className="form-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700 dark:text-gray-300">Número de Cuenta</Label>
                  <Input
                    value={formData.bankAccount}
                    onChange={(e) => setFormData(prev => ({ ...prev, bankAccount: e.target.value }))}
                    placeholder="0102-XXXX-XXXX-XXXX-XXXX"
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
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
              >
                Crear Proveedor
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="glass-card border-white/20 light-card">
          <DialogHeader>
            <DialogTitle className="text-gray-800 dark:text-gray-200">Editar Proveedor</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700 dark:text-gray-300">Nombre *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nombre del proveedor"
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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700 dark:text-gray-300">Teléfono (opcional)</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+58-XXX-XXX-XXXX"
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

            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300">Dirección (opcional)</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Dirección completa"
                className="form-input"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300">RIF/ID Fiscal (opcional)</Label>
              <Input
                value={formData.taxId}
                onChange={(e) => setFormData(prev => ({ ...prev, taxId: e.target.value }))}
                placeholder="J-12345678-9"
                className="form-input"
              />
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Información Bancaria (Opcional)
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-700 dark:text-gray-300">Nombre del Banco</Label>
                  <Input
                    value={formData.bankName}
                    onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
                    placeholder="Ej: Banco de Venezuela"
                    className="form-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700 dark:text-gray-300">Número de Cuenta</Label>
                  <Input
                    value={formData.bankAccount}
                    onChange={(e) => setFormData(prev => ({ ...prev, bankAccount: e.target.value }))}
                    placeholder="0102-XXXX-XXXX-XXXX-XXXX"
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
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
              >
                Actualizar Proveedor
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SupplierModule;