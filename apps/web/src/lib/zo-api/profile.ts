// apps/web/src/lib/zo-api/profile.ts
// ZO API profile functions

import { zoApiClient, getZoAuthHeaders } from './client';
import type { ZoProfileResponse, ZoProfileUpdatePayload, ZoErrorResponse } from './types';

/**
 * Fetch user profile from ZO API
 * Requires valid access token
 */
export async function getProfile(
  accessToken: string
): Promise<{
  success: boolean;
  profile?: ZoProfileResponse;
  error?: string;
}> {
  try {
    const response = await zoApiClient.get<ZoProfileResponse>(
      '/api/v1/profile/me/',
      {
        headers: getZoAuthHeaders(accessToken),
      }
    );

    return {
      success: true,
      profile: response.data,
    };
  } catch (error: any) {
    console.error('Failed to fetch profile:', error.response?.data || error);
    
    const errorData = error.response?.data as ZoErrorResponse;
    return {
      success: false,
      error: errorData?.detail || errorData?.message || 'Failed to fetch profile',
    };
  }
}

/**
 * Update user profile on ZO API
 * Partial updates supported
 */
export async function updateProfile(
  accessToken: string,
  updates: ZoProfileUpdatePayload
): Promise<{
  success: boolean;
  profile?: ZoProfileResponse;
  error?: string;
}> {
  try {
    const response = await zoApiClient.patch<ZoProfileResponse>(
      '/api/v1/profile/me/',
      updates,
      {
        headers: getZoAuthHeaders(accessToken),
      }
    );

    return {
      success: true,
      profile: response.data,
    };
  } catch (error: any) {
    console.error('Failed to update profile:', error.response?.data || error);
    
    const errorData = error.response?.data as ZoErrorResponse;
    return {
      success: false,
      error: errorData?.detail || errorData?.message || 'Failed to update profile',
    };
  }
}

