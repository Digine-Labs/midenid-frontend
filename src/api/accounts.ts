/**
 * Account lookup and resolution API functions
 */

import type {
  AccountToAllDomainsResponse,
  MidenBalanceResponse,
  ApiResponse,
} from '@/types/api';
import { API_BASE } from '@/shared';

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
      `${API_BASE}/accounts/${encodeURIComponent(identifier)}/domains`
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
 * Get MIDEN balance for an account
 * @param accountId - Account ID in hex format (e.g., "0xbcf3703152589f40689336e42bfbef")
 * @returns Account's MIDEN balance
 */
export async function getMidenBalance(
  accountId: string
): Promise<ApiResponse<MidenBalanceResponse>> {
  if (!accountId) {
    return {
      success: false,
      error: 'Account ID is required',
    };
  }

  try {
    const response = await fetch(
      `${API_BASE}/miden/miden_balance?accountId=${encodeURIComponent(accountId)}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`,
      };
    }

    const data: MidenBalanceResponse = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Failed to get MIDEN balance:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}