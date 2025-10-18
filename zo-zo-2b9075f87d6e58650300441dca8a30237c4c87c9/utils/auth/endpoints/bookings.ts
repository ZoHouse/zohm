import {
  ApiServer,
  HttpMethod,
  MutationEndpointConfig,
  QueryEndpointConfig,
} from "@/definitions/auth";
import {
  BookingListItem,
  BookingSeed,
  CouponValidityResponse,
  ReviewCategory,
  StayBooking,
  UpcomingBookings,
  ZoBooking,
  ZoBookingRequest,
} from "@/definitions/booking";
import { SearchResult } from "@/definitions/general";
import { TripBookingInfo } from "@/definitions/trip";

const bookingsQueryEndpoints = {
  STAY_BOOKING: {
    server: ApiServer.ZOSTEL,
    queryKey: ["bookings", "stay"],
    url: "/api/v2/stay/bookings/",
  } as QueryEndpointConfig<StayBooking>,
  ZO_BOOKINGS: {
    server: ApiServer.ZO,
    queryKey: ["bookings", "zo"],
    url: "api/v1/bookings/",
  } as QueryEndpointConfig<SearchResult<BookingListItem>>,
  BOOKINGS_LIST: {
    server: ApiServer.ZOSTEL,
    queryKey: ["bookings", "list"],
    url: `/api/v1/stay/my/bookings/list/`,
  } as QueryEndpointConfig<SearchResult<StayBooking>>,
  TRIP_BOOKINGS: {
    server: ApiServer.ZO,
    queryKey: ["bookings", "trip", "bookings"],
    url: "/api/v1/bookings/trips/bookings/",
  } as QueryEndpointConfig<SearchResult<BookingListItem>>,
  ZO_BOOKINGS_COUPON: {
    server: ApiServer.ZO,
    queryKey: ["bookings", "coupon"],
    url: "/api/v1/bookings/coupons/",
  } as QueryEndpointConfig<CouponValidityResponse>,
  TRIP_BOOKING: {
    server: ApiServer.ZO,
    queryKey: ["bookings", "trip", "booking"],
    url: "/api/v1/bookings/trips/",
  } as QueryEndpointConfig<TripBookingInfo>,
  BOOKINGS_SEED: {
    server: ApiServer.ZO,
    queryKey: ["bookings", "seed"],
    url: "/api/v1/bookings/seed/",
  } as QueryEndpointConfig<BookingSeed>,
  BOOKINGS_REVIEWS_CATEGORIES: {
    server: ApiServer.ZO,
    queryKey: ["bookings", "reviews", "categories"],
    url: "/api/v1/bookings/reviews/categories/",
  } as QueryEndpointConfig<SearchResult<ReviewCategory>>,
  UPCOMING: {
    server: ApiServer.ZO,
    queryKey: ["bookings", "zostel", "upcoming"],
    url: `/api/v1/bookings/zostel/upcoming/`,
  } as QueryEndpointConfig<UpcomingBookings>,
};

const bookingsMutationEndpoints = {
  STAY_BOOKINGS: {
    server: ApiServer.ZOSTEL,
    method: HttpMethod.POST,
    url: `/api/v2/stay/bookings/`,
  } as MutationEndpointConfig<{ booking: StayBooking }, {}>,
  ZO_BOOKINGS: {
    server: ApiServer.ZO,
    method: HttpMethod.POST,
    url: "/api/v1/bookings/",
  } as MutationEndpointConfig<ZoBooking, ZoBookingRequest>,
};

export { bookingsQueryEndpoints, bookingsMutationEndpoints };
