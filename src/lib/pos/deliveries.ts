// Delivery Management API
// Implementation of delivery scheduling and tracking system

import { getSupabaseClient } from '@/lib/supabase';
import {
  Delivery,
  DeliveryItem,
  DeliveryRoute,
  DeliveryTimeSlot,
  CreateDeliveryRequest,
  UpdateDeliveryRequest,
  DeliveryFilters,
  DeliveryMetrics,
  PaginatedResponse
} from '@/types/pos';

// Delivery Management
export const createDelivery = async (request: CreateDeliveryRequest): Promise<Delivery> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not available');

  // Generate delivery number
  const deliveryNumber = await generateDeliveryNumber();

  const { data: deliveryData, error: deliveryError } = await client
    .from('deliveries')
    .insert({
      delivery_number: deliveryNumber,
      sale_id: request.saleId,
      quotation_id: request.quotationId,
      customer_id: request.customerId,
      customer_name: request.customerName,
      delivery_address: request.deliveryAddress,
      delivery_date: request.deliveryDate,
      delivery_time_slot: request.deliveryTimeSlot,
      status: 'scheduled',
      assigned_to: request.assignedTo,
      special_instructions: request.specialInstructions,
      delivery_fee: request.deliveryFee
    })
    .select()
    .single();

  if (deliveryError) throw new Error(`Error creating delivery: ${deliveryError.message}`);

  // Create delivery items
  const deliveryItems = request.items.map(item => ({
    delivery_id: deliveryData.id,
    product_id: item.productId,
    product_name: item.productName,
    product_sku: item.productSku,
    variant_id: item.variantId,
    quantity: item.quantity,
    delivered_quantity: 0,
    condition: 'good',
    notes: item.notes
  }));

  const { data: itemsData, error: itemsError } = await client
    .from('delivery_items')
    .insert(deliveryItems)
    .select();

  if (itemsError) throw new Error(`Error creating delivery items: ${itemsError.message}`);

  return mapDeliveryFromDB(deliveryData, itemsData);
};

export const getDeliveries = async (filters?: DeliveryFilters): Promise<PaginatedResponse<Delivery>> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not available');

  let query = client
    .from('deliveries')
    .select(`
      *,
      delivery_items (*),
      users!assigned_to (
        id,
        name
      )
    `, { count: 'exact' });

  // Apply filters
  if (filters?.customerId) {
    query = query.eq('customer_id', filters.customerId);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.assignedTo) {
    query = query.eq('assigned_to', filters.assignedTo);
  }
  if (filters?.deliveryDate) {
    query = query.eq('delivery_date', filters.deliveryDate);
  }
  if (filters?.dateFrom) {
    query = query.gte('delivery_date', filters.dateFrom);
  }
  if (filters?.dateTo) {
    query = query.lte('delivery_date', filters.dateTo);
  }
  if (filters?.search) {
    query = query.or(`delivery_number.ilike.%${filters.search}%,customer_name.ilike.%${filters.search}%,delivery_address.ilike.%${filters.search}%`);
  }

  // Sorting
  const sortBy = filters?.sortBy || 'delivery_date';
  const sortOrder = filters?.sortOrder || 'asc';
  const dbSortField = sortBy === 'deliveryNumber' ? 'delivery_number' : 
                     sortBy === 'customerName' ? 'customer_name' :
                     sortBy === 'deliveryDate' ? 'delivery_date' : 'status';
  
  query = query.order(dbSortField, { ascending: sortOrder === 'asc' });

  // Pagination
  const limit = filters?.limit || 50;
  const offset = filters?.offset || 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) throw new Error(`Error fetching deliveries: ${error.message}`);

  const deliveries = data?.map(item => mapDeliveryFromDB(item, item.delivery_items, item.users)) || [];

  return {
    data: deliveries,
    total: count || 0,
    page: Math.floor(offset / limit) + 1,
    limit,
    hasMore: (count || 0) > offset + limit
  };
};

export const getDeliveryById = async (id: string): Promise<Delivery | null> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not available');

  const { data, error } = await client
    .from('deliveries')
    .select(`
      *,
      delivery_items (*),
      users!assigned_to (
        id,
        name,
        phone
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Error fetching delivery: ${error.message}`);
  }

  return mapDeliveryFromDB(data, data.delivery_items, data.users);
};

export const updateDelivery = async (id: string, updates: UpdateDeliveryRequest): Promise<Delivery> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not available');

  const updateData: unknown = {
    updated_at: new Date().toISOString()
  };

  if (updates.customerName !== undefined) updateData.customer_name = updates.customerName;
  if (updates.deliveryAddress !== undefined) updateData.delivery_address = updates.deliveryAddress;
  if (updates.deliveryDate !== undefined) updateData.delivery_date = updates.deliveryDate;
  if (updates.deliveryTimeSlot !== undefined) updateData.delivery_time_slot = updates.deliveryTimeSlot;
  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.assignedTo !== undefined) updateData.assigned_to = updates.assignedTo;
  if (updates.specialInstructions !== undefined) updateData.special_instructions = updates.specialInstructions;
  if (updates.deliveryFee !== undefined) updateData.delivery_fee = updates.deliveryFee;
  if (updates.deliveryProof !== undefined) updateData.delivery_proof = updates.deliveryProof;

  // Update status-specific timestamps
  if (updates.status === 'in_transit' && !updateData.actual_start_time) {
    updateData.actual_start_time = new Date().toISOString();
  }
  if (updates.status === 'delivered' && !updateData.actual_end_time) {
    updateData.actual_end_time = new Date().toISOString();
  }

  const { data, error } = await client
    .from('deliveries')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      delivery_items (*),
      users!assigned_to (
        id,
        name,
        phone
      )
    `)
    .single();

  if (error) throw new Error(`Error updating delivery: ${error.message}`);

  return mapDeliveryFromDB(data, data.delivery_items, data.users);
};

export const deleteDelivery = async (id: string): Promise<void> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not available');

  // Check if delivery is in progress
  const { data: delivery } = await client
    .from('deliveries')
    .select('status')
    .eq('id', id)
    .single();

  if (delivery?.status === 'in_transit') {
    throw new Error('Cannot delete delivery in transit');
  }

  const { error } = await client
    .from('deliveries')
    .delete()
    .eq('id', id);

  if (error) throw new Error(`Error deleting delivery: ${error.message}`);
};

// Delivery Status Updates
export const startDelivery = async (deliveryId: string): Promise<Delivery> => {
  return updateDelivery(deliveryId, {
    status: 'in_transit'
  });
};

export const completeDelivery = async (
  deliveryId: string, 
  deliveryProof: {
    signature?: string;
    photo?: string;
    notes?: string;
    receivedBy?: string;
  }
): Promise<Delivery> => {
  return updateDelivery(deliveryId, {
    status: 'delivered',
    deliveryProof
  });
};

export const failDelivery = async (deliveryId: string, reason: string): Promise<Delivery> => {
  return updateDelivery(deliveryId, {
    status: 'failed',
    deliveryProof: { notes: reason }
  });
};

// Delivery Time Slots
export const getAvailableTimeSlots = async (date: string): Promise<DeliveryTimeSlot[]> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not available');

  // Get existing deliveries for the date
  const { data: existingDeliveries, error } = await client
    .from('deliveries')
    .select('delivery_time_slot')
    .eq('delivery_date', date)
    .not('status', 'eq', 'cancelled');

  if (error) throw new Error(`Error fetching existing deliveries: ${error.message}`);

  // Define available time slots (this could be configurable)
  const timeSlots: DeliveryTimeSlot[] = [
    { id: '09:00-12:00', startTime: '09:00', endTime: '12:00', maxDeliveries: 5, currentDeliveries: 0, isAvailable: true },
    { id: '12:00-15:00', startTime: '12:00', endTime: '15:00', maxDeliveries: 5, currentDeliveries: 0, isAvailable: true },
    { id: '15:00-18:00', startTime: '15:00', endTime: '18:00', maxDeliveries: 5, currentDeliveries: 0, isAvailable: true },
    { id: '18:00-21:00', startTime: '18:00', endTime: '21:00', maxDeliveries: 3, currentDeliveries: 0, isAvailable: true }
  ];

  // Count current deliveries per slot
  existingDeliveries?.forEach(delivery => {
    const slot = timeSlots.find(s => s.id === delivery.delivery_time_slot);
    if (slot) {
      slot.currentDeliveries++;
      slot.isAvailable = slot.currentDeliveries < slot.maxDeliveries;
    }
  });

  return timeSlots;
};

// Delivery Routes
export const createDeliveryRoute = async (
  routeName: string,
  driverId: string,
  deliveryDate: string,
  deliveryIds: string[]
): Promise<DeliveryRoute> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not available');

  // Get driver information
  const { data: driver, error: driverError } = await client
    .from('users')
    .select('name')
    .eq('id', driverId)
    .single();

  if (driverError) throw new Error(`Error fetching driver: ${driverError.message}`);

  const { data, error } = await client
    .from('delivery_routes')
    .insert({
      route_name: routeName,
      driver_id: driverId,
      driver_name: driver.name,
      delivery_date: deliveryDate,
      deliveries: deliveryIds,
      status: 'planned'
    })
    .select()
    .single();

  if (error) throw new Error(`Error creating delivery route: ${error.message}`);

  return {
    id: data.id,
    routeName: data.route_name,
    driverId: data.driver_id,
    driverName: data.driver_name,
    deliveryDate: data.delivery_date,
    deliveries: data.deliveries,
    status: data.status,
    estimatedDistance: data.estimated_distance,
    estimatedDuration: data.estimated_duration,
    actualDistance: data.actual_distance,
    actualDuration: data.actual_duration,
    startTime: data.start_time,
    endTime: data.end_time,
    createdAt: data.created_at,
    updatedAt: data.updated_at || data.created_at
  };
};

export const optimizeDeliveryRoute = async (deliveryIds: string[]): Promise<string[]> => {
  // This is a simplified route optimization
  // In a real implementation, you would use a proper routing algorithm
  // or integrate with services like Google Maps Directions API
  
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not available');

  const { data: deliveries, error } = await client
    .from('deliveries')
    .select('id, delivery_address')
    .in('id', deliveryIds);

  if (error) throw new Error(`Error fetching deliveries for optimization: ${error.message}`);

  // Simple optimization: sort by address (in real implementation, use coordinates)
  const optimized = deliveries
    ?.sort((a, b) => a.delivery_address.localeCompare(b.delivery_address))
    .map(d => d.id) || [];

  return optimized;
};

// Delivery Metrics
export const getDeliveryMetrics = async (dateFrom?: string, dateTo?: string): Promise<DeliveryMetrics> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not available');

  let query = client
    .from('deliveries')
    .select('status, delivery_date, actual_start_time, actual_end_time, estimated_duration');

  if (dateFrom) {
    query = query.gte('delivery_date', dateFrom);
  }
  if (dateTo) {
    query = query.lte('delivery_date', dateTo);
  }

  const { data: deliveries, error } = await query;

  if (error) throw new Error(`Error fetching delivery metrics: ${error.message}`);

  const totalDeliveries = deliveries?.length || 0;
  const completedDeliveries = deliveries?.filter(d => d.status === 'delivered') || [];
  const failedDeliveries = deliveries?.filter(d => d.status === 'failed') || [];

  // Calculate on-time deliveries (delivered within estimated time)
  const onTimeDeliveries = completedDeliveries.filter(delivery => {
    if (!delivery.actual_start_time || !delivery.actual_end_time || !delivery.estimated_duration) {
      return false;
    }
    
    const startTime = new Date(delivery.actual_start_time);
    const endTime = new Date(delivery.actual_end_time);
    const actualDuration = (endTime.getTime() - startTime.getTime()) / (1000 * 60); // minutes
    
    return actualDuration <= delivery.estimated_duration;
  });

  // Calculate average delivery time
  const deliveryTimes = completedDeliveries
    .filter(d => d.actual_start_time && d.actual_end_time)
    .map(d => {
      const start = new Date(d.actual_start_time!);
      const end = new Date(d.actual_end_time!);
      return (end.getTime() - start.getTime()) / (1000 * 60); // minutes
    });

  const averageDeliveryTime = deliveryTimes.length > 0 
    ? deliveryTimes.reduce((sum, time) => sum + time, 0) / deliveryTimes.length 
    : 0;

  return {
    totalDeliveries,
    onTimeDeliveries: onTimeDeliveries.length,
    lateDeliveries: completedDeliveries.length - onTimeDeliveries.length,
    failedDeliveries: failedDeliveries.length,
    averageDeliveryTime,
    deliveryRouteEfficiency: totalDeliveries > 0 ? (completedDeliveries.length / totalDeliveries) * 100 : 0
  };
};

export const getTodaysDeliveries = async (): Promise<Delivery[]> => {
  const today = new Date().toISOString().split('T')[0];
  
  const result = await getDeliveries({
    deliveryDate: today,
    sortBy: 'deliveryDate',
    sortOrder: 'asc'
  });

  return result.data;
};

export const getDeliveriesByDriver = async (driverId: string, date?: string): Promise<Delivery[]> => {
  const filters: DeliveryFilters = {
    assignedTo: driverId,
    sortBy: 'deliveryDate',
    sortOrder: 'asc'
  };

  if (date) {
    filters.deliveryDate = date;
  }

  const result = await getDeliveries(filters);
  return result.data;
};

// Utility Functions
const generateDeliveryNumber = async (): Promise<string> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not available');

  const { count } = await client
    .from('deliveries')
    .select('*', { count: 'exact', head: true });

  const number = (count || 0) + 1;
  return `DEL-${new Date().getFullYear()}-${number.toString().padStart(6, '0')}`;
};

const mapDeliveryFromDB = (data: unknown, items: unknown[], driver?: unknown): Delivery => {
  return {
    id: data.id,
    deliveryNumber: data.delivery_number,
    saleId: data.sale_id,
    quotationId: data.quotation_id,
    customerId: data.customer_id,
    customerName: data.customer_name,
    deliveryAddress: data.delivery_address,
    deliveryDate: data.delivery_date,
    deliveryTimeSlot: data.delivery_time_slot,
    status: data.status,
    assignedTo: data.assigned_to,
    assignedDriverName: driver?.name,
    assignedDriverPhone: driver?.phone,
    items: items?.map(item => ({
      id: item.id,
      deliveryId: item.delivery_id,
      productId: item.product_id,
      productName: item.product_name,
      productSku: item.product_sku,
      variantId: item.variant_id,
      quantity: item.quantity,
      deliveredQuantity: item.delivered_quantity,
      condition: item.condition,
      notes: item.notes
    })) || [],
    specialInstructions: data.special_instructions,
    deliveryFee: data.delivery_fee,
    estimatedDuration: data.estimated_duration,
    actualStartTime: data.actual_start_time,
    actualEndTime: data.actual_end_time,
    deliveryProof: data.delivery_proof,
    createdAt: data.created_at,
    updatedAt: data.updated_at || data.created_at
  };
};