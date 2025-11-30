// Location and Multi-Warehouse Management API
// Implementation of location-based inventory tracking and stock transfers

import { getSupabaseClient } from '@/lib/supabase';
import {
  Location,
  LocationInventory,
  StockMovement,
  StockTransfer,
  StockTransferItem,
  CreateLocationRequest,
  UpdateLocationRequest,
  StockUpdateRequest,
  StockTransferRequest,
  StockMovementFilters,
  PaginatedResponse
} from '@/types/inventory';

// Location Management
export const createLocation = async (location: CreateLocationRequest): Promise<Location> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not available');

  const { data, error } = await client
    .from('locations')
    .insert({
      name: location.name,
      type: location.type,
      address: location.address,
      phone: location.phone,
      email: location.email,
      manager_id: location.managerId,
      is_active: true
    })
    .select()
    .single();

  if (error) throw new Error(`Error creating location: ${error.message}`);

  return mapLocationFromDB(data);
};

export const getLocations = async (activeOnly: boolean = true): Promise<Location[]> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not available');

  let query = client
    .from('locations')
    .select('*')
    .order('name');

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) throw new Error(`Error fetching locations: ${error.message}`);

  return data?.map(mapLocationFromDB) || [];
};

export const getLocationById = async (id: string): Promise<Location | null> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not available');

  const { data, error } = await client
    .from('locations')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Error fetching location: ${error.message}`);
  }

  return mapLocationFromDB(data);
};

export const updateLocation = async (id: string, updates: UpdateLocationRequest): Promise<Location> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not available');

  const updateData: unknown = {
    updated_at: new Date().toISOString()
  };

  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.type !== undefined) updateData.type = updates.type;
  if (updates.address !== undefined) updateData.address = updates.address;
  if (updates.phone !== undefined) updateData.phone = updates.phone;
  if (updates.email !== undefined) updateData.email = updates.email;
  if (updates.managerId !== undefined) updateData.manager_id = updates.managerId;
  if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

  const { data, error } = await client
    .from('locations')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Error updating location: ${error.message}`);

  return mapLocationFromDB(data);
};

export const deleteLocation = async (id: string): Promise<void> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not available');

  // Check if location has inventory
  const { data: inventory, error: inventoryError } = await client
    .from('location_inventory')
    .select('id')
    .eq('location_id', id)
    .gt('quantity', 0)
    .limit(1);

  if (inventoryError) throw new Error(`Error checking location inventory: ${inventoryError.message}`);

  if (inventory && inventory.length > 0) {
    throw new Error('Cannot delete location with existing inventory');
  }

  const { error } = await client
    .from('locations')
    .delete()
    .eq('id', id);

  if (error) throw new Error(`Error deleting location: ${error.message}`);
};

// Location Inventory Management
export const getLocationInventory = async (locationId: string): Promise<LocationInventory[]> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not available');

  const { data, error } = await client
    .from('location_inventory')
    .select(`
      *,
      products (
        id,
        name,
        sku,
        price_usd,
        price_ves,
        image
      )
    `)
    .eq('location_id', locationId)
    .order('last_updated', { ascending: false });

  if (error) throw new Error(`Error fetching location inventory: ${error.message}`);

  return data?.map(item => ({
    id: item.id,
    locationId: item.location_id,
    productId: item.product_id,
    product: item.products ? {
      id: item.products.id,
      name: item.products.name,
      sku: item.products.sku,
      priceUSD: item.products.price_usd,
      priceVES: item.products.price_ves,
      image: item.products.image,
      // Add other required fields with defaults
      description: '',
      stock: item.quantity,
      reorderLevel: item.reorder_level,
      isVariant: false,
      createdAt: '',
      updatedAt: ''
    } : undefined,
    quantity: item.quantity,
    reservedQuantity: item.reserved_quantity,
    reorderLevel: item.reorder_level,
    lastUpdated: item.last_updated
  })) || [];
};

export const updateLocationStock = async (request: StockUpdateRequest): Promise<void> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not available');

  const { error: txError } = await client.rpc('update_location_stock', {
    p_product_id: request.productId,
    p_location_id: request.locationId,
    p_quantity_change: request.movementType === 'out' ? -request.quantity : request.quantity,
    p_movement_type: request.movementType,
    p_reference_type: request.referenceType,
    p_reference_id: request.referenceId,
    p_notes: request.notes,
    p_user_id: 'current_user' // This should come from auth context
  });

  if (txError) throw new Error(`Error updating stock: ${txError.message}`);
};

// Stock Movements
export const getStockMovements = async (filters?: StockMovementFilters): Promise<PaginatedResponse<StockMovement>> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not available');

  let query = client
    .from('stock_movements')
    .select(`
      *,
      products (
        id,
        name,
        sku
      ),
      locations (
        id,
        name
      )
    `, { count: 'exact' });

  // Apply filters
  if (filters?.productId) {
    query = query.eq('product_id', filters.productId);
  }
  if (filters?.locationId) {
    query = query.eq('location_id', filters.locationId);
  }
  if (filters?.movementType) {
    query = query.eq('movement_type', filters.movementType);
  }
  if (filters?.dateFrom) {
    query = query.gte('created_at', filters.dateFrom);
  }
  if (filters?.dateTo) {
    query = query.lte('created_at', filters.dateTo);
  }
  if (filters?.userId) {
    query = query.eq('user_id', filters.userId);
  }

  // Pagination
  const limit = filters?.limit || 50;
  const offset = filters?.offset || 0;
  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) throw new Error(`Error fetching stock movements: ${error.message}`);

  const movements = data?.map(item => ({
    id: item.id,
    productId: item.product_id,
    product: item.products ? {
      id: item.products.id,
      name: item.products.name,
      sku: item.products.sku,
      // Add other required fields with defaults
      description: '',
      priceUSD: 0,
      priceVES: 0,
      stock: 0,
      reorderLevel: 0,
      isVariant: false,
      createdAt: '',
      updatedAt: ''
    } : undefined,
    locationId: item.location_id,
    location: item.locations ? {
      id: item.locations.id,
      name: item.locations.name,
      type: 'warehouse' as const,
      isActive: true,
      createdAt: '',
      updatedAt: ''
    } : undefined,
    movementType: item.movement_type,
    quantity: item.quantity,
    referenceType: item.reference_type,
    referenceId: item.reference_id,
    notes: item.notes,
    userId: item.user_id,
    userName: item.user_name,
    createdAt: item.created_at
  })) || [];

  return {
    data: movements,
    total: count || 0,
    page: Math.floor(offset / limit) + 1,
    limit,
    hasMore: (count || 0) > offset + limit
  };
};

// Stock Transfers
export const createStockTransfer = async (request: StockTransferRequest): Promise<StockTransfer> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not available');

  const { data: transferData, error: transferError } = await client
    .from('stock_transfers')
    .insert({
      from_location_id: request.fromLocationId,
      to_location_id: request.toLocationId,
      status: 'pending',
      requested_by: 'current_user', // This should come from auth context
      notes: request.notes
    })
    .select()
    .single();

  if (transferError) throw new Error(`Error creating transfer: ${transferError.message}`);

  // Create transfer items
  const transferItems = request.items.map(item => ({
    transfer_id: transferData.id,
    product_id: item.productId,
    requested_quantity: item.requestedQuantity,
    shipped_quantity: 0,
    received_quantity: 0
  }));

  const { data: itemsData, error: itemsError } = await client
    .from('stock_transfer_items')
    .insert(transferItems)
    .select(`
      *,
      products (
        id,
        name,
        sku
      )
    `);

  if (itemsError) throw new Error(`Error creating transfer items: ${itemsError.message}`);

  return {
    id: transferData.id,
    fromLocationId: transferData.from_location_id,
    toLocationId: transferData.to_location_id,
    status: transferData.status,
    requestedBy: transferData.requested_by,
    approvedBy: transferData.approved_by,
    shippedAt: transferData.shipped_at,
    receivedAt: transferData.received_at,
    notes: transferData.notes,
    items: itemsData?.map(item => ({
      id: item.id,
      transferId: item.transfer_id,
      productId: item.product_id,
      product: item.products ? {
        id: item.products.id,
        name: item.products.name,
        sku: item.products.sku,
        // Add other required fields with defaults
        description: '',
        priceUSD: 0,
        priceVES: 0,
        stock: 0,
        reorderLevel: 0,
        isVariant: false,
        createdAt: '',
        updatedAt: ''
      } : undefined,
      requestedQuantity: item.requested_quantity,
      shippedQuantity: item.shipped_quantity,
      receivedQuantity: item.received_quantity
    })) || [],
    createdAt: transferData.created_at,
    updatedAt: transferData.updated_at || transferData.created_at
  };
};

export const getStockTransfers = async (locationId?: string): Promise<StockTransfer[]> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not available');

  let query = client
    .from('stock_transfers')
    .select(`
      *,
      from_location:locations!from_location_id (
        id,
        name
      ),
      to_location:locations!to_location_id (
        id,
        name
      ),
      stock_transfer_items (
        *,
        products (
          id,
          name,
          sku
        )
      )
    `);

  if (locationId) {
    query = query.or(`from_location_id.eq.${locationId},to_location_id.eq.${locationId}`);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw new Error(`Error fetching transfers: ${error.message}`);

  return data?.map(item => ({
    id: item.id,
    fromLocationId: item.from_location_id,
    fromLocation: item.from_location ? {
      id: item.from_location.id,
      name: item.from_location.name,
      type: 'warehouse' as const,
      isActive: true,
      createdAt: '',
      updatedAt: ''
    } : undefined,
    toLocationId: item.to_location_id,
    toLocation: item.to_location ? {
      id: item.to_location.id,
      name: item.to_location.name,
      type: 'warehouse' as const,
      isActive: true,
      createdAt: '',
      updatedAt: ''
    } : undefined,
    status: item.status,
    requestedBy: item.requested_by,
    approvedBy: item.approved_by,
    shippedAt: item.shipped_at,
    receivedAt: item.received_at,
    notes: item.notes,
    items: item.stock_transfer_items?.map((transferItem: unknown) => ({
      id: transferItem.id,
      transferId: transferItem.transfer_id,
      productId: transferItem.product_id,
      product: transferItem.products ? {
        id: transferItem.products.id,
        name: transferItem.products.name,
        sku: transferItem.products.sku,
        // Add other required fields with defaults
        description: '',
        priceUSD: 0,
        priceVES: 0,
        stock: 0,
        reorderLevel: 0,
        isVariant: false,
        createdAt: '',
        updatedAt: ''
      } : undefined,
      requestedQuantity: transferItem.requested_quantity,
      shippedQuantity: transferItem.shipped_quantity,
      receivedQuantity: transferItem.received_quantity
    })) || [],
    createdAt: item.created_at,
    updatedAt: item.updated_at || item.created_at
  })) || [];
};

export const updateTransferStatus = async (
  transferId: string, 
  status: 'pending' | 'in_transit' | 'completed' | 'cancelled'
): Promise<StockTransfer> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not available');

  const updateData: unknown = {
    status,
    updated_at: new Date().toISOString()
  };

  if (status === 'in_transit') {
    updateData.shipped_at = new Date().toISOString();
  } else if (status === 'completed') {
    updateData.received_at = new Date().toISOString();
  }

  const { data, error } = await client
    .from('stock_transfers')
    .update(updateData)
    .eq('id', transferId)
    .select(`
      *,
      from_location:locations!from_location_id (
        id,
        name
      ),
      to_location:locations!to_location_id (
        id,
        name
      ),
      stock_transfer_items (
        *,
        products (
          id,
          name,
          sku
        )
      )
    `)
    .single();

  if (error) throw new Error(`Error updating transfer status: ${error.message}`);

  return {
    id: data.id,
    fromLocationId: data.from_location_id,
    fromLocation: data.from_location ? {
      id: data.from_location.id,
      name: data.from_location.name,
      type: 'warehouse' as const,
      isActive: true,
      createdAt: '',
      updatedAt: ''
    } : undefined,
    toLocationId: data.to_location_id,
    toLocation: data.to_location ? {
      id: data.to_location.id,
      name: data.to_location.name,
      type: 'warehouse' as const,
      isActive: true,
      createdAt: '',
      updatedAt: ''
    } : undefined,
    status: data.status,
    requestedBy: data.requested_by,
    approvedBy: data.approved_by,
    shippedAt: data.shipped_at,
    receivedAt: data.received_at,
    notes: data.notes,
    items: data.stock_transfer_items?.map((item: unknown) => ({
      id: item.id,
      transferId: item.transfer_id,
      productId: item.product_id,
      product: item.products ? {
        id: item.products.id,
        name: item.products.name,
        sku: item.products.sku,
        // Add other required fields with defaults
        description: '',
        priceUSD: 0,
        priceVES: 0,
        stock: 0,
        reorderLevel: 0,
        isVariant: false,
        createdAt: '',
        updatedAt: ''
      } : undefined,
      requestedQuantity: item.requested_quantity,
      shippedQuantity: item.shipped_quantity,
      receivedQuantity: item.received_quantity
    })) || [],
    createdAt: data.created_at,
    updatedAt: data.updated_at || data.created_at
  };
};

// Utility function to map database location to Location
const mapLocationFromDB = (data: unknown): Location => {
  return {
    id: data.id,
    name: data.name,
    type: data.type,
    address: data.address,
    phone: data.phone,
    email: data.email,
    managerId: data.manager_id,
    isActive: data.is_active,
    createdAt: data.created_at,
    updatedAt: data.updated_at || data.created_at
  };
};