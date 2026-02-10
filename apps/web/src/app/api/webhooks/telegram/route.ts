/**
 * Telegram Webhook Receiver
 *
 * Receives updates from the Telegram Bot API (inline button presses).
 * Always returns 200 to prevent Telegram retries.
 *
 * Callback data formats:
 *   vibe:{up|down}:{vibeCheckId}     — Vibe check votes
 *   gen_quote:{inquiryId}            — Generate quote for inquiry
 *   manual_quote:{inquiryId}         — Request manual quote
 */

import { NextRequest, NextResponse } from 'next/server';
import { isVibeCheckEnabled, isInquiryPipelineEnabled } from '@/lib/featureFlags';
import { handleVote } from '@/lib/telegram/vibeCheck';
import { handleGenerateQuote, handleManualQuote } from '@/lib/telegram/inquiryCallbacks';
import { devLog } from '@/lib/logger';
import type { TelegramUpdate } from '@/lib/telegram/types';

const TELEGRAM_WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET || '';

export async function POST(request: NextRequest) {
  try {
    // Verify Telegram webhook secret token
    if (TELEGRAM_WEBHOOK_SECRET) {
      const secret = request.headers.get('x-telegram-bot-api-secret-token') || '';
      if (secret !== TELEGRAM_WEBHOOK_SECRET) {
        devLog.error('[Telegram Webhook] Invalid secret token');
        return NextResponse.json({ ok: true });
      }
    }

    const update: TelegramUpdate = await request.json();

    // We only care about callback queries (inline button presses)
    if (!update.callback_query) {
      return NextResponse.json({ ok: true });
    }

    const { id: callbackQueryId, from, data } = update.callback_query;

    if (!data) {
      return NextResponse.json({ ok: true });
    }

    const parts = data.split(':');
    const action = parts[0];

    // --- VIBE CHECK VOTES: "vibe:{up|down}:{vibeCheckId}" ---
    if (action === 'vibe' && parts.length === 3 && isVibeCheckEnabled()) {
      const vote = parts[1] as 'up' | 'down';
      const vibeCheckId = parts[2];

      if (vote === 'up' || vote === 'down') {
        await handleVote(vibeCheckId, String(from.id), vote, callbackQueryId);
      }
      return NextResponse.json({ ok: true });
    }

    // --- GENERATE QUOTE: "gen_quote:{inquiryId}" ---
    if (action === 'gen_quote' && parts.length === 2 && isInquiryPipelineEnabled()) {
      const inquiryId = parts[1];
      await handleGenerateQuote(inquiryId, callbackQueryId);
      return NextResponse.json({ ok: true });
    }

    // --- MANUAL QUOTE: "manual_quote:{inquiryId}" ---
    if (action === 'manual_quote' && parts.length === 2 && isInquiryPipelineEnabled()) {
      const inquiryId = parts[1];
      await handleManualQuote(inquiryId, callbackQueryId);
      return NextResponse.json({ ok: true });
    }

    devLog.log('[Telegram Webhook] Unknown callback_data:', data);
    return NextResponse.json({ ok: true });
  } catch (error) {
    devLog.error('[Telegram Webhook] Error processing update:', error);
    // Always return 200 to prevent Telegram retries
    return NextResponse.json({ ok: true });
  }
}
