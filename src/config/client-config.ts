/**
 * Sistema de Configuración Dinámica para Múltiples Clientes
 * Permite gestionar diferentes configuraciones, temas y credenciales por cliente
 */

export interface SupabaseConfig {
  url: string
  anonKey: string
  serviceRoleKey?: string
}

export interface BrandingConfig {
  appName: string
  companyName: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  logo: string
  favicon: string
  loginBackground?: string
}

export interface ModulesConfig {
  analytics: boolean
  sms: boolean
  multiLocation: boolean
  accounting: boolean
  inventory: boolean
  quotations: boolean
  reports: boolean
  userManagement: boolean
}

export interface FeaturesConfig {
  customReports: boolean
  apiAccess: boolean
  whiteLabel: boolean
  multiCurrency: boolean
  exportData: boolean
  backupRestore: boolean
}

export interface DeploymentConfig {
  domain?: string
  subdomain?: string
  platform: 'vercel' | 'netlify' | 'railway' | 'custom'
  environment: 'development' | 'staging' | 'production'
}

export interface ClientConfig {
  clientId: string
  name: string
  supabase: SupabaseConfig
  branding: BrandingConfig
  modules: ModulesConfig
  features: FeaturesConfig
  deployment: DeploymentConfig
  customSettings?: Record<string, any>
}

// Configuración por defecto
const defaultConfig: Partial<ClientConfig> = {
  branding: {
    appName: 'Flowi Admin',
    companyName: 'Tu Empresa',
    primaryColor: '#1e40af',
    secondaryColor: '#64748b',
    accentColor: '#f59e0b',
    logo: '/logo.png',
    favicon: '/favicon.ico'
  },
  modules: {
    analytics: true,
    sms: false,
    multiLocation: false,
    accounting: true,
    inventory: true,
    quotations: true,
    reports: true,
    userManagement: true
  },
  features: {
    customReports: false,
    apiAccess: false,
    whiteLabel: false,
    multiCurrency: false,
    exportData: true,
    backupRestore: false
  },
  deployment: {
    platform: 'vercel',
    environment: 'development'
  }
}

// Configuraciones predefinidas de clientes
const clientConfigs: Record<string, ClientConfig> = {
  'demo': {
    clientId: 'demo',
    name: 'Demo Company',
    supabase: {
      url: 'https://demo.supabase.co',
      anonKey: 'demo-anon-key'
    },
    branding: {
      appName: 'Flowi Admin - Demo',
      companyName: 'Demo Company',
      primaryColor: '#1e40af',
      secondaryColor: '#64748b',
      accentColor: '#f59e0b',
      logo: '/logos/demo.png',
      favicon: '/favicons/demo.ico'
    },
    modules: {
      analytics: true,
      sms: true,
      multiLocation: true,
      accounting: true,
      inventory: true,
      quotations: true,
      reports: true,
      userManagement: true
    },
    features: {
      customReports: true,
      apiAccess: true,
      whiteLabel: true,
      multiCurrency: true,
      exportData: true,
      backupRestore: true
    },
    deployment: {
      platform: 'vercel',
      environment: 'development'
    }
  }
}

/**
 * Obtiene la configuración del cliente actual
 */
export const getCurrentClientConfig = (): ClientConfig => {
  // Obtener ID del cliente desde variables de entorno
  const clientId = import.meta.env.VITE_CLIENT_ID || 'demo'
  
  // Si existe configuración predefinida, usarla
  if (clientConfigs[clientId]) {
    return clientConfigs[clientId]
  }
  
  // Construir configuración desde variables de entorno
  const envConfig: ClientConfig = {
    clientId,
    name: import.meta.env.VITE_COMPANY_NAME || 'Tu Empresa',
    supabase: {
      url: import.meta.env.VITE_SUPABASE_URL || '',
      anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
      serviceRoleKey: import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
    },
    branding: {
      appName: import.meta.env.VITE_APP_NAME || defaultConfig.branding!.appName,
      companyName: import.meta.env.VITE_COMPANY_NAME || defaultConfig.branding!.companyName,
      primaryColor: import.meta.env.VITE_PRIMARY_COLOR || defaultConfig.branding!.primaryColor,
      secondaryColor: import.meta.env.VITE_SECONDARY_COLOR || defaultConfig.branding!.secondaryColor,
      accentColor: import.meta.env.VITE_ACCENT_COLOR || defaultConfig.branding!.accentColor,
      logo: import.meta.env.VITE_LOGO_URL || defaultConfig.branding!.logo,
      favicon: import.meta.env.VITE_FAVICON_URL || defaultConfig.branding!.favicon,
      loginBackground: import.meta.env.VITE_LOGIN_BACKGROUND
    },
    modules: {
      analytics: import.meta.env.VITE_MODULE_ANALYTICS !== 'false',
      sms: import.meta.env.VITE_MODULE_SMS === 'true',
      multiLocation: import.meta.env.VITE_MODULE_MULTI_LOCATION === 'true',
      accounting: import.meta.env.VITE_MODULE_ACCOUNTING !== 'false',
      inventory: import.meta.env.VITE_MODULE_INVENTORY !== 'false',
      quotations: import.meta.env.VITE_MODULE_QUOTATIONS !== 'false',
      reports: import.meta.env.VITE_MODULE_REPORTS !== 'false',
      userManagement: import.meta.env.VITE_MODULE_USER_MANAGEMENT !== 'false'
    },
    features: {
      customReports: import.meta.env.VITE_FEATURE_CUSTOM_REPORTS === 'true',
      apiAccess: import.meta.env.VITE_FEATURE_API_ACCESS === 'true',
      whiteLabel: import.meta.env.VITE_FEATURE_WHITE_LABEL === 'true',
      multiCurrency: import.meta.env.VITE_FEATURE_MULTI_CURRENCY === 'true',
      exportData: import.meta.env.VITE_FEATURE_EXPORT_DATA !== 'false',
      backupRestore: import.meta.env.VITE_FEATURE_BACKUP_RESTORE === 'true'
    },
    deployment: {
      domain: import.meta.env.VITE_DOMAIN,
      subdomain: import.meta.env.VITE_SUBDOMAIN,
      platform: (import.meta.env.VITE_PLATFORM as any) || 'vercel',
      environment: (import.meta.env.VITE_ENVIRONMENT as any) || 'development'
    },
    customSettings: {}
  }
  
  return envConfig
}

/**
 * Registra una nueva configuración de cliente
 */
export const registerClientConfig = (config: ClientConfig): void => {
  clientConfigs[config.clientId] = config
}

/**
 * Obtiene configuración de cliente por ID
 */
export const getClientConfig = (clientId: string): ClientConfig | null => {
  return clientConfigs[clientId] || null
}

/**
 * Lista todos los clientes configurados
 */
export const listClients = (): string[] => {
  return Object.keys(clientConfigs)
}

/**
 * Valida que la configuración del cliente sea válida
 */
export const validateClientConfig = (config: ClientConfig): boolean => {
  try {
    // Validar campos requeridos
    if (!config.clientId || !config.name) {
      console.error('Client ID and name are required')
      return false
    }
    
    if (!config.supabase.url || !config.supabase.anonKey) {
      console.error('Supabase URL and anon key are required')
      return false
    }
    
    // Validar formato de URL
    try {
      new URL(config.supabase.url)
    } catch {
      console.error('Invalid Supabase URL format')
      return false
    }
    
    // Validar colores (formato hex)
    const colorRegex = /^#[0-9a-fA-F]{6}$/
    if (!colorRegex.test(config.branding.primaryColor)) {
      console.error('Invalid primary color format')
      return false
    }
    
    return true
  } catch (error) {
    console.error('Error validating client config:', error)
    return false
  }
}

/**
 * Aplica el tema del cliente actual al documento
 */
export const applyClientTheme = (config: ClientConfig): void => {
  const root = document.documentElement
  
  // Aplicar variables CSS personalizadas
  root.style.setProperty('--primary-color', config.branding.primaryColor)
  root.style.setProperty('--secondary-color', config.branding.secondaryColor)
  root.style.setProperty('--accent-color', config.branding.accentColor)
  
  // Actualizar favicon
  const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement
  if (favicon) {
    favicon.href = config.branding.favicon
  }
  
  // Actualizar título de la página
  document.title = config.branding.appName
}

/**
 * Hook para usar la configuración del cliente en componentes React
 */
export const useClientConfig = () => {
  const config = getCurrentClientConfig()
  
  return {
    config,
    isModuleEnabled: (module: keyof ModulesConfig) => config.modules[module],
    isFeatureEnabled: (feature: keyof FeaturesConfig) => config.features[feature],
    getBrandingValue: (key: keyof BrandingConfig) => config.branding[key],
    getSupabaseConfig: () => config.supabase
  }
}

// Exportar configuración actual como default
export default getCurrentClientConfig()