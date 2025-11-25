// apps/web/src/lib/zo-api/profile.ts
// ZO API profile functions

import { zoApiClient, getZoAuthHeaders } from './client';
import type { ZoProfileResponse, ZoProfileUpdatePayload, ZoErrorResponse } from './types';

/**
 * Fetch user profile from ZO API
 * Requires valid access token
 * @param accessToken - ZO API access token
 * @param userId - Optional: Supabase user ID (for fetching device credentials from DB)
 * @param deviceCredentials - Optional: Device credentials from verify-otp response (preferred)
 */
export async function getProfile(
  accessToken: string,
  userId?: string,
  deviceCredentials?: { deviceId: string; deviceSecret: string }
): Promise<{
  success: boolean;
  profile?: ZoProfileResponse;
  error?: string;
}> {
  try {
    const headers = await getZoAuthHeaders(accessToken, userId, deviceCredentials);
    
    // Log device credentials being used (for debugging)
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 getProfile using device credentials:', {
        deviceId: headers['client-device-id'],
        deviceSecret: headers['client-device-secret']?.substring(0, 10) + '...',
        fromAuthData: !!deviceCredentials,
      });
    }
    
    // Pass device credentials in metadata so interceptor can use them if headers aren't set
    const config: any = {
      headers,
      metadata: {
        userId,
        ...(deviceCredentials && {
          deviceId: deviceCredentials.deviceId,
          deviceSecret: deviceCredentials.deviceSecret,
        }),
      },
    };
    
    const response = await zoApiClient.get<ZoProfileResponse>(
      '/api/v1/profile/me/',
      config
    );


    return {
      success: true,
      profile: response.data,
    };
  } catch (error: any) {
    console.error('❌ getProfile error details:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      headers: error.response?.headers,
      hasResponse: !!error.response,
      isNetworkError: !error.response,
    });
    
    const errorData = error.response?.data as ZoErrorResponse;
    return {
      success: false,
      error: errorData?.detail || errorData?.message || error.message || 'Failed to fetch profile',
    };
  }
}

/**
 * Update user profile on ZO API
 * Uses POST method to match mobile app implementation
 * @param accessToken - ZO API access token
 * @param updates - Profile fields to update
 * @param userId - Optional: Supabase user ID (for fetching device credentials from DB)
 * @param deviceCredentials - Optional: Device credentials from verify-otp response (preferred)
 */
export async function updateProfile(
  accessToken: string,
  updates: ZoProfileUpdatePayload,
  userId?: string,
  deviceCredentials?: { deviceId: string; deviceSecret: string }
): Promise<{
  success: boolean;
  profile?: ZoProfileResponse;
  error?: string;
}> {
  try {
    const headers = await getZoAuthHeaders(accessToken, userId, deviceCredentials);
    
    // Log device credentials being used (for debugging)
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 updateProfile using device credentials:', {
        deviceId: headers['client-device-id'],
        deviceSecret: headers['client-device-secret']?.substring(0, 10) + '...',
        fromAuthData: !!deviceCredentials,
      });
    }
    
    // Pass device credentials in metadata so interceptor can use them if headers aren't set
    const config: any = {
      headers,
      metadata: {
        userId,
        ...(deviceCredentials && {
          deviceId: deviceCredentials.deviceId,
          deviceSecret: deviceCredentials.deviceSecret,
        }),
      },
    };
    
    const response = await zoApiClient.post<ZoProfileResponse>(
      '/api/v1/profile/me/',
      updates,
      config
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

