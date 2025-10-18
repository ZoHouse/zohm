import { ProfileFields } from "@/utils/profile";
import { Operator } from "./discover";
import { ApplicationSeed } from "./auth";

export interface Currency {
  symbol: string;
  name: string;
  decimals: number;
}

export interface Destination {
  [key: string]: any;
}

export interface Media {
  id: string;
  category: string;
  url: string;
  metadata: {
    alt: string;
    title: string;
    description: string;
  };
  sort_index: number;
  image: string;
}

// ------------------------------------------------------------

export interface StayAvailabilityItem {
  units: number;
  bookable: boolean;
  room_id: number;
  date: string;
}

export interface StayPricingItem {
  room_id: number;
  date: string;
  price: number;
  base_price: number;
  slab_active: boolean;
  tax_breakup: {
    category: string;
    cgst: number;
    cgst_percent: number;
    sgst: number;
    sgst_percent: number;
  };
  offered_price?: number;
}

export interface StayOfferItem {
  id: number;
  name: string;
  status: number;
  discount_type: number;
  discount_value: number;
  max_discount_value?: number;
  min_booking_nights: number;
  max_booking_nights?: number;
  min_booked_on_datetime?: string;
  max_booked_on_datetime?: string;
  min_booking_datetime?: string;
  max_booking_datetime?: string;
  inventory_name: string;
  inventory_description: string;
  inventory: number;
  inventories: number[];
  duplicate?: boolean;
  addons: number[];
  max_booked_on_delta?: number;
  sell_base_inventory?: boolean;
  is_suffix_text?: boolean;
  booking_weekdays: number[];
  blackout_dates: string[];
}

export interface StayAvailabilityResponse {
  availability: StayAvailabilityItem[];
  pricing: StayPricingItem[];
  offers: StayOfferItem[];
}

export type StayOfferedRoomsResponse = {
  dates: {
    checkin: string;
    checkout: string;
    nights: number;
  };
  rooms: (Operator["rooms"][number] & {
    ref_id: string;
    availability: {
      available: boolean;
      units: number;
    };
    has_offer: true;
    offer?: {
      id: number;
      name: string;
      tag: string;
      is_suffix_text: boolean;
      inventory_name: string;
      inventory_description: string;
    };
    price: {
      base_price: number;
      per_night: number;
      discount: number;
      final: number;
    };
    nights: number;
  })[];
};

export interface StayOfferedPricingResponse {
  availability: StayAvailabilityItem[];
  // offered_rooms: StayOfferedRoomsResponse[];
}

// -------------

export type BookingGuest = {
  name: string;
  mobile: string;
  email: string;
  gender: number;
  address?: string;
  first_name?: string;
  last_name?: string;
  country?: string;
  sso_user_id?: string;
};

export type TrackingInfo = {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_referrer: string;
};

export type BookingRoom = {
  id: number;
  count: number;
  _ref?: string;
  offer_id?: number;
  addons?: Array<{ id: number; count: number }>;
};

export type Booking = {
  checkin: string;
  checkout: string;
  property_code: string;
  coupon_code?: string;
  guests?: BookingGuest[];
  rooms: BookingRoom[];
  track?: TrackingInfo;
};

export type FormGuest = {
  firstName: string;
  lastName: string;
  gender?: (typeof ProfileFields.gender)[number];
  email?: string;
  phone?: string;
  isOptional?: boolean;
  isFirst?: boolean;
  countryCode?: ApplicationSeed["mobile_country_codes"][number];
};

export interface StayBookingCheckin {
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    mobile: string;
    email_verified: boolean;
    mobile_verified: boolean;
    mobile_country_code: string;
  };
  approved: boolean;
  arrival_on: string;
  departure_on: string;
  checkin_at: string;
  next_destination: string;
  coming_from: string;
  arrival_time: string | null;
  departure_time: string | null;
}

export interface StayBooking {
  code: string;
  operator: Operator;
  guests: BookingGuest[];
  checkin: string;
  tax_amount: number;
  checkout: string;
  web_checkin_approved?: boolean
  total_amount: number;
  advance_amount: number;
  paid_amount: number;
  can_pay_later: boolean;
  gst_num: string | null;
  status:
    | "confirmed"
    | "pending"
    | "cancelled"
    | "requested"
    | "noshow"
    | "checked_in"
    | "checked_out";
  time_create: string;
  time_update: string;
  discount: number;
  coupon_code?: string;
  manager_notes?: string | null;
  guest_notes?: string | null;
  auto_cancel_at?: string | null;
  offer_discount: number;
  final_amount: number;
  amount: number;
  origin: number;
  web_checkin_completed: boolean;
  total_addon_amount: number;
  total_amount_with_addons: number;
  checkins: StayBookingCheckin[];
  payments: [
    {
      email: string;
      mobile: string;
      first_name: string;
      last_name: string;
      client_reference_id: string;
      client_name: string;
      amount: number;
      order_description: string;
      status: "In Progress";
      product_id: string;
      operator_code: string;
      payment_mode: "PG via Payment Gateway" | "Paid via Credits";
    }
  ];
  source: {};
  rooms_info: {
    guest: BookingGuest;
    price: number;
    nights: number;
    ref_id: string;
    status: number;
    checkin: string;
    checkout: string;
    discount: number;
    asset_name: string;
    paid_amount: number;
    tax_breakup: {
      cgst: number;
      sgst: number;
    };
    total_amount: number;
    extra_charges: number;
    unit_sequence: string;
    advance_amount: number;
    inventory_name: string;
    transaction_id: string;
    paid_extra_charges: number;
  }[];
  rooms: {
    id: number;
    date: string;
    units: number;
    price: number;
    occupancy: number;
    inventory: {
      name: string;
      occupancy: number;
      image: string;
    };
    tax_breakup: {
      cgst: number;
      sgst: number;
    };
    discount: number;
    total_amount: number;
    addons: [];
    offer_discount: number;
    final_amount: number;
    unit_sequence: number;
    ref_id: string;
    status: number;
  }[];
  payment?: {
    amount: number | null;
  };
}

export interface BookingCancellationError {
  success: false;
  error: string;
  key: "guest_error" | "source_error";
  title: string;
  description: string;
}

export interface BookingCancellationResponse {
  refund_amount: number;
  refunds: StayBooking["payments"];
}

export interface StayCancellationPolicy {
  start_date: string | null;
  end_date: string | null;
  min_days_before_checkin: number;
  max_days_before_checkin: number | null;
  cancellation_charge: number;
  operator: number;
}

export interface StayCancellationInfoResponse {
  cancellation_policy: StayCancellationPolicy[];
}

export type FeedPricingItem = {
  offered_price: number;
  base_price: number;
  price: number;
  discount: number;
  has_offer: boolean;
};

export type FeedAvailabilityItem = {
  // isAvailable: boolean;
  // maxUnits: number;
  // isBookable: boolean;
  available: boolean;
  units: number;
};

export type CouponResponse = {
  advance_amount: number;
  auto_cancel_at: string;
  can_pay_later: boolean;
  checkin: string;
  checkout: string;
  code: string;
  coupon_code: string;
  discount: number;
  final_amount: number;
  gst_num: string;
  guest_notes: string;
  guests: any[];
  manager_notes: string;
  offer_discount?: number;
  paid_amount: number;
  rooms: {
    id: number;
    date: string;
    units: number;
    price: number;
    occupancy: number;
    inventory: {
      name: string;
      occupancy: number;
      image: string;
    };
    tax_breakup: {
      cgst: number;
      sgst: number;
      category: string;
      cgst_percent: number;
      sgst_percent: number;
    };
    discount: number;
    total_amount: number;
    addons: [];
    offer_discount: number;
    final_amount: number;
    unit_sequence: number;
    asset: null;
    ref_id: null;
    status: number;
  }[];
  status: string;
  tax_amount: number;
  total_amount: number;
  operator: Operator;
};

export interface ZostelCurrency {
  id: string;
  value: string;
  symbol: string;
}

export interface ZoCurrency {
  name: string;
  code: string;
  decimals: number;
  symbol: string;
}

export interface ZostelExchangeRate {
  from: string;
  to: string;
  rate: number;
}

export interface Review {
  id: string;
  booking_ref_id: string;
  rating: number;
  comment: string;
  source: string;
  media: Media[];
  segments: ReviewSegment[];
  is_post_checkout: boolean;
}

export interface BookingListItem {
  code: string;
  operator: {
    name: string;
    code: string;
    slug: string;
    tagline: string | null;
    title: string;
    checkin_enabled: boolean;
    cover_image: string;
  };
  checkin: string;
  tax_amount: number;
  checkout: string;
  total_amount: number;
  advance_amount: number;
  paid_amount: number;
  status: StayBooking["status"];
  time_create: string;
  discount: number;
  coupon_code: string;
  offer_discount: number;
  final_amount: number;
  amount: number;
  web_checkin_completed: boolean;
}

export interface CouponValidityResponse {
  status: "active" | "expired" | "invalid";
  applicable_before: string;
  applicable_after: string;
  discount: number;
  // discount_type: "percentage" | "fixed";
  // discount_value: number;
  // max_discount_value: number;
  // min_booking_nights: number;
  // max_booking_nights: number;
}

export interface ZoBooking {}

export interface ZoBookingRequest {}

export interface BookingSeed {
  booking: {
    cancellation_reasons: string[];
  };
  trip_category_tags?: {
    title: string;
    tag: string;
    emoji: string;
  }[];
  trip_filter_tags?: {
    title: string;
    tag: string;
    emoji: string;
  }[];
}

export interface ReviewCategory {
  id: number;
  name: string;
  description: string;
  sort_index: number;
}

export interface ReviewSegment {
  id: string;
  category: {
    id: number;
    name: string;
    description: string;
    sort_index: number;
  };
  rating: number;
  comment: string;
  media: Media[];
}

export interface UpcomingBookings {
  upcoming: StayBooking[];
  pending_review: StayBooking[];
  active: StayBooking[];
}
