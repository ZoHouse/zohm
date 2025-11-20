// apps/web/src/lib/zo-api/auth.ts
// ZO API authentication functions (phone OTP)

import { zoApiClient } from './client';
import type {
  ZoAuthOTPRequest,
  ZoAuthOTPVerifyRequest,
  ZoAuthResponse,
  ZoErrorResponse,
} from './types';

/**
 * Send OTP to phone number
 * Step 1 of ZO phone authentication
 */
export async function sendOTP(
  countryCode: string,
  phoneNumber: string
): Promise<{ success: boolean; message: string }> {
  try {
    const payload: ZoAuthOTPRequest = {
      mobile_country_code: countryCode,
      mobile_number: phoneNumber,
      message_channel: '', // Empty string as per ZO API spec
    };

    const response = await zoApiClient.post(
      '/api/v1/auth/login/mobile/otp/',
      payload
    );

    return {
      success: true,
      message: response.data.message || 'OTP sent successfully',
    };
  } catch (error: any) {
    console.error('Failed to send OTP:', error.response?.data || error);
    
    const errorData = error.response?.data as ZoErrorResponse;
    return {
      success: false,
      message: errorData?.detail || errorData?.message || 'Failed to send OTP',
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

    const response = await zoApiClient.post<ZoAuthResponse>(
      '/api/v1/auth/login/mobile/otp/verify/',
      payload
    );

    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error('Failed to verify OTP:', error.response?.data || error);
    
    const errorData = error.response?.data as ZoErrorResponse;
    return {
      success: false,
      error: errorData?.detail || errorData?.message || 'Invalid OTP',
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
    const response = await zoApiClient.post('/api/v1/auth/token/refresh/', {
      refresh_token: refreshToken,
    });

    return {
      success: true,
      tokens: response.data,
    };
  } catch (error: any) {
    console.error('Failed to refresh token:', error.response?.data || error);
    
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
    const response = await zoApiClient.get('/api/v1/auth/login/check/', {
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

