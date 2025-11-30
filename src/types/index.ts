// Core business entities
import { ProductImage } from './inventory';

export interface Product {
  id: string;
  name: string;
  description?: string;
  priceUSD: number;
  priceVES: number;
  stock: number;
  reorderLevel?: number;
  image?: string;
  images?: ProductImage[];
  createdAt: string;
  updatedAt: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  priceUSD: number;
  priceVES: number;
}

export type PaymentMethod = 'usd' | 'ves' | 'mixed' | 'zelle' | 'pago_movil';

export interface Sale {
  id: string;
  items: SaleItem[];
  totalUSD: number;
  totalVES: number;
  paymentMethod: PaymentMethod;
  paidUSD?: number;
  paidVES?: number;
  reference?: string;
  lastFourDigits?: string;
  zelleEmail?: string;
  zellePhone?: string;
  userId: string;
  userName: string;
  createdAt: string;
}

// User management
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  isActive: boolean;
}

// Analytics and reporting
export interface DashboardMetrics {
  totalSalesUSD: number;
  totalSalesVES: number;
  totalProducts: number;
  lowStockProducts: number;
  todaySales: number;
  weeklySales: number;
  monthlySales: number;
}

export interface ReportFilters {
  startDate: string;
  endDate: string;
  paymentMethod?: PaymentMethod | 'all';
  userId?: string;
}

// Supplier management
export interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  paymentTerms: number; // days
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Inventory categories
export interface Category {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Financial accounts
export interface Account {
  id: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  balance: number;
  currency: 'USD' | 'VES';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Bank and payment management
export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountType: 'checking' | 'savings' | 'business';
  currency: 'USD' | 'VES';
  balance: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Marketing campaigns
export interface Campaign {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
  budget: number;
  currency: 'USD' | 'VES';
  status: 'draft' | 'active' | 'paused' | 'completed';
  createdAt: string;
  updatedAt: string;
}
