/**
 * Authentication related type definitions
 */

import { AxiosError } from "axios";

// Enum for HTTP methods
export enum HttpMethod {
  POST = "post",
  GET = "get",
  PUT = "put",
  DELETE = "delete",
}

// Enum for API servers
export enum ApiServer {
  ZOSTEL = "ZOSTEL",
  ZO = "ZO",
  ZO_COMMS = "ZO_COMMS",
}
// Generic config type for mutation endpoints
export interface MutationEndpointConfig<
  TResponse,
  TRequest,
  TError = AxiosError
> {
  server: ApiServer;
  url: string;
  method: HttpMethod;
}

export interface QueryEndpointConfig<TResponse, TError = AxiosError> {
  server: ApiServer;
  url: string;
  queryKey: string[]; // Changed to string[]
}

// Define user types for both authentication systems
export interface ZoUser {
  id: string;
  pid: string;
  first_name: string;
  last_name: string;
  wallet_address: string;
  mobile_number: string;
  email_address: string;
  roles: string[];
  membership: string;
}

export interface ZostelUser {
  app_id: string;
  first_name: string;
  id: string;
  last_name: string;
  mobile: string;
  pid: string;
  roles: string[];
  user_id: string;
}

// Define authentication states
export interface ZoState {
  token: string | null;
  refreshToken: string | null;
  refreshTokenExpiry: string | null;
  tokenExpiry: string | null;
  user: ZoUser | null;

  clientDeviceId: string | null;
  clientDeviceSecret: string | null;
}

export interface ZostelState {
  token: string | null;
  refreshToken: string | null;
  refreshTokenExpiry: string | null;
  tokenExpiry: string | null;
  user: ZostelUser | null;
  clientUserId: string | null;
}

export interface ZoAuthResponse {
  token: string;
  refresh_token: string;
  refresh_token_expiry: string;
  valid_till: string;
  access_token: string;
  access_token_expiry: string;
  client_key: string;
  device_id: string;
  device_secret: string;
  device_info: {};
  user: ZoUser;
}

export interface ZostelAuthResponse {
  user_token: string;
  token_expiry: string;
  user: ZostelUser;
}

export interface ApplicationSeed {
  disabled_features: string[];
  expiry: { coupon_expiry: number; utm_expiry: number };
  location_precision: number;
  mobile_country_codes: {
    name: string;
    flag: string;
    code: string;
    dial_code: string;
  }[];
  trip_booking_range?: number;
  tcs_threshold?: number;
  app_home_announcement?: Record<string, string>;
}

export type CountryCodeType = ApplicationSeed["mobile_country_codes"][number];

export interface ZoUserEmail {
  verification_type: "native-email";
  created_at: string;
  updated_at: string;
  primary: boolean;
  verified: boolean;
  email_address: string;
  dnd: boolean;
  promotional: boolean;
}

export interface AuthUserCommsResponse {
  token: string;
  account_id: string;
  app_id: string;
  token_expiry: string;
}

export interface MergeResponse {
  merge_id: string;
  pid: string;
  membership: string;
  ens_nickname: string | null;
  custom_nickname: string;
  nickname: string;
  wallet_address: string;
  email_address: string;
  mobile_number: string;
  pfp_image: string;
  created_at: string;
  auth: {
    email_address: string;
    otp: string;
    verification_type: string;
  };
}
