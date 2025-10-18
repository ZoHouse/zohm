import { HttpMethod, MutationEndpointConfig } from "@/definitions/auth";
import {
  MutationOptions,
  useMutation as useTanstackMutation,
} from "@tanstack/react-query";
import { AxiosError, AxiosInstance, AxiosResponse } from "axios";
import { axiosInstances } from "../utils/auth/client";
import { authMutationEndpoints } from "../utils/auth/endpoints/auth";
import { profileMutationEndpoints } from "../utils/auth/endpoints/profile";
import { stayMutationEndpoints } from "@/utils/auth/endpoints/stay";
import { bookingsMutationEndpoints } from "@/utils/auth/endpoints/bookings";
import { paymentMutationEndpoints } from "@/utils/auth/endpoints/payment";
import { tripMutationEndpoints } from "@/utils/auth/endpoints/trip";

type AxiosMethodFn = <T = any>(
  url: string,
  data?: any
) => Promise<AxiosResponse<T>>;
type TypedAxiosInstance = {
  [K in HttpMethod]: AxiosMethodFn;
} & AxiosInstance;

const allMutationEndpoints = {
  ...authMutationEndpoints,
  ...profileMutationEndpoints,
  ...stayMutationEndpoints,
  ...bookingsMutationEndpoints,
  ...paymentMutationEndpoints,
  ...tripMutationEndpoints,
} as const;

type AllMutationEndpoints = typeof allMutationEndpoints;
type AllMutationEndpointKeys = keyof AllMutationEndpoints;

type MutationEndpointResponse<K extends AllMutationEndpointKeys> =
  AllMutationEndpoints[K] extends MutationEndpointConfig<infer TResponse, any>
    ? TResponse
    : never;

type MutationEndpointRequest<K extends AllMutationEndpointKeys> =
  AllMutationEndpoints[K] extends MutationEndpointConfig<any, infer TRequest>
    ? TRequest
    : never;

type MutationEndpointError<K extends AllMutationEndpointKeys> =
  AllMutationEndpoints[K] extends MutationEndpointConfig<any, any, infer TError>
    ? TError
    : never;

type WithRequestOptions<T> = T & {
  path?: string;
  method?: HttpMethod;
};

function useMutation<
  K extends AllMutationEndpointKeys,
  TRequest = MutationEndpointRequest<K>,
  TResponse = MutationEndpointResponse<K>,
  TError = MutationEndpointError<K>
>(
  endpointKey: K,
  options?: Omit<
    MutationOptions<AxiosResponse<TResponse>, TError, TRequest>,
    "mutationFn"
  >,
  path: string = ""
) {
  const endpoint = allMutationEndpoints[endpointKey];
  if (!endpoint) {
    throw new Error(`Mutation endpoint "${String(endpointKey)}" not found`);
  }

  return useTanstackMutation<
    AxiosResponse<TResponse>,
    TError,
    WithRequestOptions<TRequest>
  >({
    mutationFn: async (request: WithRequestOptions<TRequest>) => {
      const axiosInstance = axiosInstances[
        endpoint.server
      ] as TypedAxiosInstance;
      const { path: dynamicPath, method, ...rest } = request;
      return await axiosInstance[method ?? endpoint.method]<TResponse>(
        `${endpoint.url}${path}${dynamicPath ?? ""}`,
        rest
      );
    },
    ...options,
  });
}

export default useMutation;
