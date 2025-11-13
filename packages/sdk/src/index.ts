/**
 * @zohm/sdk
 * 
 * Shared SDK for ZOHM WebApp and Mobile
 * 
 * Exports:
 * - TypeScript types for API requests/responses
 * - API client utilities
 * - Helper functions
 */

// Export all types
export * from './types';

// Export API client
export * from './client';

// Package version
export const SDK_VERSION = '0.1.0';

// Re-export commonly used types for convenience
export type {
  ApiResponse,
  User,
  Quest,
  QuestCompletion,
  LeaderboardEntry,
  VibeScore,
} from './types';

export type {
  ApiClientConfig,
} from './client';

export {
  ApiClient,
  createApiClient,
  unwrapResponse,
  getResponseData,
} from './client';
