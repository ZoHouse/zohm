import { Operator } from "@/definitions/discover";
import { TripSearchItem } from "@/definitions/trip";
import { MapOperator } from "@/definitions/zo";
import { getURLType } from "./search";
import { ZoCurrency } from "@/definitions/booking";
import { Linking } from "react-native";

export const toMapOperatorType = (
  operators: Operator[],
  trips: TripSearchItem[]
): MapOperator[] => {
  const result: MapOperator[] = [];

  for (const operator of operators) {
    result.push({
      name: operator.name,
      image: operator.images[0].image,
      latitude: operator.latitude,
      longitude: operator.longitude,
      code: operator.code,
      type_code: operator.type_code,
      operating_model: operator.operating_model,
      type: getURLType(operator.type_code, operator.operating_model),
    });
  }

  for (const trip of trips) {
    const [longitude, latitude] =
      trip.destinations?.find((el) => el.coordinates?.coordinates)?.coordinates
        ?.coordinates || [];
    result.push({
      name: trip.name,
      image: trip.media[0]?.url,
      latitude: latitude ?? 0,
      longitude: longitude ?? 0,
      code: trip.pid,
      type_code: "T",
      operating_model: "T",
      type: "zo-trip",
      batches: trip.batches,
      price: trip.price,
      currency: trip.currency as ZoCurrency,
    });
  }

  return result;
};

export const getMapURLType = (
  type_code: MapOperator["type_code"],
  operating_model: MapOperator["operating_model"]
) => {
  if (operating_model === "T" || type_code === "T") {
    return "zo-trip";
  }
  return getURLType(type_code, operating_model);
};

// sort the markers by their distance from the selected operator
export const sortMarkersByDistanceFromSelectedOperator = <
  T extends { latitude: number; longitude: number },
  U extends { latitude: number; longitude: number }
>(
  markers: T[],
  selectedOperator: U
) => {
  const { latitude, longitude } = selectedOperator;
  return markers.sort((a, b) => {
    const aDistance = calculateDistance({ latitude, longitude }, a);
    const bDistance = calculateDistance({ latitude, longitude }, b);
    return aDistance - bDistance;
  });
};

// calculate the distance between two points
const calculateDistance = (
  { latitude: lat1, longitude: lon1 }: { latitude: number; longitude: number },
  { latitude: lat2, longitude: lon2 }: { latitude: number; longitude: number }
) => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1); // deg2rad below
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
};

// convert degrees to radians
const deg2rad = (deg: number) => deg * (Math.PI / 180);

export const getMapSheetOptions = <
  T extends { latitude: number; longitude: number; name: string }
>(
  operator: T
) => [
  {
    id: "google-maps",
    title: "Open with Google Maps",
    onPress: () => {
      const url = `http://maps.google.com/?q=${operator.latitude},${operator.longitude}`;
      Linking.openURL(url);
    },
  },
  {
    id: "apple-maps",
    title: "Open with Apple Maps",
    onPress: () => {
      const scheme = "maps:0,0?q=";
      const latLng = `${operator.latitude},${operator.longitude}`;
      const url = `${scheme}${operator.name}@${latLng}`;
      Linking.openURL(url);
    },
  },
];
