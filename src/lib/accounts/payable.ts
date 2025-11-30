import { getSupabaseClient } from '@/lib/supabase';
import { 
  AccountPayable, 
  BillData, 
  DatabaseAccountPayable,
  AccountFilters,
  PaymentCalendarItem,
  EntityType
} from '@/types/accounts';

// Convert database account payable to app account payable
const convertPayableFromDB = (dbPayable: DatabaseAccountPayable & { suppliers?: { name: string } }): AccountPayable => ({
  id: dbPayable.id,
  entityType: dbPayable.entity_type as EntityType,
  supplierId: dbPayable.supplier_id,
  supplierName: dbPayable.suppliers?.name,
  entityName: dbPayable.entity_name,
  billNumber: dbPayable.bill_number,
  amount: dbPayable.amount,
  currency: dbPayable.currency as 'USD' | 'VES',
  dueDate: dbPayable.due_date,
  status: dbPayable.status as 'pending' | 'partial' | 'paid' | 'overdue',
  description: dbPayable.description,
  category: dbPayable.category,
  expenseId: dbPayable.expense_id,
  createdAt: dbPayable.created_at,
  updatedAt: dbPayable.updated_at,
});

// Convert app bill data to database format
const convertBillToDB = (bill: BillData) => ({
  entity_type: bill.entityType,
  supplier_id: bill.entityType === 'supplier' ? bill.supplierId : null,
  entity_name: bill.entityType !== 'supplier' ? bill.entityName : null,
  bill_number: bill.billNumber,
  amount: bill.amount,
  currency: bill.currency,
  due_date: bill.dueDate,
  description: bill.description,
  category: bill.category,
  expense_id: bill.expenseId,
});

export const createBill = async (billData: BillData): Promise<AccountPayable> => {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Cliente Supabase no disponible');
  }

  try {
    console.log('🔄 Creando factura por pagar...', billData);

    const { data, error } = await client
      .from('accounts_payable')
      .insert(convertBillToDB(billData))
      .select(`
        *,
        suppliers (name)
      `)
      .single();

    if (error) {
      console.error('❌ Error creando factura por pagar:', error);
      throw new Error(`Error creando factura por pagar: ${error.message}`);
    }

    console.log('✅ Factura por pagar creada exitosamente:', data);
    return convertPayableFromDB(data);
  } catch (error) {
    console.error('❌ Error en createBill:', error);
    throw error;
  }
};

export const getAccountsPayable = async (filters?: AccountFilters): Promise<AccountPayable[]> => {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Cliente Supabase no disponible');
  }

  try {
    console.log('🔄 Obteniendo cuentas por pagar...', filters);

    let query = client
      .from('accounts_payable')
      .select(`
        *,
        suppliers (name)
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.currency) {
      query = query.eq('currency', filters.currency);
    }
    if (filters?.supplierId) {
      query = query.eq('supplier_id', filters.supplierId);
    }
    if (filters?.entityType) {
      query = query.eq('entity_type', filters.entityType);
    }
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    if (filters?.dateFrom) {
      query = query.gte('due_date', filters.dateFrom);
    }
    if (filters?.dateTo) {
      query = query.lte('due_date', filters.dateTo);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Error obteniendo cuentas por pagar:', error);
      throw new Error(`Error obteniendo cuentas por pagar: ${error.message}`);
    }

    console.log(`✅ Obtenidas ${data?.length || 0} cuentas por pagar`);
    return data?.map(convertPayableFromDB) || [];
  } catch (error) {
    console.error('❌ Error en getAccountsPayable:', error);
    throw error;
  }
};

export const getPayableById = async (payableId: string): Promise<AccountPayable | null> => {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Cliente Supabase no disponible');
  }

  try {
    console.log('🔄 Obteniendo cuenta por pagar por ID:', payableId);

    const { data, error } = await client
      .from('accounts_payable')
      .select(`
        *,
        suppliers (name)
      `)
      .eq('id', payableId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Account not found
      }
      console.error('❌ Error obteniendo cuenta por pagar:', error);
      throw new Error(`Error obteniendo cuenta por pagar: ${error.message}`);
    }

    console.log('✅ Cuenta por pagar obtenida exitosamente:', data);
    return convertPayableFromDB(data);
  } catch (error) {
    console.error('❌ Error en getPayableById:', error);
    throw error;
  }
};

export const updatePayable = async (payableId: string, updateData: Partial<BillData>): Promise<AccountPayable> => {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Cliente Supabase no disponible');
  }

  try {
    console.log('🔄 Actualizando cuenta por pagar:', payableId, updateData);

    const dbUpdateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (updateData.entityType !== undefined) dbUpdateData.entity_type = updateData.entityType;
    if (updateData.supplierId !== undefined) dbUpdateData.supplier_id = updateData.supplierId;
    if (updateData.entityName !== undefined) dbUpdateData.entity_name = updateData.entityName;
    if (updateData.billNumber !== undefined) dbUpdateData.bill_number = updateData.billNumber;
    if (updateData.amount !== undefined) dbUpdateData.amount = updateData.amount;
    if (updateData.currency !== undefined) dbUpdateData.currency = updateData.currency;
    if (updateData.dueDate !== undefined) dbUpdateData.due_date = updateData.dueDate;
    if (updateData.description !== undefined) dbUpdateData.description = updateData.description;
    if (updateData.category !== undefined) dbUpdateData.category = updateData.category;
    if (updateData.expenseId !== undefined) dbUpdateData.expense_id = updateData.expenseId;

    const { data, error } = await client
      .from('accounts_payable')
      .update(dbUpdateData)
      .eq('id', payableId)
      .select(`
        *,
        suppliers (name)
      `)
      .single();

    if (error) {
      console.error('❌ Error actualizando cuenta por pagar:', error);
      throw new Error(`Error actualizando cuenta por pagar: ${error.message}`);
    }

    console.log('✅ Cuenta por pagar actualizada exitosamente:', data);
    return convertPayableFromDB(data);
  } catch (error) {
    console.error('❌ Error en updatePayable:', error);
    throw error;
  }
};

export const deletePayable = async (payableId: string): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Cliente Supabase no disponible');
  }

  try {
    console.log('🔄 Eliminando cuenta por pagar:', payableId);

    const { error } = await client
      .from('accounts_payable')
      .delete()
      .eq('id', payableId);

    if (error) {
      console.error('❌ Error eliminando cuenta por pagar:', error);
      throw new Error(`Error eliminando cuenta por pagar: ${error.message}`);
    }

    console.log('✅ Cuenta por pagar eliminada exitosamente');
    return true;
  } catch (error) {
    console.error('❌ Error en deletePayable:', error);
    throw error;
  }
};

export const getPaymentCalendar = async (month: number, year: number): Promise<PaymentCalendarItem[]> => {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Cliente Supabase no disponible');
  }

  try {
    console.log('🔄 Obteniendo calendario de pagos...', { month, year });

    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    // Get accounts receivable
    const { data: receivables, error: receivablesError } = await client
      .from('accounts_receivable')
      .select(`
        id,
        amount,
        currency,
        due_date,
        description,
        status,
        customers (name)
      `)
      .gte('due_date', startDate)
      .lte('due_date', endDate)
      .in('status', ['pending', 'partial', 'overdue']);

    if (receivablesError) {
      console.error('❌ Error obteniendo cuentas por cobrar para calendario:', receivablesError);
      throw new Error(`Error obteniendo cuentas por cobrar: ${receivablesError.message}`);
    }

    // Get accounts payable
    const { data: payables, error: payablesError } = await client
      .from('accounts_payable')
      .select(`
        id,
        amount,
        currency,
        due_date,
        description,
        status,
        entity_type,
        entity_name,
        suppliers (name)
      `)
      .gte('due_date', startDate)
      .lte('due_date', endDate)
      .in('status', ['pending', 'partial', 'overdue']);

    if (payablesError) {
      console.error('❌ Error obteniendo cuentas por pagar para calendario:', payablesError);
      throw new Error(`Error obteniendo cuentas por pagar: ${payablesError.message}`);
    }

    // Combine and format calendar items
    const calendarItems: PaymentCalendarItem[] = [];

    // Add receivables
    receivables?.forEach((receivable) => {
      calendarItems.push({
        id: receivable.id,
        type: 'receivable',
        accountId: receivable.id,
        amount: receivable.amount,
        currency: receivable.currency as 'USD' | 'VES',
        dueDate: receivable.due_date,
        description: receivable.description || 'Cuenta por cobrar',
        customerName: receivable.customers?.name,
        status: receivable.status as 'pending' | 'partial' | 'paid' | 'overdue',
      });
    });

    // Add payables
    payables?.forEach((payable) => {
      const entityName = payable.entity_type === 'supplier' 
        ? payable.suppliers?.name 
        : payable.entity_name;

      calendarItems.push({
        id: payable.id,
        type: 'payable',
        accountId: payable.id,
        amount: payable.amount,
        currency: payable.currency as 'USD' | 'VES',
        dueDate: payable.due_date,
        description: payable.description || 'Cuenta por pagar',
        supplierName: payable.entity_type === 'supplier' ? payable.suppliers?.name : undefined,
        entityName: payable.entity_type !== 'supplier' ? payable.entity_name : undefined,
        status: payable.status as 'pending' | 'partial' | 'paid' | 'overdue',
      });
    });

    // Sort by due date
    calendarItems.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    console.log(`✅ Calendario generado con ${calendarItems.length} elementos`);
    return calendarItems;
  } catch (error) {
    console.error('❌ Error en getPaymentCalendar:', error);
    throw error;
  }
};

export const getOverduePayables = async (): Promise<AccountPayable[]> => {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Cliente Supabase no disponible');
  }

  try {
    console.log('🔄 Obteniendo cuentas por pagar vencidas...');

    const { data, error } = await client
      .from('accounts_payable')
      .select(`
        *,
        suppliers (name)
      `)
      .lt('due_date', new Date().toISOString().split('T')[0])
      .in('status', ['pending', 'partial'])
      .order('due_date', { ascending: true });

    if (error) {
      console.error('❌ Error obteniendo cuentas por pagar vencidas:', error);
      throw new Error(`Error obteniendo cuentas por pagar vencidas: ${error.message}`);
    }

    console.log(`✅ Obtenidas ${data?.length || 0} cuentas por pagar vencidas`);
    return data?.map(convertPayableFromDB) || [];
  } catch (error) {
    console.error('❌ Error en getOverduePayables:', error);
    throw error;
  }
};

export const markOverduePayables = async (): Promise<number> => {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Cliente Supabase no disponible');
  }

  try {
    console.log('🔄 Marcando cuentas por pagar vencidas...');

    const { data, error } = await client
      .from('accounts_payable')
      .update({ 
        status: 'overdue',
        updated_at: new Date().toISOString()
      })
      .lt('due_date', new Date().toISOString().split('T')[0])
      .in('status', ['pending', 'partial'])
      .select('id');

    if (error) {
      console.error('❌ Error marcando cuentas por pagar vencidas:', error);
      throw new Error(`Error marcando cuentas por pagar vencidas: ${error.message}`);
    }

    const count = data?.length || 0;
    console.log(`✅ Marcadas ${count} cuentas por pagar como vencidas`);
    return count;
  } catch (error) {
    console.error('❌ Error en markOverduePayables:', error);
    throw error;
  }
};

// Helper function to get entity display name
export const getEntityDisplayName = (payable: AccountPayable): string => {
  if (payable.entityType === 'supplier') {
    return payable.supplierName || 'Proveedor Desconocido';
  }
  return payable.entityName || 'Entidad Desconocida';
};

// Helper function to get entity type label
export const getEntityTypeLabel = (entityType: EntityType): string => {
  const labels = {
    supplier: 'Proveedor',
    company: 'Empresa/Servicio',
    utility: 'Servicios Públicos',
    institution: 'Institución',
    general: 'General'
  };
  return labels[entityType] || entityType;
};