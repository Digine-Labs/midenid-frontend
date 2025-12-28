/**
 * Miden blockchain API functions
 */

import type { BlockNumberResponse, ApiResponse } from './types';
import { API_BASE } from '@/shared/constants';

/**
 * Get current block number from Miden network
 * @returns Current block number
 */
export async function getBlockNumber(): Promise<ApiResponse<BlockNumberResponse>> {
  try {
    const response = await fetch(`${API_BASE}/miden/block_number`, {
      credentials: 'include',
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`,
      };
    }

    const data: BlockNumberResponse = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Failed to get block number:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
