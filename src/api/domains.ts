/**
 * Domain resolution API functions
 */

import type {
  EnrichedDomainResponse,
  ApiResponse,
} from '@/types/api';
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
      `${API_BASE}/metadata/domains/${encodeURIComponent(domain)}/enriched`,
      { credentials: 'include' }
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
      `${API_BASE}/domains/${encodeURIComponent(domain)}`,
      { credentials: 'include' }
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

/**
 * Check if a domain is available for registration
 * @param domain - Domain name to check
 * @returns Object with available boolean (true = domain is available, false = already taken)
 */
export async function checkDomainAvailability(
  domain: string
): Promise<ApiResponse<{ available: boolean }>> {
  if (!domain) {
    return {
      success: false,
      error: 'Domain name is required',
    };
  }

  try {
    const response = await fetch(
      `${API_BASE}/domains/${encodeURIComponent(domain)}`,
      { credentials: 'include' }
    );

    if (response.status === 404) {
      // 404 = Domain not found = Available for registration
      return {
        success: true,
        data: { available: true },
      };
    }

    if (response.ok) {
      // 200 = Domain found = Already taken
      return {
        success: true,
        data: { available: false },
      };
    }

    // Other errors (500, 400, etc.)
    const errorText = await response.text();
    return {
      success: false,
      error: `HTTP ${response.status}: ${errorText}`,
    };
  } catch (error) {
    console.error('Failed to check domain availability:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
