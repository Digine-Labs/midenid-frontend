/**
 * Domain resolution API functions
 */

import type {
  ApiResponse,
  DomainAvailabilityResponse,
  RegisterDomainRequest,
  RegisterDomainResponse,
} from '@/types/api';
import { API_BASE } from '@/shared';

/**
 * Check if a domain is available for registration
 * Uses /domains/{domain}/availability endpoint
 * Returns availability status with block number for freshness indication
 * @param domain - Domain name to check (without .miden suffix)
 * @returns DomainAvailabilityResponse with available boolean and block_number
 */
export async function checkDomainAvailability(
  domain: string
): Promise<ApiResponse<DomainAvailabilityResponse>> {
  if (!domain) {
    return {
      success: false,
      error: 'Domain name is required',
    };
  }

  try {
    const response = await fetch(
      `${API_BASE}/domains/${encodeURIComponent(domain)}/availability`
    );

    if (response.ok) {
      const data: DomainAvailabilityResponse = await response.json();
      return {
        success: true,
        data,
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

/**
 * Prepare domain registration transaction
 * Backend builds the full Note and returns a serialized TransactionRequest
 * @param domain - Domain name to register (without .miden suffix)
 * @param noteInputsHex - Hex-encoded note inputs (8 Felts as little-endian bytes)
 * @returns TransactionRequest hex string to send to wallet
 */
export async function registerDomain(
  domain: string,
  noteInputsHex: string
): Promise<ApiResponse<RegisterDomainResponse>> {
  if (!domain) {
    return {
      success: false,
      error: 'Domain name is required',
    };
  }

  if (!noteInputsHex) {
    return {
      success: false,
      error: 'Note inputs are required',
    };
  }

  try {
    const request: RegisterDomainRequest = {
      note_inputs_hex: noteInputsHex,
    };

    const response = await fetch(
      `${API_BASE}/domains/${encodeURIComponent(domain)}/register`,
      {
        method: 'POST',
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

    const data: RegisterDomainResponse = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Failed to register domain:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
