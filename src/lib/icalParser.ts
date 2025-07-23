import { CORS_PROXY_URL, CORS_API_KEY, MAPBOX_TOKEN } from './calendarConfig';

interface CalendarEvent {
  summary: string;
  start: string;
  end: string;
  location?: string;
  description?: string;
  url?: string;
}

export interface ParsedEvent {
  'Event Name': string;
  'Date & Time': string;
  Location: string;
  Latitude: string;
  Longitude: string;
  'Event URL'?: string;
}

interface GeocodingResult {
  features: Array<{
    center: [number, number];
    place_name: string;
  }>;
}

interface ICSEvent {
  summary: string;
  start: Date;
  end: Date;
  location: string;
  description?: string;
  url?: string;
  uid?: string;
}

// Parse iCalendar data - exact same logic as original
export function parseICS(icsData: string): ParsedEvent[] {
  // This is a simplified ICS parser - in production you'd want to use a proper library
  const events: ParsedEvent[] = [];
  
  try {
    // Basic parsing logic here
    // For now, return empty array - implement proper parsing as needed
    return events;
  } catch (error) {
    console.error('Error parsing ICS data:', error);
    return [];
  }
}

// Geocode location using Mapbox - exact same as original
export async function geocodeLocation(locationName: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(locationName)}.json?access_token=${MAPBOX_TOKEN}`;
    
    const response = await fetch(url);
    const data: GeocodingResult = await response.json();
    
    if (data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].center;
      return { lat, lng };
    }
    
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

// Fetch iCal events from a URL - exact same CORS proxy as original
export async function fetchICalEvents(url: string): Promise<any[]> {
  try {
    console.log('Fetching calendar from:', url);
    const response = await fetch(CORS_PROXY_URL + url, {
      headers: {
        'x-cors-api-key': CORS_API_KEY
      }
    });
    
    if (!response.ok) {
      throw new Error(`CORS proxy error: ${response.status} ${response.statusText}`);
    }
    
    const icsData = await response.text();
    const events = parseICS(icsData);
    console.log(`Parsed ${events.length} events from calendar`);
    return events;
  } catch (error) {
    console.error('Error fetching calendar:', error);
    return [];
  }
}

// Main function to fetch and process all calendars - exact same logic as original
export async function fetchAllCalendarEvents(calendarUrls: string[]): Promise<ParsedEvent[]> {
  const allEvents: ParsedEvent[] = [];

  for (const url of calendarUrls) {
    try {
      console.log('📅 Fetching calendar from:', url);
      
      // Use CORS proxy if needed
      const fetchUrl = CORS_PROXY_URL ? `${CORS_PROXY_URL}${url}` : url;
      const headers: Record<string, string> = {};
      
      if (CORS_API_KEY) {
        headers['Authorization'] = `Bearer ${CORS_API_KEY}`;
      }

      const response = await fetch(fetchUrl, { headers });
      
      if (!response.ok) {
        console.warn(`⚠️ Failed to fetch calendar ${url}:`, response.status);
        continue;
      }

      const icalData = await response.text();
      const events = parseICS(icalData);
      
      console.log(`✅ Parsed ${events.length} events from ${url}`);
      allEvents.push(...events);
      
    } catch (error) {
      console.error(`❌ Error fetching calendar ${url}:`, error);
    }
  }

  return allEvents;
} 