import { motion } from 'framer-motion';
import { Lock, Clock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface UnderConstructionProps {
  title: string;
  section: string;
}

export default function UnderConstruction({ title, section }: UnderConstructionProps) {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        {/* Card Container */}
        <div className="rounded-2xl border border-orange-200/50 bg-gradient-to-br from-white via-orange-50/30 to-white p-8 shadow-lg backdrop-blur-sm">
          {/* Lock Icon */}
          <motion.div
            animate={{ 
              rotate: [0, -5, 5, 0],
              y: [0, -8, 0]
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="flex justify-center mb-6"
          >
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
              <Lock className="h-10 w-10 text-white" />
            </div>
          </motion.div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
            {title}
          </h1>

          {/* Status Badge */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 text-orange-700 text-sm font-medium">
              <Clock className="h-4 w-4" />
              En construcción
            </div>
          </div>

          {/* Description */}
          <p className="text-center text-gray-600 mb-8">
            Esta sección <span className="font-semibold">{section}</span> se encuentra en actualización y pronto estará disponible con nuevas mejoras y funcionalidades.
          </p>

          {/* Feature List */}
          <div className="space-y-3 mb-8">
            {[
              'Mejoras de rendimiento',
              'Nueva interfaz optimizada',
              'Funcionalidades avanzadas'
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * (index + 1) }}
                className="flex items-center gap-3 text-sm text-gray-700"
              >
                <div className="h-2 w-2 rounded-full bg-orange-500" />
                {feature}
              </motion.div>
            ))}
          </div>

          {/* Action Button */}
          <Button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Dashboard
          </Button>

          {/* Footer Message */}
          <p className="text-center text-gray-500 text-xs mt-6">
            Gracias por tu paciencia mientras mejoramos tu experiencia
          </p>
        </div>
      </motion.div>
    </div>
  );
}
