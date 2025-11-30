import { getSupabaseClient } from '@/lib/supabase';
import { 
  Payment, 
  PaymentData, 
  ZellePaymentData, 
  DatabasePayment,
  PaymentMethod
} from '@/types/accounts';
import { validateZelleEmail, validateZellePhone } from './utils';

// Convert database payment to app payment
const convertPaymentFromDB = (dbPayment: DatabasePayment): Payment => ({
  id: dbPayment.id,
  accountId: dbPayment.account_id,
  accountType: dbPayment.account_type as 'receivable' | 'payable',
  amount: dbPayment.amount,
  currency: dbPayment.currency as 'USD' | 'VES',
  paymentMethod: dbPayment.payment_method as PaymentMethod,
  reference: dbPayment.reference,
  zelleEmail: dbPayment.zelle_email,
  zellePhone: dbPayment.zelle_phone,
  notes: dbPayment.notes,
  processedAt: dbPayment.processed_at,
  createdAt: dbPayment.created_at,
});

// Convert app payment data to database format
const convertPaymentToDB = (payment: PaymentData) => ({
  account_id: payment.accountId,
  account_type: payment.accountType,
  amount: payment.amount,
  currency: payment.currency,
  payment_method: payment.paymentMethod,
  reference: payment.reference,
  zelle_email: payment.zelleEmail,
  zelle_phone: payment.zellePhone,
  notes: payment.notes,
});

export const recordPayment = async (paymentData: PaymentData): Promise<Payment> => {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Cliente Supabase no disponible');
  }

  try {
    console.log('🔄 Registrando pago...', paymentData);

    // Validate Zelle data if it's a Zelle payment
    if (paymentData.paymentMethod === 'zelle') {
      if (!paymentData.zelleEmail && !paymentData.zellePhone) {
        throw new Error('Se requiere email o teléfono para pagos Zelle');
      }
      
      if (paymentData.zelleEmail && !validateZelleEmail(paymentData.zelleEmail)) {
        throw new Error('Email de Zelle inválido');
      }
      
      if (paymentData.zellePhone && !validateZellePhone(paymentData.zellePhone)) {
        throw new Error('Teléfono de Zelle inválido');
      }
    }

    const { data, error } = await client
      .from('payments')
      .insert(convertPaymentToDB(paymentData))
      .select()
      .single();

    if (error) {
      console.error('❌ Error registrando pago:', error);
      throw new Error(`Error registrando pago: ${error.message}`);
    }

    console.log('✅ Pago registrado exitosamente:', data);
    return convertPaymentFromDB(data);
  } catch (error) {
    console.error('❌ Error en recordPayment:', error);
    throw error;
  }
};

export const processZellePayment = async (
  accountId: string,
  accountType: 'receivable' | 'payable',
  zelleData: ZellePaymentData
): Promise<Payment> => {
  const paymentData: PaymentData = {
    accountId,
    accountType,
    amount: zelleData.amount,
    currency: zelleData.currency,
    paymentMethod: 'zelle',
    zelleEmail: zelleData.zelleEmail,
    zellePhone: zelleData.zellePhone,
    reference: zelleData.reference,
    notes: zelleData.notes,
  };

  return recordPayment(paymentData);
};

export const getPaymentHistory = async (accountId: string, accountType: 'receivable' | 'payable'): Promise<Payment[]> => {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Cliente Supabase no disponible');
  }

  try {
    console.log('🔄 Obteniendo historial de pagos...', { accountId, accountType });

    const { data, error } = await client
      .from('payments')
      .select('*')
      .eq('account_id', accountId)
      .eq('account_type', accountType)
      .order('processed_at', { ascending: false });

    if (error) {
      console.error('❌ Error obteniendo historial de pagos:', error);
      throw new Error(`Error obteniendo historial de pagos: ${error.message}`);
    }

    console.log(`✅ Obtenidos ${data?.length || 0} pagos`);
    return data?.map(convertPaymentFromDB) || [];
  } catch (error) {
    console.error('❌ Error en getPaymentHistory:', error);
    throw error;
  }
};

export const getPaymentById = async (paymentId: string): Promise<Payment | null> => {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Cliente Supabase no disponible');
  }

  try {
    console.log('🔄 Obteniendo pago por ID:', paymentId);

    const { data, error } = await client
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Payment not found
      }
      console.error('❌ Error obteniendo pago:', error);
      throw new Error(`Error obteniendo pago: ${error.message}`);
    }

    console.log('✅ Pago obtenido exitosamente:', data);
    return convertPaymentFromDB(data);
  } catch (error) {
    console.error('❌ Error en getPaymentById:', error);
    throw error;
  }
};

export const deletePayment = async (paymentId: string): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Cliente Supabase no disponible');
  }

  try {
    console.log('🔄 Eliminando pago:', paymentId);

    const { error } = await client
      .from('payments')
      .delete()
      .eq('id', paymentId);

    if (error) {
      console.error('❌ Error eliminando pago:', error);
      throw new Error(`Error eliminando pago: ${error.message}`);
    }

    console.log('✅ Pago eliminado exitosamente');
    return true;
  } catch (error) {
    console.error('❌ Error en deletePayment:', error);
    throw error;
  }
};

export const getTotalPayments = async (
  accountId: string, 
  accountType: 'receivable' | 'payable',
  currency?: 'USD' | 'VES'
): Promise<number> => {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Cliente Supabase no disponible');
  }

  try {
    console.log('🔄 Calculando total de pagos...', { accountId, accountType, currency });

    let query = client
      .from('payments')
      .select('amount')
      .eq('account_id', accountId)
      .eq('account_type', accountType);

    if (currency) {
      query = query.eq('currency', currency);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Error calculando total de pagos:', error);
      throw new Error(`Error calculando total de pagos: ${error.message}`);
    }

    const total = data?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
    console.log(`✅ Total calculado: ${total}`);
    return total;
  } catch (error) {
    console.error('❌ Error en getTotalPayments:', error);
    throw error;
  }
};

export const validateZelleReference = (reference: string): boolean => {
  // Basic validation for Zelle reference
  // Should be alphanumeric and between 6-20 characters
  const referenceRegex = /^[a-zA-Z0-9]{6,20}$/;
  return referenceRegex.test(reference);
};

export const getPaymentMethods = (): { value: PaymentMethod; label: string; icon: string }[] => {
  return [
    { value: 'usd', label: 'Dólares (USD)', icon: 'DollarSign' },
    { value: 'ves', label: 'Bolívares (VES)', icon: 'Smartphone' },
    { value: 'mixed', label: 'Mixto (USD + VES)', icon: 'CreditCard' },
    { value: 'zelle', label: 'Zelle', icon: 'Zap' },
  ];
};

export const getPaymentMethodLabel = (method: PaymentMethod): string => {
  const methods = getPaymentMethods();
  return methods.find(m => m.value === method)?.label || method;
};