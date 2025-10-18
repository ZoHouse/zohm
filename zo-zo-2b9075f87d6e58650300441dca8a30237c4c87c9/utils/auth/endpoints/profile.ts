import {
  ApiServer,
  HttpMethod,
  MutationEndpointConfig,
  QueryEndpointConfig,
} from "@/definitions/auth";
import { ListResult } from "@/definitions/general";
import {
  OnboardingGrant,
  OnboardingGrants,
  Profile,
  ProfileCompletionGrants,
  WhereaboutsV2,
  ZostelProfile,
} from "@/definitions/profile";
import { ZoCurrency } from "@/definitions/booking";
import { RequireAtLeastOne } from "type-fest";

const profileQueryEndpoints = {
  PROFILE_ME: {
    server: ApiServer.ZO,
    queryKey: ["profile", "me"],
    url: "/api/v1/profile/me/",
  } as QueryEndpointConfig<Profile>,
  PROFILE_ME_ZOSTEL: {
    server: ApiServer.ZOSTEL,
    queryKey: ["profile", "me", "zostel"],
    url: "/api/v1/profile/me/",
  } as QueryEndpointConfig<{ profile: ZostelProfile }>,
  PROFILE_COMPLETION_GRANTS: {
    server: ApiServer.ZO,
    queryKey: ["profile", "completion", "grants"],
    url: "/api/v1/profile/completion-grants/",
  } as QueryEndpointConfig<ListResult<ProfileCompletionGrants>>,
  WHERE_ABOUTS: {
    server: ApiServer.ZO,
    queryKey: ["places", "whereabouts"],
    url: "/api/v2/places/whereabouts/",
  } as QueryEndpointConfig<WhereaboutsV2>,
  ONBOARDING_GRANTS: {
    server: ApiServer.ZO,
    queryKey: ["onboarding", "grants"],
    url: "/api/v1/profile/onboarding-grants/",
  } as QueryEndpointConfig<OnboardingGrant>,
  PROFILE_CUSTOM_NICKNAME_AVAILABLE: {
    server: ApiServer.ZO,
    queryKey: ["profile", "custom-nickname", "available"],
    url: "/api/v1/profile/custom-nickname/available/",
  } as QueryEndpointConfig<{ available: boolean }>,
  CREDITS: {
    server: ApiServer.ZO,
    queryKey: ["profile", "credits"],
    url: "/api/v1/credits/",
  } as QueryEndpointConfig<{ balance: number; currency: ZoCurrency }>,
};

const profileMutationEndpoints = {
  PROFILE_ME: {
    server: ApiServer.ZO,
    url: "/api/v1/profile/me/",
    method: HttpMethod.POST,
  } as MutationEndpointConfig<Profile, RequireAtLeastOne<Profile>>,
  WHERE_ABOUTS: {
    server: ApiServer.ZO,
    url: "/api/v2/places/whereabouts/",
    method: HttpMethod.POST,
  } as MutationEndpointConfig<
    WhereaboutsV2,
    Omit<WhereaboutsV2, "created_at" | "updated_at">
  >,
  ONBOARDING_GRANTS: {
    server: ApiServer.ZO,
    url: "/api/v1/profile/onboarding-grants/",
    method: HttpMethod.POST,
  } as MutationEndpointConfig<OnboardingGrants, {}>,
  PROFILE_SUPPORT_DELETE: {
    server: ApiServer.ZOSTEL,
    url: "/api/v1/profile/support/delete/",
    method: HttpMethod.POST,
  } as MutationEndpointConfig<{}, {}>,
} as const;

export { profileMutationEndpoints, profileQueryEndpoints };
