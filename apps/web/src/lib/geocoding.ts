/**
 * Geocoding Utility
 * 
 * Converts latitude/longitude coordinates to city names using Mapbox Geocoding API
 * Used by OnboardingPage for "Use My Location" feature
 */

// Get Mapbox token from environment
const MAPBOX_TOKEN = 
  process.env.NEXT_PUBLIC_MAPBOX_TOKEN ||
  process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ||
  process.env.NEXT_PUBLIC_MAPBOX_GL_ACCESS_TOKEN ||
  process.env.NEXT_PUBLIC_MAPBOX ||
  '';

interface GeocodeResult {
  city?: string;
  error?: string;
}

/**
 * Get city name from coordinates using Mapbox Geocoding API
 * @param latitude - Latitude coordinate
 * @param longitude - Longitude coordinate
 * @returns Promise with city name or error
 */
export async function getCityFromCoordinates(
  latitude: number,
  longitude: number
): Promise<GeocodeResult> {
  // Validate coordinates
  if (!latitude || !longitude || 
      latitude < -90 || latitude > 90 || 
      longitude < -180 || longitude > 180) {
    return { error: 'Invalid coordinates provided' };
  }

  // Check if Mapbox token is configured
  if (!MAPBOX_TOKEN) {
    console.warn('⚠️ Mapbox token not configured for geocoding');
    return { error: 'Geocoding service not configured' };
  }

  // Check cache first
  const cacheKey = `geocode_${latitude.toFixed(4)}_${longitude.toFixed(4)}`;
  const cached = getCachedCity(cacheKey);
  if (cached) {
    console.log('✅ Using cached city:', cached);
    return { city: cached };
  }

  try {
    // Mapbox Geocoding API endpoint
    // Using reverse geocoding: coordinates → place name
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_TOKEN}&types=place`;

    console.log('🔄 Fetching city from Mapbox Geocoding API...');
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Parse response
    if (data.features && data.features.length > 0) {
      // Get the first place result
      const place = data.features.find((f: any) => f.place_type?.includes('place'));
      
      if (place) {
        const cityName = place.text || place.place_name;
        console.log('✅ Found city:', cityName);
        
        // Cache the result
        setCachedCity(cacheKey, cityName);
        
        return { city: cityName };
      }
    }

    // No city found in response
    console.warn('⚠️ No city found for coordinates:', { latitude, longitude });
    return { error: 'Could not determine city from location' };

  } catch (error) {
    console.error('❌ Geocoding error:', error);
    return { 
      error: error instanceof Error ? error.message : 'Failed to get city name'
    };
  }
}

/**
 * Get browser geolocation and convert to city name
 * Handles permission requests and errors
 */
export async function getCurrentCity(): Promise<GeocodeResult & { coords?: { lat: number; lng: number } }> {
  // Check if geolocation is supported
  if (!navigator.geolocation) {
    return { error: 'Geolocation is not supported by your browser' };
  }

  try {
    // Get current position
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });
    });

    const { latitude, longitude } = position.coords;
    console.log('📍 Current position:', { latitude, longitude });

    // Get city name
    const result = await getCityFromCoordinates(latitude, longitude);

    return {
      ...result,
      coords: { lat: latitude, lng: longitude }
    };

  } catch (error: any) {
    console.error('❌ Geolocation error:', error);
    
    let errorMessage = 'Failed to get your location';
    
    if (error.code) {
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Location permission denied. Please enable location access in your browser settings.';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Location information unavailable. Please try again.';
          break;
        case error.TIMEOUT:
          errorMessage = 'Location request timed out. Please try again.';
          break;
      }
    }
    
    return { error: errorMessage };
  }
}

/**
 * Cache management functions
 * Stores city results in localStorage to reduce API calls
 */

function getCachedCity(key: string): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const cached = localStorage.getItem(key);
    if (cached) {
      const { city, timestamp } = JSON.parse(cached);
      // Cache expires after 30 days
      if (Date.now() - timestamp < 30 * 24 * 60 * 60 * 1000) {
        return city;
      }
    }
  } catch (error) {
    console.warn('Cache read error:', error);
  }
  
  return null;
}

function setCachedCity(key: string, city: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const cacheData = {
      city,
      timestamp: Date.now()
    };
    localStorage.setItem(key, JSON.stringify(cacheData));
  } catch (error) {
    console.warn('Cache write error:', error);
  }
}

/**
 * Clear geocoding cache (useful for testing)
 */
export function clearGeocodeCache(): void {
  if (typeof window === 'undefined') return;
  
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('geocode_')) {
        localStorage.removeItem(key);
      }
    });
    console.log('🧹 Geocoding cache cleared');
  } catch (error) {
    console.warn('Cache clear error:', error);
  }
}

/**
 * Fallback city list (used if geocoding fails)
 * Same as SimpleOnboarding for consistency
 */
export const FALLBACK_CITIES = [
  { name: 'San Francisco', lat: 37.7749, lng: -122.4194 },
  { name: 'New York', lat: 40.7128, lng: -74.006 },
  { name: 'London', lat: 51.5074, lng: -0.1278 },
  { name: 'Bangalore', lat: 12.9716, lng: 77.5946 },
  { name: 'Singapore', lat: 1.3521, lng: 103.8198 },
  { name: 'Tokyo', lat: 35.6762, lng: 139.6503 }
];

/**
 * Get coordinates for a city name from fallback list
 */
export function getCoordinatesForCity(cityName: string): { lat: number; lng: number } | null {
  const city = FALLBACK_CITIES.find(
    c => c.name.toLowerCase() === cityName.toLowerCase()
  );
  
  if (city) {
    return { lat: city.lat, lng: city.lng };
  }
  
  return null;
}

