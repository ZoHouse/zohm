import moment from "moment";
import { ApplicationSeed } from "./auth";
import { Currency, Destination, Media, ZoCurrency } from "./booking";
import { ZoCountry } from "./zo";
import { GeneralObject } from "./general";

export interface TripSearchItem {
  name: string;
  slug: string;
  type: string;
  pid: string;
  short_description: string;
  price: number;
  sort_index: number;
  duration: number;
  category: string;
  status: string;
  currency: Currency;
  destinations?: TripDestination[];
  batches: string[];
  media: Media[];
  itinerary: {
    media: Media[];
  };
}

export interface TripDestination {
  name: string;
  code: string;
  country: string;
  timezone: string;
  twitter_handle?: string | null;
  coordinates?: {
    type: string;
    coordinates: [number, number];
  };
}

export interface TripCancellationPolicy {
  description: string;
  start_at: string | null;
  end_at: string | null;
  cancellation_charge: number;
  min_hours_till_start: number;
  max_hours_till_start: number | null;
  inventory: {
    pid: string;
    name: string;
  };
}

export interface TripInfoItem {
  title: string;
  description: string;
  icon: string;
  sort_index: number;
}

export interface TripItem {
  name: string;
  description: string;
  icon: string;
  sort_index: number;
}

export type TripItinerary = {
  sort_index: number;
  title: string;
  icon: string;
  day: number;
  stops: TripStop[];
  policies: TripInventory["guest_policies"];
} & Pick<
  TripInventory,
  | "exclusions"
  | "essentials"
  | "inclusions"
  | "highlights"
  | "pickup_location"
  | "drop_location"
  | "duration"
  | "pid"
  | "faqs"
  | "whatsapp_number"
  | "enquiry_form"
  | "media"
  | "description"
  | "short_description"
>;

export type TripStop = {
  sort_index: number;
  title: string;
  description: string;
  icon: string;
  day: number;
  media: Media[];
};

export interface TripSku {
  pid: string;
  name: string;
  inventory: string;
  dates: string[];
  itinerary: string;
}

export interface TripInventory {
  duration: number;
  currency: ZoCurrency;
  cancellation_policies: TripCancellationPolicy[];
  is_international: boolean;
  destinations?: TripDestination[];
  batches?: string[];
  slug: string;
  pid: string;
  sort_index: number;
  name: string;
  description: string;
  type: number;
  subcategory: string;
  occupancy: number | null;
  tax_category: number;
  applicable_taxes: string[];
  short_description: string;
  slots: null;
  booking_constraints: Record<string, any>;
  operator: string;
  questionnaire: null;
  node: null;
  enquiry_form: string;
  drop_location: string;
  pickup_location: string;
  whatsapp_number: string;
  phone?: string;
  email?: string;
  highlights: TripInfoItem[];
  faqs: TripInfoItem[];
  essentials: TripItem[];
  exclusions: TripInfoItem[];
  inclusions: TripInfoItem[];
  guest_policies: TripInfoItem[];
  policies: TripInfoItem[];
  status: "active";
  category: "fixed-itinerary";
  local_map: Media[];
  media: Media[];
  skus: TripSku[];
  itinerary: TripItinerary[];
  starting_availability?: number;
  starting_price?: number;
}

export interface TripAvailability {
  date: string;
  pid: string;
  sellable: boolean;
  slot: number | null;
  units: number;
}

export interface TripTax {
  category: string;
  currency: ZoCurrency;
  country_tax: number;
  country_tax_percent: number;
  state_tax: number;
  state_tax_percent: number;
  tax_amount: number;
  tcs?: number;
  tcs_base?: number;
  tcs_percent?: number;
}

export interface TripPricing {
  pid: string;
  date: string;
  strike_price: number;
  strike_price_taxed: number;
  price: number;
  price_taxed: number;
  labels: { name: string; discount: number }[];
  currency: {
    name: string;
    code: string;
    decimals: number;
    symbol: string;
  };
  tax?: TripTax;
  strike_tax?: TripTax;
  tcs_rates?: {
    default: number;
    excess: number;
  };
}

export interface TripAddonPricing {
  id: string;
  name: string;
  description?: string;
  prices: {
    date: string;
    price: number;
    price_taxed: number;
    currency: {
      name: string;
      code: string;
      decimals: number;
      symbol: string;
    };
    price_id: string;
    tax: TripTax;
  }[];
}

export interface TripPriceResponse {
  pricing: TripPricing[];
  availability: TripAvailability[];
  addon_pricing: TripAddonPricing[];
}

export interface TripGuest {
  name: string;
  mobile?: string;
  email?: string;
  uri?: string;
  id?: string;
  isSelf?: boolean;
  date_of_birth?: string;
  gender?: string;
  countryCode?: ApplicationSeed["mobile_country_codes"][number];
  country?: ZoCountry;
  address?: string;
}

/**
 * ```json
 * {
    "first_name": "FN",
    "last_name": "LN",
    "gender": "Male",
    "email": "zozo@zo.xyz",
    "mobile": "1-800-WHAT-EVER",
    "nationality": "IND",
    "address": ""
}
 */
export interface ZoServerGuest {
  first_name: string;
  mobile: string;
  email: string;
  date_of_birth: string;
  address?: string;
  gender: string;
  nationality: string;
}

export type TripContact = {
  id: string;
  name: string;
  mobile?: string;
  email?: string;
  address?: string;
  birthday?: moment.Moment;
};

export interface TripBooking {
  coupon: null | string;
  created_at: string;
  updated_at: string;
  pid: string;
  start_at: string;
  end_at: string;
  started_at: null | string;
  ended_at: null | string;
  price: number;
  offer_discount: number;
  coupon_discount: number;
  tax_amount: number;
  advance_amount: number;
  currency: ZoCurrency;
  total_amount: number;
  final_amount: number;
  due_amount: number;
  booked_skus: {
    currency: Currency;
    customers: GeneralObject[];
    booked_addons: {
      name: string;
      price: number;
      units: number;
      addon_id: string;
      offer_discount: number;
    }[];
    date: string;
    slot: null | string;
    price: number;
    offer_discount: number;
    coupon_discount: number;
    tax_details: TripTax;
  }[];
  payments: {
    email: string;
    mobile: string;
    first_name: string;
    last_name: string;
    client_reference_id: string;
    client_name: string;
    amount: number;
    intent: "collect" | "refund";
    currency: string;
    order_description: string;
    status: "in-progress" | "success";
    payment_mode: "gateway" | "credits";
    merchant: string;
    product_id: string;
    operator_code: string;
    hash: string;
  }[];
}

export interface TripBookingRequest {
  sku: string;
  date: string;
  units: number;
  addons: string[];
  tcs_declaration: boolean;
  coupon_code?: string;
  credits_to_spend?: number;
  preview?: boolean;
}

export interface TripBookingInfo {
  user: {
    pid: string;
    first_name: string;
    last_name: string;
    nickname: string;
    pfp_image: string;
    twitter_handle: string;
    avatar: {
      ref_id: number;
      image: string;
      metadata: string;
    };
  };
  status: "pending" | "confirmed" | "cancelled" | "requested";
  inventory_types: ["trip"];
  booked_skus: TripBookingSku[];
  customers: [];
  offers: [];
  total_amount: number;
  final_amount: number;
  due_amount: number;
  payments: {
    email: string;
    mobile: string;
    first_name: string;
    last_name: string;
    client_reference_id: string;
    client_name: string;
    amount: number;
    intent: "collect" | "refund";
    currency: string;
    order_description: string;
    status: "in-progress" | "success";
    payment_mode: "gateway" | "credits";
    merchant: string;
    product_id: string;
    operator_code: string;
    hash: string;
  }[];
  currency: ZoCurrency;
  operator: {
    pid: string;
    name: string;
    destination?: TripDestination;
    alt_name: string;
    media: Media[];
  };
  kyc_documents: [
    {
      id: "b3198dee-ea5a-4057-bb27-4c17ce97ddcb";
      name: "Passport";
      slug: "passport";
    },
    {
      id: "686e810d-b566-4928-a7e2-77d7bf31fb0c";
      name: "Aadhar Card";
      slug: "aadhar-card";
    }
  ];
  coupon: string;
  created_at: string;
  updated_at: string;
  pid: string;
  start_at: string;
  end_at: string;
  started_at: string | null;
  ended_at: string | null;
  price: number;
  offer_discount: number;
  coupon_discount: number;
  tax_amount: number;
  advance_amount: number;
  paid_amount: number;
  refund_amount: number;
  customer_notes: string;
  guest_notes: string;
  internal_notes: string;
  cancelled_at: string | null;
  cancellation_reason: string;
  refund_in_credits: boolean;
  cancellation_policies: TripCancellationPolicy[];
  whatsapp_number?: string;
  phone?: string;
  trip?: TripInventory;
}

export interface TripBookingSku {
  status: "pending" | "confirmed" | "cancelled";
  sku: {
    inventory: {
      pid: string;
      name: string;
      type: "trip";
      category: "fixed-itinerary";
      media: Media[];
    };
    features: [];
    inclusions: TripItem[];
    exclusions: TripItem;
    faqs: TripInfoItem[];
    media: Media[];
    space: null;
    eligibility_criteria: [];
    pid: string;
    name: string;
    specifications: {};
    itinerary: string;
  };
  currency: ZoCurrency;
  customers: [];
  booked_addons: TripAddon[];
  date: string;
  slot: string | null;
  price: number;
  offer_discount: number;
  coupon_discount: number;
  tax_details: TripTax;
  booking: string;
  dates: string[];
  itinerary: string;
}

export interface TripAddon {
  name: string;
  description: string;
  price: number;
  units: number;
  total_amount: number;
  offer_discount: number;
  tax: TripTax;
  status: "pending" | "confirmed" | "cancelled";
  addon_id: string;
}

export type FilterValue = {
  name: string;
  code: string;
};

export interface TripSpotlight {
  pid: string;
  name: string;
  batches: string[];
  starting_price: number;
  banner: string;
  isInternational?: boolean;
  itinerary?: {
    duration?: number;
  };
  currency: ZoCurrency;
}
