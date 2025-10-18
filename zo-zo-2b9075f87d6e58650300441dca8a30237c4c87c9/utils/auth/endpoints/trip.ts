import {
  ApiServer,
  HttpMethod,
  MutationEndpointConfig,
  QueryEndpointConfig,
} from "@/definitions/auth";
import { SearchResult } from "@/definitions/general";
import {
  TripBooking,
  TripBookingRequest,
  TripInventory,
  TripPriceResponse,
  TripSearchItem,
} from "@/definitions/trip";

const tripQueryEndpoints = {
  BOOKINGS_TRIP: {
    server: ApiServer.ZO,
    queryKey: ["bookings", "trip"],
    url: "/api/v1/bookings/trips/",
  } as QueryEndpointConfig<SearchResult<TripSearchItem>>,
  TRIP: {
    server: ApiServer.ZO,
    queryKey: ["bookings", "trip", "inventories"],
    url: "/api/v1/bookings/trips/inventories/",
  } as QueryEndpointConfig<TripInventory>,
  TRIP_PRICING: {
    server: ApiServer.ZO,
    queryKey: ["bookings", "trip", "pricing"],
    url: "/api/v1/bookings/trips/pricing/",
  } as QueryEndpointConfig<TripPriceResponse>,
};

const tripMutationEndpoints = {
  BOOKINGS_TRIPS: {
    server: ApiServer.ZO,
    url: "/api/v1/bookings/trips/bookings/",
    method: HttpMethod.POST,
  } as MutationEndpointConfig<TripBooking, TripBookingRequest>,
};

export { tripQueryEndpoints, tripMutationEndpoints };
