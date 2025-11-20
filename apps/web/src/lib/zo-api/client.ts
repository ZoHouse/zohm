// apps/web/src/lib/zo-api/client.ts
// ZO API HTTP client configuration

import axios, { AxiosInstance } from 'axios';

const ZO_API_BASE_URL = process.env.ZO_API_BASE_URL || 'https://api.zo.xyz';
const ZO_CLIENT_KEY_WEB = process.env.ZO_CLIENT_KEY_WEB || process.env.NEXT_PUBLIC_ZO_CLIENT_KEY_WEB;

// Create axios instance for ZO API
export const zoApiClient: AxiosInstance = axios.create({
  baseURL: ZO_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add HTTP_CLIENT_KEY to all requests
zoApiClient.interceptors.request.use((config) => {
  if (ZO_CLIENT_KEY_WEB) {
    config.headers['HTTP_CLIENT_KEY'] = ZO_CLIENT_KEY_WEB;
  }
  return config;
});

// Helper to get authenticated request headers
export function getZoAuthHeaders(accessToken: string) {
  return {
    'HTTP_CLIENT_KEY': ZO_CLIENT_KEY_WEB,
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
}

// Helper to get device-specific headers (if needed)
export function getZoDeviceHeaders(deviceId?: string, deviceSecret?: string) {
  const headers: Record<string, string> = {
    'HTTP_CLIENT_KEY': ZO_CLIENT_KEY_WEB!,
  };
  
  if (deviceId) headers['X-Device-ID'] = deviceId;
  if (deviceSecret) headers['X-Device-Secret'] = deviceSecret;
  
  return headers;
}

