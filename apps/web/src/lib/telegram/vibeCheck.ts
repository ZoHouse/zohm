/**
 * Vibe Check — Core Business Logic
 *
 * Creates Telegram vibe checks for pending community events,
 * handles votes from inline buttons, and resolves expired checks.
 *
 * Mirrors the lib/luma/eventPush.ts pattern (non-blocking, error-catching).
 */

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabase as supabaseAnon } from '@/lib/supabase';
import { devLog } from '@/lib/logger';
import { isLumaApiEnabled } from '@/lib/featureFlags';
import { getPublicCoverUrl } from '@/lib/luma/eventPush';
import { getCultureDisplayName } from '@/lib/cultures';
import { pushEventToLuma } from '@/lib/luma/eventPush';
import {
  sendMessage,
  sendPhoto,
  editMessageCaption,
  editMessageText,
  answerCallbackQuery,
} from './bot';
import type { InlineKeyboardMarkup } from './types';
import type { VibeCheck } from './types';
import type { CommunityEvent } from '@/types/events';

const db = supabaseAdmin || supabaseAnon;
const CHAT_ID = process.env.TELEGRAM_VIBE_CHECK_CHAT_ID || '';
const VIBE_CHECK_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

// ============================================
// CREATE VIBE CHECK
// ============================================

/**
 * Create a vibe check for a pending event.
 * Inserts a DB row, sends a TG message, then stores the message ID.
 */
export async function createVibeCheck(event: CommunityEvent): Promise<void> {
  if (!CHAT_ID) {
    devLog.error('[Vibe Check] TELEGRAM_VIBE_CHECK_CHAT_ID is not set');
    return;
  }

  const expiresAt = new Date(Date.now() + VIBE_CHECK_DURATION_MS).toISOString();

  // 1. Insert DB row (without message ID yet)
  const { data: vibeCheck, error: insertError } = await db
    .from('vibe_checks')
    .insert({
      event_id: event.id,
      tg_chat_id: CHAT_ID,
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (insertError || !vibeCheck) {
    devLog.error('[Vibe Check] Failed to insert vibe check:', insertError);
    return;
  }

  // 2. Build card & keyboard
  const cardText = formatVibeCheckCard(event, 0, 0, 'open', expiresAt);
  const keyboard = buildVoteKeyboard(vibeCheck.id);
  const coverUrl = getPublicCoverUrl(event);

  // 3. Send to Telegram (photo if cover exists, otherwise text)
  let tgMessageId: number | null = null;
  let messageType: 'photo' | 'text' = 'text';

  if (coverUrl) {
    const msg = await sendPhoto(CHAT_ID, coverUrl, cardText, keyboard);
    if (msg) {
      tgMessageId = msg.message_id;
      messageType = 'photo';
    } else {
      // Fallback to text if photo fails (e.g. bad URL)
      const textMsg = await sendMessage(CHAT_ID, cardText, keyboard);
      tgMessageId = textMsg?.message_id ?? null;
    }
  } else {
    const msg = await sendMessage(CHAT_ID, cardText, keyboard);
    tgMessageId = msg?.message_id ?? null;
  }

  // 4. Store message ID back on the row
  if (tgMessageId) {
    await db
      .from('vibe_checks')
      .update({
        tg_message_id: tgMessageId,
        tg_message_type: messageType,
      })
      .eq('id', vibeCheck.id);
  }

  devLog.log(`[Vibe Check] Created for event "${event.title}" — TG msg: ${tgMessageId}`);
}

// ============================================
// HANDLE VOTE
// ============================================

/**
 * Record a vote and update the TG message.
 * Returns a user-facing toast message.
 */
export async function handleVote(
  vibeCheckId: string,
  tgUserId: string,
  vote: 'up' | 'down',
  callbackQueryId: string
): Promise<void> {
  // 1. Try inserting (UNIQUE constraint prevents duplicates)
  const { error: voteError } = await db
    .from('vibe_check_votes')
    .insert({
      vibe_check_id: vibeCheckId,
      tg_user_id: tgUserId,
      vote,
    });

  if (voteError) {
    if (voteError.code === '23505') {
      // Unique violation — already voted
      await answerCallbackQuery(callbackQueryId, 'You already voted!');
      return;
    }
    devLog.error('[Vibe Check] Vote insert error:', voteError);
    await answerCallbackQuery(callbackQueryId, 'Something went wrong. Try again.');
    return;
  }

  // 2. Recount tallies
  const { upvotes, downvotes } = await recountVotes(vibeCheckId);

  // 3. Update vibe_checks row
  await db
    .from('vibe_checks')
    .update({ upvotes, downvotes })
    .eq('id', vibeCheckId);

  // 4. Edit TG message with updated counts
  const vibeCheck = await getVibeCheck(vibeCheckId);
  if (vibeCheck && vibeCheck.tg_message_id) {
    const event = await getEventForVibeCheck(vibeCheck.event_id);
    if (event) {
      const cardText = formatVibeCheckCard(event, upvotes, downvotes, 'open', vibeCheck.expires_at);
      const keyboard = buildVoteKeyboard(vibeCheckId);

      if (vibeCheck.tg_message_type === 'photo') {
        await editMessageCaption(vibeCheck.tg_chat_id, vibeCheck.tg_message_id, cardText, keyboard);
      } else {
        await editMessageText(vibeCheck.tg_chat_id, vibeCheck.tg_message_id, cardText, keyboard);
      }
    }
  }

  const emoji = vote === 'up' ? '👍' : '👎';
  await answerCallbackQuery(callbackQueryId, `${emoji} Vote recorded!`);
}

// ============================================
// RESOLVE EXPIRED VIBE CHECKS
// ============================================

/**
 * Find and resolve all open vibe checks past their expiry.
 * Called by the cron worker every 15 minutes.
 */
export async function resolveExpiredVibeChecks(): Promise<{
  resolved: number;
  approved: number;
  rejected: number;
}> {
  const now = new Date().toISOString();

  const { data: expired, error } = await db
    .from('vibe_checks')
    .select('*')
    .eq('status', 'open')
    .lte('expires_at', now);

  if (error || !expired) {
    devLog.error('[Vibe Check] Failed to fetch expired checks:', error);
    return { resolved: 0, approved: 0, rejected: 0 };
  }

  let approved = 0;
  let rejected = 0;

  for (const check of expired as VibeCheck[]) {
    const result = check.upvotes > check.downvotes ? 'approved' : 'rejected';

    // 1. Update vibe_checks status
    await db
      .from('vibe_checks')
      .update({
        status: result,
        resolved_at: now,
      })
      .eq('id', check.id);

    // 2. Update canonical_events.submission_status
    await db
      .from('canonical_events')
      .update({
        submission_status: result,
        updated_at: now,
      })
      .eq('id', check.event_id);

    // 3. Edit TG message with final result (remove keyboard)
    if (check.tg_message_id) {
      const event = await getEventForVibeCheck(check.event_id);
      if (event) {
        const cardText = formatVibeCheckCard(event, check.upvotes, check.downvotes, result);

        if (check.tg_message_type === 'photo') {
          await editMessageCaption(check.tg_chat_id, check.tg_message_id, cardText);
        } else {
          await editMessageText(check.tg_chat_id, check.tg_message_id, cardText);
        }
      }
    }

    // 4. Push to Luma if approved and Luma sync is enabled
    if (result === 'approved' && isLumaApiEnabled()) {
      const event = await getEventForVibeCheck(check.event_id);
      if (event) {
        pushEventToLuma(event).catch(err => {
          devLog.error('[Vibe Check] Luma push failed after approval:', err);
        });
      }
    }

    if (result === 'approved') approved++;
    else rejected++;

    devLog.log(`[Vibe Check] Resolved ${check.id} → ${result} (👍${check.upvotes} 👎${check.downvotes})`);
  }

  return { resolved: expired.length, approved, rejected };
}

// ============================================
// HELPERS
// ============================================

async function recountVotes(vibeCheckId: string): Promise<{ upvotes: number; downvotes: number }> {
  const { data: votes, error } = await db
    .from('vibe_check_votes')
    .select('vote')
    .eq('vibe_check_id', vibeCheckId);

  if (error || !votes) {
    devLog.error('[Vibe Check] Recount error:', error);
    return { upvotes: 0, downvotes: 0 };
  }

  let upvotes = 0;
  let downvotes = 0;
  for (const v of votes) {
    if (v.vote === 'up') upvotes++;
    else downvotes++;
  }

  return { upvotes, downvotes };
}

async function getVibeCheck(id: string): Promise<VibeCheck | null> {
  const { data, error } = await db
    .from('vibe_checks')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) devLog.error('[Vibe Check] Fetch error:', error);
  return (data as VibeCheck) ?? null;
}

async function getEventForVibeCheck(eventId: string): Promise<CommunityEvent | null> {
  const { data, error } = await db
    .from('canonical_events')
    .select('*, host:users!host_id(id, name, pfp, role, zo_membership)')
    .eq('id', eventId)
    .maybeSingle();

  if (error) devLog.error('[Vibe Check] Event fetch error:', error);
  return (data as CommunityEvent) ?? null;
}

function buildVoteKeyboard(vibeCheckId: string): InlineKeyboardMarkup {
  return {
    inline_keyboard: [[
      { text: '👍 Upvote', callback_data: `vibe:up:${vibeCheckId}` },
      { text: '👎 Downvote', callback_data: `vibe:down:${vibeCheckId}` },
    ]],
  };
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatDateTime(isoString: string, tz?: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleString('en-IN', {
      timeZone: tz || 'Asia/Kolkata',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return isoString;
  }
}

/**
 * Build the HTML-formatted card text for a vibe check message.
 */
function formatVibeCheckCard(
  event: CommunityEvent,
  upvotes: number,
  downvotes: number,
  status: string,
  expiresAt?: string
): string {
  const title = escapeHtml(event.title);
  const culture = getCultureDisplayName(event.culture || 'default');
  const startDate = formatDateTime(event.starts_at, event.tz);
  const location = escapeHtml(event.location_name || event.location_raw || 'TBD');
  const hostName = escapeHtml(
    (event.host && 'name' in event.host ? event.host.name : null) || 'Anonymous'
  );

  let header: string;
  if (status === 'approved') {
    header = '✅ <b>APPROVED</b>';
  } else if (status === 'rejected') {
    header = '❌ <b>REJECTED</b>';
  } else {
    header = '🎯 <b>NEW VIBE CHECK</b>';
  }

  const lines = [
    header,
    '',
    `📌 ${title}`,
    `🎨 ${culture}`,
    `📅 ${startDate}`,
    `📍 ${location}`,
    `👤 Hosted by: ${hostName}`,
  ];

  if (status === 'open') {
    lines.push('');
    lines.push('Vote to approve or reject this event!');
    if (expiresAt) {
      const expiryDate = formatDateTime(expiresAt, event.tz);
      lines.push(`⏰ Voting ends: ${expiryDate}`);
    }
    lines.push('');
    lines.push(`👍 ${upvotes}  |  👎 ${downvotes}`);
  } else {
    lines.push('');
    lines.push(`Final: 👍 ${upvotes}  |  👎 ${downvotes}`);
  }

  return lines.join('\n');
}
