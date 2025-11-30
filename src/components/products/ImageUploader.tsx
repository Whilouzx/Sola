import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ProductImage } from '@/types/inventory';

interface ImageUploaderProps {
  images: ProductImage[];
  onImagesChange: (images: ProductImage[]) => void;
  maxImages?: number;
  productName?: string;
}

// URL del servidor Hostinger para upload
const HOSTINGER_UPLOAD_URL = 'https://springgreen-eel-515369.hostingersite.com/Inventario/upload.php';
const HOSTINGER_IMAGE_BASE = 'https://springgreen-eel-515369.hostingersite.com/Inventario/';

export function ImageUploader({ images = [], onImagesChange, maxImages = 5, productName = 'product' }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);

  const uploadToHostinger = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('productName', productName);

    try {
      console.log(`📤 Intentando subir imagen: ${file.name} a Hostinger...`);
      
      const response = await fetch(HOSTINGER_UPLOAD_URL, {
        method: 'POST',
        body: formData,
        mode: 'cors'
      });

      const data = await response.json();

      if (data.status === 'success' && data.url) {
        const imageUrl = data.fullUrl || `${HOSTINGER_IMAGE_BASE}${data.url}`;
        console.log(`✅ Imagen subida a Hostinger: ${imageUrl}`);
        return imageUrl;
      } else {
        console.warn(`⚠️ Respuesta del servidor: ${data.message}`);
        return null;
      }
    } catch (error) {
      console.error(`❌ Error al subir a Hostinger:`, error);
      return null;
    }
  };

  const convertToDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        resolve(event.target?.result as string);
      };
      reader.onerror = () => {
        reject(new Error(`Error al procesar ${file.name}`));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (images.length + files.length > maxImages) {
      toast.error(`Máximo ${maxImages} imágenes permitidas`);
      return;
    }

    setUploading(true);
    console.log(`📸 Iniciando carga de ${files.length} imagen(es)...`);
    console.log(`📦 Nombre del producto: ${productName}`);

    try {
      const newImages: ProductImage[] = [];
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(`📤 Subiendo archivo ${i + 1}/${files.length}: ${file.name} (${(file.size / 1024).toFixed(2)}KB)`);
        
        // Subir a Hostinger - NO usar fallback
        const imageUrl = await uploadToHostinger(file);

        if (imageUrl) {
          const newImage: ProductImage = {
            id: `${Date.now()}-${i}`,
            url: imageUrl,
            name: file.name,
            uploadedAt: new Date().toISOString(),
            isMain: images.length === 0 && newImages.length === 0,
            path: imageUrl
          };

          newImages.push(newImage);
          uploadedUrls.push(imageUrl);
          console.log(`✅ Imagen ${i + 1} guardada en Hostinger: ${imageUrl}`);
          console.log(`📋 Objeto de imagen creado:`, newImage);
        } else {
          // Si falla, mostrar error pero NO guardar data URL
          console.warn(`⚠️ No se pudo subir ${file.name} a Hostinger`);
          toast.error(`No se pudo subir ${file.name} - verifica tu conexión a Hostinger`);
        }
      }

      if (newImages.length > 0) {
        console.log(`📥 Procesando ${newImages.length} imagen(es) nueva(s)...`);
        console.log(`📦 Estado anterior: ${images.length} imagen(es)`);
        console.log(`📦 Estado nuevo: ${images.length + newImages.length} imagen(es)`);
        console.log(`🔍 Array final de imágenes:`, [...images, ...newImages]);
        onImagesChange([...images, ...newImages]);
        const count = newImages.length;
        toast.success(`${count} imagen${count > 1 ? 's' : ''} guardada${count > 1 ? 's' : ''} en Hostinger`);
      } else if (files.length > 0) {
        toast.error('No se pudo subir ninguna imagen. Verifica tu conexión a Hostinger.');
      }
    } catch (error) {
      console.error('❌ Error en uploadImages:', error);
      toast.error('Error al procesar imágenes');
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const removeImage = (id: string) => {
    const imageToRemove = images.find(img => img.id === id);
    
    const newImages = images.filter(img => img.id !== id);
    if (imageToRemove?.isMain && newImages.length > 0) {
      newImages[0].isMain = true;
    }
    onImagesChange(newImages);
    toast.success('Imagen eliminada');
  };

  const setMainImage = (id: string) => {
    const newImages = images.map(img => ({
      ...img,
      isMain: img.id === id
    }));
    onImagesChange(newImages);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
          Imágenes del Producto ({images.length}/{maxImages})
        </label>
        
        <div className="relative">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            disabled={images.length >= maxImages || uploading}
            className="hidden"
            id="image-input"
          />
          <label
            htmlFor="image-input"
            className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-orange-300 rounded-lg bg-orange-50 dark:bg-orange-900/20 dark:border-orange-700 cursor-pointer hover:border-orange-400 dark:hover:border-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="text-center">
              {uploading ? (
                <>
                  <Loader2 className="h-8 w-8 text-orange-500 dark:text-orange-400 mx-auto mb-2 animate-spin" />
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Procesando imágenes...
                  </p>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-orange-500 dark:text-orange-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Haz clic para subir imágenes
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Se guardarán en: springgreen-eel-515369.hostingersite.com/Inventario/
                  </p>
                </>
              )}
            </div>
          </label>
        </div>
      </div>

      {images.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Imágenes del producto:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.map((image) => (
              <div
                key={image.id}
                className="relative group rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700 hover:border-orange-400 dark:hover:border-orange-600 transition-colors"
              >
                <img
                  src={image.url}
                  alt={image.name}
                  className="w-full h-24 object-cover"
                  onError={(e) => {
                    console.error('❌ Error al cargar imagen:', image.url);
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/96?text=Error';
                  }}
                />
                
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-white/20"
                    onClick={() => removeImage(image.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {image.isMain && (
                  <div className="absolute top-1 right-1">
                    <Badge className="bg-orange-500 text-white text-xs">Principal</Badge>
                  </div>
                )}

                {!image.isMain && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute bottom-1 left-1 text-xs h-6"
                    onClick={() => setMainImage(image.id)}
                  >
                    <ImageIcon className="h-3 w-3 mr-1" />
                    Principal
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
