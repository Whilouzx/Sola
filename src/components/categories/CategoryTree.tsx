import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronRight, 
  ChevronDown, 
  Folder, 
  FolderOpen, 
  Edit, 
  Trash2,
  Plus,
  Package,
  MoreVertical
} from 'lucide-react';
import { CategoryTree as CategoryTreeType, ProductCategory } from '@/types/inventory';

interface CategoryTreeProps {
  categories: CategoryTreeType[];
  onEdit: (category: ProductCategory) => void;
  onDelete: (category: ProductCategory) => void;
  onAddSubcategory: (parentCategory: ProductCategory) => void;
  productCounts?: Record<string, number>;
}

interface TreeNodeProps {
  category: CategoryTreeType;
  level: number;
  onEdit: (category: ProductCategory) => void;
  onDelete: (category: ProductCategory) => void;
  onAddSubcategory: (parentCategory: ProductCategory) => void;
  productCount?: number;
}

function TreeNode({ 
  category, 
  level, 
  onEdit, 
  onDelete, 
  onAddSubcategory,
  productCount = 0
}: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(level < 2); // Auto-expand first 2 levels
  const [showActions, setShowActions] = useState(false);
  const hasChildren = category.children && category.children.length > 0;

  const toggleExpanded = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div className="select-none">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className={`
          flex items-center gap-2 p-2 sm:p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 
          transition-colors group cursor-pointer relative
          ${level > 0 ? 'ml-3 sm:ml-6 border-l-2 border-gray-200 dark:border-gray-700' : ''}
        `}
        style={{ paddingLeft: `${level * 8 + 8}px` }}
      >
        {/* Expand/Collapse Button */}
        <div 
          className="flex items-center justify-center w-6 h-6 flex-shrink-0"
          onClick={toggleExpanded}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-500" />
            )
          ) : (
            <div className="w-4 h-4" />
          )}
        </div>

        {/* Category Icon */}
        <div className="flex items-center justify-center w-6 h-6 flex-shrink-0">
          {hasChildren ? (
            isExpanded ? (
              <FolderOpen className="h-4 w-4 text-blue-500" />
            ) : (
              <Folder className="h-4 w-4 text-blue-500" />
            )
          ) : (
            <Package className="h-4 w-4 text-gray-500" />
          )}
        </div>

        {/* Category Info */}
        <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
          <div className="min-w-0 flex-1">
            <span className="font-medium text-gray-800 dark:text-gray-200 text-sm sm:text-base block truncate">
              {category.name}
            </span>
            {category.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 sm:line-clamp-1">
                {category.description}
              </p>
            )}
          </div>

          {/* Badges - Responsive */}
          <div className="flex flex-wrap gap-1 sm:gap-2 flex-shrink-0">
            {/* Product Count Badge */}
            {productCount > 0 && (
              <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                {productCount} productos
              </Badge>
            )}

            {/* Status Badge */}
            {!category.isActive && (
              <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                Inactiva
              </Badge>
            )}
          </div>
        </div>

        {/* Action Buttons - Desktop */}
        <div className="hidden sm:flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onAddSubcategory(category);
            }}
            className="h-7 w-7 p-0 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
            title="Agregar subcategoría"
          >
            <Plus className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(category);
            }}
            className="h-7 w-7 p-0 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            title="Editar categoría"
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(category);
            }}
            className="h-7 w-7 p-0 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
            title="Eliminar categoría"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>

        {/* Mobile Actions Button */}
        <div className="sm:hidden flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setShowActions(!showActions);
            }}
            className="h-8 w-8 p-0 text-gray-500"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>

        {/* Mobile Actions Menu */}
        {showActions && (
          <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 sm:hidden">
            <div className="p-1 space-y-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddSubcategory(category);
                  setShowActions(false);
                }}
                className="w-full justify-start text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 text-sm"
              >
                <Plus className="h-3 w-3 mr-2" />
                Agregar subcategoría
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(category);
                  setShowActions(false);
                }}
                className="w-full justify-start text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm"
              >
                <Edit className="h-3 w-3 mr-2" />
                Editar categoría
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(category);
                  setShowActions(false);
                }}
                className="w-full justify-start text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm"
              >
                <Trash2 className="h-3 w-3 mr-2" />
                Eliminar categoría
              </Button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Children */}
      <AnimatePresence>
        {isExpanded && hasChildren && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {category.children.map((child) => (
              <TreeNode
                key={child.id}
                category={child}
                level={level + 1}
                onEdit={onEdit}
                onDelete={onDelete}
                onAddSubcategory={onAddSubcategory}
                productCount={0} // You can pass actual counts here
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CategoryTree({ 
  categories, 
  onEdit, 
  onDelete, 
  onAddSubcategory,
  productCounts = {}
}: CategoryTreeProps) {
  if (categories.length === 0) {
    return (
      <div className="text-center py-8">
        <Folder className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">No hay categorías creadas</p>
        <p className="text-gray-500 text-xs sm:text-sm mt-1">
          Crea tu primera categoría para organizar tus productos
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {categories.map((category) => (
        <TreeNode
          key={category.id}
          category={category}
          level={0}
          onEdit={onEdit}
          onDelete={onDelete}
          onAddSubcategory={onAddSubcategory}
          productCount={productCounts[category.id] || 0}
        />
      ))}
    </div>
  );
}
