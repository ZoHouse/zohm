import { MAPBOX_TOKEN } from './calendarConfig';
import { devLog } from '@/lib/logger';

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

// Main function to fetch and process all calendars
export async function fetchAllCalendarEvents(calendarUrls: string[]): Promise<ParsedEvent[]> {
  const allEvents: ParsedEvent[] = [];

  for (const url of calendarUrls) {
    try {
      // Use our API route to avoid CORS issues
      const response = await fetch(url, {
        headers: {
          'Accept': 'text/calendar, text/plain, */*'
        }
      });
      
      if (!response.ok) {
        devLog.warn(`⚠️ Failed to fetch calendar ${url}:`, response.status, response.statusText);
        continue;
      }

      const icalData = await response.text();
      
      // Check if response is actually iCal data
      if (!icalData.includes('BEGIN:VCALENDAR')) {
        devLog.warn(`⚠️ Response doesn't appear to be iCal data from ${url}`);
        continue;
      }
      
      const events = parseICS(icalData);
      allEvents.push(...events);
      
    } catch (error) {
      devLog.error(`❌ Error fetching calendar ${url}:`, error);
    }
  }

  return allEvents;
}

// Parse iCalendar data and filter events for next 30 days
export function parseICS(icsData: string): ParsedEvent[] {
  const events: ParsedEvent[] = [];
  
  try {
    // Get current date - show all future events
    const now = new Date();
    
    // Split the iCal data into lines
    const lines = icsData.split(/\r?\n/);
    let currentEvent: Partial<ParsedEvent> = {};
    let inEvent = false;
    let multiLineValue = '';
    let multiLineKey = '';
    
    for (let i = 0; i < lines.length; i++) {
                    const line = lines[i].trim();
      
      // Handle line continuation (lines starting with space or tab)
      if (line.startsWith(' ') || line.startsWith('\t')) {
        // For URLs, don't add spaces between continued lines
        const continuationText = line.substring(1);
        if (multiLineValue.includes('https://') || continuationText.includes('https://')) {
          multiLineValue += continuationText;
        } else {
          multiLineValue += ' ' + continuationText;
        }
        continue;
      }
      
      // Process the previous multi-line value
      if (multiLineKey && multiLineValue) {
        processEventProperty(multiLineKey, multiLineValue, currentEvent);
        multiLineKey = '';
        multiLineValue = '';
      }
      
      if (line === 'BEGIN:VEVENT') {
        inEvent = true;
        currentEvent = {};
      } else if (line === 'END:VEVENT' && inEvent) {
          // Check if event is in the future
          if (currentEvent['Date & Time']) {
            const eventDate = new Date(currentEvent['Date & Time']);
            // Show events from today onwards (including today)
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const isInRange = eventDate >= today;
            
            if (isInRange) {
              // Only add events with required fields
              if (currentEvent['Event Name'] && currentEvent.Location) {
                events.push(currentEvent as ParsedEvent);
              }
            }
          }
        inEvent = false;
        currentEvent = {};
      } else if (inEvent && line.includes(':')) {
        const colonIndex = line.indexOf(':');
        const key = line.substring(0, colonIndex);
        const value = line.substring(colonIndex + 1);
        
        
        // Check if this might be a multi-line value
        if (value && !value.endsWith('\\')) {
          processEventProperty(key, value, currentEvent);
        } else {
          // Start collecting multi-line value
          multiLineKey = key;
          multiLineValue = value;
        }
      }
    }
    
    // Sort events by date (closest upcoming events first)
    events.sort((a, b) => {
      const dateA = new Date(a['Date & Time']);
      const dateB = new Date(b['Date & Time']);
      return dateA.getTime() - dateB.getTime();
    });
    
    return events;
    
  } catch (error) {
    devLog.error('Error parsing ICS data:', error);
    return [];
  }
}

// Process individual event properties
function processEventProperty(key: string, value: string, event: Partial<ParsedEvent>) {
  // Remove any trailing backslashes and clean up value
  value = value.replace(/\\n/g, '\n').replace(/\\\\/g, '\\').replace(/\\,/g, ',');
  
  switch (key) {
    case 'SUMMARY':
      event['Event Name'] = value;
      break;
      
    case 'DTSTART':
      // Parse datetime - could be in format YYYYMMDDTHHMMSSZ or YYYYMMDD
      
      // Handle different datetime formats
      let eventDate: Date;
      
      if (value.includes('T') && value.endsWith('Z')) {
        // UTC format: 20250802T033000Z
        const year = parseInt(value.substring(0, 4));
        const month = parseInt(value.substring(4, 6)) - 1; // Month is 0-based
        const day = parseInt(value.substring(6, 8));
        const hour = parseInt(value.substring(9, 11));
        const minute = parseInt(value.substring(11, 13));
        const second = parseInt(value.substring(13, 15)) || 0;
        
        eventDate = new Date(Date.UTC(year, month, day, hour, minute, second));
        
        // Debug logging for specific events
        if (value.includes('20250802T033000Z') || value.includes('20250510T010000Z') || value.includes('20250724T190000Z')) {
        }
      } else {
        // Fallback to basic parsing
        const dateStr = value.replace(/[TZ]/g, '');
        if (dateStr.length >= 8) {
          const year = parseInt(dateStr.substring(0, 4));
          const month = parseInt(dateStr.substring(4, 6)) - 1; // Month is 0-based
          const day = parseInt(dateStr.substring(6, 8));
          
          let hour = 0, minute = 0;
          if (dateStr.length >= 12) {
            hour = parseInt(dateStr.substring(8, 10));
            minute = parseInt(dateStr.substring(10, 12));
          }
          
          eventDate = new Date(year, month, day, hour, minute);
        } else {
          devLog.warn('⚠️ Could not parse date:', value);
          break;
        }
      }
      
      event['Date & Time'] = eventDate.toISOString();
      break;
      
    case 'LOCATION':
      // Extract location, preferring the actual address over the URL
      event.Location = value; // Accept both URLs and addresses
      break;
      
    case 'DESCRIPTION':
      // Extract URL from description for Event URL - handle long URLs properly
      const urlMatch = value.match(/https:\/\/lu\.ma\/[^\s\n\\]+/);
      if (urlMatch) {
        // Remove any trailing backslashes or escape characters
        const cleanUrl = urlMatch[0].replace(/\\+$/, '');
        event['Event URL'] = cleanUrl;
      }
      
      // If location is missing or is a URL, try to extract address from description
      if (!event.Location || event.Location.startsWith('http')) {
        const addressMatch = value.match(/Address:\s*([^\n]+)/);
        if (addressMatch) {
          event.Location = addressMatch[1].trim();
        }
      }
      break;
      
    case 'GEO':
      // Parse GEO coordinates (format: latitude;longitude)
      const coords = value.split(';');
      if (coords.length === 2) {
        event.Latitude = coords[0];
        event.Longitude = coords[1];
      }
            break;
          }
        }

// Geocode location using Mapbox
export async function geocodeLocation(locationName: string): Promise<{ lat: number; lng: number } | null> {
  try {
    if (!MAPBOX_TOKEN) {
      devLog.warn('⚠️ Mapbox token not available for geocoding');
      return null;
    }

    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(locationName)}.json?access_token=${MAPBOX_TOKEN}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      devLog.warn(`⚠️ Geocoding API error: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const responseText = await response.text();
    
    // Check if response is valid JSON
    if (!responseText.trim()) {
      devLog.warn('⚠️ Empty response from geocoding API');
      return null;
    }
    
    let data: GeocodingResult;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      devLog.warn('⚠️ Invalid JSON from geocoding API:', responseText.substring(0, 200));
      return null;
    }
    
    if (data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].center;
      return { lat, lng };
    }
    
    return null;
  } catch (error) {
    devLog.error('Geocoding error:', error);
    return null;
  }
}

// Enhanced function to process events and add geocoding for missing coordinates
export async function fetchAllCalendarEventsWithGeocoding(calendarUrls: string[]): Promise<ParsedEvent[]> {
  const events = await fetchAllCalendarEvents(calendarUrls);
  
  
  // Process events to add geocoding for those missing coordinates
  const processedEvents = await Promise.all(
    events.map(async (event) => {
      // If we already have coordinates, return as is
      if (event.Latitude && event.Longitude) {
        return event;
      }
      
      // Try to geocode the location
      if (event.Location && !event.Location.startsWith('http')) {
        
        // Check if it's a Zo House event and use known coordinates
        if (event.Location.toLowerCase().includes('zo house')) {
          if (event.Location.toLowerCase().includes('bangalore') || event.Location.toLowerCase().includes('koramangala')) {
            return {
              ...event,
              Latitude: '12.932658',
              Longitude: '77.634402'
            };
          } else if (event.Location.toLowerCase().includes('san francisco') || event.Location.toLowerCase().includes('sf')) {
            return {
              ...event,
              Latitude: '37.7817309',
              Longitude: '-122.401198'
            };
          } else if (event.Location.toLowerCase().includes('whitefield')) {
            return {
              ...event,
              Latitude: '12.9725',
              Longitude: '77.745'
            };
          }
        }
        
        try {
          const coords = await geocodeLocation(event.Location);
          if (coords) {
            return {
              ...event,
              Latitude: coords.lat.toString(),
              Longitude: coords.lng.toString()
            };
          } else {
            devLog.warn(`❌ Geocoding failed for: ${event.Location}`);
          }
        } catch (geocodeError) {
          devLog.warn(`⚠️ Geocoding error for ${event.Location}:`, geocodeError);
        }
      }
      
      // Return event even if geocoding failed
      return event;
    })
  );
  
  
  // 🦄 UNICORN: Temporarily disabled SF filtering for debugging
  // TODO: Re-enable once we verify events are loading
  return processedEvents;
} 