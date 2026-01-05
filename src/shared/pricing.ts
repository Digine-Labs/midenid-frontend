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

export function getDomainPrice(domainLength: number): number {
  if (domainLength === 1) return DOMAIN_PRICING_USD[1];
  if (domainLength === 2) return DOMAIN_PRICING_USD[2];
  if (domainLength === 3) return DOMAIN_PRICING_USD[3];
  if (domainLength === 4) return DOMAIN_PRICING_USD[4];
  return DOMAIN_PRICING_USD[5]; // 5 or more characters
}