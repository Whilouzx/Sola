// Utility functions for accounts management

export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

export const formatDateTime = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const calculateDaysOverdue = (dueDate: string): number => {
  const due = new Date(dueDate);
  const today = new Date();
  const diffTime = today.getTime() - due.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

export const isOverdue = (dueDate: string): boolean => {
  return calculateDaysOverdue(dueDate) > 0;
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  // Basic phone validation - adjust as needed
  const phoneRegex = /^[\+]?[0-9\-\s\(\)]+$/;
  return phoneRegex.test(phone) && phone.length >= 7;
};

// Zelle validation functions (required by Sales.tsx)
export const validateZelleEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateZellePhone = (phone: string): boolean => {
  // Venezuelan phone format: +58-XXX-XXX-XXXX or 04XX-XXX-XXXX
  const phoneRegex = /^(\+58|04)\d{2}-?\d{3}-?\d{4}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

// Date utility functions (required by AccountsPayable.tsx)
export const addDaysToDate = (date: Date, days: number): string => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result.toISOString().split('T')[0];
};

export const formatDateForInput = (date: string): string => {
  return new Date(date).toISOString().split('T')[0];
};

export const generateInvoiceNumber = (prefix: string = 'INV'): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp}-${random}`;
};

export const generateBillNumber = (prefix: string = 'BILL'): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp}-${random}`;
};

export const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'paid':
      return 'text-green-400 bg-green-500/20 border-green-500/30';
    case 'pending':
      return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    case 'partial':
      return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
    case 'overdue':
      return 'text-red-400 bg-red-500/20 border-red-500/30';
    default:
      return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
  }
};

export const getStatusText = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'paid':
      return 'Pagado';
    case 'pending':
      return 'Pendiente';
    case 'partial':
      return 'Parcial';
    case 'overdue':
      return 'Vencido';
    default:
      return 'Desconocido';
  }
};