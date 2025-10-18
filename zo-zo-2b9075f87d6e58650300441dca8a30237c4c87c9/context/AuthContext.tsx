import {
  ApiServer,
  ZoState,
  ZostelState,
  ZoAuthResponse,
  ZostelAuthResponse,
} from "@/definitions/auth";
import { AxiosInstance } from "axios";
import { randomUUID } from "expo-crypto";
import React, {
  createContext,
  useCallback,
  useRef,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Platform } from "react-native";
import { axiosInstances, setupAuthInterceptors } from "../utils/auth/client";
import { queryClient } from "./QueryClientProvider";
import useMutation from "@/hooks/useMutation";
import { logAxiosError } from "@/utils/network";
import storage from "@/utils/storage";
import moment from "moment";

// Define the context interface with tri-state authentication
interface AuthContextProps {
  authState: {
    isAuthenticated: boolean | null; // Tri-state: null (undetermined), false (not auth), true (auth)
    isLoading: boolean;
    error: string | null;
  };
  loginZoZo: (
    mobile_country_code: string,
    mobile_number: string,
    otp: string
  ) => Promise<boolean>;
  logout: () => Promise<void>;
  getZoAuthHeaders: () => Record<string, string | null>;
  getZostelAuthHeaders: () => Record<string, string | null>;
}

const INIT_STATE: AuthContextProps["authState"] = {
  isAuthenticated: null,
  isLoading: false,
  error: null,
};

const clientKeys = {
  zo:
    (Platform.OS === "ios"
      ? process.env.EXPO_PUBLIC_ZO_CLIENT_KEY_IOS
      : process.env.EXPO_PUBLIC_ZO_CLIENT_KEY_ANDROID) || null,
  zostel: process.env.EXPO_PUBLIC_ZOSTEL_CLIENT_ID || null,
};

// Create the context with default values
const AuthContext = createContext<AuthContextProps>({
  authState: INIT_STATE,
  loginZoZo: async () => false,
  logout: async () => {},
  getZoAuthHeaders: () => ({}),
  getZostelAuthHeaders: () => ({}),
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [authState, setAuthState] = useState<AuthContextProps["authState"]>(
    () => ({
      ...INIT_STATE,
    })
  );

  const authRef = useRef<{
    zo: ZoState;
    zostel: ZostelState;
  }>({
    zo: getNullZoValues(),
    zostel: getNullZostelValues(),
  });

  const isAuthenticated = useMemo(() => {
    // If either state is still loading, return null
    if (authState.isLoading) {
      return null;
    }
    // User is authenticated only if both services are authenticated
    return authState.isAuthenticated;
  }, [authState]);

  const getZoAuthHeaders = useCallback(() => {
    return {
      "client-key": clientKeys.zo,
      "client-device-id": authRef.current.zo.clientDeviceId,
      "client-device-secret": authRef.current.zo.clientDeviceSecret,
      authorization: authRef.current.zo.token
        ? `Bearer ${authRef.current.zo.token}`
        : null,
    };
  }, []);

  const getZostelAuthHeaders = useCallback(() => {
    return {
      "client-app-id": clientKeys.zostel,
      "client-user-id": authRef.current.zostel.clientUserId,
      authorization: authRef.current.zostel.token
        ? `Bearer ${authRef.current.zostel.token}`
        : null,
    };
  }, []);

  // Initialize axios interceptors for each instance
  useEffect(() => {
    // Function to get Zo auth headers

    // Function to get Zostel auth headers

    // Set up interceptors for Zo instance
    const cleanupZoInterceptors = setupAuthInterceptors(
      axiosInstances[ApiServer.ZO],
      () => authRef.current.zo.token,
      refreshZo,
      logOut,
      () => {}, // onRefreshStart
      () => {}, // onRefreshEnd
      getZoAuthHeaders
    );

    // Set up interceptors for Zostel instance
    const cleanupZostelInterceptors = setupAuthInterceptors(
      axiosInstances[ApiServer.ZOSTEL],
      () => authRef.current.zostel.token,
      refreshZostel,
      logOut,
      () => {}, // onRefreshStart
      () => {}, // onRefreshEnd
      getZostelAuthHeaders
    );

    return () => {
      cleanupZoInterceptors();
      cleanupZostelInterceptors();
    };
  }, [isAuthenticated]);

  /**
   * Loads and validates authentication state for both Zo and Zostel services
   *
   * Flow:
   * 1. Load auth data from secure storage
   * 2. For each service (Zo/Zostel):
   *    a. If auth data exists:
   *       - Store in ref for request headers
   *       - Check token expiry
   *       - If token expired:
   *         * Check refresh token expiry
   *         * If refresh token expired -> logout
   *         * If refresh token valid -> attempt refresh
   *           - On success: save new tokens and login
   *           - On failure: logout
   *       - If token valid:
   *         * Verify with login check endpoint
   *         * If valid -> set authenticated
   *         * If invalid -> attempt refresh flow
   *    b. If no auth data -> logout
   *
   * @returns Promise that resolves when auth state is loaded
   */
  const loadAuthState = () => {
    return Promise.all([
      // Zo
      storage.getData("ZO_TOKEN"),
      storage.getData("ZO_REFRESH_TOKEN"),
      storage.getData("ZO_USER"),
      storage.getData("ZO_TOKEN_EXPIRY"),
      storage.getData("ZO_REFRESH_TOKEN_EXPIRY"),
      storage.getData("ZO_CLIENT_DEVICE_ID").then(
        (id) => storage.generateIfNotExists("ZO_CLIENT_DEVICE_ID", id)
      ),
      storage.getData("ZO_CLIENT_DEVICE_SECRET").then(
        (id) =>
          storage.generateIfNotExists("ZO_CLIENT_DEVICE_SECRET", id)
      ),
      // Zostel
      storage.getData("ZOSTEL_TOKEN"),
      storage.getData("ZOSTEL_USER"),
      storage.getData("ZOSTEL_TOKEN_EXPIRY"),
    ])
      .then(
        ([
          zoToken,
          zoRefreshToken,
          zoUserJson,
          zoTokenExpiry,
          zoRefreshTokenExpiry,
          zoClientDeviceId,
          zoClientDeviceSecret,
          // --
          zostelToken,
          zostelUserJson,
          zostelTokenExpiry,
        ]) => {
          if (
            zoToken &&
            zoUserJson &&
            zostelToken &&
            zostelUserJson &&
            zoTokenExpiry &&
            zoRefreshToken &&
            zoRefreshTokenExpiry &&
            zostelTokenExpiry
          ) {
            const zoUser = JSON.parse(zoUserJson);
            const zostelUser = JSON.parse(zostelUserJson);

            storeZoAuthData(
              authRef.current.zo,
              zoToken,
              zoRefreshToken,
              zoRefreshTokenExpiry,
              zoTokenExpiry,
              zoClientDeviceId,
              zoClientDeviceSecret,
              zoUser
            );
            storeZostelAuthData(
              authRef.current.zostel,
              zostelToken,
              zostelToken,
              zostelTokenExpiry,
              zostelTokenExpiry,
              zostelUser.user_id,
              zostelUser
            );
            // Assigning above, because tokens are needed for refresh token request.
            if (checkExpiry(zoTokenExpiry)) {
              if (checkExpiry(zoRefreshTokenExpiry)) {
                logOut();
              } else {
                refreshTokenThenSaveAndLogin(zoRefreshToken);
              }
              return;
            }

            checkLogin()
              .then((status) => {
                if (status === 200) {
                  setAuthState({
                    isLoading: false,
                    error: null,
                    isAuthenticated: true,
                  });
                } else {
                  throw new Error("LOGIN_CHECK_FAILED");
                }
              })
              .catch((er) => {
                logAxiosError(er);
                refreshTokenThenSaveAndLogin(zoRefreshToken);
              });
          } else {
            logOut();
          }
        }
      )
      .catch((er) => logOut());
  };

  const refreshTokenThenSaveAndLogin = useCallback((refreshToken: string) => {
    refreshZoToken(refreshToken)
      .then((data) => {
        storeZoAuthData(
          authRef.current.zo,
          data.access_token,
          data.refresh_token,
          data.refresh_token_expiry,
          data.access_token_expiry,
          data.device_id,
          data.device_secret,
          data.user
        );
        saveZoAuthData(data);
        setAuthState({
          isLoading: false,
          error: null,
          isAuthenticated: true,
        });
      })
      .catch((er) => {
        logAxiosError(er);
        logOut();
      });
  }, []);

  useEffect(() => {
    loadAuthState();
  }, []);

  const logOut = useCallback(() => {
    return storage
      .clearAll()
      .then(() => {})
      .finally(() => {
        // Clear headers from both axios instances
        Object.values(axiosInstances).forEach((instance: AxiosInstance) => {
          // Remove auth-related headers
          delete instance.defaults.headers.common["authorization"];
          delete instance.defaults.headers.common["client-device-id"];
          delete instance.defaults.headers.common["client-user-id"];
        });

        // Clear query cache
        queryClient.clear();

        // Reset both states
        authRef.current.zo = getNullZoValues();
        authRef.current.zostel = getNullZostelValues();

        authRef.current.zo.clientDeviceId = randomUUID();
        authRef.current.zo.clientDeviceSecret = randomUUID();
        authRef.current.zostel.clientUserId = randomUUID();

        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
        console.log("--LOGGED OUT--");
      });
  }, []);

  // Refresh Zo tokens/session
  const refreshZo = async () => {
    if (
      !authRef.current.zo.token ||
      !authRef.current.zo.clientDeviceId ||
      !authRef.current.zo.clientDeviceSecret ||
      !authRef.current.zo.refreshToken
    ) {
      // logout.
      return;
    }
    // refreshZoToken(authRef.current.zo.refreshToken).then(data => {

    // })

    try {
      setAuthState((prev) => ({ ...prev, isLoading: true }));

      // In a real implementation, you would call the refresh API
      // For now, we'll use a mock response
      const mockResponse = {
        token: "zo_refreshed_token",
        tokenExpiry: "zo_token_expiry",
      };

      // Save new token to secure storage
      await storage.storeMultipleData([
        ["ZO_TOKEN", mockResponse.token],
        ["ZO_TOKEN_EXPIRY", mockResponse.tokenExpiry],
      ]);

      // Update state with the new token

      // setAuthState((prev) => ({
      //   ...prev,
      //   isLoading: false,
      //   zo: {
      //     ...prev.zo,
      //     token: mockResponse.token,
      //     tokenExpiry: mockResponse.tokenExpiry,
      //   },
      // }));
    } catch (error) {
      console.error("Zo refresh error:", error);
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Failed to refresh Zo session",
      }));
    }
  };

  // Refresh Zostel tokens/session
  const refreshZostel = async () => {
    return;
    if (!authRef.current.zostel.token) return;

    try {
      setAuthState((prev) => ({ ...prev, isLoading: true }));

      // In a real implementation, you would call the refresh API
      // For now, we'll use a mock response
      const mockResponse = {
        token: "zostel_refreshed_token",
        tokenExpiry: "zostel_token_expiry",
      };

      // Save new token to secure storage
      await storage.storeMultipleData([
        ["ZOSTEL_TOKEN", mockResponse.token],
        ["ZOSTEL_TOKEN_EXPIRY", mockResponse.tokenExpiry],
      ]);

      // Update state with the new token
      // setAuthState((prev) => ({
      //   ...prev,
      //   isLoading: false,
      //   zostel: {
      //     ...prev.zostel,
      //     token: mockResponse.token,
      //     tokenExpiry: mockResponse.tokenExpiry,
      //   },
      // }));
    } catch (error) {
      console.error("Zostel refresh error:", error);
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Failed to refresh Zostel session",
      }));
    }
  };

  const { mutateAsync: requestZostelCred } = useMutation(
    "AUTH_REQUEST_OTP_ZOSTEL"
  );
  const { mutateAsync: activateZostel } = useMutation("ZOSTEL_AUTH_ACTIVATE");
  const { mutateAsync: activateZoAsync } = useMutation("AUTH_LOGIN_MOBILE");

  const loginZoZo = useCallback(
    (mobile_country_code: string, mobile_number: string, otp: string) => {
      let zoData: ZoAuthResponse | null = null;
      let zostelData: ZostelAuthResponse | null = null;

      return activateZoAsync({
        mobile_country_code,
        mobile_number,
        otp,
      })
        .then((data) => {
          if (data.status !== 200) {
            throw new Error("INVALID_OTP");
          }
          return data.data;
        })
        .catch((er) => {
          logAxiosError(er);
          throw new Error("INVALID_OTP");
        })
        .then((data) => {
          zoData = data;
          authRef.current.zo.token = data.token;
          authRef.current.zo.refreshToken = data.refresh_token;
          authRef.current.zo.refreshTokenExpiry = data.refresh_token_expiry;
          authRef.current.zo.tokenExpiry = data.valid_till;
          authRef.current.zo.user = data.user;
          authRef.current.zo.clientDeviceId = data.device_id;
          authRef.current.zo.clientDeviceSecret = data.device_secret;
        })
        .then(() => requestZostelCred({}))
        .then((data) =>
          activateZostel({
            mobile_country_code: data.data.mobile_country_code,
            mobile: data.data.mobile_number,
            otp: data.data.code,
          }).catch((er) => {
            logAxiosError(er);
            throw new Error("ACTIVATE_ZOSTEL_FAILED");
          })
        )
        .then((data) => {
          if (data.status !== 200) {
            throw new Error("ACTIVATE_ZOSTEL_FAILED");
          }
          return data.data;
        })
        .then((data) => {
          zostelData = data;
          authRef.current.zostel.token = data.user_token;
          authRef.current.zostel.refreshToken = data.user_token;
          authRef.current.zostel.refreshTokenExpiry = data.token_expiry;
          authRef.current.zostel.tokenExpiry = data.token_expiry;
          authRef.current.zostel.user = data.user;
        })
        .then(() => {
          if (zoData && zostelData) {
            return Promise.all([
              saveZoAuthData(zoData),
              saveZostelAuthData(
                zostelData,
                authRef.current.zostel.clientUserId!
              ),
            ]);
          } else {
            throw new Error("FAILED_TO_SAVE_TO_STORAGE");
          }
        })
        .then(() => {
          if (zoData && zostelData) {
            setAuthState({
              isLoading: false,
              isAuthenticated: true,
              error: null,
            });
            return true;
          } else {
            throw new Error("FAILED_TO_SAVE_TO_STORAGE");
          }
        })
        .finally(() => setAuthState((prev) => ({ ...prev, isLoading: false })));
    },
    [requestZostelCred, activateZostel, activateZoAsync]
  );

  const contextValue: AuthContextProps = useMemo(
    () => ({
      authState,
      loginZoZo,
      logout: logOut,
      getZoAuthHeaders,
      getZostelAuthHeaders,
    }),
    [authState, loginZoZo, logOut]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

// Custom hook for using the auth context
export const useAuth = () => useContext(AuthContext);

const getNullZoValues = () => ({
  token: null,
  refreshToken: null,
  refreshTokenExpiry: null,
  tokenExpiry: null,
  user: null,
  clientDeviceId: null,
  clientDeviceSecret: null,
});

const getNullZostelValues = () => ({
  token: null,
  refreshToken: null,
  refreshTokenExpiry: null,
  tokenExpiry: null,
  user: null,
  clientUserId: null,
});

const checkLogin = () =>
  axiosInstances[ApiServer.ZO]
    .get(`/api/v1/auth/login/check/`)
    .then((res) => res.status);

const refreshZoToken = (refresh_token: string) =>
  axiosInstances[ApiServer.ZO]
    .post(`/api/v1/auth/login/refresh/`, {
      refresh_token,
    })
    .then((res) => res.data as ZoAuthResponse);

const checkExpiry = (expiry: string) =>
  moment(expiry).isSameOrBefore(moment(), "day");

const saveZoAuthData = (zoData: ZoAuthResponse) =>
  storage.storeMultipleData([
    ["ZO_TOKEN", zoData.token],
    ["ZO_TOKEN_EXPIRY", zoData.valid_till],
    ["ZO_REFRESH_TOKEN", zoData.refresh_token],
    ["ZO_REFRESH_TOKEN_EXPIRY", zoData.refresh_token_expiry],
    ["ZO_USER", JSON.stringify(zoData.user)],
    ["ZO_CLIENT_DEVICE_ID", zoData.device_id],
    ["ZO_CLIENT_DEVICE_SECRET", zoData.device_secret],
  ]);

const saveZostelAuthData = (
  zostelData: ZostelAuthResponse,
  clientUserId: string
) =>
  storage.storeMultipleData([
    ["ZOSTEL_TOKEN", zostelData.user_token],
    ["ZOSTEL_TOKEN_EXPIRY", zostelData.token_expiry],
    ["ZOSTEL_REFRESH_TOKEN", zostelData.user_token],
    ["ZOSTEL_REFRESH_TOKEN_EXPIRY", zostelData.token_expiry],
    ["ZOSTEL_USER", JSON.stringify(zostelData.user)],
    ["ZOSTEL_CLIENT_USER_ID", clientUserId],
  ]);

const storeZoAuthData = (
  zoObject: ZoState,
  zoToken: string,
  zoRefreshToken: string,
  zoRefreshTokenExpiry: string,
  zoTokenExpiry: string,
  zoClientDeviceId: string,
  zoClientDeviceSecret: string,
  zoUser: any
) => {
  zoObject.token = zoToken;
  zoObject.refreshToken = zoRefreshToken;
  zoObject.refreshTokenExpiry = zoRefreshTokenExpiry;
  zoObject.tokenExpiry = zoTokenExpiry;
  zoObject.clientDeviceId = zoClientDeviceId;
  zoObject.clientDeviceSecret = zoClientDeviceSecret;
  zoObject.user = zoUser;
};

const storeZostelAuthData = (
  zostelObject: ZostelState,
  zostelToken: string,
  zostelRefreshToken: string,
  zostelRefreshTokenExpiry: string,
  zostelTokenExpiry: string,
  zostelClientUserId: string,
  zostelUser: any
) => {
  zostelObject.token = zostelToken;
  zostelObject.refreshToken = zostelRefreshToken;
  zostelObject.refreshTokenExpiry = zostelRefreshTokenExpiry;
  zostelObject.tokenExpiry = zostelTokenExpiry;
  zostelObject.clientUserId = zostelClientUserId;
  zostelObject.user = zostelUser;
};
