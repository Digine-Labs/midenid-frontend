// Pricing tier configuration (from shared/pricing.ts)
export interface PricingTier {
  years: number;
  displayYears: number;
  savings: string;
  popular?: boolean;
  recommended?: boolean;
}

// Extended pricing tier with calculated price (used in components)
export interface PricingTierWithPrice extends PricingTier {
  price: number;
}
