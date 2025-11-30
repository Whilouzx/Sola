// Tipos de datos para la aplicación de ventas

export interface User {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'user';
}

export interface Product {
  id: string;
  name: string;
  priceUSD: number;
  priceVES: number;
  stock: number;
  image?: string;
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

// Tipos de métodos de pago actualizados
export type PaymentMethod = 'usd' | 'ves' | 'mixed';

export interface Sale {
  id: string;
  paymentMethod: PaymentMethod;
  totalUSD: number;
  totalVES: number;
  // Para método mixto
  paidUSD?: number;  // Cantidad pagada en USD (solo para método mixto)
  paidVES?: number;  // Cantidad pagada en VES (solo para método mixto)
  // Detalles de pago - solo últimos 4 dígitos
  lastFourDigits?: string;
  userId: string;
  userName: string;
  items: SaleItem[];
  createdAt: string;
}

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

// Interfaz para el formulario de pago mixto
export interface MixedPaymentDetails {
  paidUSD: number;
  paidVES: number;
  lastFourDigits: string;
}

// Interfaz para detalles de pago general
export interface PaymentDetails {
  lastFourDigits: string;
  // Para método mixto
  paidUSD?: number;
  paidVES?: number;
}