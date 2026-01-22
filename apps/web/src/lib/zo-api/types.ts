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
  middle_name?: string;
  // Nickname fields (from Swagger)
  nickname?: string;
  custom_nickname?: string;
  selected_nickname?: string;  // Currently active nickname (preferred for display)
  ens_nickname?: string;
  mobile_number: string;
  mobile_verified?: boolean;
  email_address: string;
  email_verified?: boolean;
  date_of_birth: string | null;
  gender?: string;
  bio: string;
  pfp_image: string;
  pfp_metadata?: {
    contract_address?: string;
    token_id?: string;
    metadata?: string;
    is_valid?: boolean;
  };
  wallet_address: string;
  web3_verified?: boolean;
  membership: 'founder' | 'none' | 'citizen';
  relationship_status?: string;
  body_type: 'bro' | 'bae';
  address?: string;
  pincode?: string;
  place_name: string;
  place_ref_id?: string;
  home_location: {
    lat: number;
    lng: number;
  } | null;
  country?: {
    code: string;
    flag?: string;
    name: string;
    mobile_code?: string;
    local_currency?: string;
  };
  cultures: Array<{
    key: string;
    name: string;
    icon: string;
    description: string;
  }>;
  socials?: Array<{
    category: string;
    link: string;
    verified?: boolean;
  }>;
  founder_tokens: string[] | Array<{ token_id?: string }>; // Array of token IDs or token objects
  avatar?: {
    image: string;
    metadata?: string;
    ref_id?: number;
    status?: 'pending' | 'processing' | 'completed' | 'failed';
  };
}

// Actual ZO API response structure (from verify-otp)
export interface ZoAuthResponse {
  token: string;  // Same as access_token (legacy field)
  valid_till: string;  // Same as access_token_expiry (legacy field)
  access_token: string;
  access_token_expiry: string;
  refresh_token: string;
  refresh_token_expiry: string;
  client_key: string;
  device_id: string;
  device_secret: string;
  device_info: Record<string, any>;
  user: ZoUser;
  // Legacy tokens object (for backward compatibility)
  tokens?: ZoAuthTokens;
}

export interface ZoProfileResponse {
  id: string;
  pid: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  // Nickname fields (from Swagger)
  nickname?: string;
  custom_nickname?: string;
  selected_nickname?: string;  // Currently active nickname (preferred for display)
  ens_nickname?: string;
  mobile_country_code?: string;
  mobile_number: string;
  mobile_verified?: boolean;
  email_address: string;
  email_verified?: boolean;
  date_of_birth: string | null;
  gender?: string;
  bio: string;
  pfp_image: string;
  pfp_metadata?: {
    contract_address?: string;
    token_id?: string;
    metadata?: string;
    is_valid?: boolean;
  };
  wallet_address: string;
  web3_verified?: boolean;
  membership: 'founder' | 'none' | 'citizen';
  relationship_status?: string;
  body_type: 'bro' | 'bae';
  address?: string;
  pincode?: string;
  place_name: string;
  place_ref_id?: string;
  home_location: {
    lat: number;
    lng: number;
  } | null;
  country?: {
    code: string;
    flag?: string;
    name: string;
    mobile_code?: string;
    local_currency?: string;
  };
  cultures: Array<{
    key: string;
    name: string;
    icon: string;
    description: string;
  }>;
  socials?: Array<{
    category: string;
    link: string;
    verified?: boolean;
  }>;
  founder_tokens: string[] | Array<{ token_id?: string }>;
  avatar?: {
    image: string;
    metadata?: string;
    ref_id?: number;
    status?: string;
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

