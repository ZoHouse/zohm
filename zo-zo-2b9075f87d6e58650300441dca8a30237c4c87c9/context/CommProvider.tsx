import {
  SocketMessageRequest,
  SocketMessageResponse,
} from "@/definitions/thread";
import useAppState from "@/hooks/useAppState";
import useSocket from "@/hooks/useSocket";
import { useIsFocused } from "@react-navigation/native";
import React, {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import storage from "@/utils/storage";

interface CommProviderProps extends PropsWithChildren {}

interface CommContextType {
  sendSocketMessage: (message: SocketMessageRequest) => void;
  message: SocketMessageResponse | null;
  accountId: string | null;
  isConnecting: boolean;
  isConnected: boolean;
}

const CommContext = createContext<CommContextType>({
  sendSocketMessage: () => {},
  message: null,
  accountId: null,
  isConnecting: false,
  isConnected: false,
});

const CommProvider: React.FC<CommProviderProps> = ({ children }) => {
  const { reset, sendSocketMessage, message, isConnected, isConnecting } =
    useSocket("COMM");
  const appState = useAppState();
  const isFocused = useIsFocused();

  const [accountId, setAccountId] = useState<string>("");
  const [appId, setAppId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      storage.getData("COMM_ACCOUNT_ID"),
      storage.getData("COMM_APP_ID"),
      storage.getData("COMM_TOKEN"),
      storage.getData("COMM_TOKEN_EXPIRY"),
    ]).then(([accountId, appId, token, tokenExpiry]) => {
      if (
        tokenExpiry &&
        new Date(tokenExpiry) > new Date() &&
        accountId &&
        appId &&
        token
      ) {
        setAccountId(accountId);
        setAppId(appId);
        setToken(token);
      }
    });
  }, []);

  useEffect(() => {
    if (appState === "active" && isFocused) {
      if (!isConnected) {
        if (accountId && appId && token) {
          console.log("[COMM] Reconnecting...");
          reset(
            `${process.env.EXPO_PUBLIC_ZO_SOCKET_BASE_URL}?account_id=${accountId}&app_id=${appId}&token=${token}`
          );
        }
      }
    } else {
      if (isConnected) {
        console.log("[COMM] Disconnecting...");
        reset(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appState, isConnected, isFocused]);

  useEffect(() => {
    if (accountId && appId && token) {
      reset(
        `${process.env.EXPO_PUBLIC_ZO_SOCKET_BASE_URL}?account_id=${accountId}&app_id=${appId}&token=${token}`
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId, appId, token]);

  const value = useMemo(
    () => ({
      sendSocketMessage,
      message,
      accountId,
      isConnecting,
      isConnected,
    }),
    [accountId, isConnected, isConnecting, message, sendSocketMessage]
  );

  return useMemo(
    () => <CommContext.Provider value={value}>{children}</CommContext.Provider>,
    [children, value]
  );
};

export const useComm = () => useContext(CommContext);

export default CommProvider;
