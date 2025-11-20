// apps/web/src/lib/zo-api/types.ts
// TypeScript types for ZO API responses

export interface ZoAuthOTPRequest {
  mobile_country_code: string;
  mobile_number: string;
  message_channel?: string;
}

export interface ZoAuthOTPVerifyRequest {
  mobile_country_code: string;
  mobile_number: string;
  otp: string;
}

export interface ZoAuthTokens {
  access: string;
  refresh: string;
  access_expiry: string;
  refresh_expiry: string;
}

export interface ZoUser {
  id: string;  // UUID
  pid: string;  // PID123
  first_name: string;
  last_name: string;
  mobile_number: string;
  email_address: string;
  date_of_birth: string | null;
  bio: string;
  pfp_image: string;
  wallet_address: string;
  membership: 'founder' | 'none';
  body_type: 'bro' | 'bae';
  place_name: string;
  home_location: {
    lat: number;
    lng: number;
  } | null;
  cultures: Array<{
    key: string;
    name: string;
    icon: string;
    description: string;
  }>;
  founder_tokens: Array<{
    token_id: string;
    name: string;
  }>;
  avatar?: {
    image: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
  };
}

export interface ZoAuthResponse {
  user: ZoUser;
  tokens: ZoAuthTokens;
  device_id: string;
  device_secret: string;
}

export interface ZoProfileResponse {
  id: string;
  pid: string;
  first_name: string;
  last_name: string;
  mobile_country_code: string; // Added
  mobile_number: string;
  email_address: string;
  date_of_birth: string | null;
  bio: string;
  pfp_image: string;
  wallet_address: string;
  membership: 'founder' | 'none' | 'citizen'; // Added 'citizen'
  body_type: 'bro' | 'bae';
  place_name: string;
  home_location: {
    lat: number;
    lng: number;
  } | null;
  cultures: Array<{
    key: string;
    name: string;
    icon: string;
    description: string;
  }>;
  founder_tokens: Array<{
    token_id: string;
    name: string;
  }>;
  avatar?: {
    image: string;
    status: string;
  };
}

export interface ZoProfileUpdatePayload {
  first_name?: string;
  last_name?: string;
  bio?: string;
  date_of_birth?: string;
  place_name?: string;
  body_type?: 'bro' | 'bae';
}

export interface ZoTokenBalanceResponse {
  balance: number;
  currency: {
    name: string;
    symbol: string;
  };
}

export interface ZoAvatarGenerateRequest {
  body_type: 'bro' | 'bae';
}

export interface ZoAvatarGenerateResponse {
  task_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  message: string;
}

export interface ZoAvatarStatusResponse {
  task_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: {
    avatar_url: string;
  };
  error?: string;
}

export interface ZoErrorResponse {
  detail: string;
  error?: string;
  message?: string;
}

