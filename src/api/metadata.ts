/**
 * Domain metadata CRUD API functions
 */

import type {
  DomainMetadata,
  CreateDomainMetadataRequest,
  UpdateDomainMetadataRequest,
  ApiResponse,
} from '@/types/api';
import { API_BASE } from '@/shared/constants';

/**
 * Get domain metadata
 * @param domain - Domain name
 * @returns Domain metadata from database
 */
export async function getDomainMetadata(
  domain: string
): Promise<ApiResponse<DomainMetadata>> {
  if (!domain) {
    return {
      success: false,
      error: 'Domain name is required',
    };
  }

  try {
    const response = await fetch(
      `${API_BASE}/metadata/domains/${encodeURIComponent(domain)}`
    );

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
    };
  } catch (error) {
    console.error('Failed to get domain metadata:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Create domain metadata (requires signature authentication)
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

/**
 * Update domain metadata
 * @param domain - Domain name
 * @param request - Updated metadata fields
 * @returns Updated domain metadata
 */
export async function updateDomainMetadata(
  domain: string,
  request: UpdateDomainMetadataRequest
): Promise<ApiResponse<DomainMetadata>> {
  if (!domain) {
    return {
      success: false,
      error: 'Domain name is required',
    };
  }

  try {
    const response = await fetch(
      `${API_BASE}/metadata/domains/${encodeURIComponent(domain)}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      }
    );

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
      message: 'Domain metadata updated successfully',
    };
  } catch (error) {
    console.error('Failed to update domain metadata:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Delete domain metadata
 * @param domain - Domain name
 * @returns Success status
 */
export async function deleteDomainMetadata(
  domain: string
): Promise<ApiResponse<void>> {
  if (!domain) {
    return {
      success: false,
      error: 'Domain name is required',
    };
  }

  try {
    const response = await fetch(
      `${API_BASE}/metadata/domains/${encodeURIComponent(domain)}`,
      {
        method: 'DELETE',
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`,
      };
    }

    return {
      success: true,
      message: 'Domain metadata deleted successfully',
    };
  } catch (error) {
    console.error('Failed to delete domain metadata:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
