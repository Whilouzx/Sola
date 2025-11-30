import { getSupabaseClient } from '@/lib/supabase';
import { 
  Expense, 
  ExpenseData, 
  DatabaseExpense,
  ExpenseFilters
} from '@/types/accounts';

// Convert database expense to app expense
const convertExpenseFromDB = (dbExpense: DatabaseExpense & { suppliers?: { name: string } }): Expense => ({
  id: dbExpense.id,
  category: dbExpense.category,
  amount: dbExpense.amount,
  currency: dbExpense.currency as 'USD' | 'VES',
  description: dbExpense.description,
  supplierId: dbExpense.supplier_id,
  supplierName: dbExpense.suppliers?.name,
  receiptUrl: dbExpense.receipt_url,
  isRecurring: dbExpense.is_recurring,
  createdAt: dbExpense.created_at,
  updatedAt: dbExpense.updated_at,
});

// Convert app expense data to database format
const convertExpenseToDB = (expense: ExpenseData) => ({
  category: expense.category,
  amount: expense.amount,
  currency: expense.currency,
  description: expense.description,
  supplier_id: expense.supplierId,
  receipt_url: expense.receiptUrl,
  is_recurring: expense.isRecurring,
});

export const createExpense = async (expenseData: ExpenseData): Promise<Expense> => {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Cliente Supabase no disponible');
  }

  try {
    console.log('🔄 Creando gasto...', expenseData);

    const { data, error } = await client
      .from('expenses')
      .insert(convertExpenseToDB(expenseData))
      .select(`
        *,
        suppliers (name)
      `)
      .single();

    if (error) {
      console.error('❌ Error creando gasto:', error);
      throw new Error(`Error creando gasto: ${error.message}`);
    }

    console.log('✅ Gasto creado exitosamente:', data);
    return convertExpenseFromDB(data);
  } catch (error) {
    console.error('❌ Error en createExpense:', error);
    throw error;
  }
};

export const getExpenses = async (filters?: ExpenseFilters): Promise<Expense[]> => {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Cliente Supabase no disponible');
  }

  try {
    console.log('🔄 Obteniendo gastos...', filters);

    let query = client
      .from('expenses')
      .select(`
        *,
        suppliers (name)
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    if (filters?.currency) {
      query = query.eq('currency', filters.currency);
    }
    if (filters?.supplierId) {
      query = query.eq('supplier_id', filters.supplierId);
    }
    if (filters?.isRecurring !== undefined) {
      query = query.eq('is_recurring', filters.isRecurring);
    }
    if (filters?.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }
    if (filters?.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Error obteniendo gastos:', error);
      throw new Error(`Error obteniendo gastos: ${error.message}`);
    }

    console.log(`✅ Obtenidos ${data?.length || 0} gastos`);
    return data?.map(convertExpenseFromDB) || [];
  } catch (error) {
    console.error('❌ Error en getExpenses:', error);
    throw error;
  }
};

export const getExpenseById = async (expenseId: string): Promise<Expense | null> => {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Cliente Supabase no disponible');
  }

  try {
    console.log('🔄 Obteniendo gasto por ID:', expenseId);

    const { data, error } = await client
      .from('expenses')
      .select(`
        *,
        suppliers (name)
      `)
      .eq('id', expenseId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Expense not found
      }
      console.error('❌ Error obteniendo gasto:', error);
      throw new Error(`Error obteniendo gasto: ${error.message}`);
    }

    console.log('✅ Gasto obtenido exitosamente:', data);
    return convertExpenseFromDB(data);
  } catch (error) {
    console.error('❌ Error en getExpenseById:', error);
    throw error;
  }
};

export const updateExpense = async (expenseId: string, updateData: Partial<ExpenseData>): Promise<Expense> => {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Cliente Supabase no disponible');
  }

  try {
    console.log('🔄 Actualizando gasto:', expenseId, updateData);

    const dbUpdateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (updateData.category !== undefined) dbUpdateData.category = updateData.category;
    if (updateData.amount !== undefined) dbUpdateData.amount = updateData.amount;
    if (updateData.currency !== undefined) dbUpdateData.currency = updateData.currency;
    if (updateData.description !== undefined) dbUpdateData.description = updateData.description;
    if (updateData.supplierId !== undefined) dbUpdateData.supplier_id = updateData.supplierId;
    if (updateData.receiptUrl !== undefined) dbUpdateData.receipt_url = updateData.receiptUrl;
    if (updateData.isRecurring !== undefined) dbUpdateData.is_recurring = updateData.isRecurring;

    const { data, error } = await client
      .from('expenses')
      .update(dbUpdateData)
      .eq('id', expenseId)
      .select(`
        *,
        suppliers (name)
      `)
      .single();

    if (error) {
      console.error('❌ Error actualizando gasto:', error);
      throw new Error(`Error actualizando gasto: ${error.message}`);
    }

    console.log('✅ Gasto actualizado exitosamente:', data);
    return convertExpenseFromDB(data);
  } catch (error) {
    console.error('❌ Error en updateExpense:', error);
    throw error;
  }
};

export const deleteExpense = async (expenseId: string): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Cliente Supabase no disponible');
  }

  try {
    console.log('🔄 Eliminando gasto:', expenseId);

    const { error } = await client
      .from('expenses')
      .delete()
      .eq('id', expenseId);

    if (error) {
      console.error('❌ Error eliminando gasto:', error);
      throw new Error(`Error eliminando gasto: ${error.message}`);
    }

    console.log('✅ Gasto eliminado exitosamente');
    return true;
  } catch (error) {
    console.error('❌ Error en deleteExpense:', error);
    throw error;
  }
};

export const getExpenseCategories = async (): Promise<string[]> => {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Cliente Supabase no disponible');
  }

  try {
    console.log('🔄 Obteniendo categorías de gastos...');

    const { data, error } = await client
      .from('expenses')
      .select('category')
      .order('category', { ascending: true });

    if (error) {
      console.error('❌ Error obteniendo categorías:', error);
      throw new Error(`Error obteniendo categorías: ${error.message}`);
    }

    // Get unique categories
    const categories = [...new Set(data?.map(item => item.category) || [])];
    console.log(`✅ Obtenidas ${categories.length} categorías`);
    return categories;
  } catch (error) {
    console.error('❌ Error en getExpenseCategories:', error);
    throw error;
  }
};

export const getExpensesSummary = async (
  dateFrom?: string, 
  dateTo?: string
): Promise<{ category: string; total: number; currency: 'USD' | 'VES' }[]> => {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Cliente Supabase no disponible');
  }

  try {
    console.log('🔄 Generando resumen de gastos...', { dateFrom, dateTo });

    let query = client
      .from('expenses')
      .select('category, amount, currency');

    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }
    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Error generando resumen:', error);
      throw new Error(`Error generando resumen: ${error.message}`);
    }

    // Group by category and currency
    const summary = new Map<string, { usd: number; ves: number }>();

    data?.forEach((expense) => {
      const key = expense.category;
      if (!summary.has(key)) {
        summary.set(key, { usd: 0, ves: 0 });
      }
      
      const categoryData = summary.get(key)!;
      if (expense.currency === 'USD') {
        categoryData.usd += expense.amount;
      } else {
        categoryData.ves += expense.amount;
      }
    });

    // Convert to array format
    const result: { category: string; total: number; currency: 'USD' | 'VES' }[] = [];
    
    summary.forEach((amounts, category) => {
      if (amounts.usd > 0) {
        result.push({ category, total: amounts.usd, currency: 'USD' });
      }
      if (amounts.ves > 0) {
        result.push({ category, total: amounts.ves, currency: 'VES' });
      }
    });

    console.log(`✅ Resumen generado con ${result.length} elementos`);
    return result;
  } catch (error) {
    console.error('❌ Error en getExpensesSummary:', error);
    throw error;
  }
};

export const getRecurringExpenses = async (): Promise<Expense[]> => {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Cliente Supabase no disponible');
  }

  try {
    console.log('🔄 Obteniendo gastos recurrentes...');

    const { data, error } = await client
      .from('expenses')
      .select(`
        *,
        suppliers (name)
      `)
      .eq('is_recurring', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error obteniendo gastos recurrentes:', error);
      throw new Error(`Error obteniendo gastos recurrentes: ${error.message}`);
    }

    console.log(`✅ Obtenidos ${data?.length || 0} gastos recurrentes`);
    return data?.map(convertExpenseFromDB) || [];
  } catch (error) {
    console.error('❌ Error en getRecurringExpenses:', error);
    throw error;
  }
};