/**
 * Account lookup and resolution API functions
 */

import type {
  AccountToDomainResponse,
  AccountToAllDomainsResponse,
  BatchAccountToDomainRequest,
  BatchAccountToDomainResponse,
  ApiResponse,
} from '@/types/api';
import { API_BASE } from '@/shared/constants';

/**
 * Get active domain for an account
 * @param identifier - Account ID (hex) or bech32 address
 * @returns Active domain information
 */
export async function getAccountActiveDomain(
  identifier: string
): Promise<ApiResponse<AccountToDomainResponse>> {
  if (!identifier) {
    return {
      success: false,
      error: 'Account identifier is required',
    };
  }

  try {
    const response = await fetch(
      `${API_BASE}/accounts/${encodeURIComponent(identifier)}`,
      { credentials: 'include' }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`,
      };
    }

    const data: AccountToDomainResponse = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Failed to get account active domain:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get all domains for an account
 * @param identifier - Account ID (hex) or bech32 address
 * @returns All domains owned by the account
 */
export async function getAccountAllDomains(
  identifier: string
): Promise<ApiResponse<AccountToAllDomainsResponse>> {
  if (!identifier) {
    return {
      success: false,
      error: 'Account identifier is required',
    };
  }

  try {
    const response = await fetch(
      `${API_BASE}/accounts/${encodeURIComponent(identifier)}/domains`,
      { credentials: 'include' }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`,
      };
    }

    const data: AccountToAllDomainsResponse = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Failed to get all account domains:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Batch lookup primary domains for multiple accounts
 * @param accountIds - Array of account IDs to lookup
 * @returns Primary domain for each account
 */
export async function batchGetAccountDomains(
  accountIds: string[]
): Promise<ApiResponse<BatchAccountToDomainResponse>> {
  if (!accountIds || accountIds.length === 0) {
    return {
      success: false,
      error: 'At least one account ID is required',
    };
  }

  const payload: BatchAccountToDomainRequest = {
    accounts: accountIds.map(id => ({ account_id: id })),
  };

  try {
    const response = await fetch(`${API_BASE}/accounts/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`,
      };
    }

    const data: BatchAccountToDomainResponse = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Failed to batch get account domains:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
