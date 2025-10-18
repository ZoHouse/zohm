import { useCallback, useEffect } from "react";
import {
  getToken,
  registerDeviceForRemoteMessages,
  AuthorizationStatus,
  requestPermission,
  onMessage,
  getInitialNotification,
  onNotificationOpenedApp,
  deleteToken,
} from "@react-native-firebase/messaging";
import messaging from "./messaging";
import notifee, { EventType } from "@notifee/react-native";
import navData from "@/utils/global";
import { Href, router } from "expo-router";
import useMutation from "@/hooks/useMutation";
import { useAuth } from "@/context/AuthContext";
import { isAppUpdatedOrFresh } from "@/utils/app";
import moment from "moment";
import storage from "@/utils/storage";

export const useFCM = () => {
  const {
    authState: { isAuthenticated },
  } = useAuth();
  const { mutateAsync: updateUserDevices } = useMutation("AUTH_USER_DEVICES");

  const uploadTokenToServer = useCallback((notification_token: string) => {
    updateUserDevices({ notification_token });
  }, []);

  const getNewTokenIfNeeded = useCallback(async () => {
    const isUpdated = await isAppUpdatedOrFresh();
    if (isUpdated) {
      return generateToken();
    } else {
      const [existingToken, expiry] = await Promise.all([
        storage.getData("FCM_TOKEN"),
        storage.getData("FCM_TOKEN_EXPIRY"),
      ]);
      if (existingToken && expiry && moment(expiry).isAfter(moment())) {
        // return existingToken;
        return null; // no need for server upload.
      }
      return generateToken();
    }
  }, []);

  const getFCMToken = useCallback(async () => {
    await registerDeviceForRemoteMessages(messaging);
    const token = await getNewTokenIfNeeded();
    if (token) {
      uploadTokenToServer(token);
    }
  }, []);

  const activateFCM = useCallback(async () => {
    const authStatus = await requestPermission(messaging);
    const enabled =
      authStatus === AuthorizationStatus.AUTHORIZED ||
      authStatus === AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      getFCMToken();
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      activateFCM();
    } else if (isAuthenticated === false) {
      deleteToken(messaging);
      storage.deleteMultipleData(["FCM_TOKEN", "FCM_TOKEN_EXPIRY"]);
    }
  }, [isAuthenticated]);
};

export const useNotification = () => {
  useEffect(() => {
    getInitialNotification(messaging).then((message) => {
      const data = message?.data ?? {};
      navData.notificationData = parseNotificationData(data);
    });

    const onNotificationOpenedAppListener = onNotificationOpenedApp(
      messaging,
      (message) => {
        const data = message.data;
        if (!navData.canNavigateToDeepLink) {
          return;
        }
        const parsedData = parseNotificationData(data);
        if (parsedData) {
          router.navigate(`/${parsedData.name}/${parsedData.code}` as Href);
        }
      }
    );
    let removeOnMessageListener = () => {};
    let channelId = "";
    notifee
      .createChannel({
        id: "zo",
        name: "Zostel",
      })
      .then((channelId) => {
        removeOnMessageListener = onMessage(messaging, (message) => {
          notifee.displayNotification({
            title: message.notification?.title,
            body: message.notification?.body,
            android: {
              channelId,
            },
            data: message.data,
          });
        });
        notifee.onForegroundEvent((e) => {
          if (e.type === EventType.PRESS) {
            const data = e.detail.notification?.data;
            if (!navData.canNavigateToDeepLink) {
              return;
            }
            const parsedData = parseNotificationData(data);
            if (parsedData) {
              router.navigate(`/${parsedData.name}/${parsedData.code}` as Href);
            }
          }
        });
      });

    return () => {
      onNotificationOpenedAppListener();
      removeOnMessageListener();
      if (channelId) {
        notifee.deleteChannel(channelId);
      }
    };
  }, []);
};

const parseNotificationData = (data: any) => {
  const name = data.screen_name;
  const code = data.pid ?? data.slug ?? data.code;
  if (name && typeof name === "string" && typeof code === "string") {
    return { name, code };
  }
  return null;
};

const generateToken = async () => {
  const newToken = await getToken(messaging);
  storage.storeMultipleData([
    ["FCM_TOKEN", newToken],
    ["FCM_TOKEN_EXPIRY", moment().add(7, "days").format("YYYY-MM-DD")],
  ]);
  return newToken;
};
