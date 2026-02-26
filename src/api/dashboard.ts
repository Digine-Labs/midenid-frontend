/**
 * Dashboard API service
 * Handles session-based authentication and dashboard data fetching
 */

import type {
  DashboardLoginRequest,
  DashboardLoginResponse,
  DashboardLogoutResponse,
  DashboardData,
  DashboardLimit,
  ResetStoreResponse,
  TelegramStatusResponse,
  TelegramToggleResponse,
  ApiResponse,
} from '@/types/api';
import { DASHBOARD_API_BASE, API_BASE } from '@/shared';

/**
 * Login to the dashboard
 * @param username - Admin username
 * @param password - Admin password
 * @returns Login response with success status
 */
export async function dashboardLogin(
  username: string,
  password: string
): Promise<ApiResponse<DashboardLoginResponse>> {
  if (!username || !password) {
    return {
      success: false,
      error: 'Username and password are required',
    };
  }

  try {
    const response = await fetch(`${DASHBOARD_API_BASE}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ username, password } as DashboardLoginRequest),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || `HTTP ${response.status}`,
      };
    }

    return {
      success: true,
      data: data as DashboardLoginResponse,
    };
  } catch (error) {
    console.error('Dashboard login failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Logout from the dashboard
 * @returns Logout response
 */
export async function dashboardLogout(): Promise<ApiResponse<DashboardLogoutResponse>> {
  try {
    const response = await fetch(`${DASHBOARD_API_BASE}/api/logout`, {
      method: 'POST',
      credentials: 'include',
    });

    const data = await response.json();

    return {
      success: response.ok,
      data: data as DashboardLogoutResponse,
    };
  } catch (error) {
    console.error('Dashboard logout failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get dashboard data
 * @param limit - Number of recent domains to return (10, 25, 50, or 100)
 * @returns Dashboard data including blockchain status, stats, and recent domains
 */
export async function getDashboardData(
  limit: DashboardLimit = 10
): Promise<ApiResponse<DashboardData>> {
  try {
    const response = await fetch(
      `${DASHBOARD_API_BASE}/api/dashboard-data?limit=${limit}`,
      {
        credentials: 'include',
      }
    );

    if (response.status === 401) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || 'Not authenticated',
      };
    }

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`,
      };
    }

    const data: DashboardData = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Failed to get dashboard data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Reset the Miden store
 * @returns Reset store response
 */
export async function resetStore(): Promise<ApiResponse<ResetStoreResponse>> {
  try {
    const response = await fetch(`${API_BASE}/admin/reset-store`, {
      method: 'POST',
    });

    const data: ResetStoreResponse = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || `HTTP ${response.status}`,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Failed to reset store:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get Telegram notifications status
 * @returns Telegram status response
 */
export async function getTelegramStatus(): Promise<ApiResponse<TelegramStatusResponse>> {
  try {
    const response = await fetch(`${API_BASE}/admin/telegram-notifications/status`);

    const data: TelegramStatusResponse = await response.json();

    return {
      success: response.ok,
      data,
    };
  } catch (error) {
    console.error('Failed to get Telegram status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Toggle Telegram notifications
 * @param enable - Whether to enable or disable notifications
 * @returns Toggle response
 */
export async function toggleTelegramNotifications(
  enable: boolean
): Promise<ApiResponse<TelegramToggleResponse>> {
  try {
    const endpoint = enable ? 'enable' : 'disable';
    const response = await fetch(
      `${API_BASE}/admin/telegram-notifications/${endpoint}`,
      { method: 'POST' }
    );

    const data: TelegramToggleResponse = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || `HTTP ${response.status}`,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Failed to toggle Telegram notifications:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
