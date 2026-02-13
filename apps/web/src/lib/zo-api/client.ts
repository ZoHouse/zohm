// apps/web/src/lib/zo-api/client.ts
// ZO API HTTP client configuration - Uses ZOHM proxy API

import axios, { AxiosInstance } from 'axios';
import { devLog } from '@/lib/logger';

// Base URL: Always use ZOHM proxy API (never call api.io.zo.xyz directly)
const ZO_API_BASE_URL = process.env.ZOHM_API_BASE_URL || process.env.ZO_API_BASE_URL || 'https://zohm-api.up.railway.app/api/v1';
const ZO_CLIENT_KEY_WEB = process.env.ZO_CLIENT_KEY_WEB || process.env.NEXT_PUBLIC_ZO_CLIENT_KEY_WEB;

/**
 * Generate new device credentials
 */
function generateDeviceCredentials(): { deviceId: string; deviceSecret: string } {
  const deviceId = `web-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const deviceSecret = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  return { deviceId, deviceSecret };
}

/**
 * Get or create device credentials
 * Priority: Database (if user logged in) > localStorage > Generate new
 */
async function getOrCreateDeviceCredentials(userId?: string): Promise<{ deviceId: string; deviceSecret: string }> {
  // Server-side: Try to fetch from database first (if userId provided)
  // If not found, generate temporary credentials
  if (typeof window === 'undefined') {
    if (userId) {
      try {
        const { supabase } = await import('@/lib/supabase');
        const { data } = await supabase
          .from('users')
          .select('zo_device_id, zo_device_secret')
          .eq('id', userId)
          .single();

        if (data?.zo_device_id && data?.zo_device_secret) {
          return {
            deviceId: data.zo_device_id,
            deviceSecret: data.zo_device_secret,
          };
        }
      } catch (error) {
        devLog.warn('⚠️ Failed to fetch device credentials from database:', error);
      }
    }
    // Fallback: generate temporary credentials for server-side
    return generateDeviceCredentials();
  }

  // Client-side: Try to fetch from database if userId provided
  if (userId) {
    try {
      const { supabase } = await import('@/lib/supabase');
      const { data } = await supabase
        .from('users')
        .select('zo_device_id, zo_device_secret')
        .eq('id', userId)
        .single();

      if (data?.zo_device_id && data?.zo_device_secret) {
        return {
          deviceId: data.zo_device_id,
          deviceSecret: data.zo_device_secret,
        };
      }
    } catch (error) {
      devLog.warn('Failed to fetch device credentials from database:', error);
    }
  }

  // Priority 1: Check individual localStorage keys (set by PhoneLoginModal)
  const deviceId = localStorage.getItem('zo_device_id');
  const deviceSecret = localStorage.getItem('zo_device_secret');
  if (deviceId && deviceSecret) {
    devLog.log('🔑 Using device credentials from localStorage (zo_device_id/zo_device_secret)');
    return { deviceId, deviceSecret };
  }

  // Priority 2: Check legacy JSON object key
  const storageKey = 'zo_device_credentials';
  const stored = localStorage.getItem(storageKey);

  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed.deviceId && parsed.deviceSecret) {
        return parsed;
      }
    } catch (e) {
      devLog.warn('Failed to parse stored device credentials');
    }
  }

  // Generate new credentials
  const credentials = generateDeviceCredentials();
  localStorage.setItem(storageKey, JSON.stringify(credentials));

  return credentials;
}

// Validate configuration (only in development)
if (!ZO_CLIENT_KEY_WEB && process.env.NODE_ENV === 'development') {
  devLog.error('⚠️ ZO_CLIENT_KEY_WEB is not set! Phone auth will fail.');
}

// Create axios instance for ZO API
export const zoApiClient: AxiosInstance = axios.create({
  baseURL: ZO_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add required headers to all requests
// IMPORTANT: These 3 headers must be sent with EVERY request (as per ZO API spec):
// 1. client-key: Platform-specific API key
// 2. client-device-id: Randomly generated device identifier (per session)
// 3. client-device-secret: Randomly generated device secret (per session)
// 
// Note: Device credentials are generated randomly per session and sent with each request.
// The API may return device credentials in verifyOTP response, which we store for future use.
zoApiClient.interceptors.request.use(async (config) => {
  if (ZO_CLIENT_KEY_WEB) {
    config.headers['client-key'] = ZO_CLIENT_KEY_WEB;
  } else {
    devLog.warn('⚠️ client-key header not set - request may fail');
  }

  // Check if device credentials are already set in headers (from getZoAuthHeaders)
  // If not, check if they're in config.metadata (passed explicitly)
  // Otherwise, fetch/generate them
  if (!config.headers['client-device-id'] || !config.headers['client-device-secret']) {
    const metadata = (config as any).metadata || {};

    // Priority 1: Use device credentials from metadata (explicitly passed)
    if (metadata.deviceId && metadata.deviceSecret) {
      config.headers['client-device-id'] = metadata.deviceId;
      config.headers['client-device-secret'] = metadata.deviceSecret;
      if (process.env.NODE_ENV === 'development') {
        devLog.log('🔍 Interceptor: Using device credentials from metadata');
      }
    } else {
      // Priority 2: Fetch from database or generate new
      const userId = metadata.userId;
      const { deviceId, deviceSecret } = await getOrCreateDeviceCredentials(userId);
      config.headers['client-device-id'] = deviceId;
      config.headers['client-device-secret'] = deviceSecret;
      if (process.env.NODE_ENV === 'development') {
        devLog.log('🔍 Interceptor: Fetched/generated device credentials');
      }
    }
  } else {
    // Headers already set - don't override (they came from getZoAuthHeaders)
    if (process.env.NODE_ENV === 'development') {
      devLog.log('🔍 Interceptor: Device credentials already in headers, not overriding');
    }
  }

  // Note: Platform header is NOT in the official curl command, so we don't send it
  // config.headers['Platform'] = 'web'; // Removed - not in official API spec

  return config;
});

// Flag to prevent multiple session expired events from being dispatched
// (multiple API calls may fail with 403 simultaneously)
let sessionExpiredHandled = false;

// Reset the flag when tokens are set (user logs in again)
export function resetSessionExpiredFlag() {
  sessionExpiredHandled = false;
}

// Response interceptor: Handle 403 "Session expired" errors
// This triggers logout/refresh flow when token expires
zoApiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const errorDetail = error.response?.data?.detail;

    // Check for session expired error
    if (status === 403 && errorDetail === 'Session expired.') {
      devLog.warn('🔐 Session expired! Token needs refresh or re-login.');

      // Only handle session expiry once (prevent multiple alerts from parallel API calls)
      if (sessionExpiredHandled) {
        devLog.log('⏭️ Session expiry already handled, skipping duplicate');
        return Promise.reject(error);
      }
      sessionExpiredHandled = true;

      // Dispatch event for frontend to handle (logout, show login modal, etc.)
      if (typeof window !== 'undefined') {
        devLog.log('📢 Dispatching zoSessionExpired event');
        window.dispatchEvent(new CustomEvent('zoSessionExpired', {
          detail: {
            message: 'Your session has expired. Please login again.',
            status: 403,
          }
        }));

        // Clear expired tokens from localStorage to force re-login
        localStorage.removeItem('zo_access_token');
        localStorage.removeItem('zo_token');
        devLog.log('🗑️ Cleared expired tokens from localStorage');
      }
    }

    return Promise.reject(error);
  }
);

// Helper to get authenticated request headers
export async function getZoAuthHeaders(
  accessToken: string,
  userId?: string,
  deviceCredentials?: { deviceId: string; deviceSecret: string }
) {
  // Use provided device credentials if available (from verify-otp response)
  // Otherwise, fetch from database or generate new
  let deviceId: string;
  let deviceSecret: string;

  if (deviceCredentials) {
    deviceId = deviceCredentials.deviceId;
    deviceSecret = deviceCredentials.deviceSecret;
  } else {
    const creds = await getOrCreateDeviceCredentials(userId);
    deviceId = creds.deviceId;
    deviceSecret = creds.deviceSecret;
  }

  return {
    'client-key': ZO_CLIENT_KEY_WEB!,
    'client-device-id': deviceId,
    'client-device-secret': deviceSecret,
    // Note: Platform header removed - not in official API spec
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
}

// Helper to get device credentials (for storage in Supabase)
export async function getDeviceCredentials(userId?: string) {
  return await getOrCreateDeviceCredentials(userId);
}

/**
 * Update device credentials (called after API returns them)
 * Stores in both database (if userId provided) and localStorage
 */
export async function updateDeviceCredentials(
  deviceId: string,
  deviceSecret: string,
  userId?: string
): Promise<void> {
  // Update localStorage (for immediate use)
  if (typeof window !== 'undefined') {
    const storageKey = 'zo_device_credentials';
    localStorage.setItem(storageKey, JSON.stringify({ deviceId, deviceSecret }));
  }

  // Update database (if userId provided)
  if (userId) {
    try {
      // Use supabaseAdmin for writes (anon client blocked by RLS)
      const { supabaseAdmin } = await import('@/lib/supabaseAdmin');
      const dbClient = supabaseAdmin || (await import('@/lib/supabase')).supabase;
      await dbClient
        .from('users')
        .update({
          zo_device_id: deviceId,
          zo_device_secret: deviceSecret,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
    } catch (error) {
      devLog.warn('Failed to update device credentials in database:', error);
    }
  }
}

// Helper to set userId in request metadata (for database lookup)
export function setRequestUserId(config: any, userId: string) {
  if (!config.metadata) config.metadata = {};
  config.metadata.userId = userId;
  return config;
}

