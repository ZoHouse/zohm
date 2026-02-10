/**
 * Telegram Inquiry Callback Handlers
 *
 * Handles [Generate Quote] and [Request Manual Quote] button presses
 * from the inquiry cards posted in Telegram.
 */

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { devLog } from '@/lib/logger';
import { answerCallbackQuery } from './bot';
import { updateInquiryMessageWithQuote } from './inquiryNotification';
import { generateQuote, saveQuote } from '@/lib/venue/quoteEngine';
import { sendQuoteEmail } from '@/lib/email/quoteSender';
import type { EventInquiry } from '@/types/inquiry';

if (!supabaseAdmin) {
  throw new Error('[Inquiry Callbacks] SUPABASE_SERVICE_ROLE_KEY is required');
}
const db = supabaseAdmin;

/**
 * Handle [Generate Quote] button press.
 * Generates a quote from venue pricing, sends email, updates TG message.
 */
export async function handleGenerateQuote(inquiryId: string, callbackQueryId: string): Promise<void> {
  // Fetch the inquiry
  const { data: inquiry, error } = await db
    .from('event_inquiries')
    .select('*')
    .eq('id', inquiryId)
    .single();

  if (error || !inquiry) {
    await answerCallbackQuery(callbackQueryId, 'Inquiry not found');
    return;
  }

  const inq = inquiry as EventInquiry;

  // Atomically claim this inquiry for quoting (prevents race condition on double-click)
  const { data: claimed, error: claimError } = await db
    .from('event_inquiries')
    .update({ inquiry_status: 'quoting', updated_at: new Date().toISOString() })
    .eq('id', inquiryId)
    .is('quote_json', null)
    .select('id')
    .maybeSingle();

  if (claimError || !claimed) {
    await answerCallbackQuery(callbackQueryId, 'Quote already generated!');
    return;
  }

  await answerCallbackQuery(callbackQueryId, 'Generating quote...');

  // Generate quote
  const quote = await generateQuote(inq);

  if (!quote) {
    // No pricing data — fall back to manual
    await handleManualQuote(inquiryId, '');
    return;
  }

  // Save quote to DB
  await saveQuote(inquiryId, quote);

  // Send email
  const emailSent = await sendQuoteEmail(inq, quote);

  // Update TG message with quote summary
  // Refetch with quote data
  const { data: updated } = await db
    .from('event_inquiries')
    .select('*')
    .eq('id', inquiryId)
    .single();

  if (updated) {
    await updateInquiryMessageWithQuote(updated as EventInquiry, quote);
  }

  devLog.log(`[Inquiry Callback] Quote generated for ${inquiryId}. Email: ${emailSent ? 'sent' : 'failed'}`);
}

/**
 * Handle [Request Manual Quote] button press.
 * Notifies the team that manual quoting is needed.
 */
export async function handleManualQuote(inquiryId: string, callbackQueryId: string): Promise<void> {
  if (callbackQueryId) {
    await answerCallbackQuery(callbackQueryId, 'Manual quote requested — team notified');
  }

  // Update inquiry status
  await db
    .from('event_inquiries')
    .update({
      inquiry_status: 'reviewing',
      status_notes: 'Manual quote requested — venue has no automated pricing data',
      updated_at: new Date().toISOString(),
    })
    .eq('id', inquiryId);

  // Post a follow-up message to the group
  const { sendMessage } = await import('./bot');
  const CHAT_ID = process.env.TELEGRAM_VIBE_CHECK_CHAT_ID || '';

  if (CHAT_ID) {
    await sendMessage(
      CHAT_ID,
      `📝 <b>Manual quote needed</b> for inquiry <code>${inquiryId.slice(0, 8)}</code>\n\nAutomated pricing unavailable for this venue. Please prepare a manual quote.`
    );
  }

  devLog.log(`[Inquiry Callback] Manual quote requested for ${inquiryId}`);
}
