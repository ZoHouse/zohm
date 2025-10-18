import { ApiServer } from "@/definitions/auth";
import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";
import { Platform } from "react-native";
import { formatJson } from "../object";

// TODO- Client Refresh Token is yet to be implemented.

// Base URLs for both API servers
const API_URLS = {
  [ApiServer.ZO]: process.env.EXPO_PUBLIC_ZO_API_BASE_URL,
  [ApiServer.ZOSTEL]: process.env.EXPO_PUBLIC_ZOSTEL_API_BASE_URL,
  [ApiServer.ZO_COMMS]: process.env.EXPO_PUBLIC_ZO_API_BASE_URL,
};

// Default configurations
const DEFAULT_CONFIG: AxiosRequestConfig = {
  timeout: 30000, // 30 seconds
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    Platform: Platform.OS,
  },
};

// Create an axios instance for a specific server
export const createAxiosInstance = (server: ApiServer): AxiosInstance => {
  return axios.create({
    ...DEFAULT_CONFIG,
    baseURL: API_URLS[server],
  });
};

// Cache for axios instances
export const axiosInstances: Record<ApiServer, AxiosInstance> = {
  [ApiServer.ZO]: createAxiosInstance(ApiServer.ZO),
  [ApiServer.ZOSTEL]: createAxiosInstance(ApiServer.ZOSTEL),
  [ApiServer.ZO_COMMS]: createAxiosInstance(ApiServer.ZO_COMMS),
};

export const getZoCommServerHeaders = () => {
  return axiosInstances[ApiServer.ZO_COMMS].defaults.headers;
};

export const setZoCommServerHeaders = (headers: any) => {
  axiosInstances[ApiServer.ZO_COMMS].defaults.headers = {
    ...axiosInstances[ApiServer.ZO_COMMS].defaults.headers,
    ...headers,
  };
};

// Setup auth interceptors
export const setupAuthInterceptors = (
  instance: AxiosInstance,
  getToken: () => string | null,
  refreshToken: () => Promise<void>,
  logout: () => Promise<void>,
  onRefreshStart: () => void,
  onRefreshEnd: () => void,
  getAuthHeaders: () => Record<string, string | null>
): (() => void) => {
  let isRefreshing = false;
  let refreshPromise: Promise<void> | null = null;

  // Request interceptor
  const requestInterceptor = instance.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const authHeaders = getAuthHeaders();
      Object.entries(authHeaders).forEach(([key, value]) => {
        if (value) {
          config.headers[key] = value;
        }
      });

      // console.log(
      //   `${config.method?.toLocaleUpperCase()} ${config.baseURL}${config.url}`,
      //   "\n",
      //   config.headers
      // );

      return config;
    },
    (error) => Promise.reject(error)
  );

  // // Response interceptor
  // const responseInterceptor = instance.interceptors.response.use(
  //   (response) => response,
  //   async (error: AxiosError) => {
  //     const originalRequest = error.config;

  //     // If error is 401 and not already retrying, try to refresh token
  //     if (
  //       error.response?.status === 401 &&
  //       originalRequest &&
  //       !(originalRequest as any)._retry
  //     ) {
  //       (originalRequest as any)._retry = true;

  //       try {
  //         // If already refreshing, wait for that promise
  //         if (!isRefreshing) {
  //           isRefreshing = true;
  //           onRefreshStart();

  //           refreshPromise = refreshToken()
  //             .then(() => {
  //               isRefreshing = false;
  //               onRefreshEnd();
  //             })
  //             .catch((err) => {
  //               isRefreshing = false;
  //               onRefreshEnd();
  //               throw err;
  //             });
  //         }

  //         if (refreshPromise) {
  //           await refreshPromise;
  //         }

  //         // Get updated token and auth headers
  //         const newToken = getToken();
  //         const newAuthHeaders = await getAuthHeaders();

  //         if (originalRequest.headers) {
  //           if (newToken) {
  //             originalRequest.headers.Authorization = `Bearer ${newToken}`;
  //           }

  //           // Update other auth headers
  //           Object.entries(newAuthHeaders).forEach(([key, value]) => {
  //             if (value) {
  //               originalRequest.headers[key] = value;
  //             }
  //           });

  //           return instance(originalRequest);
  //         }
  //       } catch (refreshError) {
  //         // Handle logout if refresh fails
  //         await logout();
  //         return Promise.reject(refreshError);
  //       }
  //     }

  //     return Promise.reject(error);
  //   }
  // );

  // Return function to remove interceptors
  return () => {
    instance.interceptors.request.eject(requestInterceptor);
    // instance.interceptors.response.eject(responseInterceptor);
  };
};

// Server Log.

const COLORS = {
  Black: "\x1b[30m",
  Red: "\x1b[31m",
  Green: "\x1b[32m",
  Yellow: "\x1b[33m",
  Blue: "\x1b[34m",
  Magenta: "\x1b[35m",
  Cyan: "\x1b[36m",
  White: "\x1b[37m",
};

const COLORLIST = [COLORS.Green, COLORS.Yellow, COLORS.Cyan];

if (__DEV__) {
  [axiosInstances[ApiServer.ZO], axiosInstances[ApiServer.ZOSTEL], axiosInstances[ApiServer.ZO_COMMS]].forEach(
    (server) =>
      server.interceptors.request.use((req) => {
        console.log("---REQ : ", req.baseURL, req.url, "------------");
        console.log(req.headers);
        if (req.data) {
          console.log(formatJson(req.data));
        }
        return req;
      })
  );

  [axiosInstances[ApiServer.ZO], axiosInstances[ApiServer.ZOSTEL], axiosInstances[ApiServer.ZO_COMMS]].forEach(
    (server, index) => {
      server.interceptors.response.use((config) => {
        console.log("-----------------------------");
        console.log(
          COLORLIST[index],
          "RESPONSE: ",
          config?.config.baseURL,
          config?.config?.url,
          config.config.method,
          config.status
        );
        console.log(
          COLORLIST[index],
          "headers: ",
          JSON.stringify(config.request._headers, null, 2)
        );
        console.log(COLORLIST[index], formatJson(config.data));
        console.log("-----------------------------");
        return config;
      });
    }
  );
}
