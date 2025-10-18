import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Platform } from "react-native";
import {
  getLastKnownPositionAsync,
  LocationObject,
  LocationPermissionResponse,
  useForegroundPermissions,
} from "expo-location";
import { useAuth } from "@/context/AuthContext";
import useQuery from "@/hooks/useQuery";
import { logAxiosError } from "@/utils/network";
import useMutation from "@/hooks/useMutation";
import { WhereaboutsV2 } from "@/definitions/profile";
import {
  deviceLocationToWhereabouts,
  getDistanceFromLatLonInKm,
} from "@/utils/geo";
import { storeAndroidLS, useGeoState, useSetGeoState } from "@/utils/store/geo";
import { useReactiveRef } from "@/utils/hooks";

interface LocationContextType {
  createWhereAbout: () => Promise<boolean>;
}

const LocationContext = createContext<LocationContextType>({
  createWhereAbout: () => Promise.reject("Not implemented"),
});

const precision = 10;
const LocationProvider = ({ children }: { children: React.ReactNode }) => {
  const [status, requestPermission] = useForegroundPermissions();
  const [location, setLocation] = useState<LocationObject | null>(null);

  const {
    authState: { isAuthenticated },
  } = useAuth();

  const {
    data: whereabouts,
    refetch: refetchWhereAbouts,
    isLoading,
  } = useQuery("WHERE_ABOUTS", {
    enabled: Boolean(isAuthenticated),
    throwOnError(error) {
      logAxiosError(error);
      return false;
    },
    select: (data) => data.data,
  });

  const { mutateAsync: _updateWhereabouts } = useMutation("WHERE_ABOUTS");

  const updateWhereabouts = useCallback(
    (whereabouts: Omit<WhereaboutsV2, "created_at" | "updated_at">) =>
      _updateWhereabouts(whereabouts)
        .then(() => refetchWhereAbouts())
        .then((data) => data.data),
    [_updateWhereabouts, refetchWhereAbouts]
  );

  const wbRef = useReactiveRef(whereabouts);

  const processLocationPermission = useCallback(
    (status: LocationPermissionResponse) => {
      if (Platform.OS === "android" && status.status === "granted") {
        storeAndroidLS();
      }
      return status;
    },
    []
  );

  const createWhereAbout = useCallback(
    () =>
      requestPermission()
        .then(processLocationPermission)
        .then((status) => status?.status === "granted")
        .then((isGranted) => {
          if (!isGranted) {
            throw new Error("LOCATION_PERMISSION_NOT_GRANTED");
          }
          return getLastKnownPositionAsync();
        })
        .then((data) => {
          if (!data) {
            throw new Error("LOCATION_FETCH_ERROR");
          }
          setLocation(data);
          return data;
        })
        .then((location) => {
          const wb = wbRef.current;
          if (wb?.location && wb?.place_name && wb.place_ref_id) {
            const dx = getDistanceFromLatLonInKm(
              wb.location.lat,
              wb.location.long,
              location.coords.latitude,
              location.coords.longitude
            );
            if (dx < precision) {
              return true;
            }
          }
          return deviceLocationToWhereabouts(location)
            .then((whereAbout) => updateWhereabouts(whereAbout))
            .then(() => true);
        }),
    [requestPermission, updateWhereabouts, getLastKnownPositionAsync]
  );

  const setGeoState = useSetGeoState();

  useEffect(() => {
    setGeoState({
      state: {
        status,
        whereabout: whereabouts,
        location,
        isLoading,
      },
    });
  }, [status, whereabouts, location, isLoading]);

  useEffect(() => {
    if (status?.status === "granted") {
      getLastKnownPositionAsync().then(setLocation);
    }
  }, [status?.status]);

  const value = useMemo(
    () => ({
      createWhereAbout,
    }),
    [createWhereAbout]
  );

  return useMemo(
    () => <LocationContext.Provider value={value} children={children} />,
    [value, children]
  );
};

export const useLocation = () => {
  const locationData = useContext(LocationContext);
  const { isLoading, location, status, whereabout } = useGeoState();
  return useMemo(
    () => ({
      ...locationData,
      isLoading,
      location,
      status,
      whereabouts: whereabout,
    }),
    [isLoading, location, status, whereabout, locationData]
  );
};

export default LocationProvider;
