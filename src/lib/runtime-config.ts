// Runtime configuration management for dynamic Supabase setup
interface RuntimeConfig {
  supabaseUrl: string
  supabaseAnonKey: string
  supabaseServiceRoleKey?: string
}

let runtimeConfig: RuntimeConfig = {
  supabaseUrl: '',
  supabaseAnonKey: '',
  supabaseServiceRoleKey: ''
}

// Initialize runtime config from localStorage or environment variables
export function initializeRuntimeConfig(): void {
  try {
    const savedConfig = localStorage.getItem('supabase_config')
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig)
      runtimeConfig = {
        supabaseUrl: parsed.url || '',
        supabaseAnonKey: parsed.anonKey || '',
        supabaseServiceRoleKey: parsed.serviceRoleKey || ''
      }
    } else {
      // Fallback to environment variables
      runtimeConfig = {
        supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
        supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
        supabaseServiceRoleKey: import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
      }
    }
  } catch (error) {
    console.error('Failed to initialize runtime config:', error)
    // Use environment variables as fallback
    runtimeConfig = {
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
      supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
      supabaseServiceRoleKey: import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
    }
  }
}

// Get current runtime configuration
export function getRuntimeConfig(): RuntimeConfig {
  return { ...runtimeConfig }
}

// Update runtime configuration
export function updateRuntimeConfig(newConfig: Partial<RuntimeConfig>): void {
  runtimeConfig = { ...runtimeConfig, ...newConfig }
  
  // Save to localStorage
  try {
    localStorage.setItem('supabase_config', JSON.stringify({
      url: runtimeConfig.supabaseUrl,
      anonKey: runtimeConfig.supabaseAnonKey,
      serviceRoleKey: runtimeConfig.supabaseServiceRoleKey
    }))
  } catch (error) {
    console.error('Failed to save runtime config:', error)
  }
}

// Get environment variable with runtime config fallback
export function getEnvVar(key: string): string {
  switch (key) {
    case 'VITE_SUPABASE_URL':
      return runtimeConfig.supabaseUrl || import.meta.env.VITE_SUPABASE_URL || ''
    case 'VITE_SUPABASE_ANON_KEY':
      return runtimeConfig.supabaseAnonKey || import.meta.env.VITE_SUPABASE_ANON_KEY || ''
    case 'VITE_SUPABASE_SERVICE_ROLE_KEY':
      return runtimeConfig.supabaseServiceRoleKey || import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
    default:
      return import.meta.env[key] || ''
  }
}

// Check if runtime config is valid
export function isRuntimeConfigValid(): boolean {
  return !!(runtimeConfig.supabaseUrl && runtimeConfig.supabaseAnonKey)
}

// Reset runtime config
export function resetRuntimeConfig(): void {
  runtimeConfig = {
    supabaseUrl: '',
    supabaseAnonKey: '',
    supabaseServiceRoleKey: ''
  }
  
  try {
    localStorage.removeItem('supabase_config')
  } catch (error) {
    console.error('Failed to reset runtime config:', error)
  }
}