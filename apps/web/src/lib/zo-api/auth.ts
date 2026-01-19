// apps/web/src/lib/zo-api/auth.ts
// ZO API authentication functions (phone OTP)

import { zoApiClient, getDeviceCredentials } from './client';
import type {
  ZoAuthOTPRequest,
  ZoAuthOTPVerifyRequest,
  ZoAuthResponse,
  ZoErrorResponse,
} from './types';
import { devLog } from '@/lib/logger';

// Helper to get device credentials (for logging)
async function getOrCreateDeviceCredentials() {
  return await getDeviceCredentials();
}

/**
 * Send OTP to phone number
 * Step 1 of ZO phone authentication
 */
export async function sendOTP(
  countryCode: string,
  phoneNumber: string
): Promise<{ success: boolean; message: string }> {
  const endpoint = '/auth/login/mobile/otp';
  const baseURL = zoApiClient.defaults.baseURL;
  const fullURL = `${baseURL}${endpoint}`;
  const ZO_CLIENT_KEY = process.env.ZO_CLIENT_KEY_WEB || process.env.NEXT_PUBLIC_ZO_CLIENT_KEY_WEB;

  try {
    const payload: ZoAuthOTPRequest = {
      mobile_country_code: countryCode,
      mobile_number: phoneNumber,
      message_channel: '', // Empty string as per ZO API spec
    };

    // Get device credentials for logging (server-side safe)
    let deviceId: string | undefined;
    let deviceSecret: string | undefined;
    try {
      const creds = await getOrCreateDeviceCredentials();
      deviceId = creds.deviceId;
      deviceSecret = creds.deviceSecret;
    } catch (credError) {
      devLog.warn('⚠️ Failed to get device credentials for logging:', credError);
      // Continue anyway - credentials are set by interceptor
    }

    // Log request details only in development
    if (process.env.NODE_ENV === 'development') {
      devLog.log('📤 ZO API Request:', {
        endpoint,
        fullURL,
        payload: JSON.stringify(payload),
      });
    }

    // Make request - headers are set by interceptor (client-key, client-device-id, client-device-secret)
    const response = await zoApiClient.post(
      endpoint,
      payload
    );

    // Check if response indicates success (2xx status codes)
    if (response.status >= 200 && response.status < 300) {
      // Success - log only in development
      if (process.env.NODE_ENV === 'development') {
        devLog.log('✅ ZO API Response:', {
          status: response.status,
          data: response.data,
        });
      }

      return {
        success: true,
        message: response.data?.message || response.data?.success || 'OTP sent successfully',
      };
    }

    // If status is not 2xx, treat as error
    devLog.error('❌ ZO API returned non-2xx status:', response.status);
    return {
      success: false,
      message: response.data?.message || response.data?.error || `Unexpected status: ${response.status}`,
    };
  } catch (error: any) {
    // Only log errors in development
    if (process.env.NODE_ENV === 'development') {
      devLog.error('❌ ZO API Error:', {
        status: error.response?.status,
        message: error.message,
        data: error.response?.data,
      });
    }

    const errorData = error.response?.data as ZoErrorResponse;
    const errorMessage = errorData?.detail || errorData?.message || errorData?.error || error.message || 'Failed to send OTP';

    return {
      success: false,
      message: errorMessage,
    };
  }
}

/**
 * Verify OTP and authenticate user
 * Step 2 of ZO phone authentication
 * Returns full auth response with tokens and user profile
 */
export async function verifyOTP(
  countryCode: string,
  phoneNumber: string,
  otp: string
): Promise<{
  success: boolean;
  data?: ZoAuthResponse;
  error?: string;
}> {
  try {
    const payload: ZoAuthOTPVerifyRequest = {
      mobile_country_code: countryCode,
      mobile_number: phoneNumber,
      otp,
    };

    const response = await zoApiClient.post(
      '/auth/login/mobile',
      payload
    );

    // Parse response data if it's a string (axios sometimes returns strings)
    let rawData: any;
    if (typeof response.data === 'string') {
      try {
        rawData = JSON.parse(response.data);
        devLog.log('✅ Parsed string response to JSON');
      } catch (parseError) {
        devLog.error('❌ Failed to parse response data:', parseError);
        return {
          success: false,
          error: 'Invalid response format from authentication service',
        };
      }
    } else {
      rawData = response.data;
    }

    // Handle proxy API wrapper: { success: true, data: {...} }
    // The proxy API wraps responses in this format
    let responseData: ZoAuthResponse;
    if (rawData?.data && (rawData.success === true || rawData.success === undefined)) {
      responseData = rawData.data as ZoAuthResponse;
      devLog.log('✅ Unwrapped proxy API response (found data wrapper)');
    } else {
      responseData = rawData as ZoAuthResponse;
    }

    // Log the response for debugging
    devLog.log('✅ ZO API Verify OTP Response (parsed):', {
      status: response.status,
      hasUser: !!responseData?.user,
      hasAccessToken: !!responseData?.access_token,
      hasRefreshToken: !!responseData?.refresh_token,
      hasDeviceId: !!responseData?.device_id,
      hasDeviceSecret: !!responseData?.device_secret,
    });

    // Validate response structure - check for required fields
    // Actual ZO API response has: access_token, refresh_token, user, device_id, device_secret at root level
    if (!responseData) {
      devLog.error('❌ No data in response:', response);
      return {
        success: false,
        error: 'No data in response from authentication service',
      };
    }

    // Check if response has user and access_token (required fields)
    if (!responseData.user || !responseData.access_token) {
      devLog.error('❌ Missing required fields in response:', {
        hasUser: !!responseData.user,
        hasAccessToken: !!responseData.access_token,
        hasRefreshToken: !!responseData.refresh_token,
        hasDeviceId: !!responseData.device_id,
        hasDeviceSecret: !!responseData.device_secret,
        data: responseData,
      });
      return {
        success: false,
        error: 'Invalid response structure from authentication service',
      };
    }

    // device_id and device_secret are returned in the response
    if (!responseData.device_id || !responseData.device_secret) {
      devLog.warn('⚠️ Device credentials not in response, will need to handle this');
    }

    return {
      success: true,
      data: responseData,
    };
  } catch (error: any) {
    devLog.error('❌ Failed to verify OTP:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });

    // ZO API can return errors in different formats
    const errorData = error.response?.data;
    let errorMessage = 'Invalid OTP';

    if (errorData) {
      // Format 1: { success: false, errors: [...] }
      if (errorData.errors && Array.isArray(errorData.errors)) {
        errorMessage = errorData.errors[0] || 'Invalid OTP';
      }
      // Format 2: { detail: "...", message: "..." }
      else if (errorData.detail) {
        errorMessage = errorData.detail;
      }
      else if (errorData.message) {
        errorMessage = errorData.message;
      }
      // Format 3: { error: "..." }
      else if (errorData.error) {
        errorMessage = errorData.error;
      }
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Refresh access token using refresh token
 * Called automatically when access token expires
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<{
  success: boolean;
  tokens?: {
    access: string;
    refresh: string;
    access_expiry: string;
    refresh_expiry: string;
  };
  error?: string;
}> {
  try {
    const response = await zoApiClient.post('/auth/login/refresh', {
      refresh_token: refreshToken,
    });

    return {
      success: true,
      tokens: response.data,
    };
  } catch (error: any) {
    devLog.error('Failed to refresh token:', error.response?.data || error);

    return {
      success: false,
      error: 'Failed to refresh authentication',
    };
  }
}

/**
 * Check if user is authenticated with ZO
 * Validates the access token
 */
export async function checkLoginStatus(
  accessToken: string
): Promise<{
  success: boolean;
  isAuthenticated: boolean;
}> {
  try {
    const response = await zoApiClient.get('/auth/login/check', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return {
      success: true,
      isAuthenticated: response.data.authenticated === true,
    };
  } catch (error) {
    return {
      success: false,
      isAuthenticated: false,
    };
  }
}

