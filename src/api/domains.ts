/**
 * Domain resolution API functions
 */

import type {
  EnrichedDomainResponse,
  ApiResponse,
} from './types';
import { API_BASE } from '@/shared/constants';

/**
 * Get enriched domain information including metadata and profile
 * @param domain - Domain name to lookup (without .miden suffix)
 * @returns Enriched domain data with metadata and profile
 */
export async function getDomainEnriched(
  domain: string
): Promise<ApiResponse<EnrichedDomainResponse>> {
  if (!domain) {
    return {
      success: false,
      error: 'Domain name is required',
    };
  }

  try {
    const response = await fetch(
      `${API_BASE}/metadata/domains/${encodeURIComponent(domain)}/enriched`
    );

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`,
      };
    }

    const data: EnrichedDomainResponse = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Failed to fetch enriched domain:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Resolve domain to account ID
 * @param domain - Domain name to resolve
 * @returns Account ID and bech32 address
 */
export async function resolveDomain(
  domain: string
): Promise<ApiResponse<{ account_id: string; bech32: string }>> {
  if (!domain) {
    return {
      success: false,
      error: 'Domain name is required',
    };
  }

  try {
    const response = await fetch(
      `${API_BASE}/domains/${encodeURIComponent(domain)}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Failed to resolve domain:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
