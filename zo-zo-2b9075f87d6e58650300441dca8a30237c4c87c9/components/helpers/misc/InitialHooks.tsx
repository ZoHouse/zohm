import useMutation from "@/hooks/useMutation";
import {
  getZoCommServerHeaders,
  setZoCommServerHeaders,
} from "@/utils/auth/client";
import { memo, useCallback, useEffect } from "react";
import { Platform } from "expo-modules-core";
import * as Application from "expo-application";
import { useAuth } from "@/context/AuthContext";
import { useNotification } from "./fcmHooks";
import {
  fetchOrGetdeviceId,
  getDeviceName,
  isAppUpdatedOrFresh,
} from "@/utils/app";
import storage from "@/utils/storage";

const InitialHooks = () => {
  useRegister();
  useNotification();
  return null;
};

export default memo(InitialHooks);

function useRegister() {
  const {
    authState: { isAuthenticated },
  } = useAuth();
  const { mutateAsync: registerDevice } = useMutation("AUTH_DEVICE_REGISTER");
  const { mutateAsync: updateUserDevices } = useMutation("AUTH_USER_DEVICES");
  const { mutateAsync: getUserComms } = useMutation("AUTH_USER_COMMS");

  useEffect(() => {
    if (isAuthenticated) {
      getUserComms({})
        .then((res) => res.data)
        .then((data) => {
          setZoCommServerHeaders({
            authorization: `Bearer ${data.token}`,
            "app-id": data.app_id,
            "account-id": data.account_id,
          });
          storage.storeMultipleData([
            ["COMM_TOKEN", data.token],
            ["COMM_TOKEN_EXPIRY", data.token_expiry],
            ["COMM_APP_ID", data.app_id],
            ["COMM_ACCOUNT_ID", data.account_id],
          ]);
        });
    } else if (isAuthenticated === false) {
      storage.deleteMultipleData([
        "COMM_TOKEN",
        "COMM_TOKEN_EXPIRY",
        "COMM_APP_ID",
        "COMM_ACCOUNT_ID",
      ]);
      const headers = getZoCommServerHeaders();
      delete headers.authorization;
      delete headers["app-id"];
      delete headers["account-id"];
      setZoCommServerHeaders(headers);
    }
  }, [isAuthenticated]);

  const register = useCallback(async () => {
    const isUpdated = await isAppUpdatedOrFresh();
    if (!isUpdated) {
      return;
    }
    const deviceId = await fetchOrGetdeviceId();
    const deviceName = getDeviceName();
    const appVersion = Application.nativeApplicationVersion ?? "zo";
    const appBuild = Application.nativeBuildVersion ?? "zo";
    const platform = Platform.OS;
    registerDevice({
      platform,
      device_id: deviceId,
      app_build: appBuild,
      app_version: appVersion,
      device_name: deviceName,
    });
    updateUserDevices({
      device_id: deviceId,
      device_name: deviceName,
      client_version: appVersion,
      client_build: appBuild,
    });
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      register();
    }
  }, [isAuthenticated]);
}
