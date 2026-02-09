/**
 * Luma RSVP Sync
 *
 * Pushes RSVP changes to Luma when users register or hosts manage RSVPs.
 * All operations are non-blocking (fire-and-forget with error catching).
 */

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabase as supabaseAnon } from '@/lib/supabase';
import { devLog } from '@/lib/logger';
import { lumaClient } from './client';
import { getLumaCalendarForEvent } from './config';
import type { CommunityEvent } from '@/types/events';

const db = supabaseAdmin || supabaseAnon;

/**
 * Push an RSVP to Luma as a guest registration.
 * Skips if user has no email (Luma requires email for guest add).
 * Non-blocking — catches all errors internally.
 */
export async function pushRsvpToLuma(
  event: CommunityEvent,
  userId: string
): Promise<void> {
  try {
    if (!event.luma_event_id) return;

    const calendar = getLumaCalendarForEvent(event);
    if (!calendar.apiKey) return;

    // Look up user email
    const { data: user, error: userError } = await db
      .from('users')
      .select('email, name')
      .eq('id', userId)
      .single();

    if (userError || !user?.email) {
      devLog.log('[Luma RSVP] User has no email, skipping Luma guest add');
      return;
    }

    devLog.log(`[Luma RSVP] Adding guest ${user.email} to Luma event ${event.luma_event_id}`);

    await lumaClient.addGuests(calendar.apiKey, event.luma_event_id, [
      { email: user.email, name: user.name || undefined },
    ]);

    devLog.log(`[Luma RSVP] Guest added successfully`);

  } catch (error) {
    devLog.error('[Luma RSVP] Failed to push RSVP to Luma:', error);
  }
}

/**
 * Update a guest's approval status on Luma (host approve/reject).
 * Non-blocking — catches all errors internally.
 */
export async function updateRsvpStatusOnLuma(
  event: CommunityEvent,
  userId: string,
  status: 'approved' | 'declined'
): Promise<void> {
  try {
    if (!event.luma_event_id) return;

    const calendar = getLumaCalendarForEvent(event);
    if (!calendar.apiKey) return;

    // Look up user email
    const { data: user, error: userError } = await db
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();

    if (userError || !user?.email) {
      devLog.log('[Luma RSVP] User has no email, skipping Luma status update');
      return;
    }

    devLog.log(`[Luma RSVP] Updating guest ${user.email} status to ${status}`);

    await lumaClient.updateGuestStatus(
      calendar.apiKey,
      event.luma_event_id,
      user.email,
      status
    );

    devLog.log(`[Luma RSVP] Guest status updated successfully`);

  } catch (error) {
    devLog.error('[Luma RSVP] Failed to update RSVP status on Luma:', error);
  }
}
