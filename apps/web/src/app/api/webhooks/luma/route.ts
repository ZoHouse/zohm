/**
 * Luma Webhook Receiver
 *
 * Receives real-time event updates from Luma.
 * Always returns 200 to prevent Luma retries.
 *
 * Webhook types:
 *   - event.created → upsert canonical_events
 *   - event.updated → update canonical_events
 *   - event.canceled → mark cancelled
 *   - guest.registered → upsert event_rsvps
 *   - guest.updated → update event_rsvps
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabase as supabaseAnon } from '@/lib/supabase';
import { isLumaApiEnabled } from '@/lib/featureFlags';
import { devLog } from '@/lib/logger';
import { lumaStatusToRsvpStatus } from '@/lib/luma/types';
import type { LumaEvent, LumaGuest } from '@/lib/luma/types';

const db = supabaseAdmin || supabaseAnon;

interface WebhookPayload {
  type: string;
  data: {
    event?: LumaEvent;
    guest?: LumaGuest;
  };
}

export async function POST(request: NextRequest) {
  // Always return 200 to Luma (non-200 triggers retries)
  try {
    if (!isLumaApiEnabled()) {
      devLog.log('[Luma Webhook] Feature flag disabled, ignoring');
      return NextResponse.json({ ok: true });
    }

    const payload: WebhookPayload = await request.json();
    const { type, data } = payload;

    devLog.log(`[Luma Webhook] Received: ${type}`);

    switch (type) {
      case 'event.created':
      case 'event.updated':
        if (data.event) {
          await handleEventUpsert(data.event);
        }
        break;

      case 'event.canceled':
        if (data.event) {
          await handleEventCancelled(data.event);
        }
        break;

      case 'guest.registered':
      case 'guest.updated':
        if (data.guest) {
          await handleGuestUpdate(data.guest);
        }
        break;

      default:
        devLog.log(`[Luma Webhook] Unknown type: ${type}`);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    devLog.error('[Luma Webhook] Error processing webhook:', error);
    // Still return 200 to prevent Luma retries
    return NextResponse.json({ ok: true });
  }
}

// ============================================
// HANDLERS
// ============================================

async function handleEventUpsert(lumaEvent: LumaEvent): Promise<void> {
  const lumaEventId = lumaEvent.api_id;

  // Check if exists
  const { data: existing } = await db
    .from('canonical_events')
    .select('id')
    .eq('luma_event_id', lumaEventId)
    .maybeSingle();

  const lat = lumaEvent.geo_latitude ? parseFloat(lumaEvent.geo_latitude) : null;
  const lng = lumaEvent.geo_longitude ? parseFloat(lumaEvent.geo_longitude) : null;
  const geoAddress = lumaEvent.geo_address_json;

  const eventData = {
    title: lumaEvent.name,
    description: lumaEvent.description_md || null,
    starts_at: lumaEvent.start_at,
    ends_at: lumaEvent.end_at || null,
    tz: lumaEvent.timezone || 'UTC',
    cover_image_url: lumaEvent.cover_url || null,
    meeting_url: lumaEvent.meeting_url || null,
    lat,
    lng,
    location_name: geoAddress?.description || geoAddress?.full_address || null,
    location_raw: geoAddress?.full_address || null,
    external_rsvp_url: lumaEvent.url || null,
    luma_synced_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    const { error } = await db
      .from('canonical_events')
      .update({ ...eventData, luma_sync_status: 'synced' })
      .eq('id', existing.id);

    if (error) devLog.error('[Luma Webhook] Event update error:', error);
    else devLog.log(`[Luma Webhook] Updated event: ${existing.id}`);
  } else {
    const { error } = await db
      .from('canonical_events')
      .insert({
        ...eventData,
        canonical_uid: `luma-${lumaEventId}`,
        luma_event_id: lumaEventId,
        luma_sync_status: 'pulled',
        category: 'community',
        culture: 'default',
        source_type: 'luma',
        submission_status: 'approved',
        host_type: 'admin',
        location_type: lumaEvent.meeting_url && !lat ? 'online' : 'custom',
        current_rsvp_count: 0,
        is_ticketed: false,
      });

    if (error) devLog.error('[Luma Webhook] Event insert error:', error);
    else devLog.log(`[Luma Webhook] Inserted new event: ${lumaEventId}`);
  }
}

async function handleEventCancelled(lumaEvent: LumaEvent): Promise<void> {
  const { error } = await db
    .from('canonical_events')
    .update({
      submission_status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('luma_event_id', lumaEvent.api_id);

  if (error) devLog.error('[Luma Webhook] Event cancel error:', error);
  else devLog.log(`[Luma Webhook] Cancelled event: ${lumaEvent.api_id}`);
}

async function handleGuestUpdate(guest: LumaGuest): Promise<void> {
  const lumaEventId = guest.event_api_id;

  // Find the local event
  const { data: event } = await db
    .from('canonical_events')
    .select('id')
    .eq('luma_event_id', lumaEventId)
    .maybeSingle();

  if (!event) {
    devLog.log(`[Luma Webhook] Event not found for guest update: ${lumaEventId}`);
    return;
  }

  // Try to match user by email or phone
  let userId: string | null = null;
  if (guest.email) {
    const { data: user } = await db
      .from('users')
      .select('id')
      .eq('email', guest.email)
      .maybeSingle();
    userId = user?.id || null;
  }
  if (!userId && guest.phone) {
    const { data: user } = await db
      .from('users')
      .select('id')
      .eq('phone', guest.phone)
      .maybeSingle();
    userId = user?.id || null;
  }

  if (!userId) {
    devLog.log(`[Luma Webhook] No matching user for guest: ${guest.email || guest.phone}`);
    return;
  }

  const rsvpStatus = lumaStatusToRsvpStatus(guest.status, guest.approval_status);

  // Upsert RSVP
  const { data: existingRsvp } = await db
    .from('event_rsvps')
    .select('id')
    .eq('event_id', event.id)
    .eq('user_id', userId)
    .maybeSingle();

  if (existingRsvp) {
    const { error } = await db
      .from('event_rsvps')
      .update({
        status: rsvpStatus,
        luma_guest_id: guest.api_id,
        luma_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingRsvp.id);

    if (error) devLog.error('[Luma Webhook] RSVP update error:', error);
  } else {
    const { error } = await db
      .from('event_rsvps')
      .insert({
        event_id: event.id,
        user_id: userId,
        status: rsvpStatus,
        rsvp_type: 'standard',
        luma_guest_id: guest.api_id,
        luma_synced_at: new Date().toISOString(),
      });

    if (error) devLog.error('[Luma Webhook] RSVP insert error:', error);
  }

  devLog.log(`[Luma Webhook] Guest ${rsvpStatus}: ${userId} → event ${event.id}`);
}
