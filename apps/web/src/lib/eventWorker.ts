/**
 * Canonical Event Worker
 * 
 * Syncs events from iCal feeds to canonical_events table with:
 * - Dry-run mode for safety
 * - Idempotent upserts (safe to re-run)
 * - Geocoding cache
 * - Audit trail
 * 
 * Usage:
 *   await syncCanonicalEvents() // Full sync
 *   await syncCanonicalEvents({ dryRun: true }) // Test mode
 *   await syncCanonicalEvents({ calendarId: 'cal-123' }) // Single source
 */

import { supabaseAdmin, hasServiceRole } from './supabaseAdmin';
import { supabase as supabaseAnon } from './supabase';
import { fetchAllCalendarEvents } from './icalParser';
import { getCalendarUrls } from './calendarConfig';
import { canonicalUid } from './canonicalUid';
import { geocodeLocation } from './icalParser';
import type { ParsedEvent } from './icalParser';
import { shouldWorkerWrite, FEATURE_FLAGS } from './featureFlags';
import { devLog } from '@/lib/logger';

// Use admin client (bypasses RLS) for worker operations, fall back to anon
const supabase = supabaseAdmin || supabaseAnon;

/**
 * Worker configuration
 */
interface WorkerConfig {
  dryRun?: boolean;
  calendarId?: string; // Process single calendar only
  verbose?: boolean;
}

/**
 * Geocoding result with cache status
 */
interface GeocodeResult {
  lat: number | null;
  lng: number | null;
  status: 'success' | 'failed' | 'cached';
  attempted_at: string;
}

/**
 * Sync result statistics
 */
interface SyncStats {
  processed: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: number;
  dryRunOnly: boolean;
  duration_ms: number;
}

/**
 * Main sync function
 */
export async function syncCanonicalEvents(config: WorkerConfig = {}): Promise<SyncStats> {
  const startTime = Date.now();
  const isDryRun = config.dryRun ?? FEATURE_FLAGS.CANONICAL_DRY_RUN;
  const verbose = config.verbose ?? false;
  
  const stats: SyncStats = {
    processed: 0,
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    dryRunOnly: isDryRun,
    duration_ms: 0,
  };
  
  try {
    // Check for service role (needed to bypass RLS)
    if (!hasServiceRole) {
      devLog.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY not set - worker may fail due to RLS policies');
    }
    
    // Log worker start
    devLog.log('🔄 Starting canonical event sync', {
      dryRun: isDryRun,
      writeEnabled: FEATURE_FLAGS.CANONICAL_EVENTS_WRITE,
      calendarId: config.calendarId,
      hasServiceRole,
    });
    
    // Fetch calendar URLs
    let calendarUrls = await getCalendarUrls();
    
    // Log what we got
    devLog.log(`📅 Fetched ${calendarUrls.length} calendar URLs from config`);
    if (verbose) {
      devLog.log('📋 Calendar URLs:', calendarUrls);
    }
    
    // Filter to single calendar if specified
    if (config.calendarId) {
      calendarUrls = calendarUrls.filter(url => url.includes(config.calendarId!));
      if (calendarUrls.length === 0) {
        throw new Error(`Calendar ${config.calendarId} not found`);
      }
    }
    
    if (calendarUrls.length === 0) {
      devLog.warn('⚠️  No calendar URLs configured! Check calendars table in database.');
      return stats;
    }
    
    devLog.log(`📅 Processing ${calendarUrls.length} calendar(s)`);
    
    // Fetch all events
    const events = await fetchAllCalendarEvents(calendarUrls);
    devLog.log(`📋 Fetched ${events.length} events from iCal feeds`);
    
    // Process each event
    for (const event of events) {
      try {
        await processEvent(event, isDryRun, verbose);
        stats.processed++;
        
        // Track insert/update (dry-run counts as skipped)
        if (isDryRun) {
          stats.skipped++;
        }
      } catch (error) {
        devLog.error(`❌ Error processing event "${event['Event Name']}":`, error);
        stats.errors++;
      }
    }
    
    stats.duration_ms = Date.now() - startTime;
    
    // Log summary
    devLog.log('✅ Sync complete', stats);
    
    return stats;
    
  } catch (error) {
    devLog.error('❌ Fatal error during sync:', error);
    stats.duration_ms = Date.now() - startTime;
    throw error;
  }
}

/**
 * Process a single event
 */
async function processEvent(
  event: ParsedEvent,
  isDryRun: boolean,
  verbose: boolean
): Promise<void> {
  const uid = canonicalUid(event);
  
  if (verbose) {
    devLog.log(`🔍 Processing event: "${event['Event Name']}" (UID: ${uid})`);
  }
  
  // Check if event already exists
  const { data: existing, error: queryError } = await supabase
    .from('canonical_events')
    .select('id, lat, lng, geocode_status, geocode_attempted_at, event_version')
    .eq('canonical_uid', uid)
    .maybeSingle();
  
  if (queryError) {
    devLog.error('Database query error:', queryError);
    throw queryError;
  }
  
  // Dry-run mode: Log to audit table only
  if (isDryRun) {
    await logDryRun(uid, existing, event);
    return;
  }
  
  // Real mode: Insert or update
  if (!existing) {
    await insertNewEvent(uid, event, verbose);
  } else {
    await updateExistingEvent(existing, event, verbose);
  }
}

/**
 * Log dry-run operation (no writes to canonical_events)
 */
async function logDryRun(
  uid: string,
  existing: any,
  event: ParsedEvent
): Promise<void> {
  const action = existing ? 'would-update' : 'would-insert';
  
  await supabase
    .from('canonical_event_changes')
    .insert({
      canonical_event_id: existing?.id || null,
      change_type: 'dry-run',
      payload: {
        action,
        canonical_uid: uid,
        event_name: event['Event Name'],
        location: event.Location,
        starts_at: event['Date & Time'],
      },
    });
  
  devLog.log(`🧪 DRY-RUN: ${uid} - ${action}`);
}

/**
 * Insert new event into canonical_events
 */
async function insertNewEvent(
  uid: string,
  event: ParsedEvent,
  verbose: boolean
): Promise<void> {
  // Geocode location if needed
  const geocode = await geocodeEventLocation(event);
  
  // Parse timezone (fallback to UTC if not available)
  const tz = extractTimezone(event) || 'UTC';
  
  const { data: inserted, error } = await supabase
    .from('canonical_events')
    .insert({
      canonical_uid: uid,
      title: event['Event Name'],
      description: event['Event URL'] || null,
      location_raw: event.Location,
      lat: geocode.lat,
      lng: geocode.lng,
      geocode_status: geocode.status,
      geocode_attempted_at: geocode.attempted_at,
      starts_at: event['Date & Time'],
      tz,
      source_refs: JSON.stringify([{
        event_url: event['Event URL'],
        fetched_at: new Date().toISOString(),
      }]),
      raw_payload: JSON.stringify(event),
      event_version: 1,
    })
    .select()
    .single();
  
  if (error) {
    devLog.error('Insert error:', error);
    throw error;
  }
  
  // Log to audit trail
  await supabase
    .from('canonical_event_changes')
    .insert({
      canonical_event_id: inserted.id,
      change_type: 'insert',
      payload: { event_name: event['Event Name'], uid },
    });
  
  if (verbose) {
    devLog.log(`✅ Inserted: ${uid} - "${event['Event Name']}"`);
  }
}

/**
 * Update existing event (merge strategy)
 */
async function updateExistingEvent(
  existing: any,
  event: ParsedEvent,
  verbose: boolean
): Promise<void> {
  // Check if we should retry geocoding
  const shouldRetryGeocode = 
    (!existing.lat || !existing.lng || existing.geocode_status === 'failed') &&
    (!existing.geocode_attempted_at || 
     (new Date().getTime() - new Date(existing.geocode_attempted_at).getTime()) > 86400000); // 24h
  
  if (!shouldRetryGeocode) {
    if (verbose) {
      devLog.log(`⏭️  Skipped (already complete or recently attempted): "${event['Event Name']}"`);
    }
    return;
  }
  
  // Attempt geocoding
  const geocode = await geocodeEventLocation(event);
  
  const { error } = await supabase
    .from('canonical_events')
    .update({
      lat: geocode.lat,
      lng: geocode.lng,
      geocode_status: geocode.status,
      geocode_attempted_at: geocode.attempted_at,
      event_version: existing.event_version + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', existing.id);
  
  if (error) {
    devLog.error('Update error:', error);
    throw error;
  }
  
  // Log to audit trail
  await supabase
    .from('canonical_event_changes')
    .insert({
      canonical_event_id: existing.id,
      change_type: 'update',
      payload: { action: 'geocode_update', event_name: event['Event Name'] },
    });
  
  if (verbose) {
    devLog.log(`🔄 Updated: ${existing.id} - "${event['Event Name']}"`);
  }
}

/**
 * Geocode event location with caching
 */
async function geocodeEventLocation(event: ParsedEvent): Promise<GeocodeResult> {
  // Skip if already has coordinates
  if (event.Latitude && event.Longitude) {
    return {
      lat: parseFloat(event.Latitude),
      lng: parseFloat(event.Longitude),
      status: 'cached',
      attempted_at: new Date().toISOString(),
    };
  }
  
  // Skip if location is a URL
  if (event.Location?.startsWith('http')) {
    return {
      lat: null,
      lng: null,
      status: 'failed',
      attempted_at: new Date().toISOString(),
    };
  }
  
  // Attempt geocoding
  try {
    const coords = await geocodeLocation(event.Location);
    if (coords) {
      return {
        lat: coords.lat,
        lng: coords.lng,
        status: 'success',
        attempted_at: new Date().toISOString(),
      };
    }
  } catch (error) {
    devLog.warn(`Geocoding failed for "${event.Location}":`, error);
  }
  
  return {
    lat: null,
    lng: null,
    status: 'failed',
    attempted_at: new Date().toISOString(),
  };
}

/**
 * Extract timezone from event (if available)
 */
function extractTimezone(event: ParsedEvent): string | null {
  // TODO: Parse DTSTART;TZID= from raw iCal data
  // For now, return null (will use UTC default)
  return null;
}

/**
 * CLI-friendly wrapper
 */
export async function runWorkerCLI() {
  const args = process.argv.slice(2);
  const config: WorkerConfig = {
    dryRun: !args.includes('--apply'),
    calendarId: args.find(arg => arg.startsWith('--calendar='))?.split('=')[1],
    verbose: args.includes('--verbose') || args.includes('-v'),
  };
  
  devLog.log('🚀 Canonical Event Worker CLI');
  devLog.log('================================');
  devLog.log('Config:', config);
  devLog.log('');
  
  try {
    const stats = await syncCanonicalEvents(config);
    devLog.log('');
    devLog.log('📊 Final Statistics:');
    devLog.log(JSON.stringify(stats, null, 2));
    process.exit(0);
  } catch (error) {
    devLog.error('💥 Worker failed:', error);
    process.exit(1);
  }
}

// Run CLI if executed directly
if (require.main === module) {
  runWorkerCLI();
}

