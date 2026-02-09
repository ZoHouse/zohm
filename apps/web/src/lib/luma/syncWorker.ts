/**
 * Luma Sync Worker
 *
 * Pulls events from Luma API into canonical_events table.
 * Follows the same pattern as eventWorker.ts (config interface, stats return, dry-run).
 *
 * Usage:
 *   await syncLumaEvents() // Dry-run (default)
 *   await syncLumaEvents({ dryRun: false }) // Apply writes
 *   await syncLumaEvents({ calendar: 'blr' }) // Single calendar
 */

import { supabaseAdmin, hasServiceRole } from '@/lib/supabaseAdmin';
import { supabase as supabaseAnon } from '@/lib/supabase';
import { isLumaApiEnabled } from '@/lib/featureFlags';
import { devLog } from '@/lib/logger';
import { lumaClient } from './client';
import { getActiveLumaCalendars, getLumaCalendar } from './config';
import type { LumaCalendarConfig, LumaEvent, LumaSyncStatus } from './types';
import type { SourceType, LocationType } from '@/types/events';

// Use admin client (bypasses RLS) for worker operations, fall back to anon
const supabase = supabaseAdmin || supabaseAnon;

// ============================================
// CONFIG & STATS
// ============================================

export interface LumaSyncConfig {
  dryRun?: boolean;
  calendar?: string;       // 'blr' | 'zo_events' — single calendar filter
  verbose?: boolean;
}

export interface LumaSyncStats {
  processed: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: number;
  dryRunOnly: boolean;
  duration_ms: number;
  calendarsProcessed: string[];
}

// ============================================
// MAIN SYNC FUNCTION
// ============================================

export async function syncLumaEvents(config: LumaSyncConfig = {}): Promise<LumaSyncStats> {
  const startTime = Date.now();
  const isDryRun = config.dryRun ?? true; // Default to dry-run for safety
  const verbose = config.verbose ?? false;

  const stats: LumaSyncStats = {
    processed: 0,
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    dryRunOnly: isDryRun,
    duration_ms: 0,
    calendarsProcessed: [],
  };

  try {
    // Safety checks
    if (!isLumaApiEnabled()) {
      devLog.warn('[Luma Sync] LUMA_API_SYNC feature flag is disabled');
      stats.duration_ms = Date.now() - startTime;
      return stats;
    }

    if (!hasServiceRole) {
      devLog.warn('[Luma Sync] SUPABASE_SERVICE_ROLE_KEY not set — worker may fail due to RLS');
    }

    devLog.log('[Luma Sync] Starting sync', { dryRun: isDryRun, calendar: config.calendar });

    // Determine which calendars to process
    let calendars: LumaCalendarConfig[];
    if (config.calendar) {
      const cal = getLumaCalendar(config.calendar);
      if (!cal) {
        throw new Error(`Unknown Luma calendar: ${config.calendar}`);
      }
      if (!cal.apiKey) {
        throw new Error(`No API key configured for calendar: ${config.calendar}`);
      }
      calendars = [cal];
    } else {
      calendars = getActiveLumaCalendars();
    }

    if (calendars.length === 0) {
      devLog.warn('[Luma Sync] No active Luma calendars configured');
      stats.duration_ms = Date.now() - startTime;
      return stats;
    }

    devLog.log(`[Luma Sync] Processing ${calendars.length} calendar(s)`);

    // Process each calendar
    for (const calendar of calendars) {
      try {
        await syncCalendar(calendar, isDryRun, verbose, stats);
        stats.calendarsProcessed.push(calendar.name);
      } catch (error) {
        devLog.error(`[Luma Sync] Error syncing calendar "${calendar.name}":`, error);
        stats.errors++;
      }
    }

    stats.duration_ms = Date.now() - startTime;
    devLog.log('[Luma Sync] Complete', stats);
    return stats;

  } catch (error) {
    devLog.error('[Luma Sync] Fatal error:', error);
    stats.duration_ms = Date.now() - startTime;
    throw error;
  }
}

// ============================================
// PER-CALENDAR SYNC
// ============================================

async function syncCalendar(
  calendar: LumaCalendarConfig,
  isDryRun: boolean,
  verbose: boolean,
  stats: LumaSyncStats
): Promise<void> {
  const now = new Date().toISOString();
  let hasMore = true;
  let cursor: string | undefined;

  devLog.log(`[Luma Sync] Fetching events from "${calendar.name}"`);

  while (hasMore) {
    // Fetch a page of events
    const response = await lumaClient.listEvents(calendar.apiKey, {
      after: now,
      limit: 50,
    });

    // The API returns { entries: [{ event: LumaEvent }], has_more, next_cursor }
    const entries = response.entries || [];

    if (verbose) {
      devLog.log(`[Luma Sync] Got ${entries.length} events (has_more: ${response.has_more})`);
    }

    for (const entry of entries) {
      const lumaEvent = entry.event;
      try {
        await processLumaEvent(lumaEvent, calendar, isDryRun, verbose, stats);
        stats.processed++;
      } catch (error) {
        devLog.error(`[Luma Sync] Error processing event "${lumaEvent.name}":`, error);
        stats.errors++;
      }
    }

    hasMore = response.has_more && !!response.next_cursor;
    cursor = response.next_cursor;

    // Break if no cursor provided (safety)
    if (!cursor) break;
  }
}

// ============================================
// PROCESS SINGLE EVENT
// ============================================

async function processLumaEvent(
  lumaEvent: LumaEvent,
  calendar: LumaCalendarConfig,
  isDryRun: boolean,
  verbose: boolean,
  stats: LumaSyncStats
): Promise<void> {
  const lumaEventId = lumaEvent.api_id;

  if (verbose) {
    devLog.log(`[Luma Sync] Processing: "${lumaEvent.name}" (${lumaEventId})`);
  }

  // Check if event already exists by luma_event_id
  const { data: existing, error: queryError } = await supabase
    .from('canonical_events')
    .select('id, luma_event_id, updated_at')
    .eq('luma_event_id', lumaEventId)
    .maybeSingle();

  if (queryError) {
    devLog.error('[Luma Sync] DB query error:', queryError);
    throw queryError;
  }

  // Dry-run mode: log only
  if (isDryRun) {
    const action = existing ? 'would-update' : 'would-insert';
    if (verbose) {
      devLog.log(`[Luma Sync] DRY-RUN: ${action} "${lumaEvent.name}"`);
    }
    stats.skipped++;
    return;
  }

  // Build the event data from Luma fields
  const eventData = mapLumaEventToCanonical(lumaEvent, calendar);

  if (!existing) {
    // INSERT new event
    const { error: insertError } = await supabase
      .from('canonical_events')
      .insert(eventData);

    if (insertError) {
      devLog.error('[Luma Sync] Insert error:', insertError);
      throw insertError;
    }

    stats.inserted++;
    if (verbose) {
      devLog.log(`[Luma Sync] Inserted: "${lumaEvent.name}"`);
    }
  } else {
    // UPDATE only changed fields
    const { error: updateError } = await supabase
      .from('canonical_events')
      .update({
        title: eventData.title,
        description: eventData.description,
        starts_at: eventData.starts_at,
        ends_at: eventData.ends_at,
        tz: eventData.tz,
        cover_image_url: eventData.cover_image_url,
        meeting_url: eventData.meeting_url,
        lat: eventData.lat,
        lng: eventData.lng,
        location_raw: eventData.location_raw,
        location_name: eventData.location_name,
        external_rsvp_url: eventData.external_rsvp_url,
        luma_sync_status: 'pulled' as LumaSyncStatus,
        luma_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);

    if (updateError) {
      devLog.error('[Luma Sync] Update error:', updateError);
      throw updateError;
    }

    stats.updated++;
    if (verbose) {
      devLog.log(`[Luma Sync] Updated: "${lumaEvent.name}" (${existing.id})`);
    }
  }
}

// ============================================
// FIELD MAPPING
// ============================================

function mapLumaEventToCanonical(
  lumaEvent: LumaEvent,
  calendar: LumaCalendarConfig
): Record<string, unknown> {
  // Extract coordinates
  const lat = lumaEvent.geo_latitude ? parseFloat(lumaEvent.geo_latitude) : null;
  const lng = lumaEvent.geo_longitude ? parseFloat(lumaEvent.geo_longitude) : null;

  // Extract location info
  const geoAddress = lumaEvent.geo_address_json;
  const locationName = geoAddress?.description || geoAddress?.full_address || null;
  const locationRaw = geoAddress?.full_address || null;

  // Determine location type
  let locationType: LocationType = 'custom';
  if (lumaEvent.meeting_url && !lat) {
    locationType = 'online';
  }

  return {
    canonical_uid: `luma-${lumaEvent.api_id}`,
    title: lumaEvent.name,
    description: lumaEvent.description_md || null,
    category: 'community',
    culture: 'default',
    source_type: 'luma' as SourceType,
    starts_at: lumaEvent.start_at,
    ends_at: lumaEvent.end_at || null,
    tz: lumaEvent.timezone || 'UTC',
    location_type: locationType,
    location_name: locationName,
    location_raw: locationRaw,
    lat,
    lng,
    cover_image_url: lumaEvent.cover_url || null,
    meeting_url: lumaEvent.meeting_url || null,
    external_rsvp_url: lumaEvent.url || null,
    luma_event_id: lumaEvent.api_id,
    luma_sync_status: 'pulled' as LumaSyncStatus,
    luma_synced_at: new Date().toISOString(),
    submission_status: 'approved',
    host_type: 'admin',
    current_rsvp_count: 0,
    is_ticketed: false,
  };
}
