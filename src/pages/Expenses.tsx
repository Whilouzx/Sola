import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FuturisticCard } from '@/components/ui/futuristic-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Plus, 
  DollarSign,
  Calendar,
  Truck,
  Edit,
  Trash2,
  RotateCcw,
  Tag
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { 
  Expense, 
  ExpenseData, 
  Supplier, 
  Currency,
  ExpenseFilters
} from '@/types/accounts';
import { 
  createExpense, 
  getExpenses, 
  updateExpense, 
  deleteExpense,
  getExpenseCategories,
  getExpensesSummary
} from '@/lib/accounts/expenses';
import { getSuppliers } from '@/lib/accounts/suppliers';
import { formatCurrency } from '@/lib/accounts/utils';

const DEFAULT_CATEGORIES = [
  'Oficina',
  'Servicios',
  'Transporte',
  'Marketing',
  'Tecnología',
  'Mantenimiento',
  'Seguros',
  'Impuestos',
  'Otros'
];

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  
  const [expenseForm, setExpenseForm] = useState<ExpenseData>({
    category: '',
    amount: 0,
    currency: 'USD',
    description: '',
    supplierId: '',
    receiptUrl: '',
    isRecurring: false
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [expensesData, suppliersData, categoriesData] = await Promise.all([
        getExpenses(),
        getSuppliers(),
        getExpenseCategories()
      ]);
      setExpenses(expensesData);
      setSuppliers(suppliersData);
      
      // Merge default categories with existing ones
      const allCategories = [...new Set([...DEFAULT_CATEGORIES, ...categoriesData])];
      setCategories(allCategories);
    } catch (error) {
      toast.error('Error cargando datos');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const resetExpenseForm = () => {
    setExpenseForm({
      category: '',
      amount: 0,
      currency: 'USD',
      description: '',
      supplierId: '',
      receiptUrl: '',
      isRecurring: false
    });
  };

  const handleCreateExpense = async () => {
    if (!expenseForm.category || expenseForm.amount <= 0) {
      toast.error('Complete todos los campos requeridos');
      return;
    }

    try {
      await createExpense(expenseForm);
      toast.success('Gasto creado exitosamente');
      setIsCreateDialogOpen(false);
      resetExpenseForm();
      loadData();
    } catch (error) {
      toast.error('Error creando gasto');
      console.error(error);
    }
  };

  const handleEdit = (expense: Expense) => {
    setSelectedExpense(expense);
    setExpenseForm({
      category: expense.category,
      amount: expense.amount,
      currency: expense.currency,
      description: expense.description || '',
      supplierId: expense.supplierId || '',
      receiptUrl: expense.receiptUrl || '',
      isRecurring: expense.isRecurring
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateExpense = async () => {
    if (!selectedExpense || !expenseForm.category || expenseForm.amount <= 0) {
      toast.error('Complete todos los campos requeridos');
      return;
    }

    try {
      await updateExpense(selectedExpense.id, expenseForm);
      toast.success('Gasto actualizado exitosamente');
      setIsEditDialogOpen(false);
      resetExpenseForm();
      setSelectedExpense(null);
      loadData();
    } catch (error) {
      toast.error('Error actualizando gasto');
      console.error(error);
    }
  };

  const handleDelete = async (expense: Expense) => {
    if (!confirm(`¿Está seguro de eliminar el gasto "${expense.description || expense.category}"?`)) {
      return;
    }

    try {
      await deleteExpense(expense.id);
      toast.success('Gasto eliminado exitosamente');
      loadData();
    } catch (error) {
      toast.error('Error eliminando gasto');
      console.error(error);
    }
  };

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.supplierName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const totalExpenses = {
    usd: expenses.filter(e => e.currency === 'USD').reduce((sum, e) => sum + e.amount, 0),
    ves: expenses.filter(e => e.currency === 'VES').reduce((sum, e) => sum + e.amount, 0)
  };

  const recurringCount = expenses.filter(e => e.isRecurring).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl md:text-4xl dark:text-gray-200 bg-[#00000000] mt-[0px] mr-[0px] mb-[0px] ml-[0px] pt-[0px] pr-[0px] pb-[0px] pl-[0px] font-bold text-center opacity-100 text-[#EA580CFF]">
            Gastos
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Controla y categoriza tus gastos operativos
          </p>
        </div>

        <div className="flex gap-3">
          <Badge className="bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800 px-3 py-1">
            <DollarSign className="h-4 w-4 mr-2" />
            {formatCurrency(totalExpenses.usd, 'USD')}
          </Badge>
          <Badge className="bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800 px-3 py-1">
            <DollarSign className="h-4 w-4 mr-2" />
            {formatCurrency(totalExpenses.ves, 'VES')}
          </Badge>
          {recurringCount > 0 && (
            <Badge className="bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800 px-3 py-1">
              <RotateCcw className="h-4 w-4 mr-2" />
              {recurringCount} recurrentes
            </Badge>
          )}
        </div>
      </motion.div>

      {/* Filters and Actions */}
      <FuturisticCard variant="glass" className="p-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex gap-4 flex-1">
            <div className="relative flex-1">
              <Input
                placeholder="Buscar gastos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
                onClick={resetExpenseForm}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Gasto
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card border-white/20 max-w-md">
              <DialogHeader>
                <DialogTitle className="text-gray-800 dark:text-gray-200">Crear Gasto</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-700 dark:text-gray-300">Categoría *</Label>
                  <Select value={expenseForm.category} onValueChange={(value) => setExpenseForm(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-700 dark:text-gray-300">Monto *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={expenseForm.amount}
                      onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700 dark:text-gray-300">Moneda</Label>
                    <Select value={expenseForm.currency} onValueChange={(value: Currency) => setExpenseForm(prev => ({ ...prev, currency: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="VES">VES</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700 dark:text-gray-300">Descripción</Label>
                  <Input
                    value={expenseForm.description}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descripción del gasto"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700 dark:text-gray-300">Proveedor (opcional)</Label>
                  <Select value={expenseForm.supplierId || "none"} onValueChange={(value) => setExpenseForm(prev => ({ ...prev, supplierId: value === "none" ? "" : value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar proveedor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin proveedor</SelectItem>
                      {suppliers.map(supplier => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700 dark:text-gray-300">URL del Recibo (opcional)</Label>
                  <Input
                    type="url"
                    value={expenseForm.receiptUrl}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, receiptUrl: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="recurring"
                    checked={expenseForm.isRecurring}
                    onCheckedChange={(checked) => setExpenseForm(prev => ({ ...prev, isRecurring: checked as boolean }))}
                  />
                  <Label htmlFor="recurring" className="text-gray-700 dark:text-gray-300">
                    Gasto recurrente
                  </Label>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCreateExpense}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
                  >
                    Crear Gasto
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </FuturisticCard>

      {/* Expenses List */}
      <FuturisticCard variant="glass" className="p-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-6">Lista de Gastos</h2>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Cargando gastos...</p>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">No se encontraron gastos</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredExpenses.map((expense) => (
              <motion.div
                key={expense.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border hover:border-cyan-400/50 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Tag className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      <h3 className="font-medium text-gray-800 dark:text-gray-200">{expense.category}</h3>
                      {expense.isRecurring && (
                        <Badge className="bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800">
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Recurrente
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-red-600">
                        <DollarSign className="h-3 w-3" />
                        <span>{formatCurrency(expense.amount, expense.currency)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(expense.createdAt).toLocaleDateString()}</span>
                      </div>

                      {expense.supplierName && (
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Truck className="h-3 w-3" />
                          <span>{expense.supplierName}</span>
                        </div>
                      )}

                      {expense.description && (
                        <div className="text-gray-600 dark:text-gray-400 truncate">
                          {expense.description}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(expense)}
                      className="h-8 w-8 p-0 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(expense)}
                      className="h-8 w-8 p-0 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </FuturisticCard>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="glass-card border-white/20 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gray-800 dark:text-gray-200">Editar Gasto</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300">Categoría *</Label>
              <Select value={expenseForm.category} onValueChange={(value) => setExpenseForm(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700 dark:text-gray-300">Monto *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700 dark:text-gray-300">Moneda</Label>
                <Select value={expenseForm.currency} onValueChange={(value: Currency) => setExpenseForm(prev => ({ ...prev, currency: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="VES">VES</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300">Descripción</Label>
              <Input
                value={expenseForm.description}
                onChange={(e) => setExpenseForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descripción del gasto"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300">Proveedor (opcional)</Label>
              <Select value={expenseForm.supplierId || "none"} onValueChange={(value) => setExpenseForm(prev => ({ ...prev, supplierId: value === "none" ? "" : value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar proveedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin proveedor</SelectItem>
                  {suppliers.map(supplier => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300">URL del Recibo (opcional)</Label>
              <Input
                type="url"
                value={expenseForm.receiptUrl}
                onChange={(e) => setExpenseForm(prev => ({ ...prev, receiptUrl: e.target.value }))}
                placeholder="https://..."
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="recurring-edit"
                checked={expenseForm.isRecurring}
                onCheckedChange={(checked) => setExpenseForm(prev => ({ ...prev, isRecurring: checked as boolean }))}
              />
              <Label htmlFor="recurring-edit" className="text-gray-700 dark:text-gray-300">
                Gasto recurrente
              </Label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  resetExpenseForm();
                  setSelectedExpense(null);
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUpdateExpense}
                className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
              >
                Actualizar Gasto
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}