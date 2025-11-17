/**
 * Domain Pricing Configuration
 * All prices are in USD per year
 */

export const TOKEN_SYMBOL = "MIDEN";

export const DOMAIN_PRICING_USD = {
  1: 375,  // 1 letter domains
  2: 200,  // 2 letter domains
  3: 120,  // 3 letter domains
  4: 55,   // 4 letter domains
  5: 20,   // 5+ letter domains
} as const;

/**
 * Get the annual price in USD for a domain based on its length
 */
export function getDomainPricePerYear(domainLength: number): number {
  if (domainLength === 1) return DOMAIN_PRICING_USD[1];
  if (domainLength === 2) return DOMAIN_PRICING_USD[2];
  if (domainLength === 3) return DOMAIN_PRICING_USD[3];
  if (domainLength === 4) return DOMAIN_PRICING_USD[4];
  return DOMAIN_PRICING_USD[5]; // 5 or more characters
}

/**
 * Pricing tier configuration with discount rules
 */
export interface PricingTier {
  years: number;        // Actual registration period
  displayYears: number; // What the user pays for (discounted)
  savings: string;      // Discount description
  popular?: boolean;
  recommended?: boolean;
}

/**
 * Available pricing tiers with discount rules:
 * - 5 years registration = pay for 3 years (40% savings)
 * - 3 years registration = pay for 2 years (33% savings)
 * - 1 year registration = pay for 1 year (standard)
 */
export const PRICING_TIERS: PricingTier[] = [
  {
    years: 1,
    displayYears: 1,
    savings: "Standard",
  },
  {
    years: 3,
    displayYears: 2,
    savings: "Save 33%",
  },
  {
    years: 5,
    displayYears: 3,
    savings: "Save 40%",
    popular: true,
    recommended: true,
  },
];

/**
 * Calculate the total price for a domain registration
 * @param domainLength - Length of the domain name (without .miden)
 * @param years - Number of years to register
 * @param displayYears - Number of years the user actually pays for (with discount)
 * @returns Total price in USD
 */
export function calculateDomainPrice(
  domainLength: number,
  years: number,
  displayYears: number
): number {
  const pricePerYear = getDomainPricePerYear(domainLength);
  return pricePerYear * displayYears;
}

/**
 * Get pricing tier by years
 */
export function getPricingTier(years: number): PricingTier | undefined {
  return PRICING_TIERS.find(tier => tier.years === years);
}
