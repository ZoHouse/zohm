import {
  ApiServer,
  ApplicationSeed,
  AuthUserCommsResponse,
  HttpMethod,
  MergeResponse,
  MutationEndpointConfig,
  QueryEndpointConfig,
  ZoAuthResponse,
  ZostelAuthResponse,
  ZoUserEmail,
} from "@/definitions/auth";
import { Platform } from "expo-modules-core";
import { RequireAtLeastOne } from "type-fest";

const authQueryEndpoints = {
  AUTH_APPLICATION_SEED: {
    server: ApiServer.ZO,
    queryKey: ["auth", "application", "seed"],
    url: "/api/v1/auth/application/seed/",
  } as QueryEndpointConfig<ApplicationSeed>,
  AUTH_USER_EMAILS: {
    server: ApiServer.ZO,
    queryKey: ["auth", "user", "emails"],
    url: "/api/v1/auth/user/emails/",
  } as QueryEndpointConfig<{
    emails: ZoUserEmail[];
  }>,
};

const authMutationEndpoints = {
  AUTH_LOGIN_MOBILE: {
    server: ApiServer.ZO,
    url: "/api/v1/auth/login/mobile/",
    method: HttpMethod.POST,
  } as MutationEndpointConfig<
    ZoAuthResponse,
    {
      mobile_country_code: string;
      mobile_number: string;
      otp: string;
    }
  >,
  AUTH_LOGIN_MOBILE_OTP: {
    server: ApiServer.ZO,
    url: "/api/v1/auth/login/mobile/otp/",
    method: HttpMethod.POST,
  } as MutationEndpointConfig<
    {
      success: boolean;
    },
    {
      mobile_country_code: string;
      mobile_number: string;
      message_channel: string;
    }
  >,
  AUTH_REQUEST_OTP_ZOSTEL: {
    server: ApiServer.ZO,
    url: "/api/v1/auth/request-otp/zostel/",
    method: HttpMethod.POST,
  } as MutationEndpointConfig<
    {
      mobile_country_code: string;
      mobile_number: string;
      code: string;
    },
    {}
  >,
  AUTH_REQUEST_OTP_EMAIL: {
    server: ApiServer.ZO,
    url: "/api/v1/auth/request-otp/email/",
    method: HttpMethod.POST,
  } as MutationEndpointConfig<
    {},
    {
      email_address: string;
    }
  >,
  AUTH_USER_EMAIL: {
    server: ApiServer.ZO,
    url: "/api/v1/auth/user/email/",
    method: HttpMethod.POST,
  } as MutationEndpointConfig<
    {},
    {
      email_address: string;
    }
  >,
  AUTH_USER_EMAILS: {
    server: ApiServer.ZO,
    url: "/api/v1/auth/user/emails/",
    method: HttpMethod.POST,
  } as MutationEndpointConfig<
    {},
    {
      email_address: string;
      otp: string;
      verification_type: string;
    }
  >,
  AUTH_USER_EMAILS_UPDATE: {
    server: ApiServer.ZO,
    url: "/api/v1/auth/user/emails/",
    method: HttpMethod.PUT,
  } as MutationEndpointConfig<
    {},
    {
      email_address: string;
      primary: true;
    }
  >,
  AUTH_USER_EMAILS_DELETE: {
    server: ApiServer.ZO,
    url: "/api/v1/auth/user/emails/",
    method: HttpMethod.DELETE,
  } as MutationEndpointConfig<
    {},
    {
      data: { email_address: string };
    }
  >,
  ZOSTEL_AUTH_ACTIVATE: {
    server: ApiServer.ZOSTEL,
    url: "/api/v1/auth/activate/",
    method: HttpMethod.POST,
  } as MutationEndpointConfig<
    ZostelAuthResponse,
    { mobile_country_code: string; mobile: string; otp: string }
  >,
  AUTH_USER_COMMS: {
    server: ApiServer.ZO,
    url: "/api/v1/auth/user/comms/",
    method: HttpMethod.POST,
  } as MutationEndpointConfig<AuthUserCommsResponse, {}>,
  AUTH_DEVICE_REGISTER: {
    server: ApiServer.ZOSTEL,
    url: "/api/v1/auth/device/register/",
    method: HttpMethod.POST,
  } as MutationEndpointConfig<
    {},
    {
      device_id: string;
      device_name: string;
      app_version: string;
      app_build: string;
      platform: typeof Platform.OS;
      utm?: Record<string, string>;
    }
  >,
  AUTH_USER_DEVICES: {
    server: ApiServer.ZO,
    url: "/api/v1/auth/user/devices/",
    method: HttpMethod.PUT,
  } as MutationEndpointConfig<
    {},
    RequireAtLeastOne<{
      device_id: string;
      device_name: string;
      client_version: string;
      client_build: string;
      notification_token?: string;
    }>
  >,
  AUTH_MERGE_ACCOUNTS: {
    server: ApiServer.ZO,
    url: "/api/v1/auth/user/merge/",
    method: HttpMethod.POST,
  } as MutationEndpointConfig<
    {},
    {
      merge_id: string;
      verification: MergeResponse["auth"];
    }
  >,
} as const;

export type AuthMutationEndpoints = typeof authMutationEndpoints;
export type AuthQueryEndpoints = typeof authQueryEndpoints;

export { authMutationEndpoints, authQueryEndpoints };
