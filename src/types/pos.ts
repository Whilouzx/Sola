export interface Sale {
  id: string;
  items: SaleItem[];
  paymentMethod: PaymentMethod;
  totalUSD: number;
  totalVES: number;
  lastFourDigits?: string;
  userId: string;
  userName: string;
  createdAt: string;
  paidUSD?: number;
  paidVES?: number;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  priceUSD: number;
  priceVES: number;
}

export type PaymentMethod = 'usd' | 'ves' | 'mixed';

export interface PaymentDetails {
  lastFourDigits: string;
  paidUSD?: number;
  paidVES?: number;
}

export interface Quotation {
  id: string;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  items: QuotationItem[];
  subtotalUSD: number;
  subtotalVES: number;
  discountPercentage: number;
  discountAmountUSD: number;
  discountAmountVES: number;
  taxPercentage: number;
  taxAmountUSD: number;
  taxAmountVES: number;
  totalUSD: number;
  totalVES: number;
  validUntil: string;
  status: QuotationStatus;
  notes?: string;
  terms?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  convertedToSaleId?: string;
  convertedAt?: string;
}

export interface QuotationItem {
  id: string;
  productId: string;
  productName: string;
  description?: string;
  quantity: number;
  unitPriceUSD: number;
  unitPriceVES: number;
  discountPercentage: number;
  totalUSD: number;
  totalVES: number;
}

export type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted';

export interface Delivery {
  id: string;
  saleId?: string;
  quotationId?: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  deliveryAddress: DeliveryAddress;
  items: DeliveryItem[];
  scheduledDate: string;
  scheduledTimeSlot: string;
  status: DeliveryStatus;
  priority: DeliveryPriority;
  deliveryFee: number;
  specialInstructions?: string;
  driverId?: string;
  driverName?: string;
  trackingNumber?: string;
  estimatedArrival?: string;
  actualArrival?: string;
  deliveryProof?: DeliveryProof;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryAddress {
  street: string;
  city: string;
  state: string;
  postalCode?: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  landmark?: string;
}

export interface DeliveryItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  delivered: boolean;
  notes?: string;
}

export type DeliveryStatus = 
  | 'scheduled' 
  | 'confirmed' 
  | 'in_transit' 
  | 'out_for_delivery' 
  | 'delivered' 
  | 'failed' 
  | 'cancelled' 
  | 'returned';

export type DeliveryPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface DeliveryProof {
  type: 'signature' | 'photo' | 'code';
  data: string; // Base64 encoded image or signature data, or confirmation code
  timestamp: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface PaymentRecord {
  id: string;
  saleId?: string;
  quotationId?: string;
  customerId?: string;
  amount: number;
  currency: 'USD' | 'VES';
  paymentMethod: PaymentMethodType;
  paymentDetails: Record<string, unknown>;
  status: PaymentStatus;
  reference?: string;
  description?: string;
  processedAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type PaymentMethodType = 
  | 'cash_usd'
  | 'cash_ves'
  | 'mobile_payment'
  | 'bank_transfer'
  | 'credit_card'
  | 'debit_card'
  | 'digital_wallet'
  | 'cryptocurrency'
  | 'check'
  | 'other';

export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';

export interface POSSession {
  id: string;
  userId: string;
  userName: string;
  startTime: string;
  endTime?: string;
  initialCashUSD: number;
  initialCashVES: number;
  finalCashUSD?: number;
  finalCashVES?: number;
  totalSalesUSD: number;
  totalSalesVES: number;
  totalTransactions: number;
  status: 'active' | 'closed' | 'suspended';
  notes?: string;
  location?: string;
  terminal?: string;
}

export interface CashDrawer {
  sessionId: string;
  currentCashUSD: number;
  currentCashVES: number;
  transactions: CashTransaction[];
  lastUpdated: string;
}

export interface CashTransaction {
  id: string;
  type: 'sale' | 'refund' | 'cash_in' | 'cash_out' | 'opening' | 'closing';
  amountUSD: number;
  amountVES: number;
  reason?: string;
  reference?: string;
  timestamp: string;
  userId: string;
}

export interface POSConfiguration {
  id: string;
  name: string;
  settings: {
    autoOpenDrawer: boolean;
    printReceipts: boolean;
    requireCustomerInfo: boolean;
    allowDiscounts: boolean;
    maxDiscountPercentage: number;
    allowRefunds: boolean;
    refundTimeLimit: number; // hours
    defaultPaymentMethod: PaymentMethodType;
    taxRate: number;
    currency: 'USD' | 'VES' | 'BOTH';
    roundingMethod: 'round' | 'floor' | 'ceil';
    lowStockWarning: boolean;
    lowStockThreshold: number;
  };
  printerConfig?: {
    name: string;
    type: 'thermal' | 'inkjet' | 'laser';
    width: number;
    encoding: string;
  };
  displayConfig?: {
    customerDisplay: boolean;
    showPrices: boolean;
    showPromotions: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Receipt {
  id: string;
  saleId: string;
  type: 'sale' | 'refund' | 'quotation';
  template: string;
  data: Record<string, unknown>;
  printed: boolean;
  printedAt?: string;
  createdAt: string;
}

export interface Promotion {
  id: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed_amount' | 'buy_x_get_y' | 'bundle';
  value: number;
  conditions: PromotionCondition[];
  applicableProducts: string[];
  applicableCategories: string[];
  startDate: string;
  endDate: string;
  isActive: boolean;
  usageLimit?: number;
  usageCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PromotionCondition {
  type: 'min_quantity' | 'min_amount' | 'customer_type' | 'time_range' | 'day_of_week';
  value: string | number;
  operator: 'equals' | 'greater_than' | 'less_than' | 'in' | 'not_in';
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: DeliveryAddress;
  type: 'regular' | 'vip' | 'wholesale';
  creditLimit?: number;
  currentCredit?: number;
  discountPercentage?: number;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastPurchase?: string;
  totalPurchases: number;
  totalSpent: number;
}

export interface LoyaltyProgram {
  id: string;
  customerId: string;
  points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  joinDate: string;
  lastActivity: string;
  rewards: LoyaltyReward[];
}

export interface LoyaltyReward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  type: 'discount' | 'free_product' | 'cash_back';
  value: number;
  isActive: boolean;
  expiresAt?: string;
}

export interface Refund {
  id: string;
  originalSaleId: string;
  items: RefundItem[];
  reason: string;
  refundMethod: PaymentMethodType;
  totalAmount: number;
  currency: 'USD' | 'VES';
  status: 'pending' | 'approved' | 'processed' | 'rejected';
  processedBy?: string;
  processedAt?: string;
  createdBy: string;
  createdAt: string;
  notes?: string;
}

export interface RefundItem {
  productId: string;
  productName: string;
  originalQuantity: number;
  refundQuantity: number;
  unitPrice: number;
  refundAmount: number;
  reason?: string;
}

export interface Discount {
  id: string;
  type: 'percentage' | 'fixed_amount';
  value: number;
  reason?: string;
  appliedBy: string;
  appliedAt: string;
  maxAmount?: number;
  minPurchase?: number;
}

export interface Tax {
  id: string;
  name: string;
  rate: number;
  type: 'percentage' | 'fixed_amount';
  applicableProducts: string[];
  applicableCategories: string[];
  isActive: boolean;
  startDate?: string;
  endDate?: string;
}

export interface POSReport {
  id: string;
  type: 'daily_sales' | 'product_performance' | 'payment_methods' | 'customer_analysis' | 'inventory_impact';
  title: string;
  description?: string;
  dateRange: {
    start: string;
    end: string;
  };
  filters: Record<string, unknown>;
  data: Record<string, unknown>;
  generatedAt: string;
  generatedBy: string;
}

export interface POSAnalytics {
  salesTrends: {
    daily: Array<{ date: string; sales: number; transactions: number }>;
    hourly: Array<{ hour: number; sales: number; transactions: number }>;
  };
  topProducts: Array<{
    productId: string;
    productName: string;
    quantitySold: number;
    revenue: number;
  }>;
  paymentMethodDistribution: Array<{
    method: PaymentMethodType;
    count: number;
    amount: number;
    percentage: number;
  }>;
  customerMetrics: {
    newCustomers: number;
    returningCustomers: number;
    averageOrderValue: number;
    customerLifetimeValue: number;
  };
  performanceMetrics: {
    transactionsPerHour: number;
    averageTransactionTime: number;
    refundRate: number;
    discountRate: number;
  };
}

export interface POSIntegration {
  id: string;
  name: string;
  type: 'payment_processor' | 'accounting' | 'inventory' | 'crm' | 'loyalty';
  config: Record<string, unknown>;
  isActive: boolean;
  lastSync?: string;
  syncStatus: 'success' | 'error' | 'pending';
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface POSDevice {
  id: string;
  name: string;
  type: 'terminal' | 'tablet' | 'mobile' | 'kiosk';
  location: string;
  ipAddress?: string;
  macAddress?: string;
  isOnline: boolean;
  lastSeen: string;
  currentSession?: string;
  configuration: POSConfiguration;
  capabilities: string[];
  createdAt: string;
  updatedAt: string;
}

export interface POSTransaction {
  id: string;
  sessionId: string;
  type: 'sale' | 'refund' | 'void' | 'exchange';
  items: SaleItem[];
  subtotal: number;
  discounts: Discount[];
  taxes: Tax[];
  total: number;
  currency: 'USD' | 'VES';
  payments: PaymentRecord[];
  customer?: Customer;
  status: 'pending' | 'completed' | 'cancelled' | 'voided';
  receipt?: Receipt;
  createdAt: string;
  completedAt?: string;
  voidedAt?: string;
  voidReason?: string;
}

// Inventory integration types
export interface InventoryUpdate {
  productId: string;
  quantityChange: number;
  reason: 'sale' | 'refund' | 'adjustment' | 'transfer';
  reference?: string;
  timestamp: string;
}

// Multi-location POS types
export interface POSLocation {
  id: string;
  name: string;
  address: DeliveryAddress;
  timezone: string;
  currency: 'USD' | 'VES' | 'BOTH';
  taxRates: Tax[];
  isActive: boolean;
  devices: POSDevice[];
  inventory: string[]; // Product IDs available at this location
  createdAt: string;
  updatedAt: string;
}

// Advanced POS features
export interface POSWorkflow {
  id: string;
  name: string;
  description?: string;
  trigger: 'sale_completed' | 'refund_processed' | 'customer_created' | 'low_stock';
  conditions: Array<{
    field: string;
    operator: string;
    value: unknown;
  }>;
  actions: Array<{
    type: string;
    config: Record<string, unknown>;
  }>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// POS security and audit
export interface POSAuditLog {
  id: string;
  sessionId?: string;
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  details: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

// POS backup and sync
export interface POSBackup {
  id: string;
  type: 'full' | 'incremental';
  data: Record<string, unknown>;
  size: number;
  createdAt: string;
  expiresAt?: string;
  location: 'local' | 'cloud';
  path?: string;
}

// Future extensibility
export type POSExtension = Record<string, never>;
export type POSPlugin = Record<string, never>;