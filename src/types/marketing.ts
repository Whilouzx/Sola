// Marketing and Customer Points Types

export type CustomerLevel = 'bronze' | 'silver' | 'gold' | 'platinum';
export type PointsType = 'purchase' | 'referral' | 'payment' | 'bonus' | 'login';
export type ActivityType = 'purchase' | 'payment' | 'referral' | 'login' | 'reward_redemption';
export type RewardType = 'discount' | 'free_product' | 'cash_back' | 'free_shipping';
export type MarketingSource = 'google_ads' | 'facebook' | 'instagram' | 'referral' | 'organic' | 'email' | 'direct';

// Customer Points Interface
export interface CustomerPoints {
  id: string;
  customerId: string;
  pointsEarned: number;
  pointsType: PointsType;
  description?: string;
  referenceId?: string; // ID de venta, pago, etc.
  createdAt: string;
  updatedAt: string;
}

// Customer Activity Interface
export interface CustomerActivity {
  id: string;
  customerId: string;
  activityType: ActivityType;
  activityDescription: string;
  amount?: number;
  currency?: 'USD' | 'VES';
  referenceId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

// Customer Reward Interface
export interface CustomerReward {
  id: string;
  customerId: string;
  rewardType: RewardType;
  rewardValue: number;
  pointsCost: number;
  description: string;
  isRedeemed: boolean;
  redeemedAt?: string;
  expiresAt?: string;
  createdAt: string;
}

// Enhanced Customer Interface
export interface EnhancedCustomer {
  id: string;
  name: string;
  email?: string;
  phone: string;
  sector: string;
  creditLimit: number;
  paymentTerms: number;
  marketingSource?: MarketingSource;
  campaignId?: string;
  referralCode?: string;
  totalPoints: number;
  customerLevel: CustomerLevel;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Points Configuration
export interface PointsConfig {
  purchaseMultiplier: number; // Points per $1 USD
  referralBonus: number;
  paymentOnTimeBonus: number;
  recurringPurchaseBonus: number;
  loginBonus: number;
}

// Level Configuration
export interface LevelConfig {
  level: CustomerLevel;
  minPoints: number;
  maxPoints: number;
  benefits: string[];
  icon: string;
  color: string;
}

// Marketing Analytics
export interface MarketingAnalytics {
  source: MarketingSource;
  totalCustomers: number;
  totalRevenue: number;
  averageOrderValue: number;
  customerLifetimeValue: number;
  conversionRate: number;
}

// Customer Summary
export interface CustomerSummary {
  customer: EnhancedCustomer;
  totalPurchases: number;
  totalSpent: number;
  lastActivity: string;
  pointsThisMonth: number;
  activitiesCount: number;
  availableRewards: CustomerReward[];
}