import { useState } from 'react';
import { motion } from 'framer-motion';
import { signUp, createUserInSupabase } from '@/lib/supabase';
import { FuturisticCard } from '@/components/ui/futuristic-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, UserPlus, Wifi, WifiOff, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface RegisterProps {
  onBackToLogin: () => void;
}

export default function Register({ onBackToLogin }: RegisterProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    role: 'user' as 'user' | 'admin'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsLoading(true);
    try {
      // Create user with Supabase Auth
      const { data, error } = await createUserInSupabase({
        email: formData.email,
        password: formData.password,
        full_name: formData.fullName,
        organization_id: '550e8400-e29b-41d4-a716-446655440000', // Default organization
        role: formData.role
      });

      if (error) {
        console.error('Registration error:', error);
        toast.error(`Error de registro: ${error.message}`);
        return;
      }

      toast.success('Usuario registrado exitosamente. Verifica tu email para activar la cuenta.');
      onBackToLogin();
    } catch (error: any) {
      console.error('Registration failed:', error);
      toast.error(`Error de registro: ${error.message || 'Error desconocido'}`);
    } finally {
      setIsLoading(false);
    }
  };

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
              Crear Nueva Cuenta
            </h2>
            <p className="text-gray-600">
              Completa el formulario para registrarte
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
              <Wifi className="h-4 w-4 text-orange-600" />
              <Badge className="bg-orange-100 text-orange-800 border-orange-300">
                Registro con Supabase
              </Badge>
            </div>

            <form onSubmit={handleRegister} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-gray-900 font-medium">
                  Nombre Completo
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Ingresa tu nombre completo"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className="h-12 border-gray-300 focus:border-orange-500 focus:ring-orange-200 bg-white text-gray-900 placeholder:text-gray-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-900 font-medium">
                  Correo Electrónico
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Ingresa tu correo electrónico"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="h-12 border-gray-300 focus:border-orange-500 focus:ring-orange-200 bg-white text-gray-900 placeholder:text-gray-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role" className="text-gray-900 font-medium">
                  Rol de Usuario
                </Label>
                <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
                  <SelectTrigger className="h-12 border-gray-300 focus:border-orange-500 focus:ring-orange-200 bg-white text-gray-900">
                    <SelectValue placeholder="Selecciona un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Usuario Estándar</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-900 font-medium">
                  Contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Ingresa tu contraseña (mín. 6 caracteres)"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="h-12 pr-12 border-gray-300 focus:border-orange-500 focus:ring-orange-200 bg-white text-gray-900 placeholder:text-gray-500"
                    required
                    minLength={6}
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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-900 font-medium">
                  Confirmar Contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirma tu contraseña"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className="h-12 pr-12 border-gray-300 focus:border-orange-500 focus:ring-orange-200 bg-white text-gray-900 placeholder:text-gray-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading || !formData.email || !formData.password || !formData.fullName}
                className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-medium text-base shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Registrando...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Crear Cuenta
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={onBackToLogin}
                className="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium mx-auto"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver al Login
              </button>
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