import { WhereaboutsV2 } from "@/definitions/profile";
import { LocationObject, PermissionResponse } from "expo-location";
import { createStore, useStore } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { voidFn } from "../data-types/fn";

type GeoState = {
  state: {
    location: LocationObject | null;
    status: PermissionResponse | null;
    whereabout: WhereaboutsV2 | undefined;
    isLoading: boolean;
  };
};

type GeoStore = GeoState & {
  setGeoState: (state: GeoState) => void;
};

const geoStore = createStore<GeoStore>()((set) => ({
  state: {
    location: null,
    status: null,
    whereabout: undefined,
    isLoading: false,
  },
  setGeoState: (state: GeoState) => set(state),
}));

export default geoStore;

export const useGeoState = () => {
  return useStore(geoStore, (state) => state.state);
};

export const useSetGeoState = () => {
  return useStore(geoStore, (state) => state.setGeoState);
};

const AndroidLocationStatus = "Zo_Android_Location";
/**
 * store recently granted location status response, to differentiate between `Allow Once` and `Deny`.
 *
 * Dumb expo doesn't differ between `Allow Once` and `Deny` in next session.
 *
 * @returns "true" if previously granted location permission
 */
export const fetchAndroidLS = () =>
  AsyncStorage.getItem(AndroidLocationStatus).catch(() => "");

export const storeAndroidLS = () =>
  AsyncStorage.setItem(AndroidLocationStatus, "true").catch(voidFn);
