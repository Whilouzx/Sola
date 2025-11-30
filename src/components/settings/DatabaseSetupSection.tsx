import React, { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { 
  Database, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  FileText, 
  Download, 
  Copy, 
  Check, 
  ExternalLink,
  Info
} from 'lucide-react'

interface DatabaseValidation {
  isValid: boolean
  completionPercentage: number
  missingTables: string[]
  existingTables: string[]
  allTables: TableStatus[]
}

interface TableStatus {
  name: string
  description: string
  required: boolean
  exists: boolean
}

const REQUIRED_TABLES = [
  { name: 'organizations', description: 'Organizaciones', required: true },
  { name: 'users', description: 'Usuarios', required: true },
  { name: 'profiles', description: 'Perfiles de usuario', required: true },
  { name: 'products', description: 'Productos', required: true },
  { name: 'product_categories', description: 'Categorías de productos', required: true },
  { name: 'product_variants', description: 'Variantes de productos', required: false },
  { name: 'product_attributes', description: 'Atributos de productos', required: false },
  { name: 'customers', description: 'Clientes', required: true },
  { name: 'suppliers', description: 'Proveedores', required: false },
  { name: 'sales', description: 'Ventas', required: true },
  { name: 'sale_items', description: 'Artículos de venta', required: true },
  { name: 'quotations', description: 'Cotizaciones', required: false },
  { name: 'quotation_items', description: 'Artículos de cotización', required: false },
  { name: 'quotation_templates', description: 'Plantillas de cotización', required: false },
  { name: 'accounts_receivable', description: 'Cuentas por cobrar', required: false },
  { name: 'accounts_payable', description: 'Cuentas por pagar', required: false },
  { name: 'payments', description: 'Pagos', required: false },
  { name: 'partial_payments', description: 'Pagos parciales', required: false },
  { name: 'payment_plans', description: 'Planes de pago', required: false },
  { name: 'payment_installments', description: 'Cuotas de pago', required: false },
  { name: 'expenses', description: 'Gastos', required: false },
  { name: 'expense_categories', description: 'Categorías de gastos', required: false },
  { name: 'locations', description: 'Ubicaciones', required: false },
  { name: 'location_inventory', description: 'Inventario por ubicación', required: false },
  { name: 'stock_movements', description: 'Movimientos de inventario', required: false },
  { name: 'deliveries', description: 'Entregas', required: false },
  { name: 'bank_accounts', description: 'Cuentas bancarias', required: false },
  { name: 'bank_transactions', description: 'Transacciones bancarias', required: false },
  { name: 'sms_campaigns', description: 'Campañas SMS', required: false },
  { name: 'customer_analytics', description: 'Análisis de clientes', required: false }
]

export default function DatabaseSetupSection() {
  const [validation, setValidation] = useState<DatabaseValidation | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [showSetupModal, setShowSetupModal] = useState(false)
  const [copiedSql, setCopiedSql] = useState(false)

  useEffect(() => {
    validateDatabase()
  }, [])

  const getSupabaseConfig = () => {
    const savedConfig = localStorage.getItem('supabase_config')
    if (savedConfig) {
      try {
        return JSON.parse(savedConfig)
      } catch (error) {
        console.error('Error parsing saved config:', error)
      }
    }
    
    return {
      url: import.meta.env.VITE_SUPABASE_URL || '',
      anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || ''
    }
  }

  const validateDatabase = async () => {
    const config = getSupabaseConfig()
    
    if (!config.url || !config.anonKey) {
      toast.error('Primero configura la conexión a Supabase')
      return
    }

    setIsValidating(true)
    
    try {
      const client = createClient(config.url, config.anonKey)
      
      // Get all tables in the public schema
      const { data: tables, error } = await client
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_type', 'BASE TABLE')

      if (error) {
        throw error
      }

      const existingTableNames = tables?.map(t => t.table_name) || []
      
      // Check each required table
      const tableStatuses: TableStatus[] = REQUIRED_TABLES.map(table => ({
        ...table,
        exists: existingTableNames.includes(table.name)
      }))

      const requiredTables = tableStatuses.filter(t => t.required)
      const existingRequiredTables = requiredTables.filter(t => t.exists)
      const missingTables = tableStatuses.filter(t => t.required && !t.exists).map(t => t.name)
      const existingTables = tableStatuses.filter(t => t.exists).map(t => t.name)
      
      const completionPercentage = Math.round((existingRequiredTables.length / requiredTables.length) * 100)
      const isValid = missingTables.length === 0

      setValidation({
        isValid,
        completionPercentage,
        missingTables,
        existingTables,
        allTables: tableStatuses
      })

      if (!isValid) {
        toast.error(`Base de datos incompleta: ${missingTables.length} tablas faltantes`)
      } else {
        toast.success('Base de datos configurada correctamente')
      }

    } catch (error: any) {
      console.error('Database validation error:', error)
      
      if (error.message?.includes('information_schema')) {
        // Fallback: try to check individual tables
        await validateIndividualTables(config)
      } else {
        toast.error('Error validando base de datos: ' + error.message)
        setValidation({
          isValid: false,
          completionPercentage: 0,
          missingTables: REQUIRED_TABLES.filter(t => t.required).map(t => t.name),
          existingTables: [],
          allTables: REQUIRED_TABLES.map(t => ({ ...t, exists: false }))
        })
      }
    } finally {
      setIsValidating(false)
    }
  }

  const validateIndividualTables = async (config: any) => {
    const client = createClient(config.url, config.anonKey)
    const tableStatuses: TableStatus[] = []
    
    for (const table of REQUIRED_TABLES) {
      try {
        const { error } = await client
          .from(table.name)
          .select('*')
          .limit(1)
        
        tableStatuses.push({
          ...table,
          exists: !error || error.code !== 'PGRST116'
        })
      } catch (error) {
        tableStatuses.push({
          ...table,
          exists: false
        })
      }
    }

    const requiredTables = tableStatuses.filter(t => t.required)
    const existingRequiredTables = requiredTables.filter(t => t.exists)
    const missingTables = tableStatuses.filter(t => t.required && !t.exists).map(t => t.name)
    const existingTables = tableStatuses.filter(t => t.exists).map(t => t.name)
    
    const completionPercentage = Math.round((existingRequiredTables.length / requiredTables.length) * 100)
    const isValid = missingTables.length === 0

    setValidation({
      isValid,
      completionPercentage,
      missingTables,
      existingTables,
      allTables: tableStatuses
    })
  }

  const downloadSqlFile = () => {
    // Create a downloadable SQL file
    const sqlContent = `-- Flowi Admin Database Setup Script
-- Execute this script in your Supabase SQL Editor
-- This will create all necessary tables, policies, and functions

-- Note: This is a placeholder. The actual SQL content should be loaded from the database/flowi-admin-final.sql file
-- For now, we'll provide instructions to get the file

/*
INSTRUCTIONS:
1. Go to your Flowi Admin project files
2. Find the file: database/flowi-admin-final.sql
3. Copy the entire content of that file
4. Paste it in your Supabase SQL Editor
5. Click "Run" to execute the script
*/

-- If you don't have access to the SQL file, contact support for the complete script.
`

    const blob = new Blob([sqlContent], { type: 'text/sql' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'flowi-admin-setup.sql'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Archivo SQL descargado')
  }

  const copySetupInstructions = () => {
    const instructions = `
Pasos para configurar la base de datos de Flowi Admin:

1. Ve a tu proyecto Supabase: ${getSupabaseConfig().url}
2. Navega a "SQL Editor" en el menú lateral
3. Haz clic en "New Query"
4. Copia y pega el contenido completo del archivo database/flowi-admin-final.sql
5. Haz clic en "Run" para ejecutar el script
6. Espera a que se complete la ejecución (puede tomar 1-2 minutos)
7. Regresa a Flowi Admin y haz clic en "Verificar Base de Datos"

¡Importante! El script creará más de 20 tablas y configurará todas las políticas de seguridad necesarias.
`

    navigator.clipboard.writeText(instructions)
    setCopiedSql(true)
    setTimeout(() => setCopiedSql(false), 2000)
    toast.success('Instrucciones copiadas al portapapeles')
  }

  const getStatusColor = () => {
    if (!validation) return 'border-gray-200 bg-gray-50'
    if (validation.isValid) return 'border-green-200 bg-green-50'
    if (validation.completionPercentage > 50) return 'border-yellow-200 bg-yellow-50'
    return 'border-red-200 bg-red-50'
  }

  const getStatusIcon = () => {
    if (isValidating) return <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
    if (!validation) return <Database className="h-5 w-5 text-gray-400" />
    if (validation.isValid) return <CheckCircle className="h-5 w-5 text-green-500" />
    if (validation.completionPercentage > 0) return <AlertTriangle className="h-5 w-5 text-yellow-500" />
    return <XCircle className="h-5 w-5 text-red-500" />
  }

  const getStatusMessage = () => {
    if (isValidating) return 'Validando estructura de base de datos...'
    if (!validation) return 'Haz clic en "Verificar Base de Datos" para comenzar'
    if (validation.isValid) return '¡Base de datos configurada correctamente!'
    if (validation.completionPercentage > 0) {
      return `Base de datos parcialmente configurada (${validation.completionPercentage}%)`
    }
    return 'Base de datos no configurada - Ejecuta el script SQL'
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Configuración de Base de Datos
            </CardTitle>
            <CardDescription>
              Verifica y configura la estructura de tablas necesarias para Flowi Admin
            </CardDescription>
          </div>
          <Badge variant={validation?.isValid ? 'default' : 'destructive'}>
            {validation?.isValid ? 'Configurada' : 'Pendiente'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Status Overview */}
        <Alert className={getStatusColor()}>
          <div className="flex items-start gap-3">
            {getStatusIcon()}
            <div className="flex-1">
              <AlertDescription>
                <div className="font-medium">{getStatusMessage()}</div>
                {validation && !validation.isValid && (
                  <div className="mt-2 text-sm">
                    <div>Tablas faltantes: {validation.missingTables.length}</div>
                    <div>Progreso: {validation.completionPercentage}% completado</div>
                  </div>
                )}
              </AlertDescription>
            </div>
          </div>
        </Alert>

        {/* Progress Bar */}
        {validation && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progreso de configuración</span>
              <span>{validation.completionPercentage}%</span>
            </div>
            <Progress value={validation.completionPercentage} className="h-2" />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={validateDatabase}
            disabled={isValidating}
            variant="outline"
            className="flex items-center gap-2"
          >
            {isValidating ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Database className="h-4 w-4" />
            )}
            Verificar Base de Datos
          </Button>
          
          {validation && !validation.isValid && (
            <>
              <Dialog open={showSetupModal} onOpenChange={setShowSetupModal}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Configurar Base de Datos
                  </Button>
                </DialogTrigger>
                <DatabaseSetupModal 
                  onClose={() => setShowSetupModal(false)}
                  onCopyInstructions={copySetupInstructions}
                  onDownloadSql={downloadSqlFile}
                  copiedSql={copiedSql}
                  supabaseUrl={getSupabaseConfig().url}
                />
              </Dialog>
              
              <Button
                onClick={downloadSqlFile}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Descargar SQL
              </Button>
            </>
          )}
        </div>

        {/* Table Status List */}
        {validation && (
          <>
            <Separator />
            <div className="space-y-4">
              <h4 className="font-medium">Estado de las Tablas</h4>
              <div className="grid gap-2 max-h-60 overflow-y-auto">
                {validation.allTables.map((table) => (
                  <div
                    key={table.name}
                    className="flex items-center justify-between p-2 rounded-lg border bg-card"
                  >
                    <div className="flex items-center gap-3">
                      {table.exists ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <div>
                        <div className="font-medium text-sm">{table.name}</div>
                        <div className="text-xs text-muted-foreground">{table.description}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {table.required && (
                        <Badge variant="outline" className="text-xs">
                          Requerida
                        </Badge>
                      )}
                      <Badge variant={table.exists ? 'default' : 'destructive'} className="text-xs">
                        {table.exists ? 'Existe' : 'Faltante'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

// Database Setup Modal Component
function DatabaseSetupModal({ 
  onClose, 
  onCopyInstructions, 
  onDownloadSql, 
  copiedSql, 
  supabaseUrl 
}: {
  onClose: () => void
  onCopyInstructions: () => void
  onDownloadSql: () => void
  copiedSql: boolean
  supabaseUrl: string
}) {
  return (
    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Configurar Base de Datos de Flowi Admin
        </DialogTitle>
        <DialogDescription>
          Sigue estos pasos para configurar correctamente tu base de datos Supabase
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-6">
        {/* Step 1 */}
        <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-600">
            1
          </div>
          <div className="flex-1">
            <h4 className="font-medium">Abrir SQL Editor en Supabase</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Ve a tu proyecto Supabase y abre el SQL Editor
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => window.open(`${supabaseUrl.replace('//', '//').replace(/\/$/, '')}/project/default/sql`, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir SQL Editor
            </Button>
          </div>
        </div>

        {/* Step 2 */}
        <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-600">
            2
          </div>
          <div className="flex-1">
            <h4 className="font-medium">Obtener el Script SQL</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Descarga o copia el script de configuración de Flowi Admin
            </p>
            <div className="flex gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onDownloadSql}
              >
                <Download className="h-4 w-4 mr-2" />
                Descargar SQL
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onCopyInstructions}
              >
                {copiedSql ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                Copiar Instrucciones
              </Button>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-600">
            3
          </div>
          <div className="flex-1">
            <h4 className="font-medium">Ejecutar el Script</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Pega el contenido completo del archivo <code>database/flowi-admin-final.sql</code> en el SQL Editor y haz clic en "Run"
            </p>
            <Alert className="mt-2">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Importante:</strong> El script creará más de 20 tablas y puede tomar 1-2 minutos en ejecutarse completamente.
              </AlertDescription>
            </Alert>
          </div>
        </div>

        {/* Step 4 */}
        <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-600">
            4
          </div>
          <div className="flex-1">
            <h4 className="font-medium">Verificar Configuración</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Regresa a Flowi Admin y verifica que la base de datos esté configurada correctamente
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={onClose}
            >
              Volver a Verificar
            </Button>
          </div>
        </div>

        {/* Help Section */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>¿Necesitas ayuda?</strong> Si encuentras errores durante la ejecución del script, 
            verifica que tengas permisos de administrador en tu proyecto Supabase y que la URL y API key sean correctas.
          </AlertDescription>
        </Alert>
      </div>
    </DialogContent>
  )
}