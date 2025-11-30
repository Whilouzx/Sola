import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Settings as SettingsIcon, 
  Database, 
  User, 
  Palette, 
  Bell, 
  Shield, 
  Globe,
  Building2,
  CreditCard,
  Key
} from 'lucide-react'
import SupabaseConfigSection from '@/components/settings/SupabaseConfigSection'
import DatabaseSetupSection from '@/components/settings/DatabaseSetupSection'

export default function Settings() {
  const [activeTab, setActiveTab] = useState('database')

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
              <SettingsIcon className="h-5 w-5 text-white" />
            </div>
            Configuración
          </h1>
          <p className="text-muted-foreground mt-2">
            Administra la configuración de tu sistema ERP
          </p>
        </div>
        <Badge variant="secondary" className="px-3 py-1">
          Administrador
        </Badge>
      </div>

      <Separator />

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          <TabsTrigger value="database" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline">Base de Datos</span>
          </TabsTrigger>
          <TabsTrigger value="organization" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Organización</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Usuarios</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Apariencia</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notificaciones</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Seguridad</span>
          </TabsTrigger>
        </TabsList>

        {/* Database Configuration Tab */}
        <TabsContent value="database" className="space-y-6">
          {/* Database Structure Validation */}
          <DatabaseSetupSection />
          
          {/* Supabase Connection Configuration */}
          <SupabaseConfigSection />
          
          {/* Additional Database Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Configuración Avanzada
              </CardTitle>
              <CardDescription>
                Configuraciones adicionales de base de datos y rendimiento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Modo de Conexión</h4>
                      <p className="text-sm text-muted-foreground">Configuración de pooling</p>
                    </div>
                    <Badge variant="outline">Session</Badge>
                  </div>
                </Card>
                
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Región</h4>
                      <p className="text-sm text-muted-foreground">Ubicación del servidor</p>
                    </div>
                    <Badge variant="outline">Auto</Badge>
                  </div>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Organization Tab */}
        <TabsContent value="organization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Información de la Organización
              </CardTitle>
              <CardDescription>
                Configura los datos de tu empresa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Configuración de organización próximamente</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Gestión de Usuarios
              </CardTitle>
              <CardDescription>
                Configuraciones del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Configuraciones próximamente</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Apariencia y Tema
              </CardTitle>
              <CardDescription>
                Personaliza la apariencia de la aplicación
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Palette className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Configuración de tema próximamente</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notificaciones
              </CardTitle>
              <CardDescription>
                Configura alertas y notificaciones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Configuración de notificaciones próximamente</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Seguridad
              </CardTitle>
              <CardDescription>
                Configuración de seguridad y autenticación
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Configuración de seguridad próximamente</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}