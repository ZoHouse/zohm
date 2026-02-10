/**
 * Telegram Inquiry Notification
 *
 * Posts sponsored event inquiry summaries to the Telegram group
 * with venue match results and a [Generate Quote] button.
 */

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabase as supabaseAnon } from '@/lib/supabase';
import { devLog } from '@/lib/logger';
import { sendMessage } from './bot';
import type { InlineKeyboardMarkup } from './types';
import type { EventInquiry, VenueMatchResult, QuoteBreakdown } from '@/types/inquiry';

const db = supabaseAdmin || supabaseAnon;
const CHAT_ID = process.env.TELEGRAM_VIBE_CHECK_CHAT_ID || '';

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Post an inquiry summary to Telegram with venue match and [Generate Quote] button
 */
export async function postInquiryToTelegram(inquiry: EventInquiry): Promise<void> {
  if (!CHAT_ID) {
    devLog.error('[Inquiry TG] TELEGRAM_VIBE_CHECK_CHAT_ID not set');
    return;
  }

  const card = formatInquiryCard(inquiry);
  const keyboard = buildInquiryKeyboard(inquiry);

  const msg = await sendMessage(CHAT_ID, card, keyboard);

  if (msg) {
    await db
      .from('event_inquiries')
      .update({
        telegram_message_id: msg.message_id,
        telegram_chat_id: Number(CHAT_ID),
        inquiry_status: 'reviewing',
        updated_at: new Date().toISOString(),
      })
      .eq('id', inquiry.id);

    devLog.log(`[Inquiry TG] Posted inquiry ${inquiry.id} — TG msg: ${msg.message_id}`);
  }
}

/**
 * Update the Telegram message after a quote is generated
 */
export async function updateInquiryMessageWithQuote(
  inquiry: EventInquiry,
  quote: QuoteBreakdown
): Promise<void> {
  if (!inquiry.telegram_message_id || !inquiry.telegram_chat_id) return;

  const { editMessageText } = await import('./bot');
  const card = formatQuotedCard(inquiry, quote);

  await editMessageText(
    String(inquiry.telegram_chat_id),
    inquiry.telegram_message_id,
    card
  );
}

// ============================================
// CARD FORMATTING
// ============================================

function formatInquiryCard(inquiry: EventInquiry): string {
  const name = escapeHtml(inquiry.host_name || 'Unknown');
  const email = escapeHtml(inquiry.host_email || '');
  const phone = escapeHtml(inquiry.host_phone || '');
  const org = inquiry.organization ? escapeHtml(inquiry.organization) : '';

  const lines = [
    `<b>NEW EVENT INQUIRY</b>`,
    '',
    `${name}${org ? ` — ${org}` : ''}`,
    `${email}${phone ? ` | ${phone}` : ''}`,
    '',
    `<b>Event Details</b>`,
    `   Type: ${escapeHtml(inquiry.event_type || 'Not specified')}`,
    `   Date: ${escapeHtml(inquiry.event_date || 'Flexible')}`,
    `   Guests: ${escapeHtml(inquiry.expected_headcount || '?')}`,
    `   Budget: ${escapeHtml(inquiry.budget || 'Not specified')}`,
    `   Duration: ${escapeHtml(inquiry.duration || 'Not specified')}`,
  ];

  // Requirements
  const reqs: string[] = [];
  if (inquiry.needs_convention_hall) reqs.push('Convention hall');
  if (inquiry.needs_projector) reqs.push('Projector/AV');
  if (inquiry.needs_catering) reqs.push('Catering');
  if (inquiry.needs_accommodation) reqs.push('Accommodation');
  if (inquiry.needs_music) reqs.push('Music/Sound');
  if (inquiry.needs_outdoor_area) reqs.push('Outdoor area');

  if (reqs.length > 0) {
    lines.push('');
    lines.push(`<b>Requirements</b>`);
    lines.push(`   ${reqs.join(' | ')}`);
  }

  if (inquiry.additional_notes) {
    lines.push('');
    lines.push(`<b>Notes</b>`);
    lines.push(`   "${escapeHtml(inquiry.additional_notes.slice(0, 200))}"`);
  }

  // Venue match
  lines.push('');
  lines.push('——————————————');

  if (inquiry.matched_venue && inquiry.match_score) {
    lines.push('');
    lines.push(`<b>BEST MATCH: ${escapeHtml(inquiry.matched_venue)}</b>`);
    lines.push(`   Score: ${inquiry.match_score}%`);
    if (inquiry.match_reasoning) {
      lines.push(`   ${escapeHtml(inquiry.match_reasoning.slice(0, 150))}`);
    }

    if (inquiry.alternative_venues && inquiry.alternative_venues.length > 0) {
      lines.push('');
      lines.push('   Also consider:');
      for (const alt of inquiry.alternative_venues) {
        lines.push(`   — ${escapeHtml(alt.property_name)} (${alt.score}%)`);
      }
    }
  } else {
    lines.push('');
    lines.push('<b>No venue match</b> — manual review needed');
  }

  return lines.join('\n');
}

function formatQuotedCard(inquiry: EventInquiry, quote: QuoteBreakdown): string {
  const name = escapeHtml(inquiry.host_name || 'Unknown');
  const org = inquiry.organization ? ` — ${escapeHtml(inquiry.organization)}` : '';

  const lines = [
    `<b>EVENT INQUIRY — QUOTED</b>`,
    '',
    `${name}${org}`,
    `${escapeHtml(inquiry.event_type || '')} — ${escapeHtml(inquiry.event_date || '')} — ${inquiry.expected_headcount || '?'} guests`,
    '',
    `<b>Venue: ${escapeHtml(quote.venue_name)}</b>`,
    '',
    `<b>Quote Summary</b>`,
  ];

  for (const item of quote.line_items) {
    const desc = escapeHtml(item.description);
    lines.push(`   ${desc}  ${formatINR(item.amount)}`);
  }

  lines.push('   ─────────────────────');
  lines.push(`   Subtotal  ${formatINR(quote.subtotal)}`);
  lines.push(`   GST (18%)  ${formatINR(quote.gst_amount)}`);
  lines.push('   ─────────────────────');
  lines.push(`   <b>Grand Total  ${formatINR(quote.grand_total)}</b>`);

  if (quote.security_deposit > 0) {
    lines.push(`   Security deposit (refundable)  ${formatINR(quote.security_deposit)}`);
  }

  lines.push('');
  lines.push(`Quote sent to ${escapeHtml(inquiry.host_email)}`);
  lines.push(new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));

  return lines.join('\n');
}

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

// ============================================
// KEYBOARD
// ============================================

function buildInquiryKeyboard(inquiry: EventInquiry): InlineKeyboardMarkup {
  // Check if venue has pricing data to determine which button to show
  const hasPricing = inquiry.matched_venue && inquiry.match_score && inquiry.match_score > 0;

  return {
    inline_keyboard: [[
      hasPricing
        ? { text: '📊 Generate Quote', callback_data: `gen_quote:${inquiry.id}` }
        : { text: '📝 Request Manual Quote', callback_data: `manual_quote:${inquiry.id}` },
    ]],
  };
}
