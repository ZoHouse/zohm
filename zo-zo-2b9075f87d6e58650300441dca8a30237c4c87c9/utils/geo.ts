import { GooglePlace } from "@/definitions/general";
import { WhereaboutsV2 } from "@/definitions/profile";
import { LocationObject } from "expo-location";

type GeoZone =
  | "locality"
  | "administrative_area_level_2"
  | "administrative_area_level_1";

const zones: GeoZone[] = [
  "locality",
  "administrative_area_level_2",
  "administrative_area_level_1",
];

const getGoogleMapsGeoCodeUrl = (
  lat: number,
  long: number,
  zone: GeoZone = "locality"
) =>
  `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${long}&key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}&result_type=${zone}`;

const fetchGeoZone = (
  location: LocationObject,
  level: number = 0
): Promise<Record<string, any>> =>
  level >= zones.length
    ? Promise.reject("NO_PLACE_FOUND")
    : fetch(
        getGoogleMapsGeoCodeUrl(
          location.coords.latitude,
          location.coords.longitude,
          zones[level]
        )
      )
        .then((res) => res.json())
        .then((res) => (res.results || [])[0])
        .then((res) => res ?? fetchGeoZone(location, level + 1));

export const deviceLocationToWhereabouts = (location: LocationObject) => {
  return fetchGeoZone(location).then((resp) => {
    if (!resp?.place_id) {
      throw new Error("NO_PLACE_FOUND");
    }
    const place_id: string = resp.place_id;
    const addressComponents = resp.address_components;
    const city: string = Array.isArray(addressComponents)
      ? addressComponents[0].long_name
      : "";
    if (!city) {
      throw new Error("NO_PLACE_FOUND");
    }
    const wb: WhereaboutsV2 = {
      place_name: city,
      place_ref_id: place_id,
      location: {
        lat: location.coords.latitude,
        long: location.coords.longitude,
      },
    };
    return wb;
  });
};

export const getGooglePlacesApi = (query: string) =>
  `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
    query
  )}&key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}&types=(cities)`;

export const googlePlaceIdToPlaceUrl = (placeId: string) =>
  `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry&key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}`;

export const googlePlaceToProfileCity = (place: GooglePlace) =>
  fetch(googlePlaceIdToPlaceUrl(place.place_id))
    .then((res) => res.json())
    .then((placeDetails) => ({
      place_ref_id: place.place_id,
      place_name: place.name,
      home_location: {
        lat: placeDetails.result.geometry.location.lat,
        lng: placeDetails.result.geometry.location.lng,
      },
    }));

export const getDistanceFromLatLonInKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) => {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2 - lat1); // deg2rad below
  var dLon = deg2rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c; // Distance in km
  return d;
};

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}
