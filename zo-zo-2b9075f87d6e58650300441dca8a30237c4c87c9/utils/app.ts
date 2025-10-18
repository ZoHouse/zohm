import { Platform } from "expo-modules-core";
import * as Device from "expo-device";
import * as Application from "expo-application";
import { randomUUID } from "expo-crypto";
import storage from "@/utils/storage";

export const fetchOrGetdeviceId = async () => {
  try {
    const existingId = await storage.getData("DEVICE_ID");
    if (existingId) {
      return existingId;
    }
    let newId =
      Platform.OS === "android"
        ? await Promise.resolve(Application.getAndroidId())
        : await Application.getIosIdForVendorAsync();
    newId = newId ?? randomUUID();
    await storage.storeData("DEVICE_ID", newId);
    return newId;
  } catch {
    const newId = randomUUID();
    await storage.storeData("DEVICE_ID", newId);
    return newId;
  }
};

export const getDeviceName = () =>
  Device.deviceName ??
  Device.modelName ??
  (Device.osVersion && Device.osName
    ? `${Device.osName} ${Device.osVersion}`
    : "zo");

export const isAppUpdatedOrFresh = async () =>
  storage.getData("APP_BUILD").then((v) => {
    if (v === Application.nativeBuildVersion) {
      return false;
    }
    storage.storeData("APP_BUILD", Application.nativeBuildVersion ?? "zo");
    return true;
  });
