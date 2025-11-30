import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { 
  createEnhancedProduct, 
  updateEnhancedProduct, 
  deleteEnhancedProduct, 
  getEnhancedProducts 
} from '../lib/inventory/products';
import { 
  createCustomer, 
  updateCustomer, 
  deleteCustomer, 
  getCustomers 
} from '../lib/accounts/customers';
import { useSupabase } from './SupabaseContext';

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  cost: number;
  stock: number;
  category: string;
  sku?: string;
  barcode?: string;
  supplier?: string;
  minStock?: number;
  maxStock?: number;
  location?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone: string;
  sector: string;
  creditLimit: number;
  paymentTerms: number;
  isOverdue: boolean;
  overdueAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Sale {
  id: string;
  date: string;
  customer: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  status: 'completed' | 'pending' | 'cancelled';
  paymentMethod: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  type: 'product' | 'expense';
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  email?: string;
  phone?: string;
  address?: string;
  createdAt: string;
}

interface AppState {
  products: Product[];
  customers: Customer[];
  sales: Sale[];
  categories: Category[];
  suppliers: Supplier[];
  loading: boolean;
  error: string | null;
}

type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PRODUCTS'; payload: Product[] }
  | { type: 'ADD_PRODUCT'; payload: Product }
  | { type: 'UPDATE_PRODUCT'; payload: Product }
  | { type: 'DELETE_PRODUCT'; payload: string }
  | { type: 'SET_CUSTOMERS'; payload: Customer[] }
  | { type: 'ADD_CUSTOMER'; payload: Customer }
  | { type: 'UPDATE_CUSTOMER'; payload: Customer }
  | { type: 'DELETE_CUSTOMER'; payload: string }
  | { type: 'SET_SALES'; payload: Sale[] }
  | { type: 'ADD_SALE'; payload: Sale }
  | { type: 'SET_CATEGORIES'; payload: Category[] }
  | { type: 'ADD_CATEGORY'; payload: Category }
  | { type: 'SET_SUPPLIERS'; payload: Supplier[] }
  | { type: 'ADD_SUPPLIER'; payload: Supplier };

const initialState: AppState = {
  products: [],
  customers: [],
  sales: [],
  categories: [],
  suppliers: [],
  loading: false,
  error: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_PRODUCTS':
      return { ...state, products: action.payload };
    case 'ADD_PRODUCT':
      return { ...state, products: [...state.products, action.payload] };
    case 'UPDATE_PRODUCT':
      return {
        ...state,
        products: state.products.map(p =>
          p.id === action.payload.id ? action.payload : p
        ),
      };
    case 'DELETE_PRODUCT':
      return {
        ...state,
        products: state.products.filter(p => p.id !== action.payload),
      };
    case 'SET_CUSTOMERS':
      return { ...state, customers: action.payload };
    case 'ADD_CUSTOMER':
      return { ...state, customers: [...state.customers, action.payload] };
    case 'UPDATE_CUSTOMER':
      return {
        ...state,
        customers: state.customers.map(c =>
          c.id === action.payload.id ? action.payload : c
        ),
      };
    case 'DELETE_CUSTOMER':
      return {
        ...state,
        customers: state.customers.filter(c => c.id !== action.payload),
      };
    case 'SET_SALES':
      return { ...state, sales: action.payload };
    case 'ADD_SALE':
      return { ...state, sales: [...state.sales, action.payload] };
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };
    case 'ADD_CATEGORY':
      return { ...state, categories: [...state.categories, action.payload] };
    case 'SET_SUPPLIERS':
      return { ...state, suppliers: action.payload };
    case 'ADD_SUPPLIER':
      return { ...state, suppliers: [...state.suppliers, action.payload] };
    default:
      return state;
  }
}

interface AppContextType extends AppState {
  // Product methods
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  loadProducts: () => Promise<void>;
  
  // Customer methods
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'isOverdue' | 'overdueAmount'>) => Promise<void>;
  updateCustomer: (id: string, customer: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  loadCustomers: () => Promise<void>;
  
  // Local methods (sales, categories, suppliers)
  addSale: (sale: Omit<Sale, 'id'>) => void;
  addCategory: (category: Omit<Category, 'id' | 'createdAt'>) => void;
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt'>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { state: supabaseState } = useSupabase();

  // Load products from Supabase when user is authenticated
  const loadProducts = async () => {
    if (!supabaseState.user) return;
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const products = await getEnhancedProducts();
      dispatch({ type: 'SET_PRODUCTS', payload: products.data });
    } catch (error) {
      console.error('Error loading products:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error loading products' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Load customers from Supabase when user is authenticated
  const loadCustomers = async () => {
    if (!supabaseState.user) return;
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const customers = await getCustomers();
      dispatch({ type: 'SET_CUSTOMERS', payload: customers });
    } catch (error) {
      console.error('Error loading customers:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error loading customers' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Add product to Supabase
  const addProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!supabaseState.user) {
      dispatch({ type: 'SET_ERROR', payload: 'User not authenticated' });
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const newProduct = await createEnhancedProduct(productData);
      dispatch({ type: 'ADD_PRODUCT', payload: newProduct });
    } catch (error) {
      console.error('Error adding product:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error adding product' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Update product in Supabase
  const updateProduct = async (id: string, productData: Partial<Product>) => {
    if (!supabaseState.user) {
      dispatch({ type: 'SET_ERROR', payload: 'User not authenticated' });
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const updatedProduct = await updateEnhancedProduct(id, productData);
      dispatch({ type: 'UPDATE_PRODUCT', payload: updatedProduct });
    } catch (error) {
      console.error('Error updating product:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error updating product' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Delete product from Supabase
  const deleteProduct = async (id: string) => {
    if (!supabaseState.user) {
      dispatch({ type: 'SET_ERROR', payload: 'User not authenticated' });
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      await deleteEnhancedProduct(id);
      dispatch({ type: 'DELETE_PRODUCT', payload: id });
    } catch (error) {
      console.error('Error deleting product:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error deleting product' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Add customer to Supabase
  const addCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'isOverdue' | 'overdueAmount'>) => {
    if (!supabaseState.user) {
      dispatch({ type: 'SET_ERROR', payload: 'User not authenticated' });
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const newCustomer = await createCustomer(customerData);
      dispatch({ type: 'ADD_CUSTOMER', payload: newCustomer });
    } catch (error) {
      console.error('Error adding customer:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error adding customer' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Update customer in Supabase
  const updateCustomer = async (id: string, customerData: Partial<Customer>) => {
    if (!supabaseState.user) {
      dispatch({ type: 'SET_ERROR', payload: 'User not authenticated' });
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const updatedCustomer = await updateCustomer(id, customerData);
      dispatch({ type: 'UPDATE_CUSTOMER', payload: updatedCustomer });
    } catch (error) {
      console.error('Error updating customer:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error updating customer' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Delete customer from Supabase
  const deleteCustomer = async (id: string) => {
    if (!supabaseState.user) {
      dispatch({ type: 'SET_ERROR', payload: 'User not authenticated' });
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      await deleteCustomer(id);
      dispatch({ type: 'DELETE_CUSTOMER', payload: id });
    } catch (error) {
      console.error('Error deleting customer:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error deleting customer' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Load data when user changes
  useEffect(() => {
    if (supabaseState.user) {
      loadProducts();
      loadCustomers();
    } else {
      // Clear data when user logs out
      dispatch({ type: 'SET_PRODUCTS', payload: [] });
      dispatch({ type: 'SET_CUSTOMERS', payload: [] });
    }
  }, [supabaseState.user]);

  // Local operations (keeping existing functionality for sales, categories, suppliers)
  const addSale = (saleData: Omit<Sale, 'id'>) => {
    const sale: Sale = {
      ...saleData,
      id: Date.now().toString(),
    };
    dispatch({ type: 'ADD_SALE', payload: sale });
  };

  const addCategory = (categoryData: Omit<Category, 'id' | 'createdAt'>) => {
    const category: Category = {
      ...categoryData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_CATEGORY', payload: category });
  };

  const addSupplier = (supplierData: Omit<Supplier, 'id' | 'createdAt'>) => {
    const supplier: Supplier = {
      ...supplierData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_SUPPLIER', payload: supplier });
  };

  // Load initial data from localStorage for non-Supabase entities
  useEffect(() => {
    try {
      const savedSales = localStorage.getItem('flowi-sales');
      if (savedSales) {
        dispatch({ type: 'SET_SALES', payload: JSON.parse(savedSales) });
      }

      const savedCategories = localStorage.getItem('flowi-categories');
      if (savedCategories) {
        dispatch({ type: 'SET_CATEGORIES', payload: JSON.parse(savedCategories) });
      }

      const savedSuppliers = localStorage.getItem('flowi-suppliers');
      if (savedSuppliers) {
        dispatch({ type: 'SET_SUPPLIERS', payload: JSON.parse(savedSuppliers) });
      }
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
    }
  }, []);

  // Save non-Supabase data to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('flowi-sales', JSON.stringify(state.sales));
    } catch (error) {
      console.error('Error saving sales to localStorage:', error);
    }
  }, [state.sales]);

  useEffect(() => {
    try {
      localStorage.setItem('flowi-categories', JSON.stringify(state.categories));
    } catch (error) {
      console.error('Error saving categories to localStorage:', error);
    }
  }, [state.categories]);

  useEffect(() => {
    try {
      localStorage.setItem('flowi-suppliers', JSON.stringify(state.suppliers));
    } catch (error) {
      console.error('Error saving suppliers to localStorage:', error);
    }
  }, [state.suppliers]);

  const contextValue: AppContextType = {
    ...state,
    addProduct,
    updateProduct,
    deleteProduct,
    loadProducts,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    loadCustomers,
    addSale,
    addCategory,
    addSupplier,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}