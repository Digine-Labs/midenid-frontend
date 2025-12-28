/**
 * Authentication API functions
 * Handles session-based authentication with the backend
 */

import type { ApiResponse } from './types';
import { API_BASE } from '@/shared/constants';

export interface AuthVerifyRequest {
  message_hex: string;
  pubkey_hex: string;
  signature_hex: string;
}

export interface AuthVerifyResponse {
  valid: boolean;
  message?: string | null;
}

/**
 * Verify wallet signature and establish session
 * On success, backend sets httpOnly cookie for subsequent requests
 * @param request - Signature authentication data
 * @returns Success status with optional message
 */
export async function login(
  request: AuthVerifyRequest
): Promise<ApiResponse<AuthVerifyResponse>> {
  try {
    const response = await fetch(`${API_BASE}/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`,
      };
    }

    const data: AuthVerifyResponse = await response.json();
    return {
      success: data.valid,
      data,
      message: data.message || undefined,
    };
  } catch (error) {
    console.error('Failed to verify authentication:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Logout and clear session
 * Backend will invalidate session and clear cookie
 */
export async function logout(): Promise<ApiResponse<void>> {
  try {
    const response = await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`,
      };
    }

    return {
      success: true,
      message: 'Logged out successfully',
    };
  } catch (error) {
    console.error('Failed to logout:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
