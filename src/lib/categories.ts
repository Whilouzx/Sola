import { getSupabaseClient } from '@/lib/supabase';
import { 
  ProductCategory, 
  CategoryTree, 
  CreateCategoryRequest, 
  UpdateCategoryRequest 
} from '@/types/inventory';

// Convert database category to app category
const convertCategoryFromDB = (dbCategory: any): ProductCategory => ({
  id: dbCategory.id,
  name: dbCategory.name,
  description: dbCategory.description,
  parentId: dbCategory.parent_id,
  imageUrl: dbCategory.image_url,
  sortOrder: dbCategory.sort_order || 0,
  isActive: dbCategory.is_active,
  createdAt: dbCategory.created_at,
  updatedAt: dbCategory.updated_at,
});

// Convert app category data to database format
const convertCategoryToDB = (category: CreateCategoryRequest | UpdateCategoryRequest) => ({
  name: category.name,
  description: category.description || null,
  parent_id: category.parentId || null,
  image_url: category.imageUrl || null,
  sort_order: category.sortOrder || 0,
  is_active: category.isActive !== false,
});

export const getCategories = async (): Promise<ProductCategory[]> => {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Cliente Supabase no disponible');
  }

  try {
    console.log('🔄 Obteniendo categorías...');

    const { data, error } = await client
      .from('product_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('❌ Error obteniendo categorías:', error);
      throw new Error(`Error obteniendo categorías: ${error.message}`);
    }

    console.log(`✅ Obtenidas ${data?.length || 0} categorías`);
    return data?.map(convertCategoryFromDB) || [];
  } catch (error) {
    console.error('❌ Error en getCategories:', error);
    throw error;
  }
};

export const getCategoryById = async (categoryId: string): Promise<ProductCategory | null> => {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Cliente Supabase no disponible');
  }

  try {
    console.log('🔄 Obteniendo categoría por ID:', categoryId);

    const { data, error } = await client
      .from('product_categories')
      .select('*')
      .eq('id', categoryId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Category not found
      }
      console.error('❌ Error obteniendo categoría:', error);
      throw new Error(`Error obteniendo categoría: ${error.message}`);
    }

    console.log('✅ Categoría obtenida exitosamente:', data);
    return convertCategoryFromDB(data);
  } catch (error) {
    console.error('❌ Error en getCategoryById:', error);
    throw error;
  }
};

export const createCategory = async (categoryData: CreateCategoryRequest): Promise<ProductCategory> => {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Cliente Supabase no disponible');
  }

  try {
    console.log('🔄 Creando categoría...', categoryData);

    // Get organization ID from current user
    const { data: { user } } = await client.auth.getUser();
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const { data: profile } = await client
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) {
      throw new Error('Organización no encontrada');
    }

    const dbData = {
      ...convertCategoryToDB(categoryData),
      organization_id: profile.organization_id,
    };

    const { data, error } = await client
      .from('product_categories')
      .insert(dbData)
      .select()
      .single();

    if (error) {
      console.error('❌ Error creando categoría:', error);
      throw new Error(`Error creando categoría: ${error.message}`);
    }

    console.log('✅ Categoría creada exitosamente:', data);
    return convertCategoryFromDB(data);
  } catch (error) {
    console.error('❌ Error en createCategory:', error);
    throw error;
  }
};

export const updateCategory = async (
  categoryId: string, 
  updateData: UpdateCategoryRequest
): Promise<ProductCategory> => {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Cliente Supabase no disponible');
  }

  try {
    console.log('🔄 Actualizando categoría:', categoryId, updateData);

    const dbUpdateData = {
      ...convertCategoryToDB(updateData),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await client
      .from('product_categories')
      .update(dbUpdateData)
      .eq('id', categoryId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error actualizando categoría:', error);
      throw new Error(`Error actualizando categoría: ${error.message}`);
    }

    console.log('✅ Categoría actualizada exitosamente:', data);
    return convertCategoryFromDB(data);
  } catch (error) {
    console.error('❌ Error en updateCategory:', error);
    throw error;
  }
};

export const deleteCategory = async (categoryId: string): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Cliente Supabase no disponible');
  }

  try {
    console.log('🔄 Eliminando categoría:', categoryId);

    // Check if category has products
    const { data: products, error: productsError } = await client
      .from('products')
      .select('id')
      .eq('category_id', categoryId)
      .limit(1);

    if (productsError) {
      throw new Error(`Error verificando productos: ${productsError.message}`);
    }

    if (products && products.length > 0) {
      throw new Error('No se puede eliminar una categoría que tiene productos asignados');
    }

    // Check if category has subcategories
    const { data: subcategories, error: subcategoriesError } = await client
      .from('product_categories')
      .select('id')
      .eq('parent_id', categoryId)
      .limit(1);

    if (subcategoriesError) {
      throw new Error(`Error verificando subcategorías: ${subcategoriesError.message}`);
    }

    if (subcategories && subcategories.length > 0) {
      throw new Error('No se puede eliminar una categoría que tiene subcategorías');
    }

    // Soft delete by setting is_active to false
    const { error } = await client
      .from('product_categories')
      .update({ 
        is_active: false, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', categoryId);

    if (error) {
      console.error('❌ Error eliminando categoría:', error);
      throw new Error(`Error eliminando categoría: ${error.message}`);
    }

    console.log('✅ Categoría eliminada exitosamente');
    return true;
  } catch (error) {
    console.error('❌ Error en deleteCategory:', error);
    throw error;
  }
};

export const getCategoryTree = async (): Promise<CategoryTree[]> => {
  const categories = await getCategories();
  
  // Build tree structure
  const categoryMap = new Map<string, CategoryTree>();
  const rootCategories: CategoryTree[] = [];

  // First pass: create all nodes
  categories.forEach(category => {
    categoryMap.set(category.id, {
      ...category,
      children: []
    });
  });

  // Second pass: build tree
  categories.forEach(category => {
    const treeNode = categoryMap.get(category.id)!;
    
    if (category.parentId) {
      const parent = categoryMap.get(category.parentId);
      if (parent) {
        parent.children.push(treeNode);
      } else {
        // Parent not found, treat as root
        rootCategories.push(treeNode);
      }
    } else {
      rootCategories.push(treeNode);
    }
  });

  return rootCategories;
};

export const reorderCategories = async (categoryIds: string[]): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Cliente Supabase no disponible');
  }

  try {
    console.log('🔄 Reordenando categorías...', categoryIds);

    // Update sort order for each category
    const updates = categoryIds.map((categoryId, index) => 
      client
        .from('product_categories')
        .update({ 
          sort_order: index + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', categoryId)
    );

    await Promise.all(updates);

    console.log('✅ Categorías reordenadas exitosamente');
    return true;
  } catch (error) {
    console.error('❌ Error en reorderCategories:', error);
    throw error;
  }
};

export const getCategoriesWithProductCount = async (): Promise<(ProductCategory & { productCount: number })[]> => {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Cliente Supabase no disponible');
  }

  try {
    console.log('🔄 Obteniendo categorías con conteo de productos...');

    const { data, error } = await client
      .from('product_categories')
      .select(`
        *,
        products(count)
      `)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('❌ Error obteniendo categorías con conteo:', error);
      throw new Error(`Error obteniendo categorías: ${error.message}`);
    }

    const categoriesWithCount = data?.map(item => ({
      ...convertCategoryFromDB(item),
      productCount: item.products?.[0]?.count || 0
    })) || [];

    console.log(`✅ Obtenidas ${categoriesWithCount.length} categorías con conteo`);
    return categoriesWithCount;
  } catch (error) {
    console.error('❌ Error en getCategoriesWithProductCount:', error);
    throw error;
  }
};
