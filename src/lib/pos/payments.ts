// Payment Management API
// Implementation of partial payments, payment plans, and installment tracking

import { getSupabaseClient } from '@/lib/supabase';
import {
  PaymentPlan,
  PaymentInstallment,
  PartialPayment,
  CreatePaymentPlanRequest,
  ProcessPartialPaymentRequest,
  PaymentFilters,
  PaymentSummary,
  PaginatedResponse
} from '@/types/pos';

// Payment Plan Management
export const createPaymentPlan = async (request: CreatePaymentPlanRequest): Promise<PaymentPlan> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not available');

  // Calculate installment dates and amounts
  const installmentAmount = request.totalAmount / request.numberOfInstallments;
  const installments: Omit<PaymentInstallment, 'id' | 'paymentPlanId'>[] = [];

  for (let i = 0; i < request.numberOfInstallments; i++) {
    const dueDate = new Date(request.firstPaymentDate);
    
    // Calculate due date based on frequency
    switch (request.installmentFrequency) {
      case 'weekly':
        dueDate.setDate(dueDate.getDate() + (i * 7));
        break;
      case 'biweekly':
        dueDate.setDate(dueDate.getDate() + (i * 14));
        break;
      case 'monthly':
        dueDate.setMonth(dueDate.getMonth() + i);
        break;
    }

    installments.push({
      installmentNumber: i + 1,
      dueDate: dueDate.toISOString(),
      amount: installmentAmount,
      paidAmount: 0,
      status: 'pending'
    });
  }

  // Create payment plan
  const { data: planData, error: planError } = await client
    .from('payment_plans')
    .insert({
      sale_id: request.saleId,
      customer_id: request.customerId,
      total_amount: request.totalAmount,
      currency: request.currency,
      status: 'active'
    })
    .select()
    .single();

  if (planError) throw new Error(`Error creating payment plan: ${planError.message}`);

  // Create installments
  const installmentData = installments.map(installment => ({
    payment_plan_id: planData.id,
    installment_number: installment.installmentNumber,
    due_date: installment.dueDate,
    amount: installment.amount,
    paid_amount: installment.paidAmount,
    status: installment.status
  }));

  const { data: installmentsData, error: installmentsError } = await client
    .from('payment_installments')
    .insert(installmentData)
    .select();

  if (installmentsError) throw new Error(`Error creating installments: ${installmentsError.message}`);

  return mapPaymentPlanFromDB(planData, installmentsData);
};

export const getPaymentPlans = async (filters?: PaymentFilters): Promise<PaginatedResponse<PaymentPlan>> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not available');

  let query = client
    .from('payment_plans')
    .select(`
      *,
      payment_installments (*)
    `, { count: 'exact' });

  // Apply filters
  if (filters?.saleId) {
    query = query.eq('sale_id', filters.saleId);
  }
  if (filters?.customerId) {
    query = query.eq('customer_id', filters.customerId);
  }
  if (filters?.currency) {
    query = query.eq('currency', filters.currency);
  }
  if (filters?.dateFrom) {
    query = query.gte('created_at', filters.dateFrom);
  }
  if (filters?.dateTo) {
    query = query.lte('created_at', filters.dateTo);
  }

  // Pagination
  const limit = filters?.limit || 50;
  const offset = filters?.offset || 0;
  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) throw new Error(`Error fetching payment plans: ${error.message}`);

  const paymentPlans = data?.map(item => mapPaymentPlanFromDB(item, item.payment_installments)) || [];

  return {
    data: paymentPlans,
    total: count || 0,
    page: Math.floor(offset / limit) + 1,
    limit,
    hasMore: (count || 0) > offset + limit
  };
};

export const getPaymentPlanById = async (id: string): Promise<PaymentPlan | null> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not available');

  const { data, error } = await client
    .from('payment_plans')
    .select(`
      *,
      payment_installments (*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Error fetching payment plan: ${error.message}`);
  }

  return mapPaymentPlanFromDB(data, data.payment_installments);
};

// Partial Payment Processing
export const processPartialPayment = async (request: ProcessPartialPaymentRequest): Promise<PartialPayment> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not available');

  const { data, error } = await client
    .from('partial_payments')
    .insert({
      sale_id: request.saleId,
      amount: request.amount,
      currency: request.currency,
      payment_method: request.paymentMethod,
      reference: request.reference,
      notes: request.notes,
      processed_by: 'current_user', // This should come from auth context
      processed_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw new Error(`Error processing payment: ${error.message}`);

  return {
    id: data.id,
    saleId: data.sale_id,
    amount: data.amount,
    currency: data.currency,
    paymentMethod: data.payment_method,
    reference: data.reference,
    notes: data.notes,
    processedBy: data.processed_by,
    processedAt: data.processed_at
  };
};

export const getPartialPayments = async (filters?: PaymentFilters): Promise<PaginatedResponse<PartialPayment>> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not available');

  let query = client
    .from('partial_payments')
    .select('*', { count: 'exact' });

  // Apply filters
  if (filters?.saleId) {
    query = query.eq('sale_id', filters.saleId);
  }
  if (filters?.customerId) {
    // This would require joining with sales table
    // For now, we'll handle this in the application layer
  }
  if (filters?.paymentMethod) {
    query = query.eq('payment_method', filters.paymentMethod);
  }
  if (filters?.currency) {
    query = query.eq('currency', filters.currency);
  }
  if (filters?.dateFrom) {
    query = query.gte('processed_at', filters.dateFrom);
  }
  if (filters?.dateTo) {
    query = query.lte('processed_at', filters.dateTo);
  }

  // Pagination
  const limit = filters?.limit || 50;
  const offset = filters?.offset || 0;
  query = query
    .order('processed_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) throw new Error(`Error fetching partial payments: ${error.message}`);

  const payments = data?.map(item => ({
    id: item.id,
    saleId: item.sale_id,
    amount: item.amount,
    currency: item.currency,
    paymentMethod: item.payment_method,
    reference: item.reference,
    notes: item.notes,
    processedBy: item.processed_by,
    processedAt: item.processed_at
  })) || [];

  return {
    data: payments,
    total: count || 0,
    page: Math.floor(offset / limit) + 1,
    limit,
    hasMore: (count || 0) > offset + limit
  };
};

// Installment Payment Processing
export const processInstallmentPayment = async (
  installmentId: string,
  amount: number,
  paymentMethod: string,
  reference?: string
): Promise<PaymentInstallment> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not available');

  // Get current installment
  const { data: installment, error: fetchError } = await client
    .from('payment_installments')
    .select('*')
    .eq('id', installmentId)
    .single();

  if (fetchError) throw new Error(`Error fetching installment: ${fetchError.message}`);

  const newPaidAmount = installment.paid_amount + amount;
  const newStatus = newPaidAmount >= installment.amount ? 'paid' : 'partial';

  const { data, error } = await client
    .from('payment_installments')
    .update({
      paid_amount: newPaidAmount,
      status: newStatus,
      paid_at: newStatus === 'paid' ? new Date().toISOString() : installment.paid_at,
      payment_method: paymentMethod,
      transaction_reference: reference,
      updated_at: new Date().toISOString()
    })
    .eq('id', installmentId)
    .select()
    .single();

  if (error) throw new Error(`Error updating installment: ${error.message}`);

  // Check if payment plan is completed
  await checkPaymentPlanCompletion(installment.payment_plan_id);

  return {
    id: data.id,
    paymentPlanId: data.payment_plan_id,
    installmentNumber: data.installment_number,
    dueDate: data.due_date,
    amount: data.amount,
    paidAmount: data.paid_amount,
    status: data.status,
    paidAt: data.paid_at,
    paymentMethod: data.payment_method,
    transactionReference: data.transaction_reference,
    notes: data.notes
  };
};

// Payment Plan Status Management
const checkPaymentPlanCompletion = async (paymentPlanId: string): Promise<void> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not available');

  const { data: installments, error } = await client
    .from('payment_installments')
    .select('status')
    .eq('payment_plan_id', paymentPlanId);

  if (error) throw new Error(`Error checking installments: ${error.message}`);

  const allPaid = installments?.every(installment => installment.status === 'paid');

  if (allPaid) {
    await client
      .from('payment_plans')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentPlanId);
  }
};

export const getOverdueInstallments = async (): Promise<PaymentInstallment[]> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not available');

  const { data, error } = await client
    .from('payment_installments')
    .select(`
      *,
      payment_plans (
        sale_id,
        customer_id
      )
    `)
    .lt('due_date', new Date().toISOString())
    .in('status', ['pending', 'partial'])
    .order('due_date');

  if (error) throw new Error(`Error fetching overdue installments: ${error.message}`);

  return data?.map(item => ({
    id: item.id,
    paymentPlanId: item.payment_plan_id,
    installmentNumber: item.installment_number,
    dueDate: item.due_date,
    amount: item.amount,
    paidAmount: item.paid_amount,
    status: item.status,
    paidAt: item.paid_at,
    paymentMethod: item.payment_method,
    transactionReference: item.transaction_reference,
    notes: item.notes
  })) || [];
};

export const markInstallmentOverdue = async (): Promise<number> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not available');

  const { data, error } = await client
    .from('payment_installments')
    .update({
      status: 'overdue',
      updated_at: new Date().toISOString()
    })
    .lt('due_date', new Date().toISOString())
    .eq('status', 'pending')
    .select('id');

  if (error) throw new Error(`Error marking overdue installments: ${error.message}`);

  return data?.length || 0;
};

// Payment Analytics
export const getPaymentSummary = async (filters?: Pick<PaymentFilters, 'dateFrom' | 'dateTo' | 'customerId'>): Promise<PaymentSummary> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not available');

  // Get partial payments summary
  let paymentsQuery = client
    .from('partial_payments')
    .select('amount, currency, payment_method');

  if (filters?.dateFrom) {
    paymentsQuery = paymentsQuery.gte('processed_at', filters.dateFrom);
  }
  if (filters?.dateTo) {
    paymentsQuery = paymentsQuery.lte('processed_at', filters.dateTo);
  }

  const { data: payments, error: paymentsError } = await paymentsQuery;

  if (paymentsError) throw new Error(`Error fetching payments summary: ${paymentsError.message}`);

  // Get outstanding balance from payment plans
  let plansQuery = client
    .from('payment_plans')
    .select(`
      total_amount,
      currency,
      payment_installments (
        amount,
        paid_amount,
        status
      )
    `)
    .in('status', ['active']);

  if (filters?.customerId) {
    plansQuery = plansQuery.eq('customer_id', filters.customerId);
  }

  const { data: plans, error: plansError } = await plansQuery;

  if (plansError) throw new Error(`Error fetching plans summary: ${plansError.message}`);

  // Calculate totals
  const totalAmount = { usd: 0, ves: 0 };
  const paymentMethods: Record<string, number> = {};

  payments?.forEach(payment => {
    if (payment.currency === 'USD') {
      totalAmount.usd += payment.amount;
    } else {
      totalAmount.ves += payment.amount;
    }
    
    paymentMethods[payment.payment_method] = (paymentMethods[payment.payment_method] || 0) + 1;
  });

  // Calculate outstanding balance
  const outstandingBalance = { usd: 0, ves: 0 };
  let overduePayments = 0;

  plans?.forEach(plan => {
    const totalPaid = plan.payment_installments?.reduce((sum: number, installment: unknown) => 
      sum + installment.paid_amount, 0) || 0;
    const outstanding = plan.total_amount - totalPaid;
    
    if (outstanding > 0) {
      if (plan.currency === 'USD') {
        outstandingBalance.usd += outstanding;
      } else {
        outstandingBalance.ves += outstanding;
      }
    }

    // Count overdue installments
    const overdue = plan.payment_installments?.filter((installment: unknown) => 
      installment.status === 'overdue').length || 0;
    overduePayments += overdue;
  });

  return {
    totalPayments: payments?.length || 0,
    totalAmount,
    outstandingBalance,
    overduePayments,
    paymentMethods
  };
};

// Utility Functions
const mapPaymentPlanFromDB = (data: unknown, installments: unknown[]): PaymentPlan => {
  return {
    id: data.id,
    saleId: data.sale_id,
    customerId: data.customer_id,
    totalAmount: data.total_amount,
    currency: data.currency,
    installments: installments?.map(installment => ({
      id: installment.id,
      paymentPlanId: installment.payment_plan_id,
      installmentNumber: installment.installment_number,
      dueDate: installment.due_date,
      amount: installment.amount,
      paidAmount: installment.paid_amount,
      status: installment.status,
      paidAt: installment.paid_at,
      paymentMethod: installment.payment_method,
      transactionReference: installment.transaction_reference,
      notes: installment.notes
    })) || [],
    status: data.status,
    createdAt: data.created_at,
    updatedAt: data.updated_at || data.created_at
  };
};

// Payment Reminders
export const generatePaymentReminders = async (): Promise<Array<{
  installmentId: string;
  customerId?: string;
  customerName?: string;
  amount: number;
  currency: string;
  dueDate: string;
  daysOverdue: number;
}>> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not available');

  const { data, error } = await client
    .from('payment_installments')
    .select(`
      id,
      amount,
      due_date,
      payment_plans (
        currency,
        customer_id,
        customers (
          name
        )
      )
    `)
    .in('status', ['pending', 'partial', 'overdue'])
    .lt('due_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()) // Due within 7 days
    .order('due_date');

  if (error) throw new Error(`Error generating payment reminders: ${error.message}`);

  return data?.map(item => {
    const dueDate = new Date(item.due_date);
    const today = new Date();
    const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

    return {
      installmentId: item.id,
      customerId: item.payment_plans?.customer_id,
      customerName: item.payment_plans?.customers?.name,
      amount: item.amount,
      currency: item.payment_plans?.currency || 'USD',
      dueDate: item.due_date,
      daysOverdue
    };
  }) || [];
};