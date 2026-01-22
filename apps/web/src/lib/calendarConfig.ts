// Calendar Configuration - Using Supabase for scalable calendar management
import { getActiveCalendars } from './supabase';
import { devLog } from '@/lib/logger';

// Helper to get base URL for server-side requests
function getBaseUrl(): string {
  const isServerSide = typeof window === 'undefined';
  return isServerSide 
    ? (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000')
    : '';
}

// Minimal fallback for emergency cases - DISCOVER feeds have current events!
const EMERGENCY_FALLBACK_CALENDAR_URLS = [
  'https://api2.luma.com/ics/get?entity=discover&id=discplace-BDj7GNbGlsF7Cka', // SF Discover (has 2026 events!)
  'https://api2.luma.com/ics/get?entity=discover&id=discplace-mUbtdfNjfWaLQ72', // Singapore (has 2026 events!)
  'https://api2.luma.com/ics/get?entity=calendar&id=cal-ZVonmjVxLk7F2oM', // Zo House Bangalore
  'https://api2.luma.com/ics/get?entity=calendar&id=cal-3YNnBTToy9fnnjQ', // Zo House San Francisco
];

// Convert calendar URL to API proxy URL
function toProxyUrl(calendarUrl: string): string {
  const baseUrl = getBaseUrl();
  const relativeUrl = `/api/calendar?url=${encodeURIComponent(calendarUrl)}`;
  return baseUrl ? `${baseUrl}${relativeUrl}` : relativeUrl;
}

// Dynamic calendar URLs from database
export async function getCalendarUrls(): Promise<string[]> {
  const isServerSide = typeof window === 'undefined';
  const baseUrl = getBaseUrl();
  
  try {
    const calendars = await getActiveCalendars();
    if (!calendars || calendars.length === 0) {
      devLog.log('📅 Database unavailable, using emergency fallback calendar URLs');
      // Convert fallback URLs to proxy URLs
      return EMERGENCY_FALLBACK_CALENDAR_URLS.map(toProxyUrl);
    }
    
    // Convert URLs to use our proxy API to avoid CORS issues
    const urls = calendars.map(calendar => {
      if (calendar.url.startsWith('http')) {
        // Direct URL - proxy it through our API
        return toProxyUrl(calendar.url);
      } else {
        // Already a relative API URL - prepend base URL if server-side
        return baseUrl ? `${baseUrl}${calendar.url}` : calendar.url;
      }
    });
    
    devLog.log('📅 Loaded calendar URLs from database:', urls.length, 'calendars');
    if (isServerSide) {
      devLog.log('🔧 Server-side mode: using absolute URLs with base:', baseUrl);
    }
    return urls;
  } catch (error) {
    devLog.error('Error fetching calendar URLs, using emergency fallback:', error);
    // Convert fallback URLs to proxy URLs
    return EMERGENCY_FALLBACK_CALENDAR_URLS.map(toProxyUrl);
  }
}

// Map Configuration (supports multiple common env var names)
export const MAPBOX_TOKEN =
  process.env.NEXT_PUBLIC_MAPBOX_TOKEN ||
  process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ||
  process.env.NEXT_PUBLIC_MAPBOX_GL_ACCESS_TOKEN ||
  process.env.NEXT_PUBLIC_MAPBOX ||
  '';
export const DEFAULT_CENTER: [number, number] = [-122.4194, 37.7749]; // San Francisco, CA (Unicorn) 