import { getSupabaseClient } from '@/lib/supabase';

export interface Supplier {
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

export const getSuppliers = async (): Promise<Supplier[]> => {
  try {
    const supabase = getSupabaseClient();
    
    if (!supabase) {
      console.warn('Supabase not configured, loading from localStorage');
      return loadSuppliersFromLocalStorage();
    }

    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching suppliers from Supabase:', error);
      return loadSuppliersFromLocalStorage();
    }

    console.log('✅ Suppliers loaded from Supabase:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('Error in getSuppliers:', error);
    return loadSuppliersFromLocalStorage();
  }
};

const loadSuppliersFromLocalStorage = (): Supplier[] => {
  try {
    const savedSuppliers = localStorage.getItem('sales-app-suppliers');
    if (savedSuppliers) {
      const parsedSuppliers = JSON.parse(savedSuppliers);
      console.log('✅ Suppliers loaded from localStorage:', parsedSuppliers.length);
      return parsedSuppliers.filter((supplier: Supplier) => supplier.is_active !== false);
    }
    return [];
  } catch (error) {
    console.error('Error loading suppliers from localStorage:', error);
    return [];
  }
};

export const createSupplier = async (supplierData: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>): Promise<Supplier | null> => {
  try {
    const supabase = getSupabaseClient();
    
    if (!supabase) {
      console.warn('Supabase not configured, saving to localStorage');
      return createSupplierInLocalStorage(supplierData);
    }

    const { data, error } = await supabase
      .from('suppliers')
      .insert([supplierData])
      .select()
      .single();

    if (error) {
      console.error('Error creating supplier in Supabase:', error);
      return createSupplierInLocalStorage(supplierData);
    }

    console.log('✅ Supplier created in Supabase:', data);
    return data;
  } catch (error) {
    console.error('Error in createSupplier:', error);
    return createSupplierInLocalStorage(supplierData);
  }
};

const createSupplierInLocalStorage = (supplierData: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>): Supplier => {
  const newSupplier: Supplier = {
    id: crypto.randomUUID(),
    ...supplierData,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const existingSuppliers = loadSuppliersFromLocalStorage();
  const updatedSuppliers = [...existingSuppliers, newSupplier];
  
  localStorage.setItem('sales-app-suppliers', JSON.stringify(updatedSuppliers));
  console.log('✅ Supplier created in localStorage:', newSupplier);
  
  return newSupplier;
};

export const updateSupplier = async (id: string, supplierData: Partial<Supplier>): Promise<Supplier | null> => {
  try {
    const supabase = getSupabaseClient();
    
    if (!supabase) {
      console.warn('Supabase not configured, updating in localStorage');
      return updateSupplierInLocalStorage(id, supplierData);
    }

    const { data, error } = await supabase
      .from('suppliers')
      .update(supplierData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating supplier in Supabase:', error);
      return updateSupplierInLocalStorage(id, supplierData);
    }

    console.log('✅ Supplier updated in Supabase:', data);
    return data;
  } catch (error) {
    console.error('Error in updateSupplier:', error);
    return updateSupplierInLocalStorage(id, supplierData);
  }
};

const updateSupplierInLocalStorage = (id: string, supplierData: Partial<Supplier>): Supplier | null => {
  const existingSuppliers = loadSuppliersFromLocalStorage();
  const supplierIndex = existingSuppliers.findIndex(supplier => supplier.id === id);
  
  if (supplierIndex === -1) {
    console.error('Supplier not found in localStorage');
    return null;
  }

  const updatedSupplier = {
    ...existingSuppliers[supplierIndex],
    ...supplierData,
    updated_at: new Date().toISOString()
  };

  existingSuppliers[supplierIndex] = updatedSupplier;
  localStorage.setItem('sales-app-suppliers', JSON.stringify(existingSuppliers));
  
  console.log('✅ Supplier updated in localStorage:', updatedSupplier);
  return updatedSupplier;
};

export const deleteSupplier = async (id: string): Promise<boolean> => {
  try {
    const supabase = getSupabaseClient();
    
    if (!supabase) {
      console.warn('Supabase not configured, deleting from localStorage');
      return deleteSupplierFromLocalStorage(id);
    }

    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting supplier from Supabase:', error);
      return deleteSupplierFromLocalStorage(id);
    }

    console.log('✅ Supplier deleted from Supabase');
    return true;
  } catch (error) {
    console.error('Error in deleteSupplier:', error);
    return deleteSupplierFromLocalStorage(id);
  }
};

const deleteSupplierFromLocalStorage = (id: string): boolean => {
  const existingSuppliers = loadSuppliersFromLocalStorage();
  const filteredSuppliers = existingSuppliers.filter(supplier => supplier.id !== id);
  
  if (filteredSuppliers.length === existingSuppliers.length) {
    console.error('Supplier not found in localStorage');
    return false;
  }

  localStorage.setItem('sales-app-suppliers', JSON.stringify(filteredSuppliers));
  console.log('✅ Supplier deleted from localStorage');
  return true;
};