/**
 * Events System Types
 * 
 * Type definitions for the community events system including:
 * - Event categories (community, sponsored, ticketed)
 * - Cultures (19 types)
 * - RSVPs and attendance tracking
 * - Host information
 */

// ============================================
// ENUMS & CONSTANTS
// ============================================

export type EventCategory = 'community' | 'sponsored' | 'ticketed';

export type EventCulture =
  | 'science_technology'
  | 'business'
  | 'design'
  | 'food'
  | 'game'
  | 'health_fitness'
  | 'home_lifestyle'
  | 'law'
  | 'literature_stories'
  | 'music_entertainment'
  | 'nature_wildlife'
  | 'photography'
  | 'spiritual'
  | 'travel_adventure'
  | 'television_cinema'
  | 'stories_journal'
  | 'sport'
  | 'follow_your_heart'
  | 'default';

export type SubmissionStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled';

export type HostType = 'citizen' | 'founder_member' | 'admin' | 'sponsor' | 'vibe_curator';

export type LocationType = 'zo_property' | 'custom' | 'online';

export type SourceType = 'ical' | 'luma' | 'community' | 'activity_manager' | 'admin';

export type RsvpStatus = 'pending' | 'going' | 'interested' | 'not_going' | 'waitlist' | 'cancelled' | 'approved' | 'rejected';

export type RsvpType = 'standard' | 'vip' | 'speaker' | 'organizer' | 'host';

// ============================================
// EVENT CULTURE CONFIG
// ============================================

export interface EventCultureConfig {
  slug: EventCulture;
  name: string;
  emoji: string;
  color: string;
  asset_file: string;
  description: string;
  tags: string[];
  is_active: boolean;
  sort_order: number;
}

// Asset path helper
export const CULTURE_ASSET_PATH = '/Cultural Stickers';

export function getCultureAssetUrl(assetFile: string): string {
  return `${CULTURE_ASSET_PATH}/${encodeURIComponent(assetFile)}`;
}

// ============================================
// EVENT TYPES
// ============================================

/**
 * Full event record from database
 */
export interface CommunityEvent {
  // Identity
  id: string;
  canonical_uid?: string;
  
  // Basic info
  title: string;
  description?: string;
  
  // Categorization
  category: EventCategory;
  culture: EventCulture;
  source_type: SourceType;
  
  // Date & Time
  starts_at: string;  // ISO datetime
  ends_at?: string;
  tz?: string;
  
  // Location
  location_type: LocationType;
  location_name?: string;
  location_raw?: string;
  location_address?: string;
  lat?: number;
  lng?: number;
  zo_property_id?: string;
  meeting_point?: string;
  
  // Capacity
  max_capacity?: number;
  current_rsvp_count: number;
  
  // Host
  host_id?: string;
  host_type: HostType;
  host?: EventHost;
  
  // Workflow
  submission_status: SubmissionStatus;
  
  // Ticketing
  is_ticketed: boolean;
  ticket_price?: number;
  ticket_currency?: string;
  
  // External
  external_rsvp_url?: string;
  luma_event_id?: string;
  cover_image_url?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

/**
 * Host information (joined from users table)
 */
export interface EventHost {
  id: string;
  name?: string;
  pfp?: string;
  role?: string;
  zo_membership?: string;
}

/**
 * Simplified event for map markers
 */
export interface EventMarkerData {
  id: string;
  title: string;
  category: EventCategory;
  culture: EventCulture;
  starts_at: string;
  lat: number;
  lng: number;
  location_name?: string;
  current_rsvp_count: number;
  host?: {
    name?: string;
    pfp?: string;
  };
}

// ============================================
// CREATE EVENT INPUT
// ============================================

/**
 * Input for creating a new event
 */
export interface CreateEventInput {
  // Step 1: Basic Info
  title: string;
  culture: EventCulture;
  description?: string;
  
  // Step 2: Date & Time
  starts_at: string;  // ISO datetime
  ends_at: string;
  timezone?: string;
  
  // Step 3: Location
  location_type: LocationType;
  location_name?: string;
  location_address?: string;
  lat?: number;
  lng?: number;
  zo_property_id?: string;
  meeting_point?: string;
  
  // Step 4: Details
  category: EventCategory;
  max_capacity?: number;
  
  // Ticketing (for ticketed events)
  is_ticketed?: boolean;
  ticket_price?: number;
  ticket_currency?: string;
  
  // External (for sponsored events)
  external_rsvp_url?: string;
  
  // Cover image
  cover_image_url?: string;
}

/**
 * Response from create event API
 */
export interface CreateEventResponse {
  success: boolean;
  event?: CommunityEvent;
  message?: string;
  error?: string;
}

// ============================================
// RSVP TYPES
// ============================================

/**
 * RSVP record from database
 */
export interface EventRsvp {
  id: string;
  event_id: string;
  user_id: string;
  status: RsvpStatus;
  rsvp_type: RsvpType;
  checked_in: boolean;
  checked_in_at?: string;
  checked_in_by?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  
  // Joined data
  user?: RsvpUser;
  event?: CommunityEvent;
}

/**
 * User info for RSVP display
 */
export interface RsvpUser {
  id: string;
  name?: string;
  pfp?: string;
  phone?: string;
  zo_pid?: string;
}

/**
 * Input for creating/updating RSVP
 */
export interface RsvpInput {
  status: RsvpStatus;
  rsvp_type?: RsvpType;
}

/**
 * RSVP API response
 */
export interface RsvpResponse {
  success: boolean;
  rsvp?: EventRsvp;
  message?: string;
  error?: string;
}

// ============================================
// API RESPONSE TYPES
// ============================================

/**
 * List events response
 */
export interface EventsListResponse {
  events: CommunityEvent[];
  meta: {
    total: number;
    page: number;
    limit: number;
    has_more: boolean;
  };
}

/**
 * User's events response (for "My Events" section)
 */
export interface MyEventsResponse {
  hosted: CommunityEvent[];       // Events user is hosting
  rsvps: EventRsvp[];             // Events user has RSVP'd to
  past: CommunityEvent[];         // Past attended events
  stats: {
    total_hosted: number;
    total_attended: number;
    upcoming_count: number;
  };
}

/**
 * Event attendees response (for organizers)
 */
export interface EventAttendeesResponse {
  attendees: EventRsvp[];
  meta: {
    total: number;
    going: number;
    interested: number;
    waitlist: number;
    checked_in: number;
  };
}

/**
 * Cultures list response
 */
export interface CulturesResponse {
  cultures: EventCultureConfig[];
}

// ============================================
// FILTER & QUERY TYPES
// ============================================

/**
 * Event filter options
 */
export interface EventFilters {
  category?: EventCategory | 'all';
  culture?: EventCulture;
  status?: SubmissionStatus;
  host_id?: string;
  start_date?: string;
  end_date?: string;
  lat?: number;
  lng?: number;
  radius_km?: number;
  limit?: number;
  offset?: number;
}

// ============================================
// UI STATE TYPES
// ============================================

/**
 * Host event modal state
 */
export interface HostEventModalState {
  isOpen: boolean;
  step: number;
  eventType: EventCategory;
  formData: Partial<CreateEventInput>;
  isSubmitting: boolean;
  error?: string;
}

/**
 * Culture selector state
 */
export interface CultureSelectorState {
  cultures: EventCultureConfig[];
  selected?: EventCulture;
  isLoading: boolean;
  error?: string;
}

// ============================================
// BADGE/DISPLAY HELPERS
// ============================================

export const EVENT_CATEGORY_CONFIG: Record<EventCategory, {
  label: string;
  emoji: string;
  color: string;
  bgColor: string;
}> = {
  community: {
    label: 'Community',
    emoji: '🌱',
    color: '#22c55e',
    bgColor: 'rgba(34, 197, 94, 0.1)',
  },
  sponsored: {
    label: 'Sponsored',
    emoji: '⭐',
    color: '#a855f7',
    bgColor: 'rgba(168, 85, 247, 0.1)',
  },
  ticketed: {
    label: 'Ticketed',
    emoji: '🎟️',
    color: '#eab308',
    bgColor: 'rgba(234, 179, 8, 0.1)',
  },
};

export function getEventCategoryBadge(category: EventCategory) {
  return EVENT_CATEGORY_CONFIG[category] || EVENT_CATEGORY_CONFIG.community;
}
