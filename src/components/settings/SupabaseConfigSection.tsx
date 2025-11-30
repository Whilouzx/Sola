import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Eye, EyeOff, TestTube, CheckCircle, XCircle, ExternalLink, Info, Save, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@supabase/supabase-js'

interface SupabaseConfig {
  url: string
  anonKey: string
  serviceRoleKey?: string
}

interface ConnectionStatus {
  status: 'idle' | 'testing' | 'success' | 'error'
  message?: string
  details?: any
}

export default function SupabaseConfigSection() {
  const [config, setConfig] = useState<SupabaseConfig>({
    url: '',
    anonKey: '',
    serviceRoleKey: ''
  })
  
  const [showKeys, setShowKeys] = useState({
    anonKey: false,
    serviceRoleKey: false
  })
  
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    status: 'idle'
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Load current configuration on mount
  useEffect(() => {
    loadCurrentConfig()
  }, [])

  const loadCurrentConfig = () => {
    // Try to load from localStorage first, then fall back to env vars
    const savedConfig = localStorage.getItem('supabase_config')
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig)
        setConfig(parsed)
      } catch (error) {
        console.error('Error parsing saved config:', error)
      }
    } else {
      // Load from environment variables
      setConfig({
        url: import.meta.env.VITE_SUPABASE_URL || '',
        anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
        serviceRoleKey: import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
      })
    }
  }

  const handleConfigChange = (field: keyof SupabaseConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }))
    setHasChanges(true)
    setConnectionStatus({ status: 'idle' })
  }

  const validateConfig = (config: SupabaseConfig): { isValid: boolean; errors: string[] } => {
    const errors: string[] = []
    
    if (!config.url) {
      errors.push('URL de Supabase es requerida')
    } else if (!config.url.match(/^https:\/\/[a-z0-9-]+\.supabase\.co$/)) {
      errors.push('URL de Supabase debe tener el formato: https://tu-proyecto.supabase.co')
    }
    
    if (!config.anonKey) {
      errors.push('Clave anónima es requerida')
    } else if (!config.anonKey.startsWith('eyJ')) {
      errors.push('Clave anónima debe ser un JWT válido')
    }
    
    if (config.serviceRoleKey && !config.serviceRoleKey.startsWith('eyJ')) {
      errors.push('Clave de servicio debe ser un JWT válido')
    }
    
    return { isValid: errors.length === 0, errors }
  }

  const testConnection = async () => {
    const validation = validateConfig(config)
    if (!validation.isValid) {
      setConnectionStatus({
        status: 'error',
        message: 'Configuración inválida',
        details: validation.errors
      })
      return
    }

    setConnectionStatus({ status: 'testing', message: 'Probando conexión...' })
    
    try {
      // Create a test client with the new configuration
      const testClient = createClient(config.url, config.anonKey)
      
      // Test basic connection
      const { data, error } = await testClient
        .from('organizations')
        .select('id')
        .limit(1)
      
      if (error) {
        throw error
      }
      
      // Test authentication
      const { data: authData, error: authError } = await testClient.auth.getSession()
      
      setConnectionStatus({
        status: 'success',
        message: 'Conexión exitosa',
        details: {
          tablesAccessible: true,
          authConfigured: !authError,
          recordsFound: data?.length || 0
        }
      })
      
      toast.success('Conexión a Supabase exitosa')
    } catch (error: any) {
      let errorMessage = 'Error de conexión'
      const errorDetails = []
      
      if (error.code === 'PGRST116') {
        errorMessage = 'Base de datos vacía o sin tablas'
        errorDetails.push('Ejecuta el script SQL de Flowi Admin en tu proyecto Supabase')
      } else if (error.code === '401') {
        errorMessage = 'Clave de API inválida'
        errorDetails.push('Verifica que la clave anónima sea correcta')
      } else if (error.message?.includes('fetch')) {
        errorMessage = 'No se puede conectar al servidor'
        errorDetails.push('Verifica que la URL del proyecto sea correcta')
      } else {
        errorMessage = error.message || 'Error desconocido'
        errorDetails.push('Revisa la configuración y vuelve a intentar')
      }
      
      setConnectionStatus({
        status: 'error',
        message: errorMessage,
        details: errorDetails
      })
      
      toast.error(`Error de conexión: ${errorMessage}`)
    }
  }

  const saveConfiguration = async () => {
    const validation = validateConfig(config)
    if (!validation.isValid) {
      toast.error('Por favor corrige los errores antes de guardar')
      return
    }

    setIsLoading(true)
    
    try {
      // Save to localStorage
      localStorage.setItem('supabase_config', JSON.stringify(config))
      
      // Update runtime environment variables
      window.__RUNTIME_CONFIG__ = {
        VITE_SUPABASE_URL: config.url,
        VITE_SUPABASE_ANON_KEY: config.anonKey,
        VITE_SUPABASE_SERVICE_ROLE_KEY: config.serviceRoleKey || ''
      }
      
      setHasChanges(false)
      toast.success('Configuración guardada exitosamente')
      
      // Suggest page reload for full effect
      setTimeout(() => {
        if (confirm('¿Deseas recargar la página para aplicar todos los cambios?')) {
          window.location.reload()
        }
      }, 1000)
      
    } catch (error) {
      console.error('Error saving configuration:', error)
      toast.error('Error al guardar la configuración')
    } finally {
      setIsLoading(false)
    }
  }

  const resetConfiguration = () => {
    if (confirm('¿Estás seguro de que deseas restablecer la configuración?')) {
      localStorage.removeItem('supabase_config')
      loadCurrentConfig()
      setHasChanges(false)
      setConnectionStatus({ status: 'idle' })
      toast.info('Configuración restablecida')
    }
  }

  const getStatusIcon = () => {
    switch (connectionStatus.status) {
      case 'testing':
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <TestTube className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = () => {
    switch (connectionStatus.status) {
      case 'testing': return 'border-blue-200 bg-blue-50'
      case 'success': return 'border-green-200 bg-green-50'
      case 'error': return 'border-red-200 bg-red-50'
      default: return 'border-gray-200 bg-gray-50'
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
                <svg className="h-4 w-4 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21.362 9.354H12V.396a12.04 12.04 0 0 1 9.362 8.958M0 12.04A12.04 12.04 0 0 1 12.04 0v12.04H0Z"/>
                </svg>
              </div>
              Configuración de Supabase
            </CardTitle>
            <CardDescription>
              Configura la conexión a tu base de datos Supabase personalizada
            </CardDescription>
          </div>
          <Badge variant={connectionStatus.status === 'success' ? 'default' : 'secondary'}>
            {connectionStatus.status === 'success' ? 'Conectado' : 'Desconectado'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Configuration Form */}
        <div className="space-y-4">
          {/* Project URL */}
          <div className="space-y-2">
            <Label htmlFor="supabase-url">URL del Proyecto Supabase</Label>
            <Input
              id="supabase-url"
              type="url"
              placeholder="https://tu-proyecto.supabase.co"
              value={config.url}
              onChange={(e) => handleConfigChange('url', e.target.value)}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Encuentra esta URL en tu dashboard de Supabase → Settings → API
            </p>
          </div>

          {/* Anon Key */}
          <div className="space-y-2">
            <Label htmlFor="anon-key">Clave Anónima (anon key)</Label>
            <div className="relative">
              <Input
                id="anon-key"
                type={showKeys.anonKey ? 'text' : 'password'}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={config.anonKey}
                onChange={(e) => handleConfigChange('anonKey', e.target.value)}
                className="font-mono text-sm pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowKeys(prev => ({ ...prev, anonKey: !prev.anonKey }))}
              >
                {showKeys.anonKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Clave pública segura para operaciones del frontend
            </p>
          </div>

          {/* Service Role Key */}
          <div className="space-y-2">
            <Label htmlFor="service-key">Clave de Servicio (opcional)</Label>
            <div className="relative">
              <Input
                id="service-key"
                type={showKeys.serviceRoleKey ? 'text' : 'password'}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={config.serviceRoleKey}
                onChange={(e) => handleConfigChange('serviceRoleKey', e.target.value)}
                className="font-mono text-sm pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowKeys(prev => ({ ...prev, serviceRoleKey: !prev.serviceRoleKey }))}
              >
                {showKeys.serviceRoleKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Solo para operaciones administrativas avanzadas
            </p>
          </div>
        </div>

        <Separator />

        {/* Connection Status */}
        {connectionStatus.status !== 'idle' && (
          <Alert className={getStatusColor()}>
            <div className="flex items-start gap-3">
              {getStatusIcon()}
              <div className="flex-1">
                <AlertDescription>
                  <div className="font-medium">{connectionStatus.message}</div>
                  {connectionStatus.details && Array.isArray(connectionStatus.details) && (
                    <ul className="mt-2 text-sm space-y-1">
                      {connectionStatus.details.map((detail, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <div className="h-1 w-1 rounded-full bg-current" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  )}
                  {connectionStatus.details && typeof connectionStatus.details === 'object' && !Array.isArray(connectionStatus.details) && (
                    <div className="mt-2 text-sm space-y-1">
                      <div>✓ Tablas accesibles: {connectionStatus.details.tablesAccessible ? 'Sí' : 'No'}</div>
                      <div>✓ Autenticación: {connectionStatus.details.authConfigured ? 'Configurada' : 'Pendiente'}</div>
                      <div>✓ Registros encontrados: {connectionStatus.details.recordsFound}</div>
                    </div>
                  )}
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={testConnection}
            variant="outline"
            disabled={connectionStatus.status === 'testing' || !config.url || !config.anonKey}
            className="flex items-center gap-2"
          >
            {connectionStatus.status === 'testing' ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <TestTube className="h-4 w-4" />
            )}
            Probar Conexión
          </Button>
          
          <Button
            onClick={saveConfiguration}
            disabled={!hasChanges || isLoading || connectionStatus.status === 'testing'}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Guardar Configuración
          </Button>
          
          <Button
            onClick={resetConfiguration}
            variant="ghost"
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Restablecer
          </Button>
        </div>

        <Separator />

        {/* Help Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-500" />
            <h4 className="font-medium">¿Cómo obtener estas credenciales?</h4>
          </div>
          
          <div className="grid gap-4 text-sm">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-600">
                1
              </div>
              <div>
                <div className="font-medium">Crear proyecto Supabase</div>
                <div className="text-muted-foreground">
                  Ve a <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">
                    supabase.com <ExternalLink className="h-3 w-3" />
                  </a> y crea un nuevo proyecto
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-600">
                2
              </div>
              <div>
                <div className="font-medium">Obtener credenciales</div>
                <div className="text-muted-foreground">
                  En tu proyecto, ve a Settings → API y copia la URL y las claves
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-600">
                3
              </div>
              <div>
                <div className="font-medium">Ejecutar script SQL</div>
                <div className="text-muted-foreground">
                  En SQL Editor, ejecuta el script de Flowi Admin para crear las tablas necesarias
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}