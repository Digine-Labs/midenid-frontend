/**
 * Profile management API functions
 */

import type {
  Profile,
  UpsertProfileRequest,
  ApiResponse,
} from './types';
import { API_BASE } from '@/shared/constants';

// Re-export types for backward compatibility
export type ProfileData = Omit<Profile, 'id' | 'domain_id' | 'created_block' | 'updated_block'>;
export type ProfilePayload = UpsertProfileRequest;

/**
 * Fetch existing profile for a domain
 * @param domain - The domain name to fetch profile for
 * @returns ProfileData or null if not found
 */
export async function fetchProfile(domain: string): Promise<ProfileData | null> {
  if (!domain) {
    throw new Error("Domain name is required");
  }

  try {
    const response = await fetch(
      `${API_BASE}/metadata/domains/${encodeURIComponent(domain)}/profile`
    );

    if (response.ok) {
      const data: ProfileData = await response.json();
      return data;
    } else if (response.status === 404) {
      // No profile exists yet
      return null;
    } else {
      throw new Error(`Failed to fetch profile: HTTP ${response.status}`);
    }
  } catch (error) {
    console.error('Failed to fetch profile:', error);
    throw error;
  }
}

/**
 * Create or update a profile
 * @param domain - The domain name
 * @param payload - The profile payload with signature
 * @returns API response with success/error message
 */
export async function saveProfile(
  domain: string,
  payload: ProfilePayload
): Promise<ApiResponse> {
  if (!domain) {
    throw new Error("Domain name is required");
  }

  const apiUrl = `${API_BASE}/metadata/domains/${encodeURIComponent(domain)}/profile`;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const text = await response.text();
    let result: { error?: string; message?: string } = {};

    if (text) {
      try {
        result = JSON.parse(text);
      } catch {
        if (response.ok) {
          result = { message: text || "Success" };
        } else {
          result = { error: text || `HTTP ${response.status}` };
        }
      }
    }

    if (response.ok) {
      return {
        success: true,
        message: result.message || "Profile saved successfully",
      };
    } else {
      const errorMsg = result.error || result.message || `HTTP ${response.status}`;
      return {
        success: false,
        error: errorMsg,
      };
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: errorMsg,
    };
  }
}

/**
 * Delete a profile
 * @param domain - The domain name
 * @returns API response with success/error message
 */
export async function deleteProfile(domain: string): Promise<ApiResponse<void>> {
  if (!domain) {
    return {
      success: false,
      error: 'Domain name is required',
    };
  }

  try {
    const response = await fetch(
      `${API_BASE}/metadata/domains/${encodeURIComponent(domain)}/profile`,
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
      message: 'Profile deleted successfully',
    };
  } catch (error) {
    console.error('Failed to delete profile:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
