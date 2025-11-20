// apps/web/src/lib/zo-api/index.ts
// Central export for ZO API functions

export { zoApiClient, getZoAuthHeaders, getZoDeviceHeaders } from './client';
export {
  sendOTP,
  verifyOTP,
  refreshAccessToken,
  checkLoginStatus,
} from './auth';
export {
  getProfile,
  updateProfile,
} from './profile';
export {
  syncZoProfileToSupabase,
  hasZoIdentity,
  getZoTokens,
} from './sync';
export type {
  ZoAuthOTPRequest,
  ZoAuthOTPVerifyRequest,
  ZoAuthTokens,
  ZoUser,
  ZoAuthResponse,
  ZoProfileResponse,
  ZoProfileUpdatePayload,
  ZoTokenBalanceResponse,
  ZoAvatarGenerateRequest,
  ZoAvatarGenerateResponse,
  ZoAvatarStatusResponse,
  ZoErrorResponse,
} from './types';

