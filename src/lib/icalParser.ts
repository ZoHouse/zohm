import { MAPBOX_TOKEN } from './calendarConfig';

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
      console.log('📅 Fetching calendar from:', url);
      
      // Use our API route to avoid CORS issues
      const response = await fetch(url, {
        headers: {
          'Accept': 'text/calendar, text/plain, */*'
        }
      });
      
      if (!response.ok) {
        console.warn(`⚠️ Failed to fetch calendar ${url}:`, response.status, response.statusText);
        continue;
      }

      const icalData = await response.text();
      console.log(`📝 Received ${icalData.length} characters of iCal data from ${url}`);
      
      // Check if response is actually iCal data
      if (!icalData.includes('BEGIN:VCALENDAR')) {
        console.warn(`⚠️ Response doesn't appear to be iCal data from ${url}:`, icalData.substring(0, 200));
        continue;
      }
      
      console.log(`🔄 Starting to parse iCal data from ${url}...`);
      const events = parseICS(icalData);
      console.log(`✅ Finished parsing ${url}, found ${events.length} events`);
      
      console.log(`✅ Parsed ${events.length} events from ${url}`);
      if (events.length > 0) {
        console.log(`📋 First few events:`, events.slice(0, 3).map(e => ({
          name: e['Event Name'],
          date: e['Date & Time'],
          location: e.Location
        })));
      }
      allEvents.push(...events);
      
    } catch (error) {
      console.error(`❌ Error fetching calendar ${url}:`, error);
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
    
    console.log(`🕐 Showing all events after: ${now.toISOString()}`);
    
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
        multiLineValue += line.substring(1);
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
            
            // Debug logging for date filtering
            const eventName = currentEvent['Event Name'] || 'Unnamed Event';
            const isSpecialEvent = eventName.includes('FIFA') || eventName.includes('Monad') || eventName.includes('Musa');
            
            if (isSpecialEvent) {
              console.log(`🎯 SPECIAL EVENT: "${eventName}"`);
              console.log(`   Event Date: ${eventDate.toISOString()}`);
              console.log(`   Now: ${now.toISOString()}`);
              console.log(`   Is Future: ${isInRange}`);
              console.log(`   Location: "${currentEvent.Location}"`);
              console.log(`   Date comparison: ${eventDate.getTime()} >= ${now.getTime()} = ${eventDate.getTime() >= now.getTime()}`);
            } else {
              console.log(`📅 Event: "${eventName}" | Date: ${eventDate.toISOString()} | Is Future: ${isInRange}`);
            }
            
            if (isInRange) {
              // Only add events with required fields
              if (currentEvent['Event Name'] && currentEvent.Location) {
                // Only log important events to reduce noise
                if (currentEvent['Event Name'].includes('Monad') || currentEvent['Event Name'].includes('Musa')) {
                  console.log(`✅ Adding important event: ${currentEvent['Event Name']} at ${currentEvent['Date & Time']}`);
                }
                events.push(currentEvent as ParsedEvent);
              } else {
                console.log(`❌ Event missing required fields: Name="${currentEvent['Event Name']}" Location="${currentEvent.Location}"`);
              }
            }
          }
        inEvent = false;
        currentEvent = {};
      } else if (inEvent && line.includes(':')) {
        const colonIndex = line.indexOf(':');
        const key = line.substring(0, colonIndex);
        const value = line.substring(colonIndex + 1);
        
        // Debug specific keys for important events
        if (key === 'SUMMARY' && (value.includes('Monad') || value.includes('Musa'))) {
          console.log(`🔍 Processing important event: "${value}"`);
        }
        
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
    
    console.log(`🗓️ Found ${events.length} future events`);
    console.log(`📋 Events found:`, events.map(e => ({ 
      name: e['Event Name'], 
      date: e['Date & Time'],
      location: e.Location,
      url: e['Event URL']
    })));
    return events;
    
  } catch (error) {
    console.error('Error parsing ICS data:', error);
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
      // console.log(`🕐 Raw DTSTART value: "${value}"`);
      
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
          console.log(`🔍 DEBUG DATE PARSING:`);
          console.log(`   Raw value: ${value}`);
          console.log(`   Parsed UTC: ${eventDate.toISOString()}`);
          console.log(`   Local time: ${eventDate.toString()}`);
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
          console.warn('⚠️ Could not parse date:', value);
          break;
        }
      }
      
      event['Date & Time'] = eventDate.toISOString();
      // console.log(`📅 Parsed date: ${value} → ${eventDate.toISOString()}`);
      break;
      
    case 'LOCATION':
      // Extract location, preferring the actual address over the URL
      event.Location = value; // Accept both URLs and addresses
      // console.log(`🏠 Location found: "${value}"`);
      break;
      
    case 'DESCRIPTION':
      // Extract URL from description for Event URL
      const urlMatch = value.match(/https:\/\/lu\.ma\/[^\s\n]+/);
      if (urlMatch) {
        event['Event URL'] = urlMatch[0];
        console.log(`🔗 Found event URL: ${urlMatch[0]}`);
      }
      
      // If location is missing or is a URL, try to extract address from description
      if (!event.Location || event.Location.startsWith('http')) {
        const addressMatch = value.match(/Address:\s*([^\n]+)/);
        if (addressMatch) {
          event.Location = addressMatch[1].trim();
          console.log(`🏠 Extracted address from description: ${addressMatch[1].trim()}`);
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
      console.warn('⚠️ Mapbox token not available for geocoding');
      return null;
    }

    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(locationName)}.json?access_token=${MAPBOX_TOKEN}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn(`⚠️ Geocoding API error: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const responseText = await response.text();
    
    // Check if response is valid JSON
    if (!responseText.trim()) {
      console.warn('⚠️ Empty response from geocoding API');
      return null;
    }
    
    let data: GeocodingResult;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.warn('⚠️ Invalid JSON from geocoding API:', responseText.substring(0, 200));
      return null;
    }
    
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

// Enhanced function to process events and add geocoding for missing coordinates
export async function fetchAllCalendarEventsWithGeocoding(calendarUrls: string[]): Promise<ParsedEvent[]> {
  const events = await fetchAllCalendarEvents(calendarUrls);
  
  console.log(`🔄 Processing ${events.length} events for geocoding...`);
  
  // Process events to add geocoding for those missing coordinates
  const processedEvents = await Promise.all(
    events.map(async (event) => {
      // If we already have coordinates, return as is
      if (event.Latitude && event.Longitude) {
        return event;
      }
      
      // Try to geocode the location
      if (event.Location && !event.Location.startsWith('http')) {
        console.log(`🗺️ Geocoding location: ${event.Location}`);
        
        // Check if it's a Zo House event and use known coordinates
        if (event.Location.toLowerCase().includes('zo house')) {
          if (event.Location.toLowerCase().includes('bangalore') || event.Location.toLowerCase().includes('koramangala')) {
            console.log(`🏠 Using Zo House Bangalore coordinates for: ${event.Location}`);
            return {
              ...event,
              Latitude: '12.932658',
              Longitude: '77.634402'
            };
          } else if (event.Location.toLowerCase().includes('san francisco') || event.Location.toLowerCase().includes('sf')) {
            console.log(`🏠 Using Zo House SF coordinates for: ${event.Location}`);
            return {
              ...event,
              Latitude: '37.7817309',
              Longitude: '-122.401198'
            };
          } else if (event.Location.toLowerCase().includes('whitefield')) {
            console.log(`🏠 Using Zo House Whitefield coordinates for: ${event.Location}`);
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
            console.log(`✅ Geocoding successful for: ${event.Location} → [${coords.lat}, ${coords.lng}]`);
            return {
              ...event,
              Latitude: coords.lat.toString(),
              Longitude: coords.lng.toString()
            };
          } else {
            console.warn(`❌ Geocoding failed for: ${event.Location}`);
          }
        } catch (geocodeError) {
          console.warn(`⚠️ Geocoding error for ${event.Location}:`, geocodeError);
        }
      }
      
      // Return event even if geocoding failed
      return event;
    })
  );
  
  console.log(`✅ Finished processing events. Events with coordinates:`, processedEvents.filter(e => e.Latitude && e.Longitude).length);
  console.log(`📋 Final events:`, processedEvents.map(e => ({ name: e['Event Name'], location: e.Location, coords: e.Latitude && e.Longitude ? `[${e.Latitude}, ${e.Longitude}]` : 'None' })));
  
  return processedEvents;
} 