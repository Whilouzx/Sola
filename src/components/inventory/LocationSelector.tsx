import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MapPin, 
  Warehouse, 
  Store, 
  Building2,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { Location, LocationInventory, InventoryDashboardMetrics } from '@/types/inventory';
import { getLocations, getLocationInventory } from '@/lib/inventory/locations';
import { toast } from 'sonner';

interface LocationSelectorProps {
  selectedLocationId?: string;
  onLocationChange: (locationId: string | null, location?: Location) => void;
  showInventoryStats?: boolean;
  className?: string;
}

export default function LocationSelector({
  selectedLocationId,
  onLocationChange,
  showInventoryStats = false,
  className = ''
}: LocationSelectorProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [locationInventory, setLocationInventory] = useState<LocationInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [inventoryLoading, setInventoryLoading] = useState(false);

  useEffect(() => {
    loadLocations();
  }, []);

  useEffect(() => {
    if (selectedLocationId && showInventoryStats) {
      loadLocationInventory(selectedLocationId);
    }
  }, [selectedLocationId, showInventoryStats]);

  const loadLocations = async () => {
    try {
      setLoading(true);
      const data = await getLocations();
      setLocations(data);
      
      // Set initial selected location if provided
      if (selectedLocationId) {
        const location = data.find(l => l.id === selectedLocationId);
        setSelectedLocation(location || null);
      }
    } catch (error) {
      toast.error('Error cargando ubicaciones');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadLocationInventory = async (locationId: string) => {
    try {
      setInventoryLoading(true);
      const data = await getLocationInventory(locationId);
      setLocationInventory(data);
    } catch (error) {
      toast.error('Error cargando inventario de ubicación');
      console.error(error);
    } finally {
      setInventoryLoading(false);
    }
  };

  const handleLocationSelect = (locationId: string) => {
    if (locationId === 'all') {
      setSelectedLocation(null);
      setLocationInventory([]);
      onLocationChange(null);
      return;
    }

    const location = locations.find(l => l.id === locationId);
    if (location) {
      setSelectedLocation(location);
      onLocationChange(locationId, location);
      
      if (showInventoryStats) {
        loadLocationInventory(locationId);
      }
    }
  };

  const getLocationIcon = (type: string) => {
    switch (type) {
      case 'warehouse':
        return Warehouse;
      case 'store':
        return Store;
      case 'branch':
        return Building2;
      default:
        return MapPin;
    }
  };

  const getLocationTypeLabel = (type: string) => {
    switch (type) {
      case 'warehouse':
        return 'Almacén';
      case 'store':
        return 'Tienda';
      case 'branch':
        return 'Sucursal';
      default:
        return 'Ubicación';
    }
  };

  const calculateInventoryStats = () => {
    if (!locationInventory.length) return null;

    const totalProducts = locationInventory.length;
    const totalValue = locationInventory.reduce((sum, item) => {
      if (item.product) {
        return sum + (item.quantity * item.product.priceUSD);
      }
      return sum;
    }, 0);
    
    const lowStockItems = locationInventory.filter(item => 
      item.quantity <= item.reorderLevel
    ).length;
    
    const outOfStockItems = locationInventory.filter(item => 
      item.quantity === 0
    ).length;

    return {
      totalProducts,
      totalValue,
      lowStockItems,
      outOfStockItems
    };
  };

  const inventoryStats = calculateInventoryStats();

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Location Selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Ubicación
        </label>
        <Select
          value={selectedLocationId || 'all'}
          onValueChange={handleLocationSelect}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar ubicación" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Todas las ubicaciones
              </div>
            </SelectItem>
            {locations.map((location) => {
              const IconComponent = getLocationIcon(location.type);
              return (
                <SelectItem key={location.id} value={location.id}>
                  <div className="flex items-center gap-2">
                    <IconComponent className="h-4 w-4" />
                    <span>{location.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {getLocationTypeLabel(location.type)}
                    </Badge>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Selected Location Info */}
      {selectedLocation && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                {(() => {
                  const IconComponent = getLocationIcon(selectedLocation.type);
                  return <IconComponent className="h-4 w-4" />;
                })()}
                {selectedLocation.name}
                <Badge variant="outline">
                  {getLocationTypeLabel(selectedLocation.type)}
                </Badge>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-2 text-sm">
                {selectedLocation.address && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <MapPin className="h-3 w-3" />
                    <span>{selectedLocation.address}</span>
                  </div>
                )}
                
                {selectedLocation.phone && (
                  <div className="text-gray-600 dark:text-gray-400">
                    📞 {selectedLocation.phone}
                  </div>
                )}
                
                {selectedLocation.email && (
                  <div className="text-gray-600 dark:text-gray-400">
                    ✉️ {selectedLocation.email}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Inventory Statistics */}
      {showInventoryStats && selectedLocation && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="h-4 w-4" />
                Estadísticas de Inventario
              </CardTitle>
            </CardHeader>
            
            <CardContent className="pt-0">
              {inventoryLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-400 mx-auto"></div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">Cargando...</p>
                </div>
              ) : inventoryStats ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {inventoryStats.totalProducts}
                    </div>
                    <div className="text-xs text-blue-600">Productos</div>
                  </div>
                  
                  <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      ${inventoryStats.totalValue.toFixed(0)}
                    </div>
                    <div className="text-xs text-green-600">Valor Total</div>
                  </div>
                  
                  {inventoryStats.lowStockItems > 0 && (
                    <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600 flex items-center justify-center gap-1">
                        <TrendingDown className="h-4 w-4" />
                        {inventoryStats.lowStockItems}
                      </div>
                      <div className="text-xs text-orange-600">Stock Bajo</div>
                    </div>
                  )}
                  
                  {inventoryStats.outOfStockItems > 0 && (
                    <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-red-600 flex items-center justify-center gap-1">
                        <AlertTriangle className="h-4 w-4" />
                        {inventoryStats.outOfStockItems}
                      </div>
                      <div className="text-xs text-red-600">Sin Stock</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    No hay productos en esta ubicación
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Quick Actions */}
      {selectedLocation && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-2"
        >
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            onClick={() => {
              // This would open a stock adjustment dialog
              toast.info('Función de ajuste de stock próximamente');
            }}
          >
            <TrendingUp className="h-3 w-3 mr-1" />
            Ajustar Stock
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            onClick={() => {
              // This would open a transfer dialog
              toast.info('Función de transferencia próximamente');
            }}
          >
            <Package className="h-3 w-3 mr-1" />
            Transferir
          </Button>
        </motion.div>
      )}
    </div>
  );
}