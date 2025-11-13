/**
 * API Client for ZOHM
 * 
 * Minimal fetch wrapper that ensures consistent API calls across webapp and mobile.
 * Uses the ApiResponse<T> format defined in API_CONTRACTS.md
 */

import type { ApiResponse } from './types';

export interface ApiClientConfig {
  baseUrl: string;
  authToken?: string;
  headers?: Record<string, string>;
  timeout?: number;
}

export class ApiClient {
  private baseUrl: string;
  private authToken?: string;
  private defaultHeaders: Record<string, string>;
  private timeout: number;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.authToken = config.authToken;
    this.timeout = config.timeout || 30000; // 30 seconds default
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...config.headers,
    };
  }

  /**
   * Update the auth token (e.g., after login)
   */
  setAuthToken(token: string) {
    this.authToken = token;
  }

  /**
   * Clear the auth token (e.g., after logout)
   */
  clearAuthToken() {
    this.authToken = undefined;
  }

  /**
   * Make a GET request
   */
  async get<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      ...options,
      method: 'GET',
    });
  }

  /**
   * Make a POST request
   */
  async post<T>(
    path: string,
    body?: any,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * Make a PUT request
   */
  async put<T>(
    path: string,
    body?: any,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * Make a DELETE request
   */
  async delete<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      ...options,
      method: 'DELETE',
    });
  }

  /**
   * Core request method
   */
  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${path}`;

    // Build headers
    const headers: Record<string, string> = {
      ...this.defaultHeaders,
      ...(options.headers as Record<string, string>),
    };

    // Add auth token if available
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    // Setup timeout controller
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Parse response
      const data = await response.json();

      // API should return ApiResponse<T> format
      if (response.ok) {
        return data as ApiResponse<T>;
      } else {
        // Error response
        return {
          success: false,
          error: data.error || `HTTP ${response.status}: ${response.statusText}`,
          details: data.details,
        };
      }
    } catch (error: any) {
      clearTimeout(timeoutId);

      // Handle network errors, timeouts, etc.
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: `Request timeout after ${this.timeout}ms`,
          details: { url, timeout: this.timeout },
        };
      }

      return {
        success: false,
        error: error.message || 'Network request failed',
        details: { url, originalError: error },
      };
    }
  }
}

/**
 * Simple function-based API client (alternative to class-based)
 */
export function createApiClient(baseUrl: string, authToken?: string) {
  return async function apiFetch<T>(
    path: string,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    const url = `${baseUrl}${path}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options?.headers as Record<string, string>),
    };

    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (response.ok) {
        return data as ApiResponse<T>;
      } else {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}`,
          details: data.details,
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Network error',
      };
    }
  };
}

/**
 * Helper to check if response is successful and extract data
 */
export function unwrapResponse<T>(response: ApiResponse<T>): T {
  if (!response.success || !response.data) {
    throw new Error(response.error || 'API request failed');
  }
  return response.data;
}

/**
 * Helper to safely get data or return default
 */
export function getResponseData<T>(
  response: ApiResponse<T>,
  defaultValue: T
): T {
  if (response.success && response.data !== undefined) {
    return response.data;
  }
  return defaultValue;
}
