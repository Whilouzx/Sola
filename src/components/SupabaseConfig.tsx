import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Database, 
  Settings, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Copy,
  ExternalLink,
  AlertCircle,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@supabase/supabase-js';

interface SupabaseConfigProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved: (url: string, key: string) => void;
  currentUrl?: string;
  currentKey?: string;
}

export default function SupabaseConfig({ 
  isOpen, 
  onClose, 
  onConfigSaved,
  currentUrl = '',
  currentKey = ''
}: SupabaseConfigProps) {
  const [url, setUrl] = useState(currentUrl);
  const [anonKey, setAnonKey] = useState(currentKey);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Validar formato de URL
  const isValidUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.includes('supabase.co');
    } catch {
      return false;
    }
  };

  // Validar formato de clave anónima
  const isValidAnonKey = (key: string) => {
    return key.startsWith('eyJ') && key.length > 100;
  };

  // Probar conexión con Supabase
  const testConnection = async () => {
    if (!url || !anonKey) {
      toast.error('Por favor, completa ambos campos');
      return;
    }

    if (!isValidUrl(url)) {
      toast.error('URL de Supabase inválida. Debe ser como: https://tu-proyecto.supabase.co');
      return;
    }

    if (!isValidAnonKey(anonKey)) {
      toast.error('Clave anónima inválida. Debe empezar con "eyJ"');
      return;
    }

    setIsLoading(true);
    setConnectionStatus('testing');
    setErrorMessage('');

    try {
      console.log('🔍 Probando conexión a Supabase...');
      
      // Crear cliente temporal
      const testClient = createClient(url, anonKey, {
        auth: { persistSession: false }
      });

      // Probar consulta simple
      const { data, error } = await testClient
        .from('products')
        .select('id')
        .limit(1);

      if (error) {
        console.error('❌ Error de conexión:', error);
        
        if (error.message.includes('relation "public.products" does not exist')) {
          setConnectionStatus('error');
          setErrorMessage('Las tablas no existen. ¿Ejecutaste el script SQL de configuración?');
          toast.error('Tablas no encontradas - Ejecuta el script SQL');
        } else if (error.message.includes('Invalid API key')) {
          setConnectionStatus('error');
          setErrorMessage('Clave API inválida. Verifica que copiaste la clave anónima correcta.');
          toast.error('Clave API inválida');
        } else {
          setConnectionStatus('error');
          setErrorMessage(`Error de conexión: ${error.message}`);
          toast.error('Error de conexión');
        }
        return;
      }

      console.log('✅ Conexión exitosa a Supabase');
      setConnectionStatus('success');
      toast.success('¡Conexión exitosa a Supabase!');

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ Error probando conexión:', error);
      setConnectionStatus('error');
      setErrorMessage(`Error de red: ${errorMessage}`);
      toast.error('Error de conexión de red');
    } finally {
      setIsLoading(false);
    }
  };

  // Guardar configuración
  const saveConfiguration = () => {
    if (connectionStatus !== 'success') {
      toast.error('Prueba la conexión antes de guardar');
      return;
    }

    // Guardar en localStorage
    localStorage.setItem('supabase-url', url);
    localStorage.setItem('supabase-anon-key', anonKey);

    // Notificar al componente padre
    onConfigSaved(url, anonKey);
    
    toast.success('Configuración guardada exitosamente');
    onClose();
  };

  // Copiar texto al portapapeles
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado al portapapeles`);
  };

  // Limpiar configuración
  const clearConfiguration = () => {
    setUrl('');
    setAnonKey('');
    setConnectionStatus('idle');
    setErrorMessage('');
    localStorage.removeItem('supabase-url');
    localStorage.removeItem('supabase-anon-key');
    toast.info('Configuración limpiada');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-6 w-6 text-blue-600" />
              Configuración de Supabase
            </CardTitle>
            <p className="text-sm text-gray-600">
              Configura tu proyecto de Supabase para sincronizar datos en la nube
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Instrucciones rápidas */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>¿Primera vez?</strong> Consulta el archivo{' '}
                <code className="bg-gray-100 px-1 rounded">SUPABASE_SETUP_GUIDE.md</code>{' '}
                para crear tu proyecto desde cero.
              </AlertDescription>
            </Alert>

            {/* Formulario de configuración */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="supabase-url" className="flex items-center gap-2">
                  URL de Supabase
                  <Badge variant="secondary" className="text-xs">Requerido</Badge>
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="supabase-url"
                    placeholder="https://tu-proyecto.supabase.co"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className={`flex-1 ${!isValidUrl(url) && url ? 'border-red-300' : ''}`}
                  />
                  {url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(url, 'URL')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {url && !isValidUrl(url) && (
                  <p className="text-sm text-red-600">
                    URL inválida. Debe ser como: https://tu-proyecto.supabase.co
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="supabase-key" className="flex items-center gap-2">
                  Clave Anónima (anon key)
                  <Badge variant="secondary" className="text-xs">Requerido</Badge>
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="supabase-key"
                    type="password"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={anonKey}
                    onChange={(e) => setAnonKey(e.target.value)}
                    className={`flex-1 ${!isValidAnonKey(anonKey) && anonKey ? 'border-red-300' : ''}`}
                  />
                  {anonKey && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(anonKey, 'Clave')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {anonKey && !isValidAnonKey(anonKey) && (
                  <p className="text-sm text-red-600">
                    Clave inválida. Debe empezar con "eyJ" y ser muy larga
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Estado de conexión */}
            <div className="space-y-3">
              <h3 className="font-medium flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Estado de Conexión
              </h3>
              
              <AnimatePresence>
                {connectionStatus === 'idle' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Badge variant="secondary">Sin probar</Badge>
                  </motion.div>
                )}

                {connectionStatus === 'testing' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <Badge variant="secondary">Probando conexión...</Badge>
                  </motion.div>
                )}

                {connectionStatus === 'success' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      Conexión exitosa
                    </Badge>
                  </motion.div>
                )}

                {connectionStatus === 'error' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <Badge variant="destructive">Error de conexión</Badge>
                    </div>
                    {errorMessage && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{errorMessage}</AlertDescription>
                      </Alert>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Separator />

            {/* Enlaces útiles */}
            <div className="space-y-3">
              <h3 className="font-medium">Enlaces Útiles</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
                  className="justify-start"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Dashboard Supabase
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('https://supabase.com/docs', '_blank')}
                  className="justify-start"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Documentación
                </Button>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                onClick={testConnection}
                disabled={isLoading || !url || !anonKey}
                className="flex-1"
                variant="outline"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4 mr-2" />
                )}
                Probar Conexión
              </Button>
              
              <Button
                onClick={saveConfiguration}
                disabled={connectionStatus !== 'success'}
                className="flex-1"
              >
                <Settings className="h-4 w-4 mr-2" />
                Guardar Configuración
              </Button>
            </div>

            <div className="flex justify-between pt-2">
              <Button
                variant="ghost"
                onClick={clearConfiguration}
                className="text-red-600 hover:text-red-700"
              >
                Limpiar Configuración
              </Button>
              
              <Button variant="ghost" onClick={onClose}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}