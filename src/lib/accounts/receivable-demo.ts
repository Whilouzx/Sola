// Demo data for testing (loads from localStorage or Supabase)
export function getDemoReceivables() {
  return [
    {
      id: '48b6f184-9225-49c0-b5e9-bb44e9febd9b',
      invoice_number: 'INV-20241201-001',
      entity_type: 'customer' as const,
      entity_name: 'Cliente Ejemplo 1',
      amount: 1500.00,
      currency: 'USD' as const,
      due_date: '2024-12-31',
      status: 'pending' as const,
      payment_terms: 30,
      description: 'Venta de productos',
      created_at: '2025-11-30T16:37:34.527727+00:00',
      updated_at: '2025-11-30T16:37:34.527727+00:00'
    },
    {
      id: '4cc679cd-f0e9-46f8-9722-4835e924af9d',
      invoice_number: 'INV-20241201-002',
      entity_type: 'supplier' as const,
      entity_name: 'Proveedor Ejemplo 1',
      amount: 5000.00,
      currency: 'VES' as const,
      due_date: '2024-12-15',
      status: 'pending' as const,
      payment_terms: 15,
      description: 'Compra de servicios',
      created_at: '2025-11-30T16:37:34.527727+00:00',
      updated_at: '2025-11-30T16:37:34.527727+00:00'
    },
    {
      id: 'fe85fc4a-4369-4cda-9894-87abd4575a54',
      invoice_number: 'INV-20241201-003',
      entity_type: 'customer' as const,
      entity_name: 'Cliente Ejemplo 2',
      amount: 2500.50,
      currency: 'USD' as const,
      due_date: '2024-11-25',
      status: 'overdue' as const,
      payment_terms: 30,
      description: 'Servicios profesionales',
      created_at: '2025-11-30T16:37:34.527727+00:00',
      updated_at: '2025-11-30T16:37:34.527727+00:00'
    }
  ];
}
