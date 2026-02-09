/**
 * Telegram Webhook Receiver
 *
 * Receives updates from the Telegram Bot API (inline button presses).
 * Always returns 200 to prevent Telegram retries.
 *
 * Callback data format: `vibe:{up|down}:{vibeCheckId}` (max 64 bytes)
 */

import { NextRequest, NextResponse } from 'next/server';
import { isVibeCheckEnabled } from '@/lib/featureFlags';
import { handleVote } from '@/lib/telegram/vibeCheck';
import { devLog } from '@/lib/logger';
import type { TelegramUpdate } from '@/lib/telegram/types';

export async function POST(request: NextRequest) {
  try {
    if (!isVibeCheckEnabled()) {
      return NextResponse.json({ ok: true });
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

    // Parse callback_data: "vibe:{up|down}:{vibeCheckId}"
    const parts = data.split(':');
    if (parts.length !== 3 || parts[0] !== 'vibe') {
      devLog.log('[Telegram Webhook] Unknown callback_data:', data);
      return NextResponse.json({ ok: true });
    }

    const vote = parts[1] as 'up' | 'down';
    const vibeCheckId = parts[2];

    if (vote !== 'up' && vote !== 'down') {
      return NextResponse.json({ ok: true });
    }

    const tgUserId = String(from.id);

    await handleVote(vibeCheckId, tgUserId, vote, callbackQueryId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    devLog.error('[Telegram Webhook] Error processing update:', error);
    // Always return 200 to prevent Telegram retries
    return NextResponse.json({ ok: true });
  }
}
