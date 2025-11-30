// Database type definitions for Flowi Admin
// Generated from Supabase schema

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          logo_url?: string
          address?: string
          phone?: string
          email?: string
          tax_id?: string
          currency: string
          timezone: string
          settings: any
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          logo_url?: string
          address?: string
          phone?: string
          email?: string
          tax_id?: string
          currency?: string
          timezone?: string
          settings?: any
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          logo_url?: string
          address?: string
          phone?: string
          email?: string
          tax_id?: string
          currency?: string
          timezone?: string
          settings?: any
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          username?: string
          full_name?: string
          role: string
          organization_id?: string
          avatar_url?: string
          phone?: string
          is_active: boolean
          last_login?: string
          settings: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          username?: string
          full_name?: string
          role?: string
          organization_id?: string
          avatar_url?: string
          phone?: string
          is_active?: boolean
          last_login?: string
          settings?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string
          full_name?: string
          role?: string
          organization_id?: string
          avatar_url?: string
          phone?: string
          is_active?: boolean
          last_login?: string
          settings?: any
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email?: string
          username?: string
          full_name?: string
          role: string
          organization_id?: string
          avatar_url?: string
          phone?: string
          is_active: boolean
          settings: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string
          username?: string
          full_name?: string
          role?: string
          organization_id?: string
          avatar_url?: string
          phone?: string
          is_active?: boolean
          settings?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string
          full_name?: string
          role?: string
          organization_id?: string
          avatar_url?: string
          phone?: string
          is_active?: boolean
          settings?: any
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          organization_id?: string
          name: string
          description?: string
          sku?: string
          price: number
          cost: number
          stock: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id?: string
          name: string
          description?: string
          sku?: string
          price?: number
          cost?: number
          stock?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          description?: string
          sku?: string
          price?: number
          cost?: number
          stock?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          organization_id?: string
          name: string
          email?: string
          phone?: string
          address?: string
          tax_id?: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id?: string
          name: string
          email?: string
          phone?: string
          address?: string
          tax_id?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          email?: string
          phone?: string
          address?: string
          tax_id?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      sales: {
        Row: {
          id: string
          organization_id?: string
          customer_id?: string
          total_amount: number
          status: string
          sale_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id?: string
          customer_id?: string
          total_amount: number
          status?: string
          sale_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          customer_id?: string
          total_amount?: number
          status?: string
          sale_date?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      // Define views here if any
    }
    Functions: {
      get_user_organization_id: {
        Args: { user_id: string }
        Returns: string
      }
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      user_role: 'admin' | 'manager' | 'employee' | 'viewer'
      sale_status: 'draft' | 'confirmed' | 'paid' | 'cancelled'
    }
  }
}