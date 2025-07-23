import { CORS_PROXY_URL, CORS_API_KEY, MAPBOX_TOKEN } from './calendarConfig';

interface CalendarEvent {
  summary: string;
  start: string;
  end: string;
  location?: string;
  description?: string;
  url?: string;
}

interface ParsedEvent {
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

// Parse iCalendar data - exact same logic as original
export function parseICS(icsData: string): any[] {
  const events: any[] = [];
  const lines = icsData.split(/\r\n|\n|\r/);
  let currentEvent: any = null;

  lines.forEach(line => {
    if (line.startsWith('BEGIN:VEVENT')) {
      currentEvent = {};
    } else if (line.startsWith('END:VEVENT')) {
      if (currentEvent) {
        events.push(currentEvent);
      }
      currentEvent = null;
    } else if (currentEvent) {
      const [key, ...valueParts] = line.split(':');
      const value = valueParts.join(':');

      if (key.startsWith('DTSTART')) {
        currentEvent.start = new Date(value.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/, '$1-$2-$3T$4:$5:$6'));
      } else if (key.startsWith('SUMMARY')) {
        currentEvent.summary = value;
      } else if (key.startsWith('LOCATION')) {
        currentEvent.location = value.replace(/\\,/g, ',');
      } else if (key.startsWith('URL')) {
        currentEvent.url = value;
      } else if (key.startsWith('DESCRIPTION')) {
        currentEvent.description = value.replace(/\\n/g, '\n');
        // Check if description contains the real Luma URL
        const lumaUrlMatch = value.match(/https:\/\/lu\.ma\/([a-zA-Z0-9]+)/);
        if (lumaUrlMatch) {
          currentEvent.realLumaUrl = lumaUrlMatch[0];
        }
      } else if (key.startsWith('UID')) {
        currentEvent.uid = value;
        // Extract Luma event ID from UID for URL construction
        const lumaEventMatch = value.match(/evt-([a-zA-Z0-9]+)/);
        if (lumaEventMatch) {
          currentEvent.lumaEventId = lumaEventMatch[1];
        }
      } else if (key.startsWith('ORGANIZER')) {
        // Extract organizer/host information
        const organizerMatch = value.match(/CN=([^;:]+)/);
        currentEvent.organizer = organizerMatch ? organizerMatch[1] : value;
      } else if (key.startsWith('GEO')) {
        const [lat, lon] = value.split(';');
        const parsedLat = parseFloat(lat);
        const parsedLon = parseFloat(lon);
        if (!isNaN(parsedLat) && !isNaN(parsedLon)) {
          currentEvent.geo = { lat: parsedLat, lon: parsedLon };
        }
      }
    }
  });
  return events;
}

// Geocode location using Mapbox - exact same as original
export async function geocodeLocation(locationName: string): Promise<[number, number] | null> {
  if (!locationName) return null;
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(locationName)}.json?access_token=${MAPBOX_TOKEN}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.features && data.features.length > 0) {
      return data.features[0].center; // [longitude, latitude]
    }
  } catch (error) {
    console.error('Geocoding error:', error);
  }
  return null;
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