/**
 * Domain metadata CRUD API functions
 */

import type {
  DomainMetadata,
  CreateDomainMetadataRequest,
  ApiResponse,
} from '@/types/api';
import { API_BASE } from '@/shared';

/**
 * Create domain metadata
 * @param request - Domain metadata with signature authentication
 * @returns Created domain metadata
 */
export async function createDomainMetadata(
  request: CreateDomainMetadataRequest
): Promise<ApiResponse<DomainMetadata>> {
  if (!request.domain || !request.account_id || !request.bech32) {
    return {
      success: false,
      error: 'domain, account_id, and bech32 are required',
    };
  }

  try {
    const response = await fetch(`${API_BASE}/metadata/domains`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`,
      };
    }

    const data: DomainMetadata = await response.json();
    return {
      success: true,
      data,
      message: 'Domain metadata created successfully',
    };
  } catch (error) {
    console.error('Failed to create domain metadata:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
