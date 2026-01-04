/**
 * Authentication API functions for session cookie management
 */

import type { ApiResponse } from '@/types/api';
import { API_BASE } from '@/shared/constants';

export interface AuthVerifyRequest {
  message_hex: string;
  pubkey_hex: string;
  signature_hex: string;
  account_id: string;
}

export interface AuthVerifyResponse {
  success: boolean;
  message?: string;
}

/**
 * Authenticate with backend using wallet signature
 * Establishes a session cookie for subsequent API calls
 * @param request - The signed authentication request
 * @returns API response with success/error
 */
export async function login(request: AuthVerifyRequest): Promise<ApiResponse<AuthVerifyResponse>> {
  try {
    const response = await fetch(`${API_BASE}/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(request),
    });

    const text = await response.text();
    let data: { success?: boolean; message?: string; error?: string } = {};

    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text };
      }
    }

    if (response.ok) {
      return {
        success: true,
        data: {
          success: true,
          message: data.message || 'Authentication successful',
        },
      };
    } else {
      return {
        success: false,
        error: data.error || data.message || `HTTP ${response.status}`,
      };
    }
  } catch (error) {
    console.error('Login failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Logout and invalidate session cookie
 * @returns API response with success/error
 */
export async function logout(): Promise<ApiResponse<void>> {
  try {
    const response = await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });

    if (response.ok) {
      return {
        success: true,
        message: 'Logged out successfully',
      };
    } else {
      const text = await response.text();
      return {
        success: false,
        error: text || `HTTP ${response.status}`,
      };
    }
  } catch (error) {
    console.error('Logout failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
