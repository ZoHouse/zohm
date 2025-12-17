// apps/web/src/lib/zo-api/profile.ts
// ZO API profile functions

import { zoApiClient, getZoAuthHeaders } from './client';
import type { ZoProfileResponse, ZoProfileUpdatePayload, ZoErrorResponse } from './types';
import { devLog } from '@/lib/logger';

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

    // 🔍 DEBUG: Log headers being sent (excluding secrets)
    if (process.env.NODE_ENV === 'development') {
      devLog.log('🔐 [getProfile] Request headers:', {
        hasClientKey: !!headers['client-key'],
        clientKeyPreview: headers['client-key']?.substring(0, 8) + '...',
        hasDeviceId: !!headers['client-device-id'],
        deviceIdPreview: headers['client-device-id']?.substring(0, 15) + '...',
        hasDeviceSecret: !!headers['client-device-secret'],
        hasAuth: !!headers['Authorization'],
        tokenPreview: headers['Authorization']?.substring(0, 20) + '...',
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
    devLog.error('❌ getProfile error details:', {
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
    devLog.log('📞 [updateProfile] Starting API call...', {
      endpoint: '/api/v1/profile/me/',
      method: 'POST',
      updates: JSON.stringify(updates),
      hasAccessToken: !!accessToken,
      hasUserId: !!userId,
      hasDeviceCredentials: !!deviceCredentials,
    });

    const headers = await getZoAuthHeaders(accessToken, userId, deviceCredentials);

    // Log device credentials being used (for debugging)
    devLog.log('🔍 [updateProfile] Using device credentials:', {
      deviceId: headers['client-device-id'] || 'MISSING',
      deviceSecret: headers['client-device-secret'] ? headers['client-device-secret'].substring(0, 10) + '...' : 'MISSING',
      hasClientKey: !!headers['client-key'],
      hasAuth: !!headers['Authorization'],
      fromAuthData: !!deviceCredentials,
    });

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

    devLog.log('📡 [updateProfile] Making POST request to ZO API...');
    const apiStartTime = Date.now();

    const response = await zoApiClient.post<ZoProfileResponse>(
      '/api/v1/profile/me/',
      updates,
      config
    );

    const apiDuration = Date.now() - apiStartTime;
    devLog.log(`✅ [updateProfile] API call succeeded in ${apiDuration}ms`, {
      status: response.status,
      hasData: !!response.data,
      hasAvatar: !!response.data?.avatar,
      avatarStatus: response.data?.avatar?.status || 'unknown',
      avatarImage: response.data?.avatar?.image ? 'EXISTS' : 'NULL',
    });

    return {
      success: true,
      profile: response.data,
    };
  } catch (error: any) {
    devLog.error('❌ [updateProfile] API call failed:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      hasResponse: !!error.response,
      isNetworkError: !error.response,
      fullError: error,
    });

    const errorData = error.response?.data as ZoErrorResponse;
    return {
      success: false,
      error: errorData?.detail || errorData?.message || error.message || 'Failed to update profile',
    };
  }
}

