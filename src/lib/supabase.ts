import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Singleton pattern - ONLY ONE INSTANCE EVER
let supabaseClient: SupabaseClient | null = null;
let isInitializing = false;

// Function to get environment variables with fallback
function getEnvironmentVariable(key: string): string | undefined {
  // Try different environment variable patterns
  const patterns = [
    `VITE_${key}`,
    `NEXT_PUBLIC_${key}`,
    key
  ];
  
  for (const pattern of patterns) {
    const value = import.meta.env[pattern];
    if (value) {
      return value;
    }
  }
  
  // Also check localStorage for runtime configuration
  if (key === 'SUPABASE_URL') {
    return localStorage.getItem('supabase-url') || undefined;
  }
  if (key === 'SUPABASE_ANON_KEY') {
    return localStorage.getItem('supabase-anon-key') || undefined;
  }
  
  return undefined;
}

export function getSupabaseClient(): SupabaseClient | null {
  // Return existing instance immediately
  if (supabaseClient) {
    return supabaseClient;
  }

  // Prevent multiple simultaneous initializations
  if (isInitializing) {
    return null;
  }

  isInitializing = true;

  try {
    // Try multiple environment variable patterns and localStorage
    const supabaseUrl = getEnvironmentVariable('SUPABASE_URL');
    const supabaseAnonKey = getEnvironmentVariable('SUPABASE_ANON_KEY');

    console.log('🔍 Supabase URL found:', supabaseUrl ? '✅' : '❌');
    console.log('🔍 Supabase Key found:', supabaseAnonKey ? '✅' : '❌');

    if (!supabaseUrl || !supabaseAnonKey) {
      console.log('⚠️ Supabase credentials not found in environment or localStorage');
      isInitializing = false;
      return null;
    }

    // Create SINGLE instance with unique storage key
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false, // Disable to prevent URL detection loops
        flowType: 'pkce',
        storageKey: 'flowi-admin-auth-v2' // Unique key to prevent conflicts
      },
      global: {
        headers: {
          'X-Client-Info': 'flowi-admin-singleton'
        }
      }
    });

    console.log('✅ Supabase client initialized successfully');
    isInitializing = false;
    return supabaseClient;
  } catch (error) {
    console.error('❌ Supabase initialization failed:', error);
    isInitializing = false;
    return null;
  }
}

export async function getCurrentUser() {
  const client = getSupabaseClient();
  if (!client) return { user: null, error: 'Supabase not configured' };

  try {
    const { data, error } = await client.auth.getUser();
    return { user: data.user, error };
  } catch (error) {
    return { user: null, error };
  }
}

export async function getCurrentSession() {
  const client = getSupabaseClient();
  if (!client) return { session: null, error: 'Supabase not configured' };

  try {
    const { data, error } = await client.auth.getSession();
    return { session: data.session, error };
  } catch (error) {
    return { session: null, error };
  }
}

// Authentication functions
export async function signUp(email: string, password: string, metadata?: any) {
  const client = getSupabaseClient();
  if (!client) {
    return { data: null, error: { message: 'Supabase not configured' } };
  }
  
  try {
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

export async function signIn(email: string, password: string) {
  const client = getSupabaseClient();
  if (!client) {
    return { data: null, error: { message: 'Supabase not configured' } };
  }
  
  try {
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

export async function signOut() {
  const client = getSupabaseClient();
  if (!client) {
    return { error: { message: 'Supabase not configured' } };
  }
  
  try {
    const { error } = await client.auth.signOut();
    return { error };
  } catch (error) {
    return { error };
  }
}

// User management functions
export async function createUserInSupabase(userData: {
  email: string;
  password: string;
  full_name?: string;
  organization_id?: string;
  role?: string;
}) {
  try {
    const client = getSupabaseClient();
    if (!client) {
      return { data: null, error: { message: 'Supabase not configured' } };
    }

    // First create the auth user
    const { data: authData, error: authError } = await client.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          full_name: userData.full_name,
          organization_id: userData.organization_id,
          role: userData.role || 'user'
        }
      }
    });

    if (authError) {
      return { data: null, error: authError };
    }

    // Then create the user profile
    if (authData.user) {
      const { data: profileData, error: profileError } = await client
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: userData.email,
          full_name: userData.full_name,
          organization_id: userData.organization_id,
          role: userData.role || 'user'
        })
        .select();

      if (profileError) {
        console.error('Profile creation error:', profileError);
      }

      return { data: { user: authData.user, profile: profileData }, error: null };
    }

    return { data: authData, error: null };
  } catch (error) {
    console.error('User creation error:', error);
    return { data: null, error };
  }
}

// Test connection function
export async function testSupabaseConnection() {
  try {
    const client = getSupabaseClient();
    if (!client) {
      return { success: false, error: 'Supabase not configured' };
    }
    
    console.log('🔍 Testing Supabase connection...');
    
    // Test with organizations table first
    const { data, error } = await client
      .from('organizations')
      .select('id')
      .limit(1);
    
    if (error) {
      console.log('❌ Connection test failed:', error.message);
      return { success: false, error: error.message };
    }
    
    console.log('✅ Supabase connection successful');
    return { success: true, data };
  } catch (error) {
    console.log('❌ Connection test error:', error);
    return { success: false, error: 'Failed to connect to Supabase' };
  }
}

// Initialize database function
export async function initializeDatabase() {
  try {
    const client = getSupabaseClient();
    if (!client) {
      return { success: false, error: 'Supabase not configured' };
    }
    
    // This would typically create tables, but for now just test connection
    const result = await testSupabaseConnection();
    return result;
  } catch (error) {
    return { success: false, error: 'Database initialization failed' };
  }
}

// Create sample data function
export async function createSampleData() {
  try {
    const client = getSupabaseClient();
    if (!client) {
      return { success: false, error: 'Supabase not configured' };
    }
    
    // This would create sample data, but for now just return success
    return { success: true, message: 'Sample data creation not implemented yet' };
  } catch (error) {
    return { success: false, error: 'Sample data creation failed' };
  }
}

// Initialize Supabase with custom credentials
export function initializeSupabase(url?: string, key?: string) {
  try {
    const supabaseUrl = url || getEnvironmentVariable('SUPABASE_URL');
    const supabaseAnonKey = key || getEnvironmentVariable('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      console.log('❌ Missing Supabase credentials for initialization');
      return null;
    }

    // Save to localStorage for persistence
    if (url && key) {
      localStorage.setItem('supabase-url', url);
      localStorage.setItem('supabase-anon-key', key);
    }

    // Reset existing client to create new one with new credentials
    supabaseClient = null;
    isInitializing = false;

    // Create new client with provided credentials
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        flowType: 'pkce',
        storageKey: 'flowi-admin-auth-v2'
      },
      global: {
        headers: {
          'X-Client-Info': 'flowi-admin-singleton'
        }
      }
    });

    console.log('✅ Supabase client initialized with custom credentials');
    return supabaseClient;
  } catch (error) {
    console.error('❌ Failed to initialize Supabase with custom credentials:', error);
    return null;
  }
}

// Reset function for testing
export function resetSupabaseClient() {
  supabaseClient = null;
  isInitializing = false;
}