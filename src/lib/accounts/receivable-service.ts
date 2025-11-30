import { getSupabaseClient } from '@/lib/supabase';

export interface AccountReceivable {
  id: string;
  invoice_number: string;
  customer_id?: string;
  supplier_id?: string;
  entity_type: 'customer' | 'supplier';
  entity_name: string;
  amount: number;
  currency: 'USD' | 'VES';
  due_date: string;
  status: 'pending' | 'overdue' | 'paid' | 'cancelled';
  description?: string;
  payment_terms: number;
  created_at: string;
  updated_at: string;
  user_id?: string;
}

const DEMO_RECEIVABLES: AccountReceivable[] = [
  {
    id: '48b6f184-9225-49c0-b5e9-bb44e9febd9b',
    invoice_number: 'INV-20241201-001',
    entity_type: 'customer',
    entity_name: 'Cliente Ejemplo 1',
    amount: 1500.00,
    currency: 'USD',
    due_date: '2024-12-31',
    status: 'pending',
    payment_terms: 30,
    description: 'Venta de productos',
    created_at: '2025-11-30T16:37:34.527727+00:00',
    updated_at: '2025-11-30T16:37:34.527727+00:00'
  },
  {
    id: '4cc679cd-f0e9-46f8-9722-4835e924af9d',
    invoice_number: 'INV-20241201-002',
    entity_type: 'supplier',
    entity_name: 'Proveedor Ejemplo 1',
    amount: 5000.00,
    currency: 'VES',
    due_date: '2024-12-15',
    status: 'pending',
    payment_terms: 15,
    description: 'Compra de servicios',
    created_at: '2025-11-30T16:37:34.527727+00:00',
    updated_at: '2025-11-30T16:37:34.527727+00:00'
  },
  {
    id: 'fe85fc4a-4369-4cda-9894-87abd4575a54',
    invoice_number: 'INV-20241201-003',
    entity_type: 'customer',
    entity_name: 'Cliente Ejemplo 2',
    amount: 2500.50,
    currency: 'USD',
    due_date: '2024-11-25',
    status: 'overdue',
    payment_terms: 30,
    description: 'Servicios profesionales',
    created_at: '2025-11-30T16:37:34.527727+00:00',
    updated_at: '2025-11-30T16:37:34.527727+00:00'
  }
];

export async function getReceivables(): Promise<AccountReceivable[]> {
  try {
    const supabase = getSupabaseClient();
    if (supabase) {
      console.log('📡 Intentando cargar receivables desde Supabase...');
      const { data, error } = await supabase
        .from('accounts_receivable')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        console.log('✅ Receivables cargadas de Supabase:', data.length);
        return (data || []) as AccountReceivable[];
      }
    }

    const saved = localStorage.getItem('sales-app-receivables');
    if (saved) {
      console.log('📂 Receivables cargadas desde localStorage');
      return JSON.parse(saved);
    }

    console.log('📋 Usando datos de demo');
    return DEMO_RECEIVABLES;
  } catch (error) {
    console.warn('⚠️ Error:', error);
    const saved = localStorage.getItem('sales-app-receivables');
    if (saved) return JSON.parse(saved);
    return DEMO_RECEIVABLES;
  }
}

export async function saveReceivable(receivable: Omit<AccountReceivable, 'id' | 'created_at' | 'updated_at'>): Promise<AccountReceivable | null> {
  try {
    const supabase = getSupabaseClient();
    if (supabase) {
      const now = new Date().toISOString();
      const newReceivable = {
        id: crypto.randomUUID(),
        ...receivable,
        created_at: now,
        updated_at: now
      };

      console.log('📝 Guardando en Supabase...');
      const { data, error } = await supabase
        .from('accounts_receivable')
        .insert([newReceivable])
        .select()
        .single();

      if (!error && data) {
        console.log('✅ Guardada en Supabase');
        const saved = localStorage.getItem('sales-app-receivables') || '[]';
        const list = JSON.parse(saved);
        localStorage.setItem('sales-app-receivables', JSON.stringify([...list, data]));
        return data as AccountReceivable;
      }
    }

    return saveToLocalStorage(receivable);
  } catch (error) {
    console.warn('⚠️ Error saving:', error);
    return saveToLocalStorage(receivable);
  }
}

export async function updateReceivable(id: string, receivable: Partial<AccountReceivable>): Promise<AccountReceivable | null> {
  try {
    const supabase = getSupabaseClient();
    if (supabase) {
      const updateData = {
        ...receivable,
        updated_at: new Date().toISOString()
      };

      console.log('🔄 Actualizando en Supabase...');
      const { data, error } = await supabase
        .from('accounts_receivable')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        console.log('✅ Actualizada en Supabase');
        const saved = localStorage.getItem('sales-app-receivables') || '[]';
        const list = JSON.parse(saved);
        const idx = list.findIndex((r: AccountReceivable) => r.id === id);
        if (idx >= 0) list[idx] = data;
        localStorage.setItem('sales-app-receivables', JSON.stringify(list));
        return data as AccountReceivable;
      }
    }

    return updateInLocalStorage(id, receivable);
  } catch (error) {
    console.warn('⚠️ Error updating:', error);
    return updateInLocalStorage(id, receivable);
  }
}

export async function deleteReceivable(id: string): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    if (supabase) {
      console.log('🗑️ Eliminando de Supabase...');
      const { error } = await supabase
        .from('accounts_receivable')
        .delete()
        .eq('id', id);

      if (!error) {
        console.log('✅ Eliminada de Supabase');
        const saved = localStorage.getItem('sales-app-receivables') || '[]';
        const list = JSON.parse(saved).filter((r: AccountReceivable) => r.id !== id);
        localStorage.setItem('sales-app-receivables', JSON.stringify(list));
        return true;
      }
    }

    return deleteFromLocalStorage(id);
  } catch (error) {
    console.warn('⚠️ Error deleting:', error);
    return deleteFromLocalStorage(id);
  }
}

function saveToLocalStorage(receivable: Omit<AccountReceivable, 'id' | 'created_at' | 'updated_at'>): AccountReceivable {
  const now = new Date().toISOString();
  const newReceivable: AccountReceivable = {
    id: crypto.randomUUID(),
    ...receivable,
    created_at: now,
    updated_at: now
  };

  const existing = loadFromLocalStorage();
  const updated = [...existing, newReceivable];
  localStorage.setItem('sales-app-receivables', JSON.stringify(updated));
  return newReceivable;
}

function updateInLocalStorage(id: string, receivable: Partial<AccountReceivable>): AccountReceivable | null {
  const existing = loadFromLocalStorage();
  const index = existing.findIndex(r => r.id === id);
  if (index === -1) return null;

  const updated = {
    ...existing[index],
    ...receivable,
    updated_at: new Date().toISOString()
  };

  existing[index] = updated;
  localStorage.setItem('sales-app-receivables', JSON.stringify(existing));
  return updated;
}

function deleteFromLocalStorage(id: string): boolean {
  const existing = loadFromLocalStorage();
  const filtered = existing.filter(r => r.id !== id);
  localStorage.setItem('sales-app-receivables', JSON.stringify(filtered));
  return true;
}

function loadFromLocalStorage(): AccountReceivable[] {
  try {
    const saved = localStorage.getItem('sales-app-receivables');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}
