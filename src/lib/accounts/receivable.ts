import { getSupabaseClient } from '@/lib/supabase';
import { 
  AccountReceivable, 
  InvoiceData, 
  DatabaseAccountReceivable, 
  AgingReportItem,
  AccountFilters
} from '@/types/accounts';
import { calculateAgingBucket } from './utils';

// Convert database account receivable to app account receivable
const convertReceivableFromDB = (dbReceivable: DatabaseAccountReceivable & { customers?: { name: string } }): AccountReceivable => ({
  id: dbReceivable.id,
  customerId: dbReceivable.customer_id,
  customerName: dbReceivable.customers?.name,
  invoiceNumber: dbReceivable.invoice_number,
  amount: dbReceivable.amount,
  currency: dbReceivable.currency as 'USD' | 'VES',
  dueDate: dbReceivable.due_date,
  status: dbReceivable.status as 'pending' | 'partial' | 'paid' | 'overdue',
  description: dbReceivable.description,
  saleId: dbReceivable.sale_id,
  createdAt: dbReceivable.created_at,
  updatedAt: dbReceivable.updated_at,
});

// Convert app invoice data to database format
const convertInvoiceToDB = (invoice: InvoiceData) => ({
  customer_id: invoice.customerId,
  invoice_number: invoice.invoiceNumber,
  amount: invoice.amount,
  currency: invoice.currency,
  due_date: invoice.dueDate,
  description: invoice.description,
  sale_id: invoice.saleId,
});

export const createInvoice = async (invoiceData: InvoiceData): Promise<AccountReceivable> => {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Cliente Supabase no disponible');
  }

  try {
    console.log('🔄 Creando factura por cobrar...', invoiceData);

    const { data, error } = await client
      .from('accounts_receivable')
      .insert(convertInvoiceToDB(invoiceData))
      .select(`
        *,
        customers (name)
      `)
      .single();

    if (error) {
      console.error('❌ Error creando factura:', error);
      throw new Error(`Error creando factura: ${error.message}`);
    }

    console.log('✅ Factura creada exitosamente:', data);
    return convertReceivableFromDB(data);
  } catch (error) {
    console.error('❌ Error en createInvoice:', error);
    throw error;
  }
};

export const getAccountsReceivable = async (filters?: AccountFilters): Promise<AccountReceivable[]> => {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Cliente Supabase no disponible');
  }

  try {
    console.log('🔄 Obteniendo cuentas por cobrar...', filters);

    let query = client
      .from('accounts_receivable')
      .select(`
        *,
        customers (name)
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.currency) {
      query = query.eq('currency', filters.currency);
    }
    if (filters?.customerId) {
      query = query.eq('customer_id', filters.customerId);
    }
    if (filters?.dateFrom) {
      query = query.gte('due_date', filters.dateFrom);
    }
    if (filters?.dateTo) {
      query = query.lte('due_date', filters.dateTo);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Error obteniendo cuentas por cobrar:', error);
      throw new Error(`Error obteniendo cuentas por cobrar: ${error.message}`);
    }

    console.log(`✅ Obtenidas ${data?.length || 0} cuentas por cobrar`);
    return data?.map(convertReceivableFromDB) || [];
  } catch (error) {
    console.error('❌ Error en getAccountsReceivable:', error);
    throw error;
  }
};

export const getReceivableById = async (receivableId: string): Promise<AccountReceivable | null> => {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Cliente Supabase no disponible');
  }

  try {
    console.log('🔄 Obteniendo cuenta por cobrar por ID:', receivableId);

    const { data, error } = await client
      .from('accounts_receivable')
      .select(`
        *,
        customers (name)
      `)
      .eq('id', receivableId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Account not found
      }
      console.error('❌ Error obteniendo cuenta por cobrar:', error);
      throw new Error(`Error obteniendo cuenta por cobrar: ${error.message}`);
    }

    console.log('✅ Cuenta por cobrar obtenida exitosamente:', data);
    return convertReceivableFromDB(data);
  } catch (error) {
    console.error('❌ Error en getReceivableById:', error);
    throw error;
  }
};

export const updateReceivable = async (receivableId: string, updateData: Partial<InvoiceData>): Promise<AccountReceivable> => {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Cliente Supabase no disponible');
  }

  try {
    console.log('🔄 Actualizando cuenta por cobrar:', receivableId, updateData);

    const dbUpdateData: unknown = {
      updated_at: new Date().toISOString(),
    };

    if (updateData.customerId !== undefined) dbUpdateData.customer_id = updateData.customerId;
    if (updateData.invoiceNumber !== undefined) dbUpdateData.invoice_number = updateData.invoiceNumber;
    if (updateData.amount !== undefined) dbUpdateData.amount = updateData.amount;
    if (updateData.currency !== undefined) dbUpdateData.currency = updateData.currency;
    if (updateData.dueDate !== undefined) dbUpdateData.due_date = updateData.dueDate;
    if (updateData.description !== undefined) dbUpdateData.description = updateData.description;
    if (updateData.saleId !== undefined) dbUpdateData.sale_id = updateData.saleId;

    const { data, error } = await client
      .from('accounts_receivable')
      .update(dbUpdateData)
      .eq('id', receivableId)
      .select(`
        *,
        customers (name)
      `)
      .single();

    if (error) {
      console.error('❌ Error actualizando cuenta por cobrar:', error);
      throw new Error(`Error actualizando cuenta por cobrar: ${error.message}`);
    }

    console.log('✅ Cuenta por cobrar actualizada exitosamente:', data);
    return convertReceivableFromDB(data);
  } catch (error) {
    console.error('❌ Error en updateReceivable:', error);
    throw error;
  }
};

export const deleteReceivable = async (receivableId: string): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Cliente Supabase no disponible');
  }

  try {
    console.log('🔄 Eliminando cuenta por cobrar:', receivableId);

    const { error } = await client
      .from('accounts_receivable')
      .delete()
      .eq('id', receivableId);

    if (error) {
      console.error('❌ Error eliminando cuenta por cobrar:', error);
      throw new Error(`Error eliminando cuenta por cobrar: ${error.message}`);
    }

    console.log('✅ Cuenta por cobrar eliminada exitosamente');
    return true;
  } catch (error) {
    console.error('❌ Error en deleteReceivable:', error);
    throw error;
  }
};

export const getAgingReport = async (asOfDate: Date = new Date()): Promise<AgingReportItem[]> => {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Cliente Supabase no disponible');
  }

  try {
    console.log('🔄 Generando reporte de antigüedad...', asOfDate);

    const { data, error } = await client
      .from('accounts_receivable')
      .select(`
        *,
        customers (name)
      `)
      .in('status', ['pending', 'partial', 'overdue']);

    if (error) {
      console.error('❌ Error obteniendo datos para reporte:', error);
      throw new Error(`Error obteniendo datos para reporte: ${error.message}`);
    }

    // Group by customer and calculate aging buckets
    const customerMap = new Map<string, AgingReportItem>();

    data?.forEach((receivable) => {
      const customerId = receivable.customer_id;
      const customerName = receivable.customers?.name || 'Cliente Desconocido';
      
      if (!customerMap.has(customerId)) {
        customerMap.set(customerId, {
          customerId,
          customerName,
          current: 0,
          days30: 0,
          days60: 0,
          days90: 0,
          over90: 0,
          total: 0,
        });
      }

      const customer = customerMap.get(customerId)!;
      const aging = calculateAgingBucket(receivable.due_date, receivable.amount);
      
      customer.current += aging.current;
      customer.days30 += aging.days30;
      customer.days60 += aging.days60;
      customer.days90 += aging.days90;
      customer.over90 += aging.over90;
      customer.total += receivable.amount;
    });

    const agingReport = Array.from(customerMap.values())
      .filter(item => item.total > 0)
      .sort((a, b) => b.total - a.total);

    console.log(`✅ Reporte de antigüedad generado con ${agingReport.length} clientes`);
    return agingReport;
  } catch (error) {
    console.error('❌ Error en getAgingReport:', error);
    throw error;
  }
};

export const getOverdueReceivables = async (): Promise<AccountReceivable[]> => {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Cliente Supabase no disponible');
  }

  try {
    console.log('🔄 Obteniendo cuentas vencidas...');

    const { data, error } = await client
      .from('accounts_receivable')
      .select(`
        *,
        customers (name)
      `)
      .lt('due_date', new Date().toISOString().split('T')[0])
      .in('status', ['pending', 'partial'])
      .order('due_date', { ascending: true });

    if (error) {
      console.error('❌ Error obteniendo cuentas vencidas:', error);
      throw new Error(`Error obteniendo cuentas vencidas: ${error.message}`);
    }

    console.log(`✅ Obtenidas ${data?.length || 0} cuentas vencidas`);
    return data?.map(convertReceivableFromDB) || [];
  } catch (error) {
    console.error('❌ Error en getOverdueReceivables:', error);
    throw error;
  }
};

export const markOverdueReceivables = async (): Promise<number> => {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Cliente Supabase no disponible');
  }

  try {
    console.log('🔄 Marcando cuentas vencidas...');

    const { data, error } = await client
      .from('accounts_receivable')
      .update({ 
        status: 'overdue',
        updated_at: new Date().toISOString()
      })
      .lt('due_date', new Date().toISOString().split('T')[0])
      .in('status', ['pending', 'partial'])
      .select('id');

    if (error) {
      console.error('❌ Error marcando cuentas vencidas:', error);
      throw new Error(`Error marcando cuentas vencidas: ${error.message}`);
    }

    const count = data?.length || 0;
    console.log(`✅ Marcadas ${count} cuentas como vencidas`);
    return count;
  } catch (error) {
    console.error('❌ Error en markOverdueReceivables:', error);
    throw error;
  }
};