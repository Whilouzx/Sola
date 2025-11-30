// Account Management Types for Flowi
export type Currency = 'USD' | 'VES';
export type PaymentMethod = 'usd' | 'ves' | 'mixed' | 'zelle';
export type AccountStatus = 'pending' | 'partial' | 'paid' | 'overdue';
export type AccountType = 'receivable' | 'payable';

// Entity Types for Accounts Payable
export type EntityType = 'supplier' | 'company' | 'utility' | 'institution' | 'general';

// Customer Types - Enhanced with Marketing and Points
export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone: string;
  sector: string; // Changed from address to sector
  creditLimit: number;
  paymentTerms: number;
  marketingSource?: string; // Marketing source
  campaignId?: string; // Campaign ID
  referralCode?: string; // Referral code
  totalPoints?: number; // Total loyalty points
  customerLevel?: string; // Customer level (bronze, silver, gold, platinum)
  isOverdue?: boolean; // Optional for now
  overdueAmount?: number; // Optional for now
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerData {
  name: string;
  email?: string;
  phone: string;
  sector: string; // Changed from address to sector
  creditLimit: number;
  paymentTerms: number;
  marketingSource?: string;
  campaignId?: string;
  referralCode?: string;
}

// Database Types (matching Supabase schema)
export interface DatabaseCustomer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string; // Maps to sector in UI
  credit_limit: number;
  payment_terms: number;
  marketing_source?: string;
  campaign_id?: string;
  referral_code?: string;
  total_points?: number;
  customer_level?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Supplier Types
export interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  paymentTerms: number;
  taxId?: string;
  bankName?: string;
  bankAccount?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  paymentTerms: number;
  taxId?: string;
  bankName?: string;
  bankAccount?: string;
}

// Accounts Receivable Types
export interface AccountReceivable {
  id: string;
  customerId: string;
  customerName?: string;
  invoiceNumber: string;
  amount: number;
  currency: Currency;
  dueDate: string;
  status: AccountStatus;
  description?: string;
  saleId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceData {
  customerId: string;
  invoiceNumber: string;
  amount: number;
  currency: Currency;
  dueDate: string;
  description?: string;
  saleId?: string;
}

// Accounts Payable Types
export interface AccountPayable {
  id: string;
  entityType: EntityType;
  supplierId?: string;
  supplierName?: string;
  entityName?: string;
  billNumber: string;
  amount: number;
  currency: Currency;
  dueDate: string;
  status: AccountStatus;
  description?: string;
  category?: string;
  expenseId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BillData {
  entityType: EntityType;
  supplierId?: string;
  entityName?: string;
  billNumber: string;
  amount: number;
  currency: Currency;
  dueDate: string;
  description?: string;
  category?: string;
  expenseId?: string;
}

// Payment Types
export interface Payment {
  id: string;
  accountId: string;
  accountType: AccountType;
  amount: number;
  currency: Currency;
  paymentMethod: PaymentMethod;
  reference?: string;
  zelleEmail?: string;
  zellePhone?: string;
  notes?: string;
  processedAt: string;
  createdAt: string;
}

export interface PaymentData {
  accountId: string;
  accountType: AccountType;
  amount: number;
  currency: Currency;
  paymentMethod: PaymentMethod;
  reference?: string;
  zelleEmail?: string;
  zellePhone?: string;
  notes?: string;
}

// Expense Types
export interface Expense {
  id: string;
  category: string;
  amount: number;
  currency: Currency;
  description?: string;
  supplierId?: string;
  supplierName?: string;
  receiptUrl?: string;
  isRecurring: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseData {
  category: string;
  amount: number;
  currency: Currency;
  description?: string;
  supplierId?: string;
  receiptUrl?: string;
  isRecurring: boolean;
}

// Filters and Search Types
export interface AccountFilters {
  status?: AccountStatus;
  currency?: Currency;
  customerId?: string;
  supplierId?: string;
  entityType?: EntityType;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface ExpenseFilters {
  category?: string;
  currency?: Currency;
  supplierId?: string;
  dateFrom?: string;
  dateTo?: string;
  isRecurring?: boolean;
}

// Form Validation Types
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}