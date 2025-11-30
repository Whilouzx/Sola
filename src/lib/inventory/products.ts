// Enhanced Product Management API
// Implementation of product variants, categories, and advanced inventory features

import { getSupabaseClient } from '@/lib/supabase';
import {
  EnhancedProduct,
  ProductCategory,
  ProductAttribute,
  ProductVariant,
  CreateProductRequest,
  UpdateProductRequest,
  CreateVariantRequest,
  UpdateVariantRequest,
  ProductFilters,
  PaginatedResponse,
  BarcodeResult,
  BarcodeScanRequest
} from '@/types/inventory';

// Product Categories
export const createProductCategory = async (category: Omit<ProductCategory, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProductCategory> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not available');

  const { data, error } = await client
    .from('product_categories')
    .insert({
      name: category.name,
      description: category.description,
      parent_id: category.parentId
    })
    .select()
    .single();

  if (error) throw new Error(`Error creating category: ${error.message}`);

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    parentId: data.parent_id,
    createdAt: data.created_at,
    updatedAt: data.updated_at || data.created_at
  };
};

export const getProductCategories = async (): Promise<ProductCategory[]> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not available');

  const { data, error } = await client
    .from('product_categories')
    .select('*')
    .order('name');

  if (error) throw new Error(`Error fetching categories: ${error.message}`);

  return data?.map(item => ({
    id: item.id,
    name: item.name,
    description: item.description,
    parentId: item.parent_id,
    createdAt: item.created_at,
    updatedAt: item.updated_at || item.created_at
  })) || [];
};

// Product Attributes
export const createProductAttribute = async (attribute: Omit<ProductAttribute, 'id' | 'values'>): Promise<ProductAttribute> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not available');

  const { data, error } = await client
    .from('product_attributes')
    .insert({
      name: attribute.name,
      type: attribute.type,
      required: attribute.required,
      category_id: attribute.categoryId
    })
    .select()
    .single();

  if (error) throw new Error(`Error creating attribute: ${error.message}`);

  return {
    id: data.id,
    name: data.name,
    type: data.type,
    required: data.required,
    categoryId: data.category_id,
    values: []
  };
};

export const getProductAttributes = async (categoryId?: string): Promise<ProductAttribute[]> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not available');

  let query = client
    .from('product_attributes')
    .select(`
      *,
      product_attribute_values (
        id,
        value,
        sort_order
      )
    `);

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  const { data, error } = await query.order('name');

  if (error) throw new Error(`Error fetching attributes: ${error.message}`);

  return data?.map(item => ({
    id: item.id,
    name: item.name,
    type: item.type,
    required: item.required,
    categoryId: item.category_id,
    values: item.product_attribute_values?.map((val: unknown) => ({
      id: val.id,
      attributeId: item.id,
      value: val.value,
      sortOrder: val.sort_order
    })) || []
  })) || [];
};

// Enhanced Products
export const createEnhancedProduct = async (product: CreateProductRequest): Promise<EnhancedProduct> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not available');

  const { data, error } = await client
    .from('products')
    .insert({
      name: product.name,
      description: product.description,
      category_id: product.categoryId,
      sku: product.sku,
      barcode: product.barcode,
      price_usd: product.priceUSD,
      price_ves: product.priceVES,
      stock: product.stock,
      reorder_level: product.reorderLevel,
      max_stock_level: product.maxStockLevel,
      weight: product.weight,
      dimensions: product.dimensions,
      supplier_id: product.supplierId,
      image: product.image,
      is_variant: false
    })
    .select(`
      *,
      product_categories (
        id,
        name
      ),
      suppliers (
        id,
        name
      )
    `)
    .single();

  if (error) throw new Error(`Error creating product: ${error.message}`);

  return mapProductFromDB(data);
};

export const getEnhancedProducts = async (filters?: ProductFilters): Promise<PaginatedResponse<EnhancedProduct>> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not available');

  let query = client
    .from('products')
    .select(`
      *,
      product_categories (
        id,
        name
      ),
      suppliers (
        id,
        name
      )
    `, { count: 'exact' });

  // Apply filters
  if (filters?.categoryId) {
    query = query.eq('category_id', filters.categoryId);
  }
  if (filters?.supplierId) {
    query = query.eq('supplier_id', filters.supplierId);
  }
  if (filters?.lowStock) {
    query = query.filter('stock', 'lte', 'reorder_level');
  }
  if (filters?.outOfStock) {
    query = query.eq('stock', 0);
  }
  if (filters?.hasVariants !== undefined) {
    query = query.eq('is_variant', filters.hasVariants);
  }
  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%,barcode.ilike.%${filters.search}%`);
  }

  // Sorting
  const sortBy = filters?.sortBy || 'name';
  const sortOrder = filters?.sortOrder || 'asc';
  query = query.order(sortBy === 'price' ? 'price_usd' : sortBy, { ascending: sortOrder === 'asc' });

  // Pagination
  const limit = filters?.limit || 50;
  const offset = filters?.offset || 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) throw new Error(`Error fetching products: ${error.message}`);

  const products = data?.map(mapProductFromDB) || [];

  return {
    data: products,
    total: count || 0,
    page: Math.floor(offset / limit) + 1,
    limit,
    hasMore: (count || 0) > offset + limit
  };
};

export const getEnhancedProductById = async (id: string): Promise<EnhancedProduct | null> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not available');

  const { data, error } = await client
    .from('products')
    .select(`
      *,
      product_categories (
        id,
        name
      ),
      suppliers (
        id,
        name
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Error fetching product: ${error.message}`);
  }

  return mapProductFromDB(data);
};

export const updateEnhancedProduct = async (id: string, updates: UpdateProductRequest): Promise<EnhancedProduct> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not available');

  const updateData: unknown = {
    updated_at: new Date().toISOString()
  };

  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.categoryId !== undefined) updateData.category_id = updates.categoryId;
  if (updates.sku !== undefined) updateData.sku = updates.sku;
  if (updates.barcode !== undefined) updateData.barcode = updates.barcode;
  if (updates.priceUSD !== undefined) updateData.price_usd = updates.priceUSD;
  if (updates.priceVES !== undefined) updateData.price_ves = updates.priceVES;
  if (updates.stock !== undefined) updateData.stock = updates.stock;
  if (updates.reorderLevel !== undefined) updateData.reorder_level = updates.reorderLevel;
  if (updates.maxStockLevel !== undefined) updateData.max_stock_level = updates.maxStockLevel;
  if (updates.weight !== undefined) updateData.weight = updates.weight;
  if (updates.dimensions !== undefined) updateData.dimensions = updates.dimensions;
  if (updates.supplierId !== undefined) updateData.supplier_id = updates.supplierId;
  if (updates.image !== undefined) updateData.image = updates.image;

  const { data, error } = await client
    .from('products')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      product_categories (
        id,
        name
      ),
      suppliers (
        id,
        name
      )
    `)
    .single();

  if (error) throw new Error(`Error updating product: ${error.message}`);

  return mapProductFromDB(data);
};

export const deleteEnhancedProduct = async (id: string): Promise<void> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not available');

  const { error } = await client
    .from('products')
    .delete()
    .eq('id', id);

  if (error) throw new Error(`Error deleting product: ${error.message}`);
};

// Product Variants
export const createProductVariant = async (productId: string, variant: CreateVariantRequest): Promise<ProductVariant> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not available');

  const { data, error } = await client
    .from('product_variants')
    .insert({
      product_id: productId,
      sku: variant.sku,
      barcode: variant.barcode,
      attributes: variant.attributes,
      price_usd: variant.priceUSD,
      price_ves: variant.priceVES,
      stock: variant.stock,
      reorder_level: variant.reorderLevel,
      is_active: true
    })
    .select()
    .single();

  if (error) throw new Error(`Error creating variant: ${error.message}`);

  return {
    id: data.id,
    productId: data.product_id,
    sku: data.sku,
    barcode: data.barcode,
    attributes: data.attributes,
    priceUSD: data.price_usd,
    priceVES: data.price_ves,
    stock: data.stock,
    reorderLevel: data.reorder_level,
    isActive: data.is_active,
    createdAt: data.created_at,
    updatedAt: data.updated_at || data.created_at
  };
};

export const getProductVariants = async (productId: string): Promise<ProductVariant[]> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not available');

  const { data, error } = await client
    .from('product_variants')
    .select('*')
    .eq('product_id', productId)
    .eq('is_active', true)
    .order('sku');

  if (error) throw new Error(`Error fetching variants: ${error.message}`);

  return data?.map(item => ({
    id: item.id,
    productId: item.product_id,
    sku: item.sku,
    barcode: item.barcode,
    attributes: item.attributes,
    priceUSD: item.price_usd,
    priceVES: item.price_ves,
    stock: item.stock,
    reorderLevel: item.reorder_level,
    isActive: item.is_active,
    createdAt: item.created_at,
    updatedAt: item.updated_at || item.created_at
  })) || [];
};

export const updateProductVariant = async (variantId: string, updates: UpdateVariantRequest): Promise<ProductVariant> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not available');

  const updateData: unknown = {
    updated_at: new Date().toISOString()
  };

  if (updates.sku !== undefined) updateData.sku = updates.sku;
  if (updates.barcode !== undefined) updateData.barcode = updates.barcode;
  if (updates.attributes !== undefined) updateData.attributes = updates.attributes;
  if (updates.priceUSD !== undefined) updateData.price_usd = updates.priceUSD;
  if (updates.priceVES !== undefined) updateData.price_ves = updates.priceVES;
  if (updates.stock !== undefined) updateData.stock = updates.stock;
  if (updates.reorderLevel !== undefined) updateData.reorder_level = updates.reorderLevel;
  if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

  const { data, error } = await client
    .from('product_variants')
    .update(updateData)
    .eq('id', variantId)
    .select()
    .single();

  if (error) throw new Error(`Error updating variant: ${error.message}`);

  return {
    id: data.id,
    productId: data.product_id,
    sku: data.sku,
    barcode: data.barcode,
    attributes: data.attributes,
    priceUSD: data.price_usd,
    priceVES: data.price_ves,
    stock: data.stock,
    reorderLevel: data.reorder_level,
    isActive: data.is_active,
    createdAt: data.created_at,
    updatedAt: data.updated_at || data.created_at
  };
};

// Barcode Scanning
export const scanBarcode = async (request: BarcodeScanRequest): Promise<BarcodeResult> => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not available');

  // First, try to find a product by barcode
  const { data: productData, error: productError } = await client
    .from('products')
    .select(`
      *,
      product_categories (
        id,
        name
      ),
      suppliers (
        id,
        name
      )
    `)
    .eq('barcode', request.code)
    .single();

  if (!productError && productData) {
    return {
      code: request.code,
      format: 'unknown', // We'd need a barcode library to determine format
      product: mapProductFromDB(productData)
    };
  }

  // Then try to find a variant by barcode
  const { data: variantData, error: variantError } = await client
    .from('product_variants')
    .select('*')
    .eq('barcode', request.code)
    .single();

  if (!variantError && variantData) {
    return {
      code: request.code,
      format: 'unknown',
      variant: {
        id: variantData.id,
        productId: variantData.product_id,
        sku: variantData.sku,
        barcode: variantData.barcode,
        attributes: variantData.attributes,
        priceUSD: variantData.price_usd,
        priceVES: variantData.price_ves,
        stock: variantData.stock,
        reorderLevel: variantData.reorder_level,
        isActive: variantData.is_active,
        createdAt: variantData.created_at,
        updatedAt: variantData.updated_at || variantData.created_at
      }
    };
  }

  // Return barcode result without product/variant if not found
  return {
    code: request.code,
    format: 'unknown'
  };
};

// Utility function to map database product to EnhancedProduct
const mapProductFromDB = (data: unknown): EnhancedProduct => {
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    categoryId: data.category_id,
    category: data.product_categories ? {
      id: data.product_categories.id,
      name: data.product_categories.name,
      createdAt: '',
      updatedAt: ''
    } : undefined,
    sku: data.sku,
    barcode: data.barcode,
    priceUSD: data.price_usd,
    priceVES: data.price_ves,
    stock: data.stock,
    reorderLevel: data.reorder_level,
    maxStockLevel: data.max_stock_level,
    weight: data.weight,
    dimensions: data.dimensions,
    isVariant: data.is_variant,
    parentProductId: data.parent_product_id,
    supplierId: data.supplier_id,
    supplier: data.suppliers ? {
      id: data.suppliers.id,
      name: data.suppliers.name
    } : undefined,
    image: data.image,
    createdAt: data.created_at,
    updatedAt: data.updated_at || data.created_at
  };
};