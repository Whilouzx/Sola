import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { 
  getSupabaseClient, 
  testSupabaseConnection, 
  initializeDatabase, 
  createSampleData,
  initializeSupabase,
  getCurrentUser,
  getCurrentSession
} from '@/lib/supabase';
import { User, Product, Sale, DashboardMetrics, ReportFilters, SaleItem, PaymentMethod } from '@/types';
import { toast } from 'sonner';

// Estado inicial de la aplicación con Supabase
interface AppState {
  user: User | null;
  products: Product[];
  sales: Sale[];
  isLoading: boolean;
  isConnected: boolean;
  lastSync: string | null;
  error: string | null;
  organizationId: string | null;
  isAuthLoading: boolean; // New field for auth loading state
}

// Acciones del reducer
type AppAction =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_PRODUCTS'; payload: Product[] }
  | { type: 'ADD_PRODUCT'; payload: Product }
  | { type: 'UPDATE_PRODUCT'; payload: Product }
  | { type: 'DELETE_PRODUCT'; payload: string }
  | { type: 'SET_SALES'; payload: Sale[] }
  | { type: 'ADD_SALE'; payload: Sale }
  | { type: 'DELETE_SALE'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_AUTH_LOADING'; payload: boolean }
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_LAST_SYNC'; payload: string }
  | { type: 'SET_ORGANIZATION_ID'; payload: string | null }
  | { type: 'UPDATE_STOCK'; payload: { productId: string; quantity: number } };

// Estado inicial
const initialState: AppState = {
  user: null,
  products: [],
  sales: [],
  isLoading: false,
  isConnected: false,
  lastSync: null,
  error: null,
  organizationId: null,
  isAuthLoading: true, // Start with auth loading
};

// Reducer principal
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_PRODUCTS':
      return { ...state, products: action.payload };
    case 'ADD_PRODUCT':
      const newProducts = [...state.products, action.payload];
      // CRITICAL FIX: Always save to localStorage immediately
      localStorage.setItem('sales-app-products', JSON.stringify(newProducts));
      return { ...state, products: newProducts };
    case 'UPDATE_PRODUCT':
      const updatedProducts = state.products.map(p =>
        p.id === action.payload.id ? action.payload : p
      );
      // CRITICAL FIX: Always save to localStorage immediately
      localStorage.setItem('sales-app-products', JSON.stringify(updatedProducts));
      return { ...state, products: updatedProducts };
    case 'DELETE_PRODUCT':
      const filteredProducts = state.products.filter(p => p.id !== action.payload);
      // CRITICAL FIX: Always save to localStorage immediately
      localStorage.setItem('sales-app-products', JSON.stringify(filteredProducts));
      return { ...state, products: filteredProducts };
    case 'SET_SALES':
      return { ...state, sales: action.payload };
    case 'ADD_SALE':
      const newSales = [...state.sales, action.payload];
      // CRITICAL FIX: Always save to localStorage immediately
      localStorage.setItem('sales-app-sales', JSON.stringify(newSales));
      return { ...state, sales: newSales };
    case 'DELETE_SALE':
      const filteredSales = state.sales.filter(s => s.id !== action.payload);
      // CRITICAL FIX: Always save to localStorage immediately
      localStorage.setItem('sales-app-sales', JSON.stringify(filteredSales));
      return { ...state, sales: filteredSales };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_AUTH_LOADING':
      return { ...state, isAuthLoading: action.payload };
    case 'SET_CONNECTED':
      return { ...state, isConnected: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_LAST_SYNC':
      return { ...state, lastSync: action.payload };
    case 'SET_ORGANIZATION_ID':
      return { ...state, organizationId: action.payload };
    case 'UPDATE_STOCK':
      const stockUpdatedProducts = state.products.map(p =>
        p.id === action.payload.productId
          ? { ...p, stock: Math.max(0, p.stock - action.payload.quantity) }
          : p
      );
      // CRITICAL FIX: Always save to localStorage immediately
      localStorage.setItem('sales-app-products', JSON.stringify(stockUpdatedProducts));
      return { ...state, products: stockUpdatedProducts };
    default:
      return state;
  }
}

// Contexto
const SupabaseContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  // Funciones helper
  login: (username: string, password: string) => boolean;
  logout: () => void;
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addSale: (sale: Omit<Sale, 'id' | 'createdAt'>) => Promise<void>;
  deleteSale: (id: string) => Promise<void>;
  getDashboardMetrics: () => DashboardMetrics;
  getFilteredSales: (filters: ReportFilters) => Sale[];
  syncWithSupabase: () => Promise<void>;
  migrateFromLocalStorage: () => Promise<void>;
  updateSupabaseConfig: (url: string, key: string) => Promise<void>;
  clearSales?: () => Promise<void>;
} | null>(null);

// Provider del contexto con Supabase
export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  // CRITICAL FIX: Add ref to control toast duplicates
  const connectionToastShown = useRef(false);
  const lastConnectionTime = useRef<number>(0);

  // Helper function to show connection toast only once per session
  const showConnectionToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const now = Date.now();
    const timeSinceLastToast = now - lastConnectionTime.current;
    
    // Only show toast if it hasn't been shown in the last 5 seconds
    if (!connectionToastShown.current || timeSinceLastToast > 5000) {
      if (type === 'success') {
        toast.success(message);
      } else if (type === 'info') {
        toast.info(message);
      } else {
        toast.error(message);
      }
      connectionToastShown.current = true;
      lastConnectionTime.current = now;
    }
  };

  // CRITICAL FIX: Load user from Supabase Auth
  const loadUserFromSupabaseAuth = async () => {
    console.log('🔍 AUTH DEBUG - Loading user from Supabase Auth...');
    dispatch({ type: 'SET_AUTH_LOADING', payload: true });
    
    try {
      const { user, error } = await getCurrentUser();
      
      if (error) {
        console.log('⚠️ AUTH DEBUG - Error getting user:', error);
        dispatch({ type: 'SET_USER', payload: null });
        return;
      }
      
      if (user) {
        console.log('🔍 AUTH DEBUG - Supabase user found:', user);
        console.log('🔍 AUTH DEBUG - User metadata:', user.user_metadata);
        
        // CRITICAL FIX: Enhanced mapping to prioritize full_name from user_metadata
        const fullName = user.user_metadata?.full_name || 
                         user.user_metadata?.name || 
                         user.user_metadata?.display_name ||
                         user.email?.split('@')[0] || 
                         'Usuario';
        
        const mappedUser: User = {
          id: user.id,
          name: fullName,
          email: user.email || '',
          role: (user.user_metadata?.role as 'admin' | 'user') || 'user',
          isActive: true
        };
        
        console.log('✅ AUTH DEBUG - User mapped successfully:', mappedUser);
        console.log('✅ AUTH DEBUG - Final display name:', mappedUser.name);
        dispatch({ type: 'SET_USER', payload: mappedUser });
      } else {
        console.log('⚠️ AUTH DEBUG - No user found in Supabase Auth');
        dispatch({ type: 'SET_USER', payload: null });
      }
    } catch (error) {
      console.error('❌ AUTH DEBUG - Error loading user from Supabase:', error);
      dispatch({ type: 'SET_USER', payload: null });
    } finally {
      dispatch({ type: 'SET_AUTH_LOADING', payload: false });
    }
  };

  // CRITICAL FIX: Setup auth state listener
  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) {
      console.log('⚠️ AUTH DEBUG - No Supabase client available');
      dispatch({ type: 'SET_AUTH_LOADING', payload: false });
      return;
    }

    console.log('🔍 AUTH DEBUG - Setting up auth state listener...');
    
    // Load initial user
    loadUserFromSupabaseAuth();

    // Listen for auth changes
    const { data: { subscription } } = client.auth.onAuthStateChange(async (event, session) => {
      console.log('🔍 AUTH DEBUG - Auth state changed:', event, session?.user?.email);
      
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('🔍 AUTH DEBUG - Session user metadata:', session.user.user_metadata);
        
        // CRITICAL FIX: Enhanced mapping to prioritize full_name from user_metadata
        const fullName = session.user.user_metadata?.full_name || 
                         session.user.user_metadata?.name || 
                         session.user.user_metadata?.display_name ||
                         session.user.email?.split('@')[0] || 
                         'Usuario';
        
        const mappedUser: User = {
          id: session.user.id,
          name: fullName,
          email: session.user.email || '',
          role: (session.user.user_metadata?.role as 'admin' | 'user') || 'user',
          isActive: true
        };
        
        console.log('✅ AUTH DEBUG - User signed in:', mappedUser);
        console.log('✅ AUTH DEBUG - Final display name:', mappedUser.name);
        dispatch({ type: 'SET_USER', payload: mappedUser });
      } else if (event === 'SIGNED_OUT') {
        console.log('🔍 AUTH DEBUG - User signed out');
        dispatch({ type: 'SET_USER', payload: null });
      }
    });

    // Cleanup subscription
    return () => {
      console.log('🔍 AUTH DEBUG - Cleaning up auth listener');
      subscription.unsubscribe();
    };
  }, []);

  // Verificar conexión con Supabase y cargar datos
  useEffect(() => {
    const initializeApp = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });
        
        console.log('🚀 Inicializando aplicación...');
        
        // CRITICAL FIX: Always load from localStorage first (for products and sales)
        loadFromLocalStorage();
        
        // Luego intentar conectar con Supabase
        const client = getSupabaseClient();
        if (client) {
          const connectionResult = await testSupabaseConnection();
          
          if (connectionResult.success) {
            console.log('✅ Supabase conectado - Sincronizando datos...');
            dispatch({ type: 'SET_CONNECTED', payload: true });
            dispatch({ type: 'SET_ERROR', payload: null });
            
            // Set default organization ID for single-tenant usage
            dispatch({ type: 'SET_ORGANIZATION_ID', payload: '550e8400-e29b-41d4-a716-446655440000' });
            
            // CRITICAL FIX: Sync with Supabase silently during initialization
            await syncWithSupabase(true); // Pass silent flag
            
            // CRITICAL FIX: Show connection toast only once
            showConnectionToast('Conectado a Supabase');
          } else {
            console.log('⚠️ Supabase no disponible - Usando datos locales');
            dispatch({ type: 'SET_CONNECTED', payload: false });
            dispatch({ type: 'SET_ERROR', payload: 'Supabase no configurado' });
            showConnectionToast('Usando datos locales - Configura Supabase para sincronizar', 'info');
          }
        } else {
          console.log('⚠️ Cliente Supabase no disponible - Usando datos locales');
          dispatch({ type: 'SET_CONNECTED', payload: false });
          dispatch({ type: 'SET_ERROR', payload: 'Supabase no configurado' });
          showConnectionToast('Usando datos locales - Configura Supabase para sincronizar', 'info');
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        console.error('❌ Error inicializando aplicación:', error);
        dispatch({ type: 'SET_CONNECTED', payload: false });
        dispatch({ type: 'SET_ERROR', payload: `Error: ${errorMessage}` });
        loadFromLocalStorage();
        showConnectionToast('Error de conexión - Usando datos locales', 'error');
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initializeApp();
  }, []);

  // CRITICAL FIX: Load only products and sales from localStorage (not user)
  const loadFromLocalStorage = () => {
    console.log('📂 Cargando datos desde localStorage...');
    
    try {
      const savedProducts = localStorage.getItem('sales-app-products');
      const savedSales = localStorage.getItem('sales-app-sales');
      
      if (savedProducts) {
        const products = JSON.parse(savedProducts);
        dispatch({ type: 'SET_PRODUCTS', payload: products });
        console.log(`📦 Cargados ${products.length} productos desde localStorage`);
      }
      
      if (savedSales) {
        const sales = JSON.parse(savedSales);
        dispatch({ type: 'SET_SALES', payload: sales });
        console.log(`💰 Cargadas ${sales.length} ventas desde localStorage`);
      }
    } catch (error) {
      console.error('❌ Error cargando desde localStorage:', error);
      // Initialize empty arrays if localStorage is corrupted
      dispatch({ type: 'SET_PRODUCTS', payload: [] });
      dispatch({ type: 'SET_SALES', payload: [] });
    }
  };

  // Actualizar configuración de Supabase
  const updateSupabaseConfig = async (url: string, key: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Inicializar nuevo cliente
      const client = initializeSupabase(url, key);
      if (!client) {
        throw new Error('No se pudo crear cliente Supabase');
      }

      // Probar conexión
      const connectionResult = await testSupabaseConnection();
      if (!connectionResult.success) {
        throw new Error('No se pudo conectar con las nuevas credenciales');
      }

      dispatch({ type: 'SET_CONNECTED', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      dispatch({ type: 'SET_ORGANIZATION_ID', payload: '550e8400-e29b-41d4-a716-446655440000' });
      
      // Reload user from new Supabase instance
      await loadUserFromSupabaseAuth();
      
      // Sincronizar datos silently
      await syncWithSupabase(true);
      
      // CRITICAL FIX: Show specific toast for configuration update
      toast.success('Configuración de Supabase actualizada');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ Error actualizando configuración:', error);
      dispatch({ type: 'SET_CONNECTED', payload: false });
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error('Error actualizando configuración');
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // CRITICAL FIX: Updated Supabase sync with optional silent mode
  const syncWithSupabase = async (silent: boolean = false) => {
    const client = getSupabaseClient();
    if (!client) {
      console.log('⚠️ Cliente Supabase no disponible');
      return;
    }

    try {
      console.log('🔄 Sincronizando datos con Supabase...');
      
      // CRITICAL FIX: Use correct column names from SQL schema
      const { data: products, error: productsError } = await client
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (productsError) {
        console.error('❌ Error cargando productos:', productsError);
        
        if (productsError.message.includes('relation "public.products" does not exist')) {
          console.log('🔧 Las tablas no existen - Ejecuta el script SQL');
          throw new Error('Tablas no encontradas - Ejecuta el script SQL de configuración');
        }
        
        throw productsError;
      }

      // CRITICAL FIX: Map database columns to application format
      const formattedProducts: Product[] = (products || []).map(p => {
        // CRITICAL: Parse images if they're stored as JSON string
        let parsedImages = [];
        if (p.images) {
          try {
            if (typeof p.images === 'string') {
              const parsed = JSON.parse(p.images);
              parsedImages = Array.isArray(parsed) ? parsed : [];
            } else if (Array.isArray(p.images)) {
              parsedImages = p.images.map((img: any) => {
                if (typeof img === 'string') {
                  try {
                    return JSON.parse(img);
                  } catch {
                    return img;
                  }
                }
                return img;
              });
            }
          } catch (e) {
            console.warn('⚠️ Error parsing images:', e);
            parsedImages = [];
          }
        }

        const result = {
          id: p.id,
          name: p.name,
          description: p.description,
          priceUSD: parseFloat(p.price_usd || p.price || 0), // Try both fields
          priceVES: parseFloat(p.price_ves || p.cost || 0), // Try both fields
          stock: p.stock || 0,
          reorderLevel: p.min_stock || p.reorder_level || 5,
          image: parsedImages?.[0]?.url || p.image || '', // Get first image URL
          images: parsedImages, // Keep full images array
          createdAt: p.created_at,
          updatedAt: p.updated_at,
        };
        
        if (parsedImages.length > 0) {
          console.log(`📸 Producto "${p.name}" cargado con ${parsedImages.length} imagen(es)`);
        }
        
        return result;
      });

      dispatch({ type: 'SET_PRODUCTS', payload: formattedProducts });
      console.log(`✅ Sincronizados ${formattedProducts.length} productos`);

      // CRITICAL FIX: Load sales with correct column mapping and field names
      const { data: sales, error: salesError } = await client
        .from('sales')
        .select(`
          *,
          sale_items (*)
        `)
        .order('created_at', { ascending: false });

      if (salesError && !salesError.message.includes('relation "public.sales" does not exist')) {
        console.error('❌ Error cargando ventas:', salesError);
        throw salesError;
      }

      // CRITICAL FIX: Map sales data correctly from database
      const formattedSales: Sale[] = (sales || []).map(s => ({
        id: s.id,
        paymentMethod: s.payment_method as PaymentMethod,
        // CRITICAL FIX: Use correct field mapping for totals
        totalUSD: parseFloat(s.total_usd || 0),
        totalVES: parseFloat(s.total_ves || 0),
        paidUSD: s.paid_usd ? parseFloat(s.paid_usd) : undefined,
        paidVES: s.paid_ves ? parseFloat(s.paid_ves) : undefined,
        reference: s.reference,
        lastFourDigits: s.last_four_digits,
        zelleEmail: s.zelle_email,
        zellePhone: s.zelle_phone,
        userId: s.user_id || 'system',
        userName: s.user_name || 'Sistema',
        createdAt: s.created_at,
        items: (s.sale_items || []).map((item: any) => ({
          productId: item.product_id,
          productName: item.product_name || 'Producto',
          quantity: item.quantity,
          priceUSD: parseFloat(item.unit_price || 0),
          priceVES: parseFloat(item.unit_price || 0),
        })),
      }));

      dispatch({ type: 'SET_SALES', payload: formattedSales });
      console.log(`✅ Sincronizadas ${formattedSales.length} ventas`);

      // CRITICAL FIX: Always update localStorage after successful sync
      localStorage.setItem('sales-app-products', JSON.stringify(formattedProducts));
      localStorage.setItem('sales-app-sales', JSON.stringify(formattedSales));

      dispatch({ type: 'SET_LAST_SYNC', payload: new Date().toISOString() });
      console.log('✅ Sincronización completada exitosamente');

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ Error sincronizando con Supabase:', error);
      dispatch({ type: 'SET_ERROR', payload: `Error de sincronización: ${errorMessage}` });
      throw error;
    }
  };

  // CRITICAL FIX: Updated migration with correct column mapping
  const migrateFromLocalStorage = async () => {
    const client = getSupabaseClient();
    if (!client) {
      toast.error('No conectado a Supabase - No se puede migrar');
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      console.log('🔄 Iniciando migración desde localStorage...');

      const organizationId = state.organizationId || '550e8400-e29b-41d4-a716-446655440000';

      // Migrate products with correct column mapping
      const savedProducts = localStorage.getItem('sales-app-products');
      if (savedProducts) {
        const products = JSON.parse(savedProducts);
        console.log(`📦 Migrando ${products.length} productos...`);
        
        for (const product of products) {
          const { error } = await client.from('products').upsert({
            id: product.id,
            organization_id: organizationId,
            name: product.name,
            description: product.description || '',
            price: product.priceUSD, // Map to correct column
            price_usd: product.priceUSD, // Also set explicit USD price
            price_ves: product.priceVES, // Set explicit VES price
            cost: product.priceVES, // Map to correct column
            stock: product.stock,
            min_stock: product.reorderLevel || 5,
            reorder_level: product.reorderLevel || 5,
            images: product.images || [], // Map to array
            image: product.image, // Also set single image field
            created_at: product.createdAt,
            updated_at: product.updatedAt,
          });
          
          if (error) {
            console.error('❌ Error migrando producto:', error);
            throw error;
          }
        }
        console.log('✅ Productos migrados exitosamente');
      }

      // CRITICAL FIX: Migrate sales with EXACT SQL schema mapping
      const savedSales = localStorage.getItem('sales-app-sales');
      if (savedSales) {
        const sales = JSON.parse(savedSales);
        console.log(`💰 Migrando ${sales.length} ventas...`);
        
        for (const sale of sales) {
          // SALES FIX: Map to exact SQL schema fields
          const { error: saleError } = await client.from('sales').upsert({
            id: sale.id,
            organization_id: organizationId,
            payment_method: sale.paymentMethod,
            // CRITICAL: Map totals according to SQL schema
            total_amount: sale.paymentMethod === 'usd' ? sale.totalUSD : 
                         sale.paymentMethod === 'ves' ? sale.totalVES :
                         sale.paymentMethod === 'mixed' ? (sale.totalUSD + sale.totalVES) : 
                         sale.paymentMethod === 'zelle' ? sale.totalUSD : sale.totalUSD,
            total_usd: sale.totalUSD || 0,
            total_ves: sale.totalVES || 0,
            paid_usd: sale.paidUSD || null,
            paid_ves: sale.paidVES || null,
            reference: sale.reference || null,
            last_four_digits: sale.lastFourDigits || null,
            zelle_email: sale.zelleEmail || null,
            zelle_phone: sale.zellePhone || null,
            user_id: sale.userId,
            user_name: sale.userName,
            created_at: sale.createdAt,
          });

          if (saleError) {
            console.error('❌ Error migrando venta:', saleError);
            throw saleError;
          }

          // SALE ITEMS FIX: Map to exact SQL schema fields
          await client.from('sale_items').delete().eq('sale_id', sale.id);
          
          for (const item of sale.items) {
            const { error: itemError } = await client.from('sale_items').insert({
              sale_id: sale.id,
              product_id: item.productId,
              product_name: item.productName,
              quantity: item.quantity,
              unit_price: item.priceUSD,
              price_usd: item.priceUSD || null,
              price_ves: item.priceVES || null,
              // CRITICAL FIX: Remove total_price calculation - let database handle it with DEFAULT
              // total_price: item.priceUSD * item.quantity, // REMOVED - causing the error
            });
            
            if (itemError) {
              console.error('❌ Error migrando item de venta:', itemError);
              throw itemError;
            }
          }
        }
        console.log('✅ Ventas migradas exitosamente');
      }

      // Reload data after migration silently
      await syncWithSupabase(true);
      
      // CRITICAL FIX: Show specific toast for migration completion
      toast.success('Migración completada exitosamente');
      console.log('✅ Migración completada exitosamente');
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ Error durante la migración:', error);
      toast.error(`Error en migración: ${errorMessage}`);
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // CRITICAL FIX: Keep legacy login function for backward compatibility but log deprecation
  const login = (username: string, password: string): boolean => {
    console.log('⚠️ DEPRECATED - Legacy login function called. Use Supabase Auth instead.');
    console.log('🔍 LOGIN DEBUG - Current user from Supabase Auth:', state.user);
    
    // If user is already authenticated via Supabase, return true
    if (state.user && !state.isAuthLoading) {
      console.log('✅ LOGIN DEBUG - User already authenticated via Supabase Auth');
      return true;
    }
    
    console.log('❌ LOGIN DEBUG - No user authenticated via Supabase Auth');
    return false;
  };

  // CRITICAL FIX: Keep legacy logout function but add Supabase signout
  const logout = async () => {
    console.log('🔍 LOGOUT DEBUG - Logging out user...');
    
    const client = getSupabaseClient();
    if (client) {
      try {
        const { error } = await client.auth.signOut();
        if (error) {
          console.error('❌ Error signing out from Supabase:', error);
        } else {
          console.log('✅ Successfully signed out from Supabase');
        }
      } catch (error) {
        console.error('❌ Error during Supabase signout:', error);
      }
    }
    
    // Clear local state
    dispatch({ type: 'SET_USER', payload: null });
    
    // Reset connection toast flag on logout
    connectionToastShown.current = false;
    lastConnectionTime.current = 0;
    
    // Clean up any legacy localStorage user data
    localStorage.removeItem('sales-app-user');
  };

  // CRITICAL FIX: Updated product functions with proper persistence and field validation
  const addProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    console.log('🔍 DEBUGGING - Datos recibidos en addProduct:', productData);
    console.log('🔍 DEBUGGING - priceVES value:', productData.priceVES, 'type:', typeof productData.priceVES);
    
    // CRITICAL FIX: Ensure all numeric fields are properly converted
    const newProduct: Product = {
      id: crypto.randomUUID(),
      name: productData.name || '',
      description: productData.description || '',
      priceUSD: typeof productData.priceUSD === 'number' ? productData.priceUSD : parseFloat(String(productData.priceUSD)) || 0,
      priceVES: typeof productData.priceVES === 'number' ? productData.priceVES : parseFloat(String(productData.priceVES)) || 0,
      stock: typeof productData.stock === 'number' ? productData.stock : parseInt(String(productData.stock)) || 0,
      reorderLevel: typeof productData.reorderLevel === 'number' ? productData.reorderLevel : parseInt(String(productData.reorderLevel)) || 5,
      image: productData.image || '',
      images: productData.images || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log('✅ DEBUGGING - Producto procesado:', newProduct);
    console.log('✅ DEBUGGING - priceVES final:', newProduct.priceVES, 'type:', typeof newProduct.priceVES);

    // CRITICAL FIX: Always update local state first (immediate persistence)
    dispatch({ type: 'ADD_PRODUCT', payload: newProduct });
    console.log('✅ Producto guardado en localStorage inmediatamente');

    // Then try to sync with Supabase
    const client = getSupabaseClient();
    if (client && state.isConnected) {
      try {
        const organizationId = state.organizationId || '550e8400-e29b-41d4-a716-446655440000';
        
        const supabaseData = {
          id: newProduct.id,
          organization_id: organizationId,
          name: newProduct.name,
          description: newProduct.description,
          price: newProduct.priceUSD, // Maps to 'price' column in database
          price_usd: newProduct.priceUSD, // Explicit USD price
          price_ves: newProduct.priceVES, // Explicit VES price
          cost: newProduct.priceVES,  // Maps to 'cost' column in database
          stock: newProduct.stock,
          min_stock: newProduct.reorderLevel,
          reorder_level: newProduct.reorderLevel,
          images: productData.images && productData.images.length > 0 ? productData.images : [],
          image: newProduct.image,
          created_at: newProduct.createdAt,
          updated_at: newProduct.updatedAt,
        };
        
        console.log('🔍 DEBUGGING - Datos enviados a Supabase:', supabaseData);
        console.log('📸 IMAGES DEBUG - Tipo:', typeof supabaseData.images);
        console.log('📸 IMAGES DEBUG - Contenido:', JSON.stringify(supabaseData.images));
        
        const { error } = await client.from('products').insert(supabaseData);

        if (error) {
          console.error('❌ Error añadiendo producto a Supabase:', error);
          toast.error(`Error Supabase: ${error.message} - Guardado localmente`);
        } else {
          console.log('✅ Producto añadido a Supabase exitosamente');
          console.log('📸 Imágenes guardadas:', supabaseData.images?.length || 0);
          toast.success('Producto guardado en Supabase');
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        console.error('❌ Error con Supabase, guardado localmente:', error);
        toast.error(`Error Supabase: ${errorMessage} - Guardado localmente`);
      }
    } else {
      console.log('💾 Producto guardado solo localmente (Supabase no disponible)');
      toast.success('Producto guardado localmente');
    }
  };

  const updateProduct = async (product: Product) => {
    console.log('🔍 DEBUGGING - Datos recibidos en updateProduct:', product);
    console.log('🔍 DEBUGGING - priceVES value:', product.priceVES, 'type:', typeof product.priceVES);
    
    // CRITICAL FIX: Ensure all numeric fields are properly converted
    const updatedProduct: Product = {
      ...product,
      priceUSD: typeof product.priceUSD === 'number' ? product.priceUSD : parseFloat(String(product.priceUSD)) || 0,
      priceVES: typeof product.priceVES === 'number' ? product.priceVES : parseFloat(String(product.priceVES)) || 0,
      stock: typeof product.stock === 'number' ? product.stock : parseInt(String(product.stock)) || 0,
      reorderLevel: typeof product.reorderLevel === 'number' ? product.reorderLevel : parseInt(String(product.reorderLevel)) || 5,
      updatedAt: new Date().toISOString()
    };

    console.log('✅ DEBUGGING - Producto actualizado procesado:', updatedProduct);
    console.log('✅ DEBUGGING - priceVES final:', updatedProduct.priceVES, 'type:', typeof updatedProduct.priceVES);

    // CRITICAL FIX: Always update local state first (immediate persistence)
    dispatch({ type: 'UPDATE_PRODUCT', payload: updatedProduct });
    console.log('✅ Producto actualizado en localStorage inmediatamente');

    // Then try to sync with Supabase
    const client = getSupabaseClient();
    if (client && state.isConnected) {
      try {
        const supabaseData = {
          name: updatedProduct.name,
          description: updatedProduct.description,
          price: updatedProduct.priceUSD, // Maps to 'price' column in database
          price_usd: updatedProduct.priceUSD, // Explicit USD price
          price_ves: updatedProduct.priceVES, // Explicit VES price
          cost: updatedProduct.priceVES,  // Maps to 'cost' column in database
          stock: updatedProduct.stock,
          min_stock: updatedProduct.reorderLevel,
          reorder_level: updatedProduct.reorderLevel,
          images: updatedProduct.images && updatedProduct.images.length > 0 ? updatedProduct.images : [],
          image: updatedProduct.image,
          updated_at: updatedProduct.updatedAt,
        };
        
        console.log('🔍 DEBUGGING - Datos de actualización enviados a Supabase:', supabaseData);
        console.log('📸 IMAGES DEBUG - Tipo:', typeof supabaseData.images);
        console.log('📸 IMAGES DEBUG - Contenido:', JSON.stringify(supabaseData.images));
        
        const { error } = await client
          .from('products')
          .update(supabaseData)
          .eq('id', updatedProduct.id);

        if (error) {
          console.error('❌ Error actualizando producto en Supabase:', error);
          toast.error(`Error Supabase: ${error.message} - Guardado localmente`);
        } else {
          console.log('✅ Producto actualizado en Supabase exitosamente');
          console.log('📸 Imágenes actualizadas:', supabaseData.images?.length || 0);
          toast.success('Producto actualizado en Supabase');
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        console.error('❌ Error con Supabase, guardado localmente:', error);
        toast.error(`Error Supabase: ${errorMessage} - Guardado localmente`);
      }
    } else {
      console.log('💾 Producto actualizado solo localmente (Supabase no disponible)');
      toast.success('Producto actualizado localmente');
    }
  };

  const deleteProduct = async (id: string) => {
    console.log('🗑️ Eliminando producto:', id);

    // CRITICAL FIX: Always update local state first (immediate persistence)
    dispatch({ type: 'DELETE_PRODUCT', payload: id });

    // Then try to sync with Supabase
    const client = getSupabaseClient();
    if (client && state.isConnected) {
      try {
        const { error } = await client.from('products').delete().eq('id', id);
        if (error) {
          console.error('❌ Error eliminando producto de Supabase:', error);
          toast.error(`Error Supabase: ${error.message} - Eliminado localmente`);
        } else {
          console.log('✅ Producto eliminado de Supabase');
          toast.success('Producto eliminado de Supabase');
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        console.error('❌ Error con Supabase, eliminado localmente:', error);
        toast.error(`Error Supabase: ${errorMessage} - Eliminado localmente`);
      }
    } else {
      console.log('💾 Producto eliminado localmente');
      toast.success('Producto eliminado localmente');
    }
  };

  // SALES FIX: Updated addSale function with EXACT SQL schema mapping
  const addSale = async (saleData: Omit<Sale, 'id' | 'createdAt'>) => {
    console.log('🔍 SALES DEBUGGING - Sale data received:', saleData);
    
    const newSale: Sale = {
      ...saleData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };

    console.log('💰 SALES - Registrando venta:', newSale.id, 'Método:', newSale.paymentMethod);
    console.log('💰 SALES - Datos completos:', {
      paymentMethod: newSale.paymentMethod,
      totalUSD: newSale.totalUSD,
      totalVES: newSale.totalVES,
      paidUSD: newSale.paidUSD,
      paidVES: newSale.paidVES,
      items: newSale.items.length,
      userId: newSale.userId,
      userName: newSale.userName
    });

    // SALES FIX: Always update local state first (immediate persistence)
    dispatch({ type: 'ADD_SALE', payload: newSale });

    // Update stock locally
    saleData.items.forEach(item => {
      dispatch({
        type: 'UPDATE_STOCK',
        payload: { productId: item.productId, quantity: item.quantity }
      });
    });

    // SALES FIX: Sync with Supabase using EXACT SQL schema mapping
    const client = getSupabaseClient();
    if (client && state.isConnected) {
      try {
        const organizationId = state.organizationId || '550e8400-e29b-41d4-a716-446655440000';
        
        // SALES FIX: Map to EXACT SQL schema fields from database_sales_fixed.sql
        const saleInsertData = {
          id: newSale.id,
          organization_id: organizationId,
          // Required fields from SQL schema
          payment_method: newSale.paymentMethod,
          total_amount: newSale.paymentMethod === 'usd' ? newSale.totalUSD : 
                       newSale.paymentMethod === 'ves' ? newSale.totalVES :
                       newSale.paymentMethod === 'mixed' ? (newSale.totalUSD + newSale.totalVES) : 
                       newSale.paymentMethod === 'zelle' ? newSale.totalUSD : newSale.totalUSD,
          total_usd: newSale.totalUSD || 0,
          total_ves: newSale.totalVES || 0,
          // Optional fields (can be null)
          paid_usd: newSale.paidUSD || null,
          paid_ves: newSale.paidVES || null,
          reference: newSale.reference || null,
          last_four_digits: newSale.lastFourDigits || null,
          zelle_email: newSale.zelleEmail || null,
          zelle_phone: newSale.zellePhone || null,
          // Required user fields
          user_id: newSale.userId,
          user_name: newSale.userName,
          created_at: newSale.createdAt,
        };

        console.log('🔍 SALES - Datos enviados a Supabase sales table:', saleInsertData);
        
        const { error: saleError } = await client.from('sales').insert(saleInsertData);

        if (saleError) {
          console.error('❌ SALES - Error insertando venta:', saleError);
          toast.error(`Error Supabase: ${saleError.message} - Guardado localmente`);
        } else {
          console.log('✅ SALES - Venta insertada en Supabase exitosamente');
          
          // CRITICAL FIX: Insert sale items WITHOUT total_price field - let database calculate it
          const saleItems = newSale.items.map(item => ({
            sale_id: newSale.id,
            product_id: item.productId, // VARCHAR(255) in SQL schema
            product_name: item.productName,
            quantity: item.quantity,
            unit_price: item.priceUSD,
            price_usd: item.priceUSD || null,
            price_ves: item.priceVES || null,
            // CRITICAL FIX: Removed total_price - let database handle with DEFAULT 0
            // total_price: item.priceUSD * item.quantity, // REMOVED - this was causing the error
          }));

          console.log('🔍 SALES - Datos enviados a Supabase sale_items table:', saleItems);

          const { error: itemsError } = await client.from('sale_items').insert(saleItems);
          if (itemsError) {
            console.error('❌ SALES - Error insertando items de venta:', itemsError);
            toast.error(`Error items: ${itemsError.message}`);
          } else {
            console.log('✅ SALES - Items de venta insertados exitosamente');
          }

          console.log('✅ SALES - Venta registrada completamente en Supabase');
          toast.success('Venta registrada en Supabase');
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        console.error('❌ SALES - Error con Supabase, guardado localmente:', error);
        toast.error(`Error Supabase: ${errorMessage} - Guardado localmente`);
      }
    } else {
      console.log('💾 SALES - Venta registrada localmente');
      toast.success('Venta registrada localmente');
    }
  };

  const deleteSale = async (id: string) => {
    console.log('🗑️ Eliminando venta:', id);

    // CRITICAL FIX: Always update local state first (immediate persistence)
    dispatch({ type: 'DELETE_SALE', payload: id });

    // Then try to sync with Supabase
    const client = getSupabaseClient();
    if (client && state.isConnected) {
      try {
        const { error } = await client.from('sales').delete().eq('id', id);
        if (error) {
          console.error('❌ Error eliminando venta de Supabase:', error);
          toast.error(`Error Supabase: ${error.message} - Eliminado localmente`);
        } else {
          console.log('✅ Venta eliminada de Supabase');
          toast.success('Venta eliminada de Supabase');
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        console.error('❌ Error con Supabase, eliminado localmente:', error);
        toast.error(`Error Supabase: ${errorMessage} - Eliminado localmente`);
      }
    } else {
      console.log('💾 Venta eliminada localmente');
      toast.success('Venta eliminada localmente');
    }
  };

  // Clear sales function for cash closure
  const clearSales = async () => {
    console.log('🧹 Limpiando ventas...');
    dispatch({ type: 'SET_SALES', payload: [] });
    localStorage.setItem('sales-app-sales', JSON.stringify([]));
    
    const client = getSupabaseClient();
    if (client && state.isConnected) {
      try {
        const { error } = await client.from('sales').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) {
          console.error('❌ Error limpiando ventas de Supabase:', error);
        } else {
          console.log('✅ Ventas limpiadas de Supabase');
        }
      } catch (error) {
        console.error('❌ Error limpiando ventas:', error);
      }
    }
  };

  // Obtener métricas del dashboard (CORREGIDO PARA MÉTODO MIXTO)
  const getDashboardMetrics = (): DashboardMetrics => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // CORRECCIÓN: Calcular totales usando montos reales pagados
    const totalSalesUSD = state.sales.reduce((sum, sale) => {
      if (sale.paymentMethod === 'usd') return sum + sale.totalUSD;
      if (sale.paymentMethod === 'mixed') return sum + (sale.paidUSD || 0);
      return sum;
    }, 0);
    
    const totalSalesVES = state.sales.reduce((sum, sale) => {
      if (sale.paymentMethod === 'ves') return sum + sale.totalVES;
      if (sale.paymentMethod === 'mixed') return sum + (sale.paidVES || 0);
      return sum;
    }, 0);
    
    const todaySales = state.sales.filter(sale => 
      new Date(sale.createdAt) >= today
    ).length;
    
    const weeklySales = state.sales.filter(sale => 
      new Date(sale.createdAt) >= weekAgo
    ).length;
    
    const monthlySales = state.sales.filter(sale => 
      new Date(sale.createdAt) >= monthAgo
    ).length;

    const lowStockProducts = state.products.filter(p => p.stock > 0 && p.stock <= 5).length;

    return {
      totalSalesUSD,
      totalSalesVES,
      totalProducts: state.products.length,
      lowStockProducts,
      todaySales,
      weeklySales,
      monthlySales,
    };
  };

  // Filtrar ventas para reportes (CORREGIDO PARA MÉTODO MIXTO)
  const getFilteredSales = (filters: ReportFilters): Sale[] => {
    return state.sales.filter(sale => {
      const saleDate = new Date(sale.createdAt);
      const startDate = new Date(filters.startDate + 'T00:00:00.000Z');
      const endDate = new Date(filters.endDate + 'T23:59:59.999Z');
      
      const matchesDate = saleDate >= startDate && saleDate <= endDate;
      const matchesPayment = !filters.paymentMethod || filters.paymentMethod === 'all' || sale.paymentMethod === filters.paymentMethod;
      const matchesUser = !filters.userId || sale.userId === filters.userId;
      
      return matchesDate && matchesPayment && matchesUser;
    });
  };

  const value = {
    state,
    dispatch,
    login,
    logout,
    addProduct,
    updateProduct,
    deleteProduct,
    addSale,
    deleteSale,
    clearSales,
    getDashboardMetrics,
    getFilteredSales,
    syncWithSupabase,
    migrateFromLocalStorage,
    updateSupabaseConfig,
  };

  return <SupabaseContext.Provider value={value}>{children}</SupabaseContext.Provider>;
}

// Hook para usar el contexto
export function useSupabase() {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
}