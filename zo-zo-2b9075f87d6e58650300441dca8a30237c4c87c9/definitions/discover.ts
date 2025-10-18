import { GeneralObject } from "./general";

export type DestinationPropertyTypes =
  | "DESTINATION"
  | "ZOSTEL"
  | "ZOSTEL_HOME"
  | "ZOSTEL_PLUS";

export type OperatorTypes = "H" | "B" | "P" | "T" | "HO";
export type OperatingModel = "F";

export interface ZostelMedia {
  id: string;
  title: string;
  description: string;
  image: string;
  alt_text: string;
  priority: number;
}

export interface Experience {
  [key: string]: any;
}

export interface Operator {
  name: string;
  code: string;
  slug: string;
  tagline: string;
  description: string;
  short_description: string;
  title: string;
  images: ZostelMedia[];
  bookable_months: number;
  booking_delay: number;
  bookable_occupancy: number;
  destination: {
    code: string;
    slug: string;
    name: string;
    alt_name: string | null;
    thumbnail: string;
    short_description: string;
    region: [];
  };
  policy: string;
  booking_min_length: number;
  directions: string;
  checkin_time: string;
  checkout_time: string;
  videos: ZostelMedia[];
  type_code: OperatorTypes;
  operating_model: OperatingModel;
  latitude: number;
  longitude: number;
  address: string;
  phone: string;
  email: string;
  case_study: string | null;
  checkin_enabled: boolean;
  local_map: ZostelMedia[];
  age_restriction: string;
  rooms: Room[];
  amenities: { id: number; name: string; code: string }[];
  tags: {
    title: string;
    emoji: string;
    slug: string;
    subtitle: string;
    categories?: ("property_page" | "booking_flow")[];
  }[];
  cancellation_policy?: string;
  kyc_documents?: {
    id: number;
    name: string;
    requires_back: boolean;
    slug: string;
  }[];
  chat_thread_id?: string;
  cover_image?: string;
  data?: {
    group_booking_allowed?: boolean;
  };
}

export interface Destination {
  cover_image_mobile?: string;
  cover_image: string;
  code: string;
  slug: string;
  name: string;
  alt_name: string | null;
  thumbnail: string;
  unlock_date: string;
  stamp_colored: string;
  stamp_grey: string;
  zobu_male: string;
  zobu_female: string;
  short_description: string;
  description?: string;
  intro_video: string | null;
  background: string | null;
  graphic_left: string | null;
  graphic_right: string | null;
  images: ZostelMedia[];
  videos: ZostelMedia[];
  operators: Operator[];
  geo: {};
  latitude: number;
  longitude: number;
  region: [];
  tags: {
    slug: string;
    emoji: string;
    title?: string;
  }[];
  local_map: [];
}

export interface DiscoverSearchItem {
  experiences: Experience[];
  operators: Operator[];
  destinations: Destination[];
}

export type ReverseOperatorType = {
  H: "zostel";
  B: "zostel-homes";
  P: "zostel-plus";
  T: "trusted-by-zostel";
  HO: "zo-house"; // verify
};

export enum ReverseOperatorTypeMap {
  H = "zostel",
  B = "zostel-homes",
  P = "zostel-plus",
  T = "trusted-by-zostel",
  HO = "zo-house", // verify
}

export interface DiscoverSeed {
  splash: {
    video_url: string;
    image_url: string;
  };
  experiences: {
    categories: [number, string][];
    timing: {
      days: [number, string][];
      months: [number, string][];
      season: [number, string][];
    };
  };
  discover_cards: {
    types: [number, string][];
  };
  auth: {
    otp_types: [number, string][];
  };
  themes: [
    {
      header_theme: string;
      header_bg_color: string;
      header_bg_gradient: string[];
      header_bg_gradient_locations: number[];
      header_file: string;
      header_ending_gradient: string[];
      header_ending_gradient_locations: number[];
      footer_file: string;
      footer_starting_gradient: string[];
      footer_starting_gradient_locations: number[];
      time_from: string;
      time_to: string;
    },
    {
      header_theme: string;
      header_bg_color: string;
      header_bg_gradient: string[];
      header_bg_gradient_locations: number[];
      header_file: string;
      header_ending_gradient: string[];
      header_ending_gradient_locations: number[];
      footer_file: string;
      footer_starting_gradient: string[];
      footer_starting_gradient_locations: number[];
      time_from: string;
      time_to: string;
    }
  ];
  extra_links: {
    title: string;
    data: {
      id: number;
      title: string;
      icon: string;
      emoji: string;
      link: string;
    }[];
  }[];
  social_links: { id: string; link: string }[];
  features: {
    checkin: boolean;
  };
  profile: {
    document_types: [number, string][];
    validation_status: [number, string][];
  };
}

export interface Room {
  id: number;
  addons: GeneralObject[];
  status: string;
  category: string;
  sub_category: "dorm-bed" | "private-room";
  tax_category: string;
  amenities: {
    id: number;
    name: string;
    code: string;
  }[];
  images: ZostelMedia[];
  videos: ZostelMedia[];
  code: string;
  name: string;
  description: string;
  inclusion: null | string;
  exclusion: null | string;
  itinerary: null | string;
  priority: number;
  availability?: {
    isAvailable: boolean;
    // message: string;
  } | null;
  units: number;
  price: number;
  advance_percent: number;
  occupancy: number;
  ref_keys: {
    ezee: string;
  };
  data: GeneralObject;
  experience: null | string;
  _ref: string;
  discount: number;
}
