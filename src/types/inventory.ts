export interface Product {
  id: string;
  name: string;
  priceUSD: number;
  priceVES: number;
  stock: number;
  image?: string;
  images?: ProductImage[];
  createdAt: string;
  updatedAt: string;
  locationId?: string;
  variants?: ProductVariant[];
}

export interface ProductImage {
  id: string;
  url: string;
  name: string;
  uploadedAt: string;
  isMain?: boolean;
  path?: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  priceUSD: number;
  priceVES: number;
  stock: number;
  attributes: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface Location {
  id: string;
  name: string;
  description?: string;
  address?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  locationId?: string;
  locationName?: string;
  type: 'in' | 'out' | 'transfer' | 'adjustment';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason?: string;
  reference?: string;
  userId: string;
  userName: string;
  createdAt: string;
}

export interface StockAlert {
  id: string;
  productId: string;
  productName: string;
  locationId?: string;
  locationName?: string;
  currentStock: number;
  minStock: number;
  alertType: 'low_stock' | 'out_of_stock';
  isActive: boolean;
  createdAt: string;
  resolvedAt?: string;
}

export interface InventoryFilters {
  search?: string;
  locationId?: string;
  lowStock?: boolean;
  outOfStock?: boolean;
  category?: string;
}

export interface StockMovementFilters {
  productId?: string;
  locationId?: string;
  type?: StockMovement['type'];
  startDate?: string;
  endDate?: string;
  userId?: string;
}

export interface LocationStats {
  totalProducts: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalMovements: number;
}

export interface ProductStats {
  totalSold: number;
  totalRevenue: number;
  averagePrice: number;
  stockTurnover: number;
  lastSaleDate?: string;
}

// Inventory management functions
export interface InventoryManager {
  // Product management
  getProducts: (filters?: InventoryFilters) => Promise<Product[]>;
  getProduct: (id: string) => Promise<Product | null>;
  createProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Product>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<Product>;
  deleteProduct: (id: string) => Promise<void>;
  
  // Stock management
  adjustStock: (productId: string, quantity: number, reason?: string) => Promise<StockMovement>;
  transferStock: (productId: string, fromLocationId: string, toLocationId: string, quantity: number) => Promise<StockMovement>;
  getStockMovements: (filters?: StockMovementFilters) => Promise<StockMovement[]>;
  
  // Location management
  getLocations: () => Promise<Location[]>;
  createLocation: (location: Omit<Location, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Location>;
  updateLocation: (id: string, updates: Partial<Location>) => Promise<Location>;
  deleteLocation: (id: string) => Promise<void>;
  
  // Alerts and analytics
  getStockAlerts: () => Promise<StockAlert[]>;
  resolveStockAlert: (id: string) => Promise<void>;
  getLocationStats: (locationId?: string) => Promise<LocationStats>;
  getProductStats: (productId: string) => Promise<ProductStats>;
}

// Batch operations
export interface BatchStockUpdate {
  productId: string;
  quantity: number;
  reason?: string;
}

export interface BatchTransfer {
  productId: string;
  quantity: number;
  fromLocationId: string;
  toLocationId: string;
}

// Import/Export types
export interface ProductImportData {
  name: string;
  priceUSD: number;
  priceVES: number;
  stock: number;
  locationId?: string;
  image?: string;
}

export interface ProductExportData extends Product {
  locationName?: string;
  totalSold?: number;
  totalRevenue?: number;
}

// Inventory report types
export interface InventoryReport {
  id: string;
  type: 'stock_valuation' | 'movement_summary' | 'low_stock' | 'product_performance';
  title: string;
  description?: string;
  filters: InventoryFilters & StockMovementFilters;
  data: Record<string, unknown>;
  generatedAt: string;
  generatedBy: string;
}

// Inventory configuration
export interface InventoryConfig {
  defaultLocationId?: string;
  lowStockThreshold: number;
  autoCreateAlerts: boolean;
  allowNegativeStock: boolean;
  trackMovements: boolean;
  enableBarcodes: boolean;
  enableVariants: boolean;
}

// Barcode types
export interface BarcodeData {
  productId: string;
  variantId?: string;
  code: string;
  type: 'ean13' | 'ean8' | 'upc' | 'code128' | 'qr';
  createdAt: string;
}

// Supplier integration types
export interface SupplierProduct {
  supplierId: string;
  supplierProductId: string;
  supplierSku?: string;
  supplierPrice: number;
  currency: 'USD' | 'VES';
  minimumOrderQuantity?: number;
  leadTimeDays?: number;
  lastUpdated: string;
}

// Audit trail
export interface InventoryAuditLog {
  id: string;
  entityType: 'product' | 'location' | 'stock_movement' | 'alert';
  entityId: string;
  action: 'create' | 'update' | 'delete' | 'resolve';
  changes: Record<string, { old?: unknown; new?: unknown }>;
  userId: string;
  userName: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

// Inventory dashboard types
export interface InventoryDashboardData {
  totalProducts: number;
  totalLocations: number;
  totalValue: {
    usd: number;
    ves: number;
  };
  lowStockAlerts: number;
  outOfStockAlerts: number;
  recentMovements: StockMovement[];
  topProducts: Array<{
    product: Product;
    stats: ProductStats;
  }>;
  locationStats: Array<{
    location: Location;
    stats: LocationStats;
  }>;
}

// Search and filtering
export interface InventorySearchResult {
  products: Product[];
  locations: Location[];
  movements: StockMovement[];
  totalResults: number;
  searchTime: number;
}

export interface InventorySearchFilters extends InventoryFilters {
  includeProducts?: boolean;
  includeLocations?: boolean;
  includeMovements?: boolean;
  limit?: number;
  offset?: number;
}

// Notification types
export interface InventoryNotification {
  id: string;
  type: 'low_stock' | 'out_of_stock' | 'reorder_point' | 'expiry_warning';
  title: string;
  message: string;
  productId?: string;
  locationId?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  isRead: boolean;
  createdAt: string;
  expiresAt?: string;
}

// Inventory synchronization
export interface InventorySyncStatus {
  lastSync: string;
  isOnline: boolean;
  pendingChanges: number;
  conflictCount: number;
  syncInProgress: boolean;
}

export interface InventorySyncConflict {
  id: string;
  entityType: 'product' | 'location' | 'movement';
  entityId: string;
  localVersion: Record<string, unknown>;
  remoteVersion: Record<string, unknown>;
  conflictFields: string[];
  createdAt: string;
}

// Category management
export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryTree extends ProductCategory {
  children: CategoryTree[];
  productCount: number;
}

// Unit of measure
export interface UnitOfMeasure {
  id: string;
  name: string;
  symbol: string;
  type: 'weight' | 'volume' | 'length' | 'area' | 'count';
  baseUnit?: string;
  conversionFactor?: number;
  isActive: boolean;
}

// Product attributes
export interface ProductAttribute {
  id: string;
  name: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'multiselect';
  options?: string[];
  isRequired: boolean;
  isVariant: boolean;
  sortOrder: number;
}

// Inventory templates
export interface InventoryTemplate {
  id: string;
  name: string;
  description?: string;
  type: 'product' | 'location' | 'movement';
  template: Record<string, unknown>;
  isPublic: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Bulk operations
export interface BulkOperation {
  id: string;
  type: 'import' | 'export' | 'update' | 'delete';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalItems: number;
  processedItems: number;
  failedItems: number;
  errors: string[];
  result?: Record<string, unknown>;
  createdBy: string;
  createdAt: string;
  completedAt?: string;
}

// Inventory integration webhooks
export interface InventoryWebhook {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  secret?: string;
  lastTriggered?: string;
  failureCount: number;
  createdAt: string;
}

// Advanced inventory types for future features
export type InventoryEventType = 
  | 'product.created'
  | 'product.updated'
  | 'product.deleted'
  | 'stock.adjusted'
  | 'stock.transferred'
  | 'alert.created'
  | 'alert.resolved'
  | 'location.created'
  | 'location.updated'
  | 'location.deleted';

export interface InventoryEvent {
  id: string;
  type: InventoryEventType;
  entityId: string;
  data: Record<string, unknown>;
  userId?: string;
  timestamp: string;
}

// Placeholder interfaces for future features
export type AdvancedInventoryFeatures = Record<string, never>;
export type InventoryIntegrations = Record<string, never>;
