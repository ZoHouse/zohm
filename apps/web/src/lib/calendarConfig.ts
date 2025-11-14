// Calendar Configuration - Using Supabase for scalable calendar management
import { getActiveCalendars } from './supabase';

// Minimal fallback for emergency cases only
const EMERGENCY_FALLBACK_URLS = [
  '/api/calendar?url=https://api2.luma.com/ics/get?entity=calendar&id=cal-ZVonmjVxLk7F2oM', // Zo House Bangalore
  '/api/calendar?url=https://api2.luma.com/ics/get?entity=calendar&id=cal-3YNnBTToy9fnnjQ', // Zo House San Francisco
  '/api/calendar?url=https://api2.luma.com/ics/get?entity=calendar&id=cal-4BIGfE8WhTFQj9H'  // ETHGlobal
];

// Dynamic calendar URLs from database
export async function getCalendarUrls(): Promise<string[]> {
  try {
    const calendars = await getActiveCalendars();
    if (!calendars || calendars.length === 0) {
      console.log('📅 Database unavailable, using emergency fallback calendar URLs');
      return EMERGENCY_FALLBACK_URLS;
    }
    
    // Check if running server-side (for worker) or client-side
    const isServerSide = typeof window === 'undefined';
    const baseUrl = isServerSide 
      ? (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001')
      : '';
    
    // Convert URLs to use our proxy API to avoid CORS issues
    const urls = calendars.map(calendar => {
      if (calendar.url.startsWith('http')) {
        // Direct URL - proxy it through our API
        const relativeUrl = `/api/calendar?url=${encodeURIComponent(calendar.url)}`;
        return isServerSide ? `${baseUrl}${relativeUrl}` : relativeUrl;
      } else {
        // Already a relative API URL
        return isServerSide ? `${baseUrl}${calendar.url}` : calendar.url;
      }
    });
    
    console.log('📅 Loaded calendar URLs from database:', urls.length, 'calendars');
    if (isServerSide) {
      console.log('🔧 Server-side mode: using absolute URLs');
    }
    return urls;
  } catch (error) {
    console.error('Error fetching calendar URLs, using emergency fallback:', error);
    return EMERGENCY_FALLBACK_URLS;
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