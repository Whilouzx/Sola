// Customer management for accounts receivable
import { getSupabaseClient } from '@/lib/supabase';

export interface Customer {
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

interface AccountsReceivableEntry {
  id: string;
  customerId: string;
  customerName: string;
  invoiceNumber: string;
  amount: number;
  currency: 'USD' | 'VES';
  dueDate: string;
  status: 'pending' | 'overdue' | 'paid' | 'cancelled';
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// Main function - Load customers from Supabase
export const getCustomers = async (): Promise<Customer[]> => {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.error('❌ Supabase no está configurado');
      return [];
    }

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error loading customers from Supabase:', error);
      return [];
    }

    console.log('✅ Customers loaded from Supabase:', data?.length || 0);
    
    return (data || []).map(item => ({
      id: item.id,
      name: item.name,
      email: item.email,
      phone: item.phone,
      address: item.address || null,
      taxId: item.tax_id || null,
      creditLimit: item.credit_limit || 0,
      paymentTerms: item.payment_terms || 30,
      isActive: item.is_active !== false,
      created_at: item.created_at,
      updated_at: item.updated_at
    }));
  } catch (error) {
    console.error('❌ Error in getCustomers:', error);
    return [];
  }
};

export const saveCustomers = (customers: Customer[]): void => {
  try {
    localStorage.setItem('flowi-customers', JSON.stringify(customers));
    console.log('✅ Customers saved to localStorage:', customers.length);
  } catch (error) {
    console.error('❌ Error saving customers:', error);
  }
};

export const getAccountsReceivable = (): AccountsReceivableEntry[] => {
  try {
    const saved = localStorage.getItem('flowi-accounts-receivable');
    if (saved) {
      return JSON.parse(saved);
    }
    return [];
  } catch (error) {
    console.error('Error loading accounts receivable:', error);
    return [];
  }
};

export const saveAccountsReceivable = (entries: AccountsReceivableEntry[]): void => {
  try {
    localStorage.setItem('flowi-accounts-receivable', JSON.stringify(entries));
  } catch (error) {
    console.error('Error saving accounts receivable:', error);
  }
};

export const getCustomerById = (id: string): Promise<Customer | undefined> => {
  return getCustomers().then(customers => 
    customers.find(customer => customer.id === id)
  );
};

export const getOverdueEntries = (): AccountsReceivableEntry[] => {
  const entries = getAccountsReceivable();
  const now = new Date();
  return entries.filter(entry => 
    entry.status === 'pending' && new Date(entry.dueDate) < now
  );
};

export const getTotalReceivableAmount = (): { USD: number; VES: number } => {
  const entries = getAccountsReceivable();
  const pending = entries.filter(entry => entry.status === 'pending' || entry.status === 'overdue');
  
  return pending.reduce(
    (totals, entry) => {
      if (entry.currency === 'USD') {
        totals.USD += entry.amount;
      } else {
        totals.VES += entry.amount;
      }
      return totals;
    },
    { USD: 0, VES: 0 }
  );
};

export const formatCurrency = (amount: number, currency: 'USD' | 'VES'): string => {
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  } else {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'VES'
    }).format(amount);
  }
};

export const getStatusColor = (status: AccountsReceivableEntry['status']): string => {
  switch (status) {
    case 'pending':
      return 'text-yellow-600 bg-yellow-100';
    case 'overdue':
      return 'text-red-600 bg-red-100';
    case 'paid':
      return 'text-green-600 bg-green-100';
    case 'cancelled':
      return 'text-gray-600 bg-gray-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

export const getStatusText = (status: AccountsReceivableEntry['status']): string => {
  switch (status) {
    case 'pending':
      return 'Pendiente';
    case 'overdue':
      return 'Vencido';
    case 'paid':
      return 'Pagado';
    case 'cancelled':
      return 'Cancelado';
    default:
      return 'Desconocido';
  }
};
