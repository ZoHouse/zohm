/**
 * Event Inquiry Pipeline Types
 *
 * Types for the sponsored event inquiry flow:
 * Typeform → venue match → TG notification → quote → email
 */

// ============================================
// EVENT INQUIRY
// ============================================

export interface EventInquiry {
  id: string;
  typeform_token?: string;

  // Contact
  host_name: string;
  host_email: string;
  host_phone: string;
  organization: string;

  // Event details
  event_type: string;
  venue_preference: string;
  event_date: string;
  expected_headcount: string;
  budget: string;
  duration: string;
  additional_notes: string;

  // Requirements
  needs_projector: boolean;
  needs_music: boolean;
  needs_catering: boolean;
  needs_accommodation: boolean;
  needs_convention_hall: boolean;
  needs_outdoor_area: boolean;

  // Venue matching
  matched_venue: string;
  match_score: number | null;
  match_reasoning: string;
  alternative_venues: VenueMatchResult[];

  // Quote
  quote_json: QuoteBreakdown | null;
  quote_total: number | null;
  quote_sent_at: string | null;

  // Telegram
  telegram_message_id: number | null;
  telegram_chat_id: number | null;

  // Status
  inquiry_status: InquiryStatus;
  status_notes: string;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export type InquiryStatus =
  | 'new'
  | 'matched'
  | 'reviewing'
  | 'quoted'
  | 'confirmed'
  | 'rejected'
  | 'expired';

// ============================================
// VENUE MATCHING
// ============================================

export interface VenueMatchResult {
  property_name: string;
  score: number;
  reasoning: string;
  city?: string;
  region?: string;
  category?: string;
}

export interface ZoeventsVenue {
  id: number;
  property_name: string;
  category: string;
  city: string;
  region: string;
  operational_status: string;

  // Event capabilities
  convention_hall_available: string;
  convention_hall_capacity: string;
  has_projector: string;
  has_speakers: string;
  has_mic: string;
  events_stage: string;
  lounge: string;
  rooftop_access: string;
  has_garden: string;

  // Music
  amplified_music_allowed: string;
  live_music_allowed: string;
  dj_allowed: string;

  // Catering
  meal_buffet_available: string;
  external_catering_allowed: string;

  // Pricing (may be empty)
  hourly_rate: string;
  half_day_rate: string;
  full_day_rate: string;
  buffet_veg_per_pax: string;
  buffet_nonveg_per_pax: string;
  cleanup_fee: string;
  security_deposit: string;
  convention_hall_charges: string;
  peak_season_multiplier: string;
  offseason_discount_pct: string;

  // Rooms
  rooms_json: unknown;
}

// ============================================
// QUOTE
// ============================================

export interface QuoteLineItem {
  category: string;
  description: string;
  amount: number;
}

export interface QuoteBreakdown {
  venue_name: string;
  generated_at: string;
  currency: string;
  line_items: QuoteLineItem[];
  subtotal: number;
  seasonal_adjustment: number | null;
  gst_rate: number;
  gst_amount: number;
  security_deposit: number;
  grand_total: number;
  notes: string[];
  valid_until: string;
}

// ============================================
// TYPEFORM
// ============================================

export interface TypeformWebhookPayload {
  event_id: string;
  event_type: string;
  form_response: {
    form_id: string;
    token: string;
    submitted_at: string;
    definition: {
      fields: TypeformField[];
    };
    answers: TypeformAnswer[];
  };
}

export interface TypeformField {
  id: string;
  title: string;
  type: string;
  ref?: string;
}

export interface TypeformAnswer {
  field: { id: string; type: string; ref?: string };
  type: string;
  text?: string;
  email?: string;
  phone_number?: string;
  number?: number;
  boolean?: boolean;
  choice?: { label: string };
  choices?: { labels: string[] };
}
