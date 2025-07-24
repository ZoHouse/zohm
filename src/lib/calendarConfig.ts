// Calendar Configuration - Extracted from original map.zo project
// These are the exact same calendar URLs used in the working HTML version

// Calendar IDs for our API route
export const CALENDAR_IDS = [
  'cal-ZVonmjVxLk7F2oM', // Bangalore
  'cal-3YNnBTToy9fnnjQ'  // San Francisco
];

// Generate URLs for our API route
export const CALENDAR_URLS = CALENDAR_IDS.map(id => `/api/calendar?id=${id}`);

// Map Configuration (same as original)
export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;
export const DEFAULT_CENTER: [number, number] = [77.6413, 12.9141]; // Bangalore, Karnataka 