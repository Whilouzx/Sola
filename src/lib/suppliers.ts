// Suppliers management library
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

// Sample suppliers data
export const sampleSuppliers: Supplier[] = [
  {
    id: '1',
    name: 'Distribuidora Central',
    email: 'ventas@distribuidoracentral.com',
    phone: '+58-212-555-0123',
    address: 'Av. Principal, Caracas',
    contactPerson: 'María González',
    paymentTerms: 30,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Importaciones del Norte',
    email: 'info@importacionesnorte.com',
    phone: '+58-261-555-0456',
    address: 'Zona Industrial, Maracaibo',
    contactPerson: 'Carlos Rodríguez',
    paymentTerms: 15,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Suministros del Este',
    email: 'contacto@suministroseste.com',
    phone: '+58-281-555-0789',
    address: 'Barcelona, Anzoátegui',
    contactPerson: 'Ana Martínez',
    paymentTerms: 45,
    isActive: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Suppliers management functions
export class SuppliersManager {
  private suppliers: Supplier[] = [];

  constructor() {
    this.loadSuppliers();
  }

  private loadSuppliers() {
    const saved = localStorage.getItem('flowi-suppliers');
    if (saved) {
      this.suppliers = JSON.parse(saved);
    } else {
      this.suppliers = [...sampleSuppliers];
      this.saveSuppliers();
    }
  }

  private saveSuppliers() {
    localStorage.setItem('flowi-suppliers', JSON.stringify(this.suppliers));
  }

  getAllSuppliers(): Supplier[] {
    return this.suppliers;
  }

  getActiveSuppliers(): Supplier[] {
    return this.suppliers.filter(supplier => supplier.isActive);
  }

  getSupplierById(id: string): Supplier | undefined {
    return this.suppliers.find(supplier => supplier.id === id);
  }

  addSupplier(supplierData: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Supplier {
    const newSupplier: Supplier = {
      ...supplierData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.suppliers.push(newSupplier);
    this.saveSuppliers();
    return newSupplier;
  }

  updateSupplier(id: string, updates: Partial<Omit<Supplier, 'id' | 'createdAt'>>): Supplier | null {
    const index = this.suppliers.findIndex(supplier => supplier.id === id);
    if (index === -1) return null;

    this.suppliers[index] = {
      ...this.suppliers[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.saveSuppliers();
    return this.suppliers[index];
  }

  deleteSupplier(id: string): boolean {
    const index = this.suppliers.findIndex(supplier => supplier.id === id);
    if (index === -1) return false;

    this.suppliers.splice(index, 1);
    this.saveSuppliers();
    return true;
  }

  toggleSupplierStatus(id: string): Supplier | null {
    const supplier = this.getSupplierById(id);
    if (!supplier) return null;

    return this.updateSupplier(id, { isActive: !supplier.isActive });
  }

  searchSuppliers(query: string): Supplier[] {
    const lowercaseQuery = query.toLowerCase();
    return this.suppliers.filter(supplier =>
      supplier.name.toLowerCase().includes(lowercaseQuery) ||
      supplier.email?.toLowerCase().includes(lowercaseQuery) ||
      supplier.contactPerson?.toLowerCase().includes(lowercaseQuery)
    );
  }
}

// Export singleton instance
export const suppliersManager = new SuppliersManager();

// Utility functions
export const formatPaymentTerms = (days: number): string => {
  if (days === 0) return 'Inmediato';
  if (days === 1) return '1 día';
  if (days <= 7) return `${days} días`;
  if (days <= 30) return `${Math.round(days / 7)} semanas`;
  return `${Math.round(days / 30)} meses`;
};

export const getSupplierStatusColor = (isActive: boolean): string => {
  return isActive ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100';
};

export const getSupplierStatusText = (isActive: boolean): string => {
  return isActive ? 'Activo' : 'Inactivo';
};