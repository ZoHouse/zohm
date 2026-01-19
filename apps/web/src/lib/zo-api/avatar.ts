// apps/web/src/lib/zo-api/avatar.ts
// ZO API avatar generation functions - Uses ZOHM proxy /profile/me endpoint

import { zoApiClient, getZoAuthHeaders } from './client';
import type { ZoErrorResponse } from './types';
import { devLog } from '@/lib/logger';

/**
 * Generate avatar for user by setting body_type
 * Uses PATCH /profile/me endpoint as per Postman collection
 * Requires authenticated ZO user
 */
export async function generateAvatar(
  accessToken: string,
  bodyType: 'bro' | 'bae'
): Promise<{
  success: boolean;
  profile?: any;
  avatarUrl?: string;
  error?: string;
}> {
  try {
    const headers = await getZoAuthHeaders(accessToken);

    // Use PATCH /profile/me to set body_type and trigger avatar generation
    const response = await zoApiClient.patch(
      '/profile/me',
      { body_type: bodyType },
      { headers }
    );

    const profile = response.data?.data || response.data;
    const avatarUrl = profile?.avatar?.image;

    return {
      success: true,
      profile,
      avatarUrl: avatarUrl && avatarUrl.trim() !== '' ? avatarUrl : undefined,
    };
  } catch (error: any) {
    devLog.error('Failed to generate avatar:', error.response?.data || error);

    const errorData = error.response?.data as ZoErrorResponse;
    return {
      success: false,
      error: errorData?.detail || errorData?.message || 'Failed to generate avatar',
    };
  }
}

/**
 * Check avatar status by fetching profile
 * Uses GET /profile/me endpoint - avatar is ready when avatar.image is populated
 */
export async function getAvatarStatus(
  accessToken: string
): Promise<{
  success: boolean;
  status: 'pending' | 'ready' | 'error';
  avatarUrl?: string;
  profile?: any;
  error?: string;
}> {
  try {
    const headers = await getZoAuthHeaders(accessToken);

    // Use GET /profile/me to check avatar status
    const response = await zoApiClient.get('/profile/me', { headers });

    const profile = response.data?.data || response.data;
    const avatarImage = profile?.avatar?.image;
    const isAvatarReady = avatarImage && avatarImage.trim() !== '' && avatarImage !== 'null';

    return {
      success: true,
      status: isAvatarReady ? 'ready' : 'pending',
      avatarUrl: isAvatarReady ? avatarImage : undefined,
      profile,
    };
  } catch (error: any) {
    devLog.error('Failed to get avatar status:', error.response?.data || error);

    const errorData = error.response?.data as ZoErrorResponse;
    return {
      success: false,
      status: 'error',
      error: errorData?.detail || errorData?.message || 'Failed to get avatar status',
    };
  }
}

/**
 * Poll avatar status until completion
 * Calls onProgress every 2 seconds, onComplete when done
 */
export async function pollAvatarStatus(
  accessToken: string,
  options: {
    onProgress?: (status: string) => void;
    onComplete?: (avatarUrl: string) => void;
    onError?: (error: string) => void;
    maxAttempts?: number;
    interval?: number;
  } = {}
): Promise<void> {
  const {
    onProgress,
    onComplete,
    onError,
    maxAttempts = 30,  // 30 attempts * 2 seconds = 60 seconds max
    interval = 2000,   // Poll every 2 seconds
  } = options;

  let attempts = 0;

  const poll = async () => {
    attempts++;

    if (attempts > maxAttempts) {
      const timeoutError = 'Avatar generation timed out';
      devLog.error(timeoutError);
      onError?.(timeoutError);
      return;
    }

    const result = await getAvatarStatus(accessToken);

    if (!result.success) {
      onError?.(result.error || 'Unknown error');
      return;
    }

    onProgress?.(result.status);

    if (result.status === 'ready' && result.avatarUrl) {
      onComplete?.(result.avatarUrl);
      return;
    }

    if (result.status === 'error') {
      onError?.('Avatar generation failed');
      return;
    }

    // Continue polling
    setTimeout(poll, interval);
  };

  poll();
}
