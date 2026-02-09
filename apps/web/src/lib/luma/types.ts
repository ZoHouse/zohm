/**
 * Luma API Type Definitions
 *
 * Types for the Luma public API (https://docs.lu.ma/reference)
 * Used for bidirectional event sync between game.zo.xyz and Luma.
 */

// ============================================
// LUMA API RESPONSE TYPES
// ============================================

export interface LumaEvent {
  api_id: string;
  name: string;
  description_md?: string;
  start_at: string;       // ISO datetime
  end_at?: string;        // ISO datetime
  timezone: string;
  cover_url?: string;
  url: string;            // lu.ma event URL
  geo_address_json?: LumaGeoAddress;
  geo_latitude?: string;
  geo_longitude?: string;
  meeting_url?: string;
  visibility: 'public' | 'private';
  series_api_id?: string;
  calendar_api_id: string;
  event_type?: string;
}

export interface LumaGeoAddress {
  city?: string;
  region?: string;
  country?: string;
  latitude?: string;
  longitude?: string;
  full_address?: string;
  place_id?: string;
  description?: string;
  type?: string;
}

export interface LumaGuest {
  api_id: string;
  event_api_id: string;
  email?: string;
  name?: string;
  phone?: string;
  status: LumaGuestStatus;
  approval_status?: LumaApprovalStatus;
  created_at: string;
  updated_at: string;
}

export type LumaGuestStatus = 'registered' | 'invited' | 'declined' | 'maybe';
export type LumaApprovalStatus = 'approved' | 'pending' | 'rejected';

export interface LumaWebhook {
  api_id: string;
  url: string;
  event_types: string[];
  secret: string;
  created_at: string;
}

export interface LumaTicket {
  api_id: string;
  name: string;
  price: number;
  currency: string;
  quantity_available?: number;
  quantity_sold?: number;
}

// ============================================
// LUMA API INPUT TYPES
// ============================================

export interface LumaCreateEventInput {
  name: string;
  description_md?: string;
  start_at: string;
  end_at?: string;
  timezone?: string;
  cover_url?: string;
  meeting_url?: string;
  geo_address_json?: LumaGeoAddress;
  geo_latitude?: string;
  geo_longitude?: string;
  require_rsvp_approval?: boolean;
  visibility?: 'public' | 'private';
}

export interface LumaUpdateEventInput {
  name?: string;
  description_md?: string;
  start_at?: string;
  end_at?: string;
  timezone?: string;
  cover_url?: string;
  meeting_url?: string;
  geo_address_json?: LumaGeoAddress;
  geo_latitude?: string;
  geo_longitude?: string;
}

export interface LumaAddGuestInput {
  email: string;
  name?: string;
  phone?: string;
}

// ============================================
// LUMA API RESPONSE WRAPPERS
// ============================================

export interface LumaPaginatedResponse<T> {
  entries: T[];
  has_more: boolean;
  next_cursor?: string;
}

export interface LumaEventResponse {
  event: LumaEvent;
}

export interface LumaGuestResponse {
  guest: LumaGuest;
}

// ============================================
// CALENDAR CONFIG TYPE
// ============================================

export interface LumaCalendarConfig {
  apiKey: string;
  calendarId: string;
  name: string;
}

// ============================================
// SYNC STATUS
// ============================================

export type LumaSyncStatus = 'pending' | 'pushed' | 'pulled' | 'push_failed' | 'synced';

// ============================================
// MAPPING HELPERS
// ============================================

import type { RsvpStatus } from '@/types/events';

/**
 * Map Luma guest status to our RSVP status
 */
export function lumaStatusToRsvpStatus(
  guestStatus: LumaGuestStatus,
  approvalStatus?: LumaApprovalStatus
): RsvpStatus {
  if (approvalStatus === 'pending') return 'pending';
  if (approvalStatus === 'rejected') return 'rejected';

  switch (guestStatus) {
    case 'registered': return 'going';
    case 'invited': return 'interested';
    case 'declined': return 'not_going';
    case 'maybe': return 'interested';
    default: return 'pending';
  }
}

/**
 * Map our RSVP status to Luma guest status
 */
export function rsvpStatusToLumaStatus(status: RsvpStatus): LumaGuestStatus {
  switch (status) {
    case 'going':
    case 'approved':
      return 'registered';
    case 'interested':
    case 'pending':
    case 'waitlist':
      return 'invited';
    case 'not_going':
    case 'cancelled':
    case 'rejected':
      return 'declined';
    default:
      return 'invited';
  }
}
