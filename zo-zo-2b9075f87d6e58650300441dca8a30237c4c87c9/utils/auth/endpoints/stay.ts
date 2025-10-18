import {
  ApiServer,
  HttpMethod,
  MutationEndpointConfig,
  QueryEndpointConfig,
} from "@/definitions/auth";
import {
  Booking,
  StayAvailabilityResponse,
  StayOfferedPricingResponse,
  StayOfferedRoomsResponse,
} from "@/definitions/booking";
import { Destination, Operator } from "@/definitions/discover";
import { CouponResponse } from "@/definitions/booking";
import { RequireAtLeastOne } from "type-fest";
import { CheckinRequest } from "@/definitions/checkin";

const stayQueryEndpoints = {
  STAY_OPERATORS: {
    server: ApiServer.ZOSTEL,
    queryKey: ["zostel", "stay", "operators"],
    url: "/api/v1/stay/operators/",
  } as QueryEndpointConfig<{ operator: Operator }>,
  STAY_AVAILABILITY: {
    server: ApiServer.ZOSTEL,
    queryKey: ["zostel", "stay", "availability"],
    url: `/api/v1/stay/availability/`,
  } as QueryEndpointConfig<StayAvailabilityResponse>,
  STAY_OFFERED_ROOMS: {
    server: ApiServer.ZOSTEL,
    queryKey: ["zostel", "stay", "offered", "rooms"],
    url: `/api/v1/stay/offered/rooms/`,
  } as QueryEndpointConfig<StayOfferedRoomsResponse>,
  STAY_OFFERED_PRICING: {
    server: ApiServer.ZOSTEL,
    queryKey: ["zostel", "stay", "offered", "pricing"],
    url: `/api/v1/stay/offered/pricing/`,
  } as QueryEndpointConfig<StayOfferedPricingResponse>,
  STAY_DESTINATIONS: {
    server: ApiServer.ZOSTEL,
    queryKey: ["zostel", "stay", "destinations"],
    url: `/api/v1/stay/destinations/`,
  } as QueryEndpointConfig<Destination>,
  ALL_STAY_OPERATOR: {
    server: ApiServer.ZOSTEL,
    queryKey: ["zostel", "stay", "operators"],
    url: `/api/v1/stay/operators/`,
  } as QueryEndpointConfig<{ operators: Operator[] }>,
};

const stayMutationEndpoints = {
  STAY_BOOKINGS_APPLY_COUPON: {
    server: ApiServer.ZOSTEL,
    url: "/api/v1/stay/bookings/apply_coupon/",
    method: HttpMethod.POST,
  } as MutationEndpointConfig<
    { booking: CouponResponse },
    RequireAtLeastOne<Booking>
  >,
  STAY_CHECKIN: {
    server: ApiServer.ZOSTEL,
    method: HttpMethod.POST,
    url: "/api/v1/stay/checkin/",
  } as MutationEndpointConfig<{}, CheckinRequest>,
};

export { stayQueryEndpoints, stayMutationEndpoints };
