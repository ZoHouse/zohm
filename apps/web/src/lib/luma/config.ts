/**
 * Luma Calendar Configuration
 *
 * Maps our Luma calendars (BLR, global) to API keys.
 * Provides geo-fencing logic to route events to the right calendar.
 */

import { FEATURE_FLAGS } from '@/lib/featureFlags';
import type { LumaCalendarConfig } from './types';

// ============================================
// CALENDAR DEFINITIONS
// ============================================

export const LUMA_CALENDARS: Record<string, LumaCalendarConfig> = {
  blr: {
    apiKey: process.env.LUMA_BLR_API_KEY || '',
    calendarId: 'cal-ZVonmjVxLk7F2oM',
    name: 'BLRxZo (Bangalore)',
  },
  zo_events: {
    apiKey: process.env.LUMA_ZO_EVENTS_API_KEY || '',
    calendarId: 'cal-3YNnBTToy9fnnjQ',
    name: 'Zo Events (Global)',
  },
};

// Bangalore coordinates for geo-fencing
const BLR_CENTER = { lat: 12.9716, lng: 77.5946 };
const BLR_RADIUS_KM = 500;

// ============================================
// HELPERS
// ============================================

/**
 * Check if Luma API integration is enabled
 */
export function isLumaEnabled(): boolean {
  return FEATURE_FLAGS.LUMA_API_SYNC;
}

/**
 * Haversine distance between two points in km
 */
function haversineDistanceKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Determine which Luma calendar to use for an event based on its location.
 *
 * - Events within 500km of Bangalore → BLR calendar
 * - Everything else → Global Zo Events calendar
 */
export function getLumaCalendarForEvent(event: {
  lat?: number | null;
  lng?: number | null;
}): LumaCalendarConfig {
  if (event.lat != null && event.lng != null) {
    const distance = haversineDistanceKm(
      event.lat, event.lng,
      BLR_CENTER.lat, BLR_CENTER.lng
    );
    if (distance <= BLR_RADIUS_KM) {
      return LUMA_CALENDARS.blr;
    }
  }

  // Default to global calendar
  return LUMA_CALENDARS.zo_events;
}

/**
 * Get a specific Luma calendar config by key
 */
export function getLumaCalendar(key: string): LumaCalendarConfig | undefined {
  return LUMA_CALENDARS[key];
}

/**
 * Get all configured Luma calendars (only those with API keys set)
 */
export function getActiveLumaCalendars(): LumaCalendarConfig[] {
  return Object.values(LUMA_CALENDARS).filter(cal => cal.apiKey.length > 0);
}
