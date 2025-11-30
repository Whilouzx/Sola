export interface BankAccount {
  id: string;
  name: string;
  accountNumber: string;
  accountType: 'pago_movil' | 'zelle' | 'transferencia';
  currency: 'VES' | 'USD';
  balance: number;
  isActive: boolean;
  bankCode?: string;
  phone?: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BankTransaction {
  id: string;
  accountId: string;
  saleId?: string;
  type: 'income' | 'expense';
  amount: number;
  currency: 'VES' | 'USD';
  reference: string;
  description: string;
  paymentMethod: 'pago_movil' | 'zelle' | 'transferencia' | 'efectivo';
  phoneNumber?: string;
  bankCode?: string;
  zelleEmail?: string;
  zellePhone?: string;
  createdAt: string;
}

export interface ExchangeRate {
  id: string;
  usdToVes: number;
  source: string;
  isActive: boolean;
  createdAt: string;
}