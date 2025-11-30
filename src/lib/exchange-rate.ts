import { ExchangeRate } from '@/types/banks';

const STORAGE_KEY = 'flowi_exchange_rate';

// Local storage fallback for exchange rates
export class ExchangeRateManager {
  private static instance: ExchangeRateManager;
  private currentRate: ExchangeRate | null = null;

  private constructor() {
    this.loadFromStorage();
  }

  static getInstance(): ExchangeRateManager {
    if (!ExchangeRateManager.instance) {
      ExchangeRateManager.instance = new ExchangeRateManager();
    }
    return ExchangeRateManager.instance;
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.currentRate = JSON.parse(stored);
      } else {
        // Set default rate
        this.currentRate = {
          id: 'default',
          usdToVes: 36.50,
          source: 'manual',
          isActive: true,
          createdAt: new Date().toISOString()
        };
        this.saveToStorage();
      }
    } catch (error) {
      console.error('Error loading exchange rate from storage:', error);
      this.setDefaultRate();
    }
  }

  private saveToStorage(): void {
    try {
      if (this.currentRate) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.currentRate));
      }
    } catch (error) {
      console.error('Error saving exchange rate to storage:', error);
    }
  }

  private setDefaultRate(): void {
    this.currentRate = {
      id: 'default',
      usdToVes: 36.50,
      source: 'manual',
      isActive: true,
      createdAt: new Date().toISOString()
    };
    this.saveToStorage();
  }

  getCurrentRate(): ExchangeRate | null {
    return this.currentRate;
  }

  updateRate(usdToVes: number, source: string = 'manual'): ExchangeRate {
    const newRate: ExchangeRate = {
      id: this.currentRate?.id || 'default',
      usdToVes,
      source,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    this.currentRate = newRate;
    this.saveToStorage();
    
    // Dispatch custom event for components to listen to
    window.dispatchEvent(new CustomEvent('exchangeRateUpdated', { 
      detail: newRate 
    }));

    return newRate;
  }

  convertUsdToVes(usdAmount: number): number {
    if (!this.currentRate) return usdAmount * 36.50;
    return usdAmount * this.currentRate.usdToVes;
  }

  convertVesToUsd(vesAmount: number): number {
    if (!this.currentRate) return vesAmount / 36.50;
    return vesAmount / this.currentRate.usdToVes;
  }

  // FIXED: Format VES without division - show actual amount
  formatVES(amount: number): string {
    // FIXED: Removed division by 1000 - show actual VES amount
    return amount.toLocaleString('es-VE', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  }

  // Format USD with proper decimal places
  formatUSD(amount: number): string {
    return amount.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  }
}

// Export singleton instance
export const exchangeRateManager = ExchangeRateManager.getInstance();

// Utility functions for easy access
export const getCurrentExchangeRate = (): ExchangeRate | null => {
  return exchangeRateManager.getCurrentRate();
};

export const updateExchangeRate = (usdToVes: number, source?: string): ExchangeRate => {
  return exchangeRateManager.updateRate(usdToVes, source);
};

export const convertUsdToVes = (usdAmount: number): number => {
  return exchangeRateManager.convertUsdToVes(usdAmount);
};

export const convertVesToUsd = (vesAmount: number): number => {
  return exchangeRateManager.convertVesToUsd(vesAmount);
};

export const formatVES = (amount: number): string => {
  return `Bs. ${exchangeRateManager.formatVES(amount)}`;
};

export const formatUSD = (amount: number): string => {
  return `$${exchangeRateManager.formatUSD(amount)}`;
};