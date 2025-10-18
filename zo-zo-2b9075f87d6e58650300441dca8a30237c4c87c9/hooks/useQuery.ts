import { ApiServer, QueryEndpointConfig } from "@/definitions/auth";
import {
  UseQueryOptions,
  UseQueryResult,
  useQuery as useTanstackQuery,
} from "@tanstack/react-query";
import { AxiosError, AxiosResponse } from "axios";
import { axiosInstances } from "../utils/auth/client";
import { authQueryEndpoints } from "../utils/auth/endpoints/auth";
import { profileQueryEndpoints } from "../utils/auth/endpoints/profile";
import { web3QueryEndpoints } from "../utils/auth/endpoints/web3";
import { exploreQueryEndpoints } from "../utils/auth/endpoints/explore";
import { bookingsQueryEndpoints } from "../utils/auth/endpoints/bookings";
import { stayQueryEndpoints } from "@/utils/auth/endpoints/stay";
import { paymentQueryEndpoints } from "@/utils/auth/endpoints/payment";
import { zoQueryEndpoints } from "@/utils/auth/endpoints/zo";
import { tripQueryEndpoints } from "@/utils/auth/endpoints/trip";
import { commsQueryEndpoints } from "@/utils/auth/endpoints/comms";

// Combine all query endpoints
export const allQueryEndpoints = {
  ...authQueryEndpoints,
  ...profileQueryEndpoints,
  ...stayQueryEndpoints,
  ...paymentQueryEndpoints,
  ...web3QueryEndpoints,
  ...exploreQueryEndpoints,
  ...bookingsQueryEndpoints,
  ...zoQueryEndpoints,
  ...tripQueryEndpoints,
  ...commsQueryEndpoints,
} as const;
export type AllQueryEndpoints = typeof allQueryEndpoints;
export type AllQueryEndpointKeys = keyof AllQueryEndpoints;

// Type utility to extract response type from an endpoint
export type QueryEndpointResponse<K extends keyof AllQueryEndpoints> =
  AllQueryEndpoints[K] extends QueryEndpointConfig<infer TResponse>
    ? TResponse
    : never;

// Type utility to extract params type from an endpoint
type QueryEndpointError<K extends keyof AllQueryEndpoints> =
  AllQueryEndpoints[K] extends QueryEndpointConfig<any, infer TError>
    ? TError
    : undefined;

type QueryParams = {
  search?: Record<string, string>;
  path?: string[];
};

// Todo- need to fix type system for different Req/Response types on extended paths using same Query Endpoint config.

function useQuery<
  K extends keyof AllQueryEndpoints,
  TQueryData = QueryEndpointResponse<K>,
  TData = QueryEndpointResponse<K>,
  TError = QueryEndpointError<K>
>(
  endpointKey: K,
  options?: Omit<
    UseQueryOptions<AxiosResponse<TQueryData>, AxiosError<TError>, TData>,
    "queryKey" | "queryFn"
  >,
  params?: QueryParams
) {
  const endpoint = allQueryEndpoints[endpointKey];
  if (!endpoint) {
    throw new Error(`Query endpoint "${String(endpointKey)}" not found`);
  }
  const path = generatePath(params);
  const url = `${endpoint.url}${path}`;

  return useTanstackQuery({
    queryKey: [...endpoint.queryKey, path],
    queryFn: async () => {
      const axiosInstance = axiosInstances[endpoint.server];
      const response = await axiosInstance.get<TQueryData>(url);
      return response;
    },
    ...options,
  });
}

export default useQuery;

const generatePath = (params?: QueryParams) => {
  if (!params) {
    return "";
  }
  const { search, path } = params;
  // Construct the base path by joining path segments
  const basePath = path ? path.join("/") : "";

  // If no search parameters, return the base path
  if (!search || Object.keys(search).length === 0) {
    if (basePath) {
      return basePath + "/";
    }
    return "";
  }

  // // Convert search parameters to query string
  // const queryParams = new URLSearchParams();

  // for (const [key, value] of Object.entries(search)) {
  //   if (value !== undefined && value !== null) {
  //     queryParams.append(key, value);
  //   }
  // }

  // const queryString = queryParams.toString();

  const queryParams: string[] = [];
  for (const [key, value] of Object.entries(search)) {
    if (value !== undefined && value !== null) {
      // queryParams.append(key, value);
      queryParams.push(`${key}=${value}`);
    }
  }
  const queryString = queryParams.join("&");

  // Return path with query string if it exists
  return queryString
    ? basePath
      ? `${basePath}/?${queryString}`
      : `?${queryString}`
    : basePath + "/";
};
