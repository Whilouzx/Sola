import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FuturisticCard } from '@/components/ui/futuristic-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  FolderTree, 
  Plus, 
  Search, 
  Package
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  ProductCategory, 
  CategoryTree as CategoryTreeType,
  CreateCategoryRequest, 
  UpdateCategoryRequest 
} from '@/types/inventory';
import { 
  getCategories, 
  getCategoryTree, 
  createCategory, 
  updateCategory, 
  deleteCategory
} from '@/lib/categories';
import CategoryForm from '@/components/categories/CategoryForm';
import CategoryTree from '@/components/categories/CategoryTree';

export default function Categories() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [categoryTree, setCategoryTree] = useState<CategoryTreeType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const [categoriesData, treeData] = await Promise.all([
        getCategories(),
        getCategoryTree()
      ]);
      
      setCategories(categoriesData);
      setCategoryTree(treeData);
    } catch (error) {
      toast.error('Error cargando categorías');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (categoryData: CreateCategoryRequest) => {
    try {
      await createCategory(categoryData);
      toast.success('Categoría creada exitosamente');
      loadCategories();
    } catch (error: any) {
      toast.error(error.message || 'Error creando categoría');
      throw error;
    }
  };

  const handleEdit = (category: ProductCategory) => {
    setSelectedCategory(category);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (category: ProductCategory) => {
    if (!confirm(`¿Está seguro de eliminar la categoría "${category.name}"?`)) {
      return;
    }

    try {
      await deleteCategory(category.id);
      toast.success('Categoría eliminada exitosamente');
      loadCategories();
    } catch (error: any) {
      toast.error(error.message || 'Error eliminando categoría');
    }
  };

  const handleAddSubcategory = (parentCategory: ProductCategory) => {
    setIsCreateDialogOpen(true);
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header - Responsive */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#EA580CFF] dark:text-gray-200">
            Categorías
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 sm:mt-2 text-sm sm:text-base">
            Organiza tus productos en categorías jerárquicas
          </p>
        </div>

        <div className="flex flex-wrap gap-2 sm:gap-3">
          <Badge className="bg-blue-100 text-blue-700 border-blue-200 px-2 sm:px-3 py-1 text-xs">
            <FolderTree className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            {categories.length} categorías
          </Badge>
        </div>
      </motion.div>

      {/* Main Card - Responsive */}
      <FuturisticCard variant="glass" className="p-4 sm:p-6">
        {/* Header with responsive button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-200">
            Árbol de Categorías
          </h2>
          
          {/* Responsive Button */}
          <Button 
            className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 w-full sm:w-auto"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="sm:inline">Nueva Categoría</span>
          </Button>
        </div>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm sm:text-base">Cargando categorías...</p>
          </div>
        ) : (
          <CategoryTree
            categories={categoryTree}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAddSubcategory={handleAddSubcategory}
          />
        )}
      </FuturisticCard>

      <CategoryForm
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSubmit={handleCreateCategory}
        categories={categories}
        title="Nueva Categoría"
      />

      <CategoryForm
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setSelectedCategory(null);
        }}
        onSubmit={async (data) => {
          if (selectedCategory) {
            await updateCategory(selectedCategory.id, data);
            loadCategories();
          }
        }}
        category={selectedCategory || undefined}
        categories={categories}
        title="Editar Categoría"
      />
    </div>
  );
}
