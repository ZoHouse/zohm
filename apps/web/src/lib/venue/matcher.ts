/**
 * Venue Matching Engine
 *
 * Scores Zoeventsmaster venues against an inquiry's requirements.
 * Scoring: location (40), capacity (20), requirements (30), operational (10) = 100 max.
 * Returns top 3: best match + 2 alternatives.
 */

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { devLog } from '@/lib/logger';
import type { EventInquiry, VenueMatchResult, ZoeventsVenue } from '@/types/inquiry';

if (!supabaseAdmin) {
  throw new Error('[Venue Matcher] SUPABASE_SERVICE_ROLE_KEY is required — cannot use anon client for server-side operations');
}
const db = supabaseAdmin;

// Region mapping for fuzzy location matching
const CITY_TO_REGION: Record<string, string> = {
  manali: 'North', shimla: 'North', rishikesh: 'North', mcleodganj: 'North',
  varanasi: 'North', agra: 'North', delhi: 'North', dehradun: 'North',
  mussoorie: 'North', kasol: 'North', bir: 'North', spiti: 'North',
  goa: 'West', mumbai: 'West', pune: 'West',
  bangalore: 'South', mysore: 'South', coorg: 'South', ooty: 'South',
  pondicherry: 'South', kochi: 'South', alleppey: 'South', varkala: 'South',
  jaipur: 'Rajasthan', udaipur: 'Rajasthan', jaisalmer: 'Rajasthan', jodhpur: 'Rajasthan', pushkar: 'Rajasthan',
  kolkata: 'East/Northeast', darjeeling: 'East/Northeast', gangtok: 'East/Northeast', shillong: 'East/Northeast',
  srinagar: 'J&K', leh: 'J&K', pahalgam: 'J&K',
};

// Keyword-to-region mapping for vague locations
const KEYWORD_TO_REGION: Record<string, string> = {
  mountains: 'North',
  hills: 'North',
  beach: 'West',
  south: 'South',
  north: 'North',
  rajasthan: 'Rajasthan',
  northeast: 'East/Northeast',
  kashmir: 'J&K',
};

function isYes(val: string | null | undefined): boolean {
  return (val || '').toLowerCase().trim() === 'yes';
}

function parseCapacity(val: string | null | undefined): number {
  const num = parseInt(val || '0', 10);
  return isNaN(num) ? 0 : num;
}

function parseHeadcount(val: string): number {
  const num = parseInt(val || '0', 10);
  return isNaN(num) ? 0 : num;
}

/**
 * Score a single venue against an inquiry
 */
function scoreVenue(venue: ZoeventsVenue, inquiry: EventInquiry): { score: number; reasoning: string[] } {
  let score = 0;
  const reasons: string[] = [];
  const location = (inquiry.venue_preference || '').toLowerCase().trim();
  const guests = parseHeadcount(inquiry.expected_headcount);

  // --- LOCATION SCORE (0-40) ---
  const venueCity = (venue.city || '').toLowerCase().trim();
  const venueRegion = (venue.region || '').toLowerCase().trim();

  if (location && venueCity.includes(location)) {
    score += 40;
    reasons.push(`Exact city match (${venue.city})`);
  } else if (location) {
    // Try region matching
    const inferredRegion = CITY_TO_REGION[location] || KEYWORD_TO_REGION[location];
    if (inferredRegion && venueRegion === inferredRegion.toLowerCase()) {
      score += 20;
      reasons.push(`Same region (${venue.region})`);
    } else if (venueCity.includes(location.split(' ')[0])) {
      score += 30;
      reasons.push(`Partial city match (${venue.city})`);
    }
  }

  // --- CAPACITY SCORE (0-20) ---
  const hallCapacity = parseCapacity(venue.convention_hall_capacity);
  if (isYes(venue.convention_hall_available) && hallCapacity >= guests && guests > 0) {
    score += 20;
    reasons.push(`Convention hall fits ${guests} guests (capacity: ${hallCapacity})`);
  } else if (isYes(venue.convention_hall_available) && guests > 0) {
    score += 10;
    reasons.push(`Has convention hall (capacity: ${hallCapacity || 'unknown'})`);
  } else if (isYes(venue.lounge) || isYes(venue.rooftop_access)) {
    score += 5;
    reasons.push('Has lounge/rooftop area');
  }

  // --- REQUIREMENTS SCORE (0-30, 6 pts each) ---
  if (inquiry.needs_projector && isYes(venue.has_projector)) {
    score += 6;
    reasons.push('Has projector');
  }
  if (inquiry.needs_music && (isYes(venue.has_speakers) || isYes(venue.amplified_music_allowed))) {
    score += 6;
    reasons.push('Has sound/music setup');
  }
  if (inquiry.needs_catering && (isYes(venue.meal_buffet_available) || isYes(venue.external_catering_allowed))) {
    score += 6;
    reasons.push(isYes(venue.meal_buffet_available) ? 'In-house catering' : 'External catering allowed');
  }
  if (inquiry.needs_accommodation) {
    // All Zostel properties have rooms by definition
    score += 6;
    reasons.push('Accommodation available');
  }
  if (inquiry.needs_convention_hall && isYes(venue.convention_hall_available)) {
    score += 6;
    reasons.push('Convention hall available');
  }
  if (inquiry.needs_outdoor_area && (isYes(venue.has_garden) || isYes(venue.rooftop_access))) {
    score += 6;
    reasons.push(isYes(venue.has_garden) ? 'Garden area' : 'Rooftop access');
  }

  // --- OPERATIONAL SCORE (0-10) ---
  if (venue.operational_status === 'Active') {
    score += 5;
  }
  // Zo Houses and Zostel Plus get a small bonus for event suitability
  if (venue.category === 'Zo Houses' || venue.category === 'Zostel Plus') {
    score += 5;
    reasons.push(`${venue.category} — premium venue`);
  } else if (venue.category === 'Zostel') {
    score += 3;
  }

  return { score: Math.min(score, 100), reasoning: reasons };
}

/**
 * Match an inquiry to the best venues in Zoeventsmaster.
 * Returns top 3 matches with scores and reasoning.
 */
export async function matchVenues(inquiry: EventInquiry): Promise<{
  bestMatch: VenueMatchResult | null;
  alternatives: VenueMatchResult[];
}> {
  // Fetch all active venues with relevant columns
  const { data: venues, error } = await db
    .from('Zoeventsmaster')
    .select([
      'id', 'property_name', 'category', 'city', 'region', 'operational_status',
      'convention_hall_available', 'convention_hall_capacity',
      'has_projector', 'has_speakers', 'has_mic', 'events_stage',
      'lounge', 'rooftop_access', 'has_garden',
      'amplified_music_allowed', 'live_music_allowed', 'dj_allowed',
      'meal_buffet_available', 'external_catering_allowed',
      'hourly_rate', 'half_day_rate', 'full_day_rate',
      'buffet_veg_per_pax', 'buffet_nonveg_per_pax',
      'cleanup_fee', 'security_deposit', 'convention_hall_charges',
      'peak_season_multiplier', 'offseason_discount_pct',
      'rooms_json',
    ].join(','))
    .eq('operational_status', 'Active');

  if (error || !venues) {
    devLog.error('[Venue Matcher] Failed to fetch venues:', error);
    return { bestMatch: null, alternatives: [] };
  }

  // Score all venues
  const scored = (venues as unknown as ZoeventsVenue[]).map(venue => {
    const { score, reasoning } = scoreVenue(venue, inquiry);
    return {
      property_name: venue.property_name,
      score,
      reasoning: reasoning.join('. ') || 'No specific matches',
      city: venue.city,
      region: venue.region,
      category: venue.category,
    } satisfies VenueMatchResult;
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  const bestMatch = scored[0] || null;
  const alternatives = scored.slice(1, 3);

  devLog.log(`[Venue Matcher] Matched ${scored.length} venues. Best: ${bestMatch?.property_name} (${bestMatch?.score})`);

  return { bestMatch, alternatives };
}

/**
 * Store match results on the inquiry row
 */
export async function saveMatchResults(
  inquiryId: string,
  bestMatch: VenueMatchResult | null,
  alternatives: VenueMatchResult[]
): Promise<void> {
  const { error } = await db
    .from('event_inquiries')
    .update({
      matched_venue: bestMatch?.property_name || '',
      match_score: bestMatch?.score ?? null,
      match_reasoning: bestMatch?.reasoning || '',
      alternative_venues: alternatives,
      inquiry_status: bestMatch ? 'matched' : 'new',
      updated_at: new Date().toISOString(),
    })
    .eq('id', inquiryId);

  if (error) {
    devLog.error('[Venue Matcher] Failed to save match results:', error);
  }
}
