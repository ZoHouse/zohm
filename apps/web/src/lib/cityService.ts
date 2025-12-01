import { supabase } from './supabase';
import { devLog } from '@/lib/logger';

export interface City {
  id: string;
  name: string;
  country: string;
  state_province: string | null;
  latitude: number;
  longitude: number;
  timezone: string | null;
  stage: number;
  population_total: number;
  population_active: number;
  node_count: number;
  total_quests_completed: number;
  total_zo_earned: number;
  token_address: string | null;
  treasury_balance: number;
  metadata: {
    climate?: string;
    landmarks?: string[];
    featured_events?: string[];
  };
  created_at: string;
  updated_at: string;
}

export interface CityProgress {
  id: string;
  city_id: string;
  user_id: string;
  quests_completed: number;
  zo_earned: number;
  events_attended: number;
  nodes_visited: number;
  first_contribution_at: string;
  last_contribution_at: string;
}

/**
 * Get all cities ordered by population
 */
export async function getAllCities(): Promise<City[]> {
  const { data, error } = await supabase
    .from('cities')
    .select('*')
    .order('population_total', { ascending: false });

  if (error) {
    devLog.error('Error fetching cities:', error);
    return [];
  }

  return data || [];
}

/**
 * Get a specific city by ID
 */
export async function getCityById(cityId: string): Promise<City | null> {
  const { data, error } = await supabase
    .from('cities')
    .select('*')
    .eq('id', cityId)
    .single();

  if (error) {
    devLog.error('Error fetching city:', error);
    return null;
  }

  return data;
}

/**
 * Get nearby cities within radius (km)
 */
export async function getNearbyCities(
  latitude: number,
  longitude: number,
  radiusKm: number = 100
): Promise<City[]> {
  // For now, fetch all cities and filter client-side
  // TODO: Implement PostGIS for server-side distance calculation
  const cities = await getAllCities();
  
  return cities.filter(city => {
    const distance = haversineDistance(
      latitude,
      longitude,
      city.latitude,
      city.longitude
    );
    return distance <= radiusKm;
  });
}

/**
 * Find or create city from geocoded location
 */
export async function findOrCreateCity(
  cityName: string,
  country: string,
  latitude: number,
  longitude: number,
  stateProvince?: string
): Promise<City | null> {
  // Generate city ID (slug format: "city-name-country")
  const cityId = generateCityId(cityName, country);

  // Check if city exists
  let city = await getCityById(cityId);
  
  if (city) {
    return city;
  }

  // Create new city
  const { data, error } = await supabase
    .from('cities')
    .insert({
      id: cityId,
      name: cityName,
      country: country,
      state_province: stateProvince || null,
      latitude: latitude,
      longitude: longitude,
      stage: 1,  // Start as Prospect
      population_total: 0,
      metadata: {}
    })
    .select()
    .single();

  if (error) {
    devLog.error('Error creating city:', error);
    return null;
  }

  return data;
}

/**
 * Sync user's home city (Map your Sync feature)
 */
export async function syncUserHomeCity(
  userId: string,
  cityId: string
): Promise<{ success: boolean; zoEarned: number; city: City | null }> {
  try {
    // Get current sync count first
    const { data: currentUser } = await supabase
      .from('users')
      .select('city_sync_count')
      .eq('id', userId)
      .single();
    
    const currentCount = currentUser?.city_sync_count || 0;
    
    // Update user's home city
    const { data: userData, error: userError } = await supabase
      .from('users')
      .update({
        home_city_id: cityId,
        city_synced_at: new Date().toISOString(),
        city_sync_count: currentCount + 1
      })
      .eq('id', userId)
      .select()
      .single();

    if (userError) {
      devLog.error('Error updating user home city:', userError);
      return { success: false, zoEarned: 0, city: null };
    }

    // Award 200 Zo for syncing home city
    const { error: repError } = await supabase
      .from('user_reputations')
      .upsert({
        user_id: userId,
        trait: 'city_sync',
        score: 200,
        level: 2,
        last_earned_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,trait'
      });

    if (repError) {
      devLog.error('Error updating reputation:', repError);
    }

    // Create or update city progress entry
    const { error: progressError } = await supabase
      .from('city_progress')
      .upsert({
        city_id: cityId,
        user_id: userId,
        last_contribution_at: new Date().toISOString()
      }, {
        onConflict: 'city_id,user_id'
      });

    if (progressError) {
      devLog.error('Error updating city progress:', progressError);
    }

    // Fetch updated city data
    const city = await getCityById(cityId);

    return {
      success: true,
      zoEarned: 200,
      city: city
    };
  } catch (error) {
    devLog.error('Error syncing home city:', error);
    return { success: false, zoEarned: 0, city: null };
  }
}

/**
 * Get user's city progress
 */
export async function getUserCityProgress(
  userId: string,
  cityId: string
): Promise<CityProgress | null> {
  const { data, error } = await supabase
    .from('city_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('city_id', cityId)
    .single();

  if (error) {
    // Not found is not an error, just means no progress yet
    if (error.code === 'PGRST116') {
      return null;
    }
    devLog.error('Error fetching city progress:', error);
    return null;
  }

  return data;
}

/**
 * Get city leaderboard (top contributors)
 */
export async function getCityLeaderboard(
  cityId: string,
  limit: number = 10
): Promise<CityProgress[]> {
  const { data, error } = await supabase
    .from('city_progress')
    .select('*')
    .eq('city_id', cityId)
    .order('zo_earned', { ascending: false })
    .limit(limit);

  if (error) {
    devLog.error('Error fetching city leaderboard:', error);
    return [];
  }

  return data || [];
}

// ============================================
// Helper Functions
// ============================================

/**
 * Generate city ID from name and country
 * Format: "san-francisco-us", "bangalore-in"
 */
function generateCityId(cityName: string, countryCode: string): string {
  const slug = cityName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  
  const country = countryCode
    .toLowerCase()
    .replace(/[^a-z]+/g, '-')
    .substring(0, 2);
  
  return `${slug}-${country}`;
}

/**
 * Calculate distance between two points using Haversine formula
 */
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
    Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Get city stage name
 */
export function getCityStageName(stage: number): string {
  const stages = {
    1: 'Prospect',
    2: 'Outpost',
    3: 'District',
    4: 'City Center',
    5: 'Network Hub'
  };
  return stages[stage as keyof typeof stages] || 'Unknown';
}

/**
 * Get next stage requirements
 */
export function getNextStageRequirements(stage: number): string {
  const requirements = {
    1: '11 users to reach Outpost',
    2: '51 users to reach District',
    3: '201 users to reach City Center',
    4: '1000 users to reach Network Hub',
    5: 'Maximum stage reached!'
  };
  return requirements[stage as keyof typeof requirements] || '';
}

