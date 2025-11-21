// apps/web/src/lib/zo-api/avatar.ts
// ZO API avatar generation functions

import { zoApiClient, getZoAuthHeaders } from './client';
import type {
  ZoAvatarGenerateRequest,
  ZoAvatarGenerateResponse,
  ZoAvatarStatusResponse,
  ZoErrorResponse,
} from './types';

/**
 * Generate avatar for user
 * Requires authenticated ZO user
 */
export async function generateAvatar(
  accessToken: string,
  bodyType: 'bro' | 'bae'
): Promise<{
  success: boolean;
  task_id?: string;
  status?: string;
  error?: string;
}> {
  try {
    const payload: ZoAvatarGenerateRequest = {
      body_type: bodyType,
    };

    const headers = await getZoAuthHeaders(accessToken);
    const response = await zoApiClient.post<ZoAvatarGenerateResponse>(
      '/api/v1/avatar/generate/',
      payload,
      {
        headers,
      }
    );

    return {
      success: true,
      task_id: response.data.task_id,
      status: response.data.status,
    };
  } catch (error: any) {
    console.error('Failed to generate avatar:', error.response?.data || error);

    const errorData = error.response?.data as ZoErrorResponse;
    return {
      success: false,
      error: errorData?.detail || errorData?.message || 'Failed to generate avatar',
    };
  }
}

/**
 * Check avatar generation status
 * Poll this endpoint until status is 'completed'
 */
export async function getAvatarStatus(
  accessToken: string,
  taskId: string
): Promise<{
  success: boolean;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  avatarUrl?: string;
  error?: string;
}> {
  try {
    const headers = await getZoAuthHeaders(accessToken);
    const response = await zoApiClient.get<ZoAvatarStatusResponse>(
      `/api/v1/avatar/status/${taskId}/`,
      {
        headers,
      }
    );

    return {
      success: true,
      status: response.data.status,
      avatarUrl: response.data.result?.avatar_url,
    };
  } catch (error: any) {
    console.error('Failed to get avatar status:', error.response?.data || error);

    const errorData = error.response?.data as ZoErrorResponse;
    return {
      success: false,
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
  taskId: string,
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
      console.error(timeoutError);
      onError?.(timeoutError);
      return;
    }

    const result = await getAvatarStatus(accessToken, taskId);

    if (!result.success) {
      onError?.(result.error || 'Unknown error');
      return;
    }

    onProgress?.(result.status || 'unknown');

    if (result.status === 'completed' && result.avatarUrl) {
      onComplete?.(result.avatarUrl);
      return;
    }

    if (result.status === 'failed') {
      onError?.('Avatar generation failed');
      return;
    }

    // Continue polling
    setTimeout(poll, interval);
  };

  poll();
}

