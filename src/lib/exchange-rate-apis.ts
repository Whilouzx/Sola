// API integrations for exchange rate sources
import { toast } from 'sonner';

export interface ExchangeRateAPIResponse {
  success: boolean;
  rate?: number;
  source: string;
  error?: string;
}

// BCV (Banco Central de Venezuela) API integration using third-party service
export async function fetchBCVRate(): Promise<ExchangeRateAPIResponse> {
  try {
    console.log('🏦 Fetching BCV exchange rate...');
    
    // Using third-party BCV API service
    const response = await fetch('https://bcv-api.rafnixg.dev/rates/', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    console.log('📊 BCV API Response:', data);
    
    // BCV API returns rates in different formats, try to extract USD rate
    let bcvRate = 36.50; // fallback
    
    if (data && typeof data === 'object') {
      // Try different possible response structures
      if (data.USD && data.USD.rate) {
        bcvRate = parseFloat(data.USD.rate);
      } else if (data.usd && data.usd.rate) {
        bcvRate = parseFloat(data.usd.rate);
      } else if (data.rates && data.rates.USD) {
        bcvRate = parseFloat(data.rates.USD);
      } else if (data.USD) {
        bcvRate = parseFloat(data.USD);
      } else if (Array.isArray(data) && data.length > 0) {
        // If it's an array, look for USD entry
        const usdEntry = data.find(item => 
          item.currency === 'USD' || 
          item.code === 'USD' ||
          item.name?.toLowerCase().includes('dólar')
        );
        if (usdEntry && usdEntry.rate) {
          bcvRate = parseFloat(usdEntry.rate);
        }
      }
    }
    
    console.log('✅ BCV rate fetched successfully:', bcvRate);
    
    return {
      success: true,
      rate: bcvRate,
      source: 'BCV'
    };
    
  } catch (error) {
    console.error('❌ Error fetching BCV rate:', error);
    
    // Fallback: try alternative BCV endpoint
    try {
      console.log('🔄 Trying alternative BCV endpoint...');
      
      const fallbackResponse = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        const vesRate = fallbackData.rates?.VES;
        
        if (vesRate) {
          console.log('✅ BCV rate from fallback service:', vesRate);
          
          return {
            success: true,
            rate: vesRate,
            source: 'BCV'
          };
        }
      }
    } catch (fallbackError) {
      console.error('❌ BCV fallback also failed:', fallbackError);
    }
    
    return {
      success: false,
      source: 'BCV',
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

// Dólar Paralelo API integration using ve.dolarapi.com (correct URL)
export async function fetchParaleloRate(): Promise<ExchangeRateAPIResponse> {
  try {
    console.log('💱 Fetching Dólar Paralelo rate from ve.dolarapi.com...');
    
    // Using correct Venezuela dolarapi.com endpoint
    const response = await fetch('https://ve.dolarapi.com/v1/dolares/paralelo', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    console.log('📊 Paralelo API Response:', data);
    
    // ve.dolarapi.com returns data in format: { "venta": number, "compra": number, "fecha": string }
    const paraleloRate = data.venta || data.compra || data.promedio || 36.50;
    
    console.log('✅ Dólar Paralelo rate fetched successfully:', paraleloRate);
    
    return {
      success: true,
      rate: paraleloRate,
      source: 'Dólar paralelo'
    };
    
  } catch (error) {
    console.error('❌ Error fetching Dólar Paralelo rate:', error);
    
    // Fallback: try general dolares endpoint
    try {
      console.log('🔄 Trying alternative Dólar Paralelo endpoint...');
      
      const fallbackResponse = await fetch('https://ve.dolarapi.com/v1/dolares');
      
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        console.log('📊 Fallback API Response:', fallbackData);
        
        // Find paralelo rate in the array
        let paraleloData = null;
        
        if (Array.isArray(fallbackData)) {
          paraleloData = fallbackData.find(item => 
            item.casa?.toLowerCase().includes('paralelo') ||
            item.nombre?.toLowerCase().includes('paralelo') ||
            item.fuente?.toLowerCase().includes('paralelo')
          );
        }
        
        if (paraleloData) {
          const rate = paraleloData.venta || paraleloData.compra || paraleloData.promedio || 36.50;
          
          console.log('✅ Dólar Paralelo rate from fallback:', rate);
          
          return {
            success: true,
            rate: rate,
            source: 'Dólar paralelo'
          };
        }
      }
    } catch (fallbackError) {
      console.error('❌ Paralelo fallback also failed:', fallbackError);
    }
    
    return {
      success: false,
      source: 'Dólar paralelo',
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

// Manual rate - no API needed, user sets it manually
export function setManualRate(rate: number): ExchangeRateAPIResponse {
  console.log('✏️ Setting manual exchange rate:', rate);
  
  if (rate <= 0) {
    return {
      success: false,
      source: 'Manual',
      error: 'La tasa debe ser mayor a 0'
    };
  }
  
  return {
    success: true,
    rate: rate,
    source: 'Manual'
  };
}

// Main function to fetch rate based on source
export async function fetchExchangeRate(source: string, manualRate?: number): Promise<ExchangeRateAPIResponse> {
  console.log(`🔄 Fetching exchange rate from source: ${source}`);
  
  switch (source.toLowerCase()) {
    case 'bcv':
      return await fetchBCVRate();
      
    case 'dólar paralelo':
    case 'paralelo':
      return await fetchParaleloRate();
      
    case 'manual':
      if (typeof manualRate === 'number') {
        return setManualRate(manualRate);
      } else {
        return {
          success: false,
          source: 'Manual',
          error: 'Se requiere especificar la tasa manual'
        };
      }
      
    default:
      return {
        success: false,
        source: source,
        error: 'Fuente no reconocida'
      };
  }
}

// Utility function to update exchange rate with API integration
export async function updateExchangeRateFromAPI(source: string, manualRate?: number): Promise<ExchangeRateAPIResponse> {
  try {
    console.log(`🚀 Updating exchange rate from ${source}...`);
    
    const result = await fetchExchangeRate(source, manualRate);
    
    if (result.success && result.rate) {
      // Import the exchange rate manager to update the rate
      const { updateExchangeRate } = await import('./exchange-rate');
      updateExchangeRate(result.rate, result.source);
      
      toast.success(`Tasa actualizada desde ${result.source}: ${result.rate.toFixed(2)} Bs/$`);
    } else {
      toast.error(`Error actualizando desde ${result.source}: ${result.error}`);
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Error in updateExchangeRateFromAPI:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    toast.error(`Error actualizando tasa: ${errorMessage}`);
    
    return {
      success: false,
      source: source,
      error: errorMessage
    };
  }
}

// Cache system for exchange rates (optional Supabase integration)
export interface ExchangeRateCache {
  id: string;
  source: string;
  rate: number;
  created_at: string;
  expires_at: string;
}

// Function to create Supabase table for caching (if needed)
export const createExchangeRateCacheTable = `
-- Exchange Rate Cache Table for Supabase
CREATE TABLE IF NOT EXISTS exchange_rate_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source VARCHAR(50) NOT NULL,
  rate DECIMAL(10,4) NOT NULL,
  raw_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_exchange_rate_cache_source ON exchange_rate_cache(source);
CREATE INDEX IF NOT EXISTS idx_exchange_rate_cache_active ON exchange_rate_cache(is_active, expires_at);

-- RLS policies (optional)
ALTER TABLE exchange_rate_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_read_exchange_rates" ON exchange_rate_cache FOR SELECT USING (true);
CREATE POLICY "allow_insert_exchange_rates" ON exchange_rate_cache FOR INSERT WITH CHECK (true);
`;