import { CORS_PROXY_URL, CORS_API_KEY, MAPBOX_TOKEN } from './calendarConfig';

export interface ParsedEvent {
  'Event Name': string;
  'Host': string;
  'Date & Time': string;
  'Location': string;
  'Latitude': string | null;
  'Longitude': string | null;
  'Event URL': string | null;
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
  console.log('Fetching events from', calendarUrls.length, 'calendars...');
  
  try {
    // Fetch all calendars in parallel
    const responses = await Promise.all(calendarUrls.map(url => 
      fetch(CORS_PROXY_URL + url, {
        headers: {
          'x-cors-api-key': CORS_API_KEY
        }
      })
    ));
    
    const icsDataArray = await Promise.all(responses.map(res => {
      if (!res.ok) {
        throw new Error(`CORS proxy error: ${res.status} ${res.statusText}`);
      }
      return res.text();
    }));

    let parsedEvents: any[] = [];
    calendarUrls.forEach((calendarUrl, index) => {
      const icsData = icsDataArray[index];
      const eventsFromCalendar = parseICS(icsData);
      
      // Extract calendar ID from the URL for constructing event URLs
      const calendarIdMatch = calendarUrl.match(/id=cal-([a-zA-Z0-9]+)/);
      const calendarId = calendarIdMatch ? calendarIdMatch[1] : null;
      
      // Add calendar context to each event
      eventsFromCalendar.forEach(event => {
        event.calendarId = calendarId;
        event.calendarUrl = calendarUrl;
      });
      
      parsedEvents = parsedEvents.concat(eventsFromCalendar);
    });

    // Filter future events and sort by date
    const now = new Date();
    const futureEvents = parsedEvents.filter(event => event.start >= now);
    futureEvents.sort((a, b) => a.start - b.start);
    
    // Process events with geocoding - exact same logic as original
    const geocodedEvents = await Promise.all(futureEvents.map(async (e) => {
      let coords: [number, number] | null = null;
      let displayLocation = e.location;
      
      if (e.geo && e.geo.lat && e.geo.lon && !isNaN(e.geo.lat) && !isNaN(e.geo.lon)) {
        coords = [e.geo.lon, e.geo.lat];
      }
      else if (e.location && e.location.toLowerCase().includes('zo house')) {
        coords = [-122.3943, 37.7776];
        displayLocation = "Zo House, 300 4th St, San Francisco";
      } else if (e.location && (e.location.toLowerCase().includes('@ zo') || e.location.toLowerCase().includes('fifa @ zo'))) {
        coords = [-122.3943, 37.7776];
        displayLocation = "Zo House, 300 4th St, San Francisco";
      }
      else if (e.location && !e.location.startsWith('http')) {
        coords = await geocodeLocation(e.location);
      }
      
      let host = e.organizer || 'TBA';
      if (!e.organizer && e.description) {
        // Try to extract host from description patterns like "Hosted by X" or "Host: X"
        const hostMatch = e.description.match(/(?:hosted by|host:|by)\s*([^\n\r]+)/i);
        if (hostMatch) {
          host = hostMatch[1].trim();
        }
      }
      
      // Construct Luma URL - exact same logic as original
      let eventUrl: string | null = null;
      
      // Priority 1: Real Luma URL found in description
      if (e.realLumaUrl) {
        eventUrl = e.realLumaUrl;
      }
      // Priority 2: Direct URL field
      else if (e.url && e.url.includes('lu.ma')) {
        eventUrl = e.url;
      }
      // Priority 3: Try to construct from UID (backup)
      else if (e.uid) {
        // Only try this as last resort since it gives wrong URLs
        const uidPatterns = [
          /evt-([a-zA-Z0-9]+)/,  // evt-XXXXX pattern
        ];
        
        for (const pattern of uidPatterns) {
          const match = e.uid.match(pattern);
          if (match) {
            const eventId = match[1];
            eventUrl = `https://lu.ma/evt-${eventId}`;
            break;
          }
        }
      }
      
      // Fallback: if we have calendar ID, link to calendar
      if (!eventUrl && e.calendarId) {
        eventUrl = `https://lu.ma/calendar/cal-${e.calendarId}`;
      }
      
      return {
        'Event Name': e.summary || 'Untitled Event',
        'Host': host,
        'Date & Time': e.start.toISOString(),
        'Location': displayLocation || e.location,
        'Latitude': coords ? coords[1].toString() : null,
        'Longitude': coords ? coords[0].toString() : null,
        'Event URL': eventUrl
      };
    }));

    const finalEvents = geocodedEvents.filter(e => e.Latitude && e.Longitude);
    console.log('Final geocoded events:', finalEvents.length);
    return finalEvents;

  } catch (error) {
    console.error('Error fetching or parsing calendar data:', error);
    return [];
  }
} 