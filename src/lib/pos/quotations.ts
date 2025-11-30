// Quotation Management API
// Implementation of quotation system with conversion to sales

import { getSupabaseClient } from '@/lib/supabase';
import {
  Quotation,
  QuotationItem,
  QuotationTemplate,
  CreateQuotationRequest,
  UpdateQuotationRequest,
  QuotationFilters,
  QuotationTotals,
  PaginatedResponse
} from '@/types/pos';

// Quotation Management
export const createQuotation = async (request: CreateQuotationRequest): Promise<Quotation> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not available');

  // Generate quotation number
  const quotationNumber = await generateQuotationNumber();

  // Calculate totals
  const totals = calculateQuotationTotals(request.items);

  const { data: quotationData, error: quotationError } = await client
    .from('quotations')
    .insert({
      quotation_number: quotationNumber,
      customer_id: request.customerId,
      customer_name: request.customerName,
      customer_email: request.customerEmail,
      customer_phone: request.customerPhone,
      customer_address: request.customerAddress,
      status: 'draft',
      valid_until: request.validUntil,
      subtotal_usd: totals.subtotalUSD,
      subtotal_ves: totals.subtotalVES,
      tax_amount: totals.taxAmount,
      discount_amount: totals.discountAmount,
      total_usd: totals.totalUSD,
      total_ves: totals.totalVES,
      notes: request.notes,
      terms: request.terms,
      created_by: 'current_user' // This should come from auth context
    })
    .select()
    .single();

  if (quotationError) throw new Error(`Error creating quotation: ${quotationError.message}`);

  // Create quotation items
  const quotationItems = request.items.map(item => ({
    quotation_id: quotationData.id,
    product_id: item.productId,
    product_name: item.productName,
    product_sku: item.productSku,
    variant_id: item.variantId,
    variant_attributes: item.variantAttributes,
    quantity: item.quantity,
    unit_price_usd: item.unitPriceUSD,
    unit_price_ves: item.unitPriceVES,
    discount_percentage: item.discountPercentage,
    total_price_usd: item.totalPriceUSD,
    total_price_ves: item.totalPriceVES,
    notes: item.notes
  }));

  const { data: itemsData, error: itemsError } = await client
    .from('quotation_items')
    .insert(quotationItems)
    .select();

  if (itemsError) throw new Error(`Error creating quotation items: ${itemsError.message}`);

  return mapQuotationFromDB(quotationData, itemsData);
};

export const getQuotations = async (filters?: QuotationFilters): Promise<PaginatedResponse<Quotation>> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not available');

  let query = client
    .from('quotations')
    .select(`
      *,
      quotation_items (*)
    `, { count: 'exact' });

  // Apply filters
  if (filters?.customerId) {
    query = query.eq('customer_id', filters.customerId);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.dateFrom) {
    query = query.gte('created_at', filters.dateFrom);
  }
  if (filters?.dateTo) {
    query = query.lte('created_at', filters.dateTo);
  }
  if (filters?.validFrom) {
    query = query.gte('valid_until', filters.validFrom);
  }
  if (filters?.validTo) {
    query = query.lte('valid_until', filters.validTo);
  }
  if (filters?.createdBy) {
    query = query.eq('created_by', filters.createdBy);
  }
  if (filters?.search) {
    query = query.or(`quotation_number.ilike.%${filters.search}%,customer_name.ilike.%${filters.search}%,customer_email.ilike.%${filters.search}%`);
  }

  // Sorting
  const sortBy = filters?.sortBy || 'created_at';
  const sortOrder = filters?.sortOrder || 'desc';
  const dbSortField = sortBy === 'quotationNumber' ? 'quotation_number' : 
                     sortBy === 'customerName' ? 'customer_name' :
                     sortBy === 'totalUSD' ? 'total_usd' :
                     sortBy === 'validUntil' ? 'valid_until' : 'created_at';
  
  query = query.order(dbSortField, { ascending: sortOrder === 'asc' });

  // Pagination
  const limit = filters?.limit || 50;
  const offset = filters?.offset || 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) throw new Error(`Error fetching quotations: ${error.message}`);

  const quotations = data?.map(item => mapQuotationFromDB(item, item.quotation_items)) || [];

  return {
    data: quotations,
    total: count || 0,
    page: Math.floor(offset / limit) + 1,
    limit,
    hasMore: (count || 0) > offset + limit
  };
};

export const getQuotationById = async (id: string): Promise<Quotation | null> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not available');

  const { data, error } = await client
    .from('quotations')
    .select(`
      *,
      quotation_items (*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Error fetching quotation: ${error.message}`);
  }

  return mapQuotationFromDB(data, data.quotation_items);
};

export const updateQuotation = async (id: string, updates: UpdateQuotationRequest): Promise<Quotation> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not available');

  const updateData: unknown = {
    updated_at: new Date().toISOString()
  };

  if (updates.customerId !== undefined) updateData.customer_id = updates.customerId;
  if (updates.customerName !== undefined) updateData.customer_name = updates.customerName;
  if (updates.customerEmail !== undefined) updateData.customer_email = updates.customerEmail;
  if (updates.customerPhone !== undefined) updateData.customer_phone = updates.customerPhone;
  if (updates.customerAddress !== undefined) updateData.customer_address = updates.customerAddress;
  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.validUntil !== undefined) updateData.valid_until = updates.validUntil;
  if (updates.notes !== undefined) updateData.notes = updates.notes;
  if (updates.terms !== undefined) updateData.terms = updates.terms;

  // If items are updated, recalculate totals
  if (updates.items) {
    const totals = calculateQuotationTotals(updates.items);
    updateData.subtotal_usd = totals.subtotalUSD;
    updateData.subtotal_ves = totals.subtotalVES;
    updateData.tax_amount = totals.taxAmount;
    updateData.discount_amount = totals.discountAmount;
    updateData.total_usd = totals.totalUSD;
    updateData.total_ves = totals.totalVES;

    // Update items
    await client
      .from('quotation_items')
      .delete()
      .eq('quotation_id', id);

    const quotationItems = updates.items.map(item => ({
      quotation_id: id,
      product_id: item.productId,
      product_name: item.productName,
      product_sku: item.productSku,
      variant_id: item.variantId,
      variant_attributes: item.variantAttributes,
      quantity: item.quantity,
      unit_price_usd: item.unitPriceUSD,
      unit_price_ves: item.unitPriceVES,
      discount_percentage: item.discountPercentage,
      total_price_usd: item.totalPriceUSD,
      total_price_ves: item.totalPriceVES,
      notes: item.notes
    }));

    await client
      .from('quotation_items')
      .insert(quotationItems);
  }

  const { data, error } = await client
    .from('quotations')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      quotation_items (*)
    `)
    .single();

  if (error) throw new Error(`Error updating quotation: ${error.message}`);

  return mapQuotationFromDB(data, data.quotation_items);
};

export const deleteQuotation = async (id: string): Promise<void> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not available');

  // Check if quotation has been converted to sale
  const { data: quotation } = await client
    .from('quotations')
    .select('status, converted_to_sale_id')
    .eq('id', id)
    .single();

  if (quotation?.status === 'converted') {
    throw new Error('Cannot delete converted quotation');
  }

  const { error } = await client
    .from('quotations')
    .delete()
    .eq('id', id);

  if (error) throw new Error(`Error deleting quotation: ${error.message}`);
};

export const convertQuotationToSale = async (quotationId: string): Promise<string> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not available');

  // Get quotation details
  const quotation = await getQuotationById(quotationId);
  if (!quotation) throw new Error('Quotation not found');

  if (quotation.status === 'converted') {
    throw new Error('Quotation already converted');
  }

  if (quotation.status === 'expired') {
    throw new Error('Cannot convert expired quotation');
  }

  // Create sale from quotation
  const saleData = {
    customer_id: quotation.customerId,
    customer_name: quotation.customerName,
    customer_email: quotation.customerEmail,
    customer_phone: quotation.customerPhone,
    payment_method: 'pending', // Will be updated when payment is made
    total_usd: quotation.totalUSD,
    total_ves: quotation.totalVES,
    user_id: quotation.createdBy,
    user_name: 'System', // This should come from user lookup
    quotation_id: quotationId,
    items: quotation.items.map(item => ({
      product_id: item.productId,
      product_name: item.productName,
      product_sku: item.productSku,
      variant_id: item.variantId,
      quantity: item.quantity,
      price_usd: item.unitPriceUSD,
      price_ves: item.unitPriceVES
    }))
  };

  const { data: saleResult, error: saleError } = await client
    .from('sales')
    .insert(saleData)
    .select()
    .single();

  if (saleError) throw new Error(`Error creating sale: ${saleError.message}`);

  // Update quotation status
  await updateQuotation(quotationId, {
    status: 'converted'
  });

  await client
    .from('quotations')
    .update({
      converted_to_sale_id: saleResult.id,
      converted_at: new Date().toISOString()
    })
    .eq('id', quotationId);

  return saleResult.id;
};

// Quotation Templates
export const createQuotationTemplate = async (template: Omit<QuotationTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<QuotationTemplate> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not available');

  const { data, error } = await client
    .from('quotation_templates')
    .insert({
      name: template.name,
      description: template.description,
      customer_id: template.customerId,
      items: template.items,
      default_validity_days: template.defaultValidityDays,
      default_terms: template.defaultTerms,
      is_active: template.isActive
    })
    .select()
    .single();

  if (error) throw new Error(`Error creating template: ${error.message}`);

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    customerId: data.customer_id,
    items: data.items,
    defaultValidityDays: data.default_validity_days,
    defaultTerms: data.default_terms,
    isActive: data.is_active,
    createdAt: data.created_at,
    updatedAt: data.updated_at || data.created_at
  };
};

export const getQuotationTemplates = async (customerId?: string): Promise<QuotationTemplate[]> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not available');

  let query = client
    .from('quotation_templates')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (customerId) {
    query = query.or(`customer_id.eq.${customerId},customer_id.is.null`);
  }

  const { data, error } = await query;

  if (error) throw new Error(`Error fetching templates: ${error.message}`);

  return data?.map(item => ({
    id: item.id,
    name: item.name,
    description: item.description,
    customerId: item.customer_id,
    items: item.items,
    defaultValidityDays: item.default_validity_days,
    defaultTerms: item.default_terms,
    isActive: item.is_active,
    createdAt: item.created_at,
    updatedAt: item.updated_at || item.created_at
  })) || [];
};

export const applyQuotationTemplate = async (templateId: string, customizations: Partial<CreateQuotationRequest>): Promise<CreateQuotationRequest> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not available');

  const { data: template, error } = await client
    .from('quotation_templates')
    .select('*')
    .eq('id', templateId)
    .single();

  if (error) throw new Error(`Error fetching template: ${error.message}`);

  const validUntil = customizations.validUntil || 
    new Date(Date.now() + template.default_validity_days * 24 * 60 * 60 * 1000).toISOString();

  return {
    customerId: customizations.customerId || template.customer_id,
    customerName: customizations.customerName || '',
    customerEmail: customizations.customerEmail,
    customerPhone: customizations.customerPhone,
    customerAddress: customizations.customerAddress,
    validUntil,
    items: customizations.items || template.items,
    notes: customizations.notes,
    terms: customizations.terms || template.default_terms
  };
};

// Utility Functions
const generateQuotationNumber = async (): Promise<string> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not available');

  const { count } = await client
    .from('quotations')
    .select('*', { count: 'exact', head: true });

  const number = (count || 0) + 1;
  return `QUO-${new Date().getFullYear()}-${number.toString().padStart(6, '0')}`;
};

const calculateQuotationTotals = (items: Omit<QuotationItem, 'id' | 'quotationId'>[]): QuotationTotals => {
  const subtotalUSD = items.reduce((sum, item) => sum + item.totalPriceUSD, 0);
  const subtotalVES = items.reduce((sum, item) => sum + item.totalPriceVES, 0);
  
  // Calculate tax (assuming 16% IVA for Venezuela)
  const taxRate = 0.16;
  const taxAmount = subtotalUSD * taxRate;
  
  // Calculate discount
  const discountAmount = items.reduce((sum, item) => {
    const itemDiscount = (item.unitPriceUSD * item.quantity) * (item.discountPercentage / 100);
    return sum + itemDiscount;
  }, 0);

  return {
    subtotalUSD,
    subtotalVES,
    taxAmount,
    discountAmount,
    totalUSD: subtotalUSD + taxAmount - discountAmount,
    totalVES: subtotalVES + (taxAmount * 36) - (discountAmount * 36) // Assuming 1 USD = 36 VES
  };
};

const mapQuotationFromDB = (data: unknown, items: unknown[]): Quotation => {
  return {
    id: data.id,
    quotationNumber: data.quotation_number,
    customerId: data.customer_id,
    customerName: data.customer_name,
    customerEmail: data.customer_email,
    customerPhone: data.customer_phone,
    customerAddress: data.customer_address,
    status: data.status,
    validUntil: data.valid_until,
    items: items?.map(item => ({
      id: item.id,
      quotationId: item.quotation_id,
      productId: item.product_id,
      productName: item.product_name,
      productSku: item.product_sku,
      variantId: item.variant_id,
      variantAttributes: item.variant_attributes,
      quantity: item.quantity,
      unitPriceUSD: item.unit_price_usd,
      unitPriceVES: item.unit_price_ves,
      discountPercentage: item.discount_percentage,
      totalPriceUSD: item.total_price_usd,
      totalPriceVES: item.total_price_ves,
      notes: item.notes
    })) || [],
    subtotalUSD: data.subtotal_usd,
    subtotalVES: data.subtotal_ves,
    taxAmount: data.tax_amount,
    discountAmount: data.discount_amount,
    totalUSD: data.total_usd,
    totalVES: data.total_ves,
    notes: data.notes,
    terms: data.terms,
    createdBy: data.created_by,
    createdAt: data.created_at,
    updatedAt: data.updated_at || data.created_at,
    convertedToSaleId: data.converted_to_sale_id,
    convertedAt: data.converted_at
  };
};

// Quotation Status Management
export const markQuotationExpired = async (): Promise<number> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not available');

  const { data, error } = await client
    .from('quotations')
    .update({ 
      status: 'expired',
      updated_at: new Date().toISOString()
    })
    .lt('valid_until', new Date().toISOString())
    .in('status', ['draft', 'pending', 'approved'])
    .select('id');

  if (error) throw new Error(`Error marking quotations expired: ${error.message}`);

  return data?.length || 0;
};

export const getExpiringQuotations = async (days: number = 3): Promise<Quotation[]> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not available');

  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + days);

  const { data, error } = await client
    .from('quotations')
    .select(`
      *,
      quotation_items (*)
    `)
    .lte('valid_until', expiryDate.toISOString())
    .in('status', ['draft', 'pending', 'approved'])
    .order('valid_until');

  if (error) throw new Error(`Error fetching expiring quotations: ${error.message}`);

  return data?.map(item => mapQuotationFromDB(item, item.quotation_items)) || [];
};