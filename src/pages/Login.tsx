import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSupabase } from '@/context/SupabaseContext';
import { FuturisticCard } from '@/components/ui/futuristic-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, LogIn, Wifi, WifiOff, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import Register from './Register';
import { signIn } from '@/lib/supabase';

export default function Login() {
  const { state } = useSupabase();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    try {
      const result = await signIn(email, password);
      if (result.error) {
        toast.error(`Error de login: ${result.error.message}`);
      } else {
        toast.success('Sesión iniciada exitosamente');
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      toast.error(`Error de login: ${error.message || 'Error desconocido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (showRegister) {
    return <Register onBackToLogin={() => setShowRegister(false)} />;
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          {/* Flowi Logo and Branding */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-white shadow-lg border border-orange-200 flex items-center justify-center">
              <img 
                src="/flowi-logo.png" 
                alt="Flowi Logo" 
                className="w-12 h-12 object-contain"
              />
            </div>
            <div className="text-left">
              <h1 className="text-3xl font-bold text-gray-900">Flowi</h1>
              <p className="text-gray-700 font-medium">Sistema de Ventas</p>
            </div>
          </div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Bienvenido de vuelta
            </h2>
            <p className="text-gray-600">
              Ingresa tus credenciales para continuar
            </p>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <FuturisticCard variant="glass" className="p-8 bg-white border border-orange-200 shadow-xl">
            {/* Connection Status */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {state.isConnected ? (
                <>
                  <Wifi className="h-4 w-4 text-orange-600" />
                  <Badge className="bg-orange-100 text-orange-800 border-orange-300">
                    Conectado a Supabase
                  </Badge>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 text-orange-600" />
                  <Badge className="bg-orange-100 text-orange-800 border-orange-300">
                    Modo Local
                  </Badge>
                </>
              )}
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-900 font-medium">
                  Correo Electrónico
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Ingresa tu correo electrónico"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 border-gray-300 focus:border-orange-500 focus:ring-orange-200 bg-white text-gray-900 placeholder:text-gray-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-900 font-medium">
                  Contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Ingresa tu contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 pr-12 border-gray-300 focus:border-orange-500 focus:ring-orange-200 bg-white text-gray-900 placeholder:text-gray-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading || !email || !password}
                className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-medium text-base shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Iniciando sesión...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <LogIn className="h-5 w-5" />
                    Iniciar Sesión
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-4">
              <button
                onClick={() => setShowRegister(true)}
                className="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium mx-auto"
              >
                <UserPlus className="h-4 w-4" />
                Crear nueva cuenta
              </button>
              
              <p className="text-gray-600 text-sm">
                ¿Problemas para acceder?{' '}
                <a 
                  href="https://wa.me/584121156707" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-600 hover:text-orange-700 font-medium"
                >
                  Contacta al administrador
                </a>
              </p>
            </div>
          </FuturisticCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="text-center mt-8"
        >
          <p className="text-gray-500 text-sm">
            © 2024 Flowi. Todos los derechos reservados.
          </p>
        </motion.div>
      </div>
    </div>
  );
}