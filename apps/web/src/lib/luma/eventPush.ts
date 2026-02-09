/**
 * Luma Event Push
 *
 * Pushes approved community events to Luma.
 * All operations are non-blocking (fire-and-forget with error catching).
 */

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabase as supabaseAnon } from '@/lib/supabase';
import { devLog } from '@/lib/logger';
import { lumaClient } from './client';
import { getLumaCalendarForEvent } from './config';
import type { CommunityEvent } from '@/types/events';
import type { LumaCreateEventInput, LumaUpdateEventInput, LumaSyncStatus } from './types';

const db = supabaseAdmin || supabaseAnon;

/**
 * Push a newly approved event to Luma.
 * Non-blocking — catches all errors internally.
 */
export async function pushEventToLuma(event: CommunityEvent): Promise<void> {
  try {
    const calendar = getLumaCalendarForEvent(event);
    if (!calendar.apiKey) {
      devLog.warn('[Luma Push] No API key for calendar, skipping push');
      return;
    }

    devLog.log(`[Luma Push] Pushing event "${event.title}" to ${calendar.name}`);

    const coverUrl = getPublicCoverUrl(event);

    const payload: LumaCreateEventInput = {
      name: event.title,
      description_md: event.description || undefined,
      start_at: event.starts_at,
      end_at: event.ends_at || undefined,
      timezone: event.tz || 'Asia/Kolkata',
      cover_url: coverUrl || undefined,
      meeting_url: event.meeting_url || undefined,
      require_rsvp_approval: false,
      visibility: 'public',
    };

    // Add geo data if available
    if (event.lat && event.lng) {
      payload.geo_latitude = String(event.lat);
      payload.geo_longitude = String(event.lng);
      if (event.location_name || event.location_raw) {
        payload.geo_address_json = {
          full_address: event.location_raw || event.location_name || undefined,
          description: event.location_name || undefined,
          latitude: String(event.lat),
          longitude: String(event.lng),
        };
      }
    }

    const response = await lumaClient.createEvent(calendar.apiKey, payload);
    const lumaEventId = response.event.api_id;
    const lumaUrl = response.event.url;

    // Update our DB with the Luma references
    const { error: updateError } = await db
      .from('canonical_events')
      .update({
        luma_event_id: lumaEventId,
        external_rsvp_url: lumaUrl,
        luma_sync_status: 'pushed' as LumaSyncStatus,
        luma_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', event.id);

    if (updateError) {
      devLog.error('[Luma Push] Failed to update DB after push:', updateError);
    }

    devLog.log(`[Luma Push] Success — Luma ID: ${lumaEventId}, URL: ${lumaUrl}`);

  } catch (error) {
    devLog.error(`[Luma Push] Failed to push event "${event.title}":`, error);

    // Mark as push_failed in DB
    await db
      .from('canonical_events')
      .update({
        luma_sync_status: 'push_failed' as LumaSyncStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', event.id)
      .then(() => {}, () => {}); // Swallow secondary errors
  }
}

/**
 * Update an existing event on Luma after local edits.
 * Non-blocking — catches all errors internally.
 */
export async function updateEventOnLuma(event: CommunityEvent): Promise<void> {
  try {
    if (!event.luma_event_id) {
      devLog.warn('[Luma Push] No luma_event_id, skipping update');
      return;
    }

    const calendar = getLumaCalendarForEvent(event);
    if (!calendar.apiKey) {
      devLog.warn('[Luma Push] No API key for calendar, skipping update');
      return;
    }

    devLog.log(`[Luma Push] Updating event "${event.title}" on Luma`);

    const coverUrl = getPublicCoverUrl(event);

    const payload: LumaUpdateEventInput = {
      name: event.title,
      description_md: event.description || undefined,
      start_at: event.starts_at,
      end_at: event.ends_at || undefined,
      timezone: event.tz || 'Asia/Kolkata',
      cover_url: coverUrl || undefined,
      meeting_url: event.meeting_url || undefined,
    };

    // Add geo data if available
    if (event.lat && event.lng) {
      payload.geo_latitude = String(event.lat);
      payload.geo_longitude = String(event.lng);
    }

    await lumaClient.updateEvent(calendar.apiKey, event.luma_event_id, payload);

    // Update sync timestamp
    await db
      .from('canonical_events')
      .update({
        luma_sync_status: 'synced' as LumaSyncStatus,
        luma_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', event.id);

    devLog.log(`[Luma Push] Update success for "${event.title}"`);

  } catch (error) {
    devLog.error(`[Luma Push] Failed to update event "${event.title}" on Luma:`, error);
  }
}

/**
 * Convert a cover_image_url to a publicly accessible URL.
 * Relative sticker paths get converted to full HTTPS URLs.
 * Supabase storage URLs are already public.
 */
export function getPublicCoverUrl(event: CommunityEvent): string | null {
  const url = event.cover_image_url;
  if (!url) return null;

  // Already an absolute URL
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // Relative path — assume it's a culture sticker or asset on our domain
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://game.zo.xyz';
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
}
