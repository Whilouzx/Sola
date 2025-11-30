import { getSupabaseClient } from '@/lib/supabase';
import { BankAccount, BankTransaction, ExchangeRate } from '@/types/banks';
import { toast } from 'sonner';

// =====================================================
// BANK ACCOUNTS FUNCTIONS
// =====================================================

export async function loadBankAccounts(): Promise<BankAccount[]> {
  const client = getSupabaseClient();
  if (!client) {
    console.log('⚠️ Supabase not available - returning empty array');
    return [];
  }

  try {
    const { data, error } = await client
      .from('bank_accounts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error loading bank accounts:', error);
      throw error;
    }

    // Map database fields to TypeScript interface
    const accounts: BankAccount[] = (data || []).map(account => ({
      id: account.id,
      name: account.name,
      accountNumber: account.account_number || '',
      accountType: account.account_type,
      currency: account.currency,
      balance: parseFloat(account.balance || 0),
      isActive: account.is_active,
      bankCode: account.bank_code || undefined,
      phone: account.phone || undefined,
      email: account.email || undefined,
      createdAt: account.created_at,
      updatedAt: account.updated_at
    }));

    console.log(`✅ Loaded ${accounts.length} bank accounts from Supabase`);
    return accounts;
  } catch (error) {
    console.error('❌ Error in loadBankAccounts:', error);
    return [];
  }
}

export async function createBankAccount(accountData: Omit<BankAccount, 'id' | 'createdAt' | 'updatedAt'>): Promise<BankAccount | null> {
  const client = getSupabaseClient();
  if (!client) {
    toast.error('Supabase no disponible - cuenta no guardada');
    return null;
  }

  try {
    const { data, error } = await client
      .from('bank_accounts')
      .insert([{
        name: accountData.name,
        account_number: accountData.accountNumber,
        account_type: accountData.accountType,
        currency: accountData.currency,
        balance: accountData.balance,
        is_active: accountData.isActive,
        bank_code: accountData.bankCode || null,
        phone: accountData.phone || null,
        email: accountData.email || null
      }])
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating bank account:', error);
      toast.error(`Error creando cuenta: ${error.message}`);
      return null;
    }

    const newAccount: BankAccount = {
      id: data.id,
      name: data.name,
      accountNumber: data.account_number || '',
      accountType: data.account_type,
      currency: data.currency,
      balance: parseFloat(data.balance || 0),
      isActive: data.is_active,
      bankCode: data.bank_code || undefined,
      phone: data.phone || undefined,
      email: data.email || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };

    console.log('✅ Bank account created in Supabase:', newAccount.id);
    toast.success('Cuenta bancaria creada exitosamente');
    return newAccount;
  } catch (error) {
    console.error('❌ Error in createBankAccount:', error);
    toast.error('Error creando cuenta bancaria');
    return null;
  }
}

export async function updateBankAccount(account: BankAccount): Promise<BankAccount | null> {
  const client = getSupabaseClient();
  if (!client) {
    toast.error('Supabase no disponible - cuenta no actualizada');
    return null;
  }

  try {
    const { data, error } = await client
      .from('bank_accounts')
      .update({
        name: account.name,
        account_number: account.accountNumber,
        account_type: account.accountType,
        currency: account.currency,
        balance: account.balance,
        is_active: account.isActive,
        bank_code: account.bankCode || null,
        phone: account.phone || null,
        email: account.email || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', account.id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating bank account:', error);
      toast.error(`Error actualizando cuenta: ${error.message}`);
      return null;
    }

    const updatedAccount: BankAccount = {
      id: data.id,
      name: data.name,
      accountNumber: data.account_number || '',
      accountType: data.account_type,
      currency: data.currency,
      balance: parseFloat(data.balance || 0),
      isActive: data.is_active,
      bankCode: data.bank_code || undefined,
      phone: data.phone || undefined,
      email: data.email || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };

    console.log('✅ Bank account updated in Supabase:', updatedAccount.id);
    toast.success('Cuenta bancaria actualizada exitosamente');
    return updatedAccount;
  } catch (error) {
    console.error('❌ Error in updateBankAccount:', error);
    toast.error('Error actualizando cuenta bancaria');
    return null;
  }
}

// =====================================================
// BANK TRANSACTIONS FUNCTIONS
// =====================================================

export async function loadBankTransactions(): Promise<BankTransaction[]> {
  const client = getSupabaseClient();
  if (!client) {
    console.log('⚠️ Supabase not available - returning empty array');
    return [];
  }

  try {
    const { data, error } = await client
      .from('bank_transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error loading bank transactions:', error);
      throw error;
    }

    // Map database fields to TypeScript interface
    const transactions: BankTransaction[] = (data || []).map(transaction => ({
      id: transaction.id,
      accountId: transaction.account_id,
      saleId: transaction.sale_id || undefined,
      type: transaction.type,
      amount: parseFloat(transaction.amount || 0),
      currency: transaction.currency,
      reference: transaction.reference,
      description: transaction.description || '',
      paymentMethod: transaction.payment_method,
      phoneNumber: transaction.phone_number || undefined,
      bankCode: transaction.bank_code || undefined,
      zelleEmail: transaction.zelle_email || undefined,
      zellePhone: transaction.zelle_phone || undefined,
      createdAt: transaction.created_at
    }));

    console.log(`✅ Loaded ${transactions.length} bank transactions from Supabase`);
    return transactions;
  } catch (error) {
    console.error('❌ Error in loadBankTransactions:', error);
    return [];
  }
}

export async function createBankTransaction(transactionData: Omit<BankTransaction, 'id' | 'createdAt'>): Promise<BankTransaction | null> {
  const client = getSupabaseClient();
  if (!client) {
    toast.error('Supabase no disponible - transacción no guardada');
    return null;
  }

  try {
    const { data, error } = await client
      .from('bank_transactions')
      .insert([{
        account_id: transactionData.accountId,
        sale_id: transactionData.saleId || null,
        type: transactionData.type,
        amount: transactionData.amount,
        currency: transactionData.currency,
        reference: transactionData.reference,
        description: transactionData.description,
        payment_method: transactionData.paymentMethod,
        phone_number: transactionData.phoneNumber || null,
        bank_code: transactionData.bankCode || null,
        zelle_email: transactionData.zelleEmail || null,
        zelle_phone: transactionData.zellePhone || null
      }])
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating bank transaction:', error);
      toast.error(`Error creando transacción: ${error.message}`);
      return null;
    }

    const newTransaction: BankTransaction = {
      id: data.id,
      accountId: data.account_id,
      saleId: data.sale_id || undefined,
      type: data.type,
      amount: parseFloat(data.amount || 0),
      currency: data.currency,
      reference: data.reference,
      description: data.description || '',
      paymentMethod: data.payment_method,
      phoneNumber: data.phone_number || undefined,
      bankCode: data.bank_code || undefined,
      zelleEmail: data.zelle_email || undefined,
      zellePhone: data.zelle_phone || undefined,
      createdAt: data.created_at
    };

    console.log('✅ Bank transaction created in Supabase:', newTransaction.id);
    toast.success('Transacción registrada exitosamente');
    return newTransaction;
  } catch (error) {
    console.error('❌ Error in createBankTransaction:', error);
    toast.error('Error registrando transacción');
    return null;
  }
}

// =====================================================
// EXCHANGE RATES FUNCTIONS
// =====================================================

export async function loadExchangeRates(): Promise<ExchangeRate[]> {
  const client = getSupabaseClient();
  if (!client) {
    console.log('⚠️ Supabase not available - returning empty array');
    return [];
  }

  try {
    const { data, error } = await client
      .from('exchange_rates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error loading exchange rates:', error);
      throw error;
    }

    // Map database fields to TypeScript interface
    const rates: ExchangeRate[] = (data || []).map(rate => ({
      id: rate.id,
      usdToVes: parseFloat(rate.usd_to_ves || 0),
      source: rate.source,
      isActive: rate.is_active,
      createdAt: rate.created_at
    }));

    console.log(`✅ Loaded ${rates.length} exchange rates from Supabase`);
    return rates;
  } catch (error) {
    console.error('❌ Error in loadExchangeRates:', error);
    return [];
  }
}

export async function getCurrentExchangeRateFromSupabase(): Promise<ExchangeRate | null> {
  const client = getSupabaseClient();
  if (!client) {
    console.log('⚠️ Supabase not available - returning null');
    return null;
  }

  try {
    const { data, error } = await client
      .from('exchange_rates')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('❌ Error loading current exchange rate:', error);
      return null;
    }

    const rate: ExchangeRate = {
      id: data.id,
      usdToVes: parseFloat(data.usd_to_ves || 0),
      source: data.source,
      isActive: data.is_active,
      createdAt: data.created_at
    };

    console.log('✅ Loaded current exchange rate from Supabase:', rate.usdToVes);
    return rate;
  } catch (error) {
    console.error('❌ Error in getCurrentExchangeRateFromSupabase:', error);
    return null;
  }
}

export async function createExchangeRate(rateData: { usdToVes: number; source: string }): Promise<ExchangeRate | null> {
  const client = getSupabaseClient();
  if (!client) {
    toast.error('Supabase no disponible - tasa no guardada');
    return null;
  }

  try {
    // First, deactivate all existing rates
    await client
      .from('exchange_rates')
      .update({ is_active: false })
      .neq('id', '00000000-0000-0000-0000-000000000000');

    // Then create new active rate
    const { data, error } = await client
      .from('exchange_rates')
      .insert([{
        usd_to_ves: rateData.usdToVes,
        source: rateData.source,
        is_active: true
      }])
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating exchange rate:', error);
      toast.error(`Error creando tasa: ${error.message}`);
      return null;
    }

    const newRate: ExchangeRate = {
      id: data.id,
      usdToVes: parseFloat(data.usd_to_ves || 0),
      source: data.source,
      isActive: data.is_active,
      createdAt: data.created_at
    };

    console.log('✅ Exchange rate created in Supabase:', newRate.usdToVes);
    toast.success('Tasa de cambio actualizada exitosamente');
    return newRate;
  } catch (error) {
    console.error('❌ Error in createExchangeRate:', error);
    toast.error('Error actualizando tasa de cambio');
    return null;
  }
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

export async function getBankingStats(): Promise<{
  totalAccounts: number;
  activeAccounts: number;
  totalVES: number;
  totalUSD: number;
  todayTransactions: number;
  todayIncome: number;
} | null> {
  const client = getSupabaseClient();
  if (!client) {
    console.log('⚠️ Supabase not available - returning null');
    return null;
  }

  try {
    const { data, error } = await client.rpc('get_banking_stats');

    if (error) {
      console.error('❌ Error getting banking stats:', error);
      return null;
    }

    if (!data || data.length === 0) {
      return {
        totalAccounts: 0,
        activeAccounts: 0,
        totalVES: 0,
        totalUSD: 0,
        todayTransactions: 0,
        todayIncome: 0
      };
    }

    const stats = data[0];
    return {
      totalAccounts: stats.total_accounts || 0,
      activeAccounts: stats.active_accounts || 0,
      totalVES: parseFloat(stats.total_ves || 0),
      totalUSD: parseFloat(stats.total_usd || 0),
      todayTransactions: stats.today_transactions || 0,
      todayIncome: parseFloat(stats.today_income || 0)
    };
  } catch (error) {
    console.error('❌ Error in getBankingStats:', error);
    return null;
  }
}

// =====================================================
// CONNECTION TEST
// =====================================================

export async function testBanksConnection(): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) {
    console.log('⚠️ Supabase client not available');
    return false;
  }

  try {
    const { data, error } = await client
      .from('exchange_rates')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Banks connection test failed:', error);
      return false;
    }

    console.log('✅ Banks connection test successful');
    return true;
  } catch (error) {
    console.error('❌ Banks connection test error:', error);
    return false;
  }
}

export async function deleteBankAccount(accountId: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) {
    toast.error('Supabase no disponible - cuenta no eliminada');
    return false;
  }

  try {
    // First check if there are any transactions for this account
    const { data: transactions, error: transactionError } = await client
      .from('bank_transactions')
      .select('id')
      .eq('account_id', accountId)
      .limit(1);

    if (transactionError) {
      console.error('❌ Error checking transactions:', transactionError);
      toast.error('Error verificando transacciones asociadas');
      return false;
    }

    if (transactions && transactions.length > 0) {
      toast.error('No se puede eliminar la cuenta porque tiene transacciones asociadas');
      return false;
    }

    // Delete the account
    const { error } = await client
      .from('bank_accounts')
      .delete()
      .eq('id', accountId);

    if (error) {
      console.error('❌ Error deleting bank account:', error);
      toast.error(`Error eliminando cuenta: ${error.message}`);
      return false;
    }

    console.log('✅ Bank account deleted from Supabase:', accountId);
    toast.success('Cuenta bancaria eliminada exitosamente');
    return true;
  } catch (error) {
    console.error('❌ Error in deleteBankAccount:', error);
    toast.error('Error eliminando cuenta bancaria');
    return false;
  }
}
