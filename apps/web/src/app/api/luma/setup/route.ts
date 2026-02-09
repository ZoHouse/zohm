/**
 * Luma Webhook Setup API
 *
 * One-time endpoint to register webhooks with Luma for each calendar.
 * Admin-only — requires zo_roles to include 'admin'.
 *
 * POST /api/luma/setup
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabase as supabaseAnon } from '@/lib/supabase';
import { isLumaApiEnabled } from '@/lib/featureFlags';
import { devLog } from '@/lib/logger';
import { lumaClient } from '@/lib/luma/client';
import { getActiveLumaCalendars } from '@/lib/luma/config';

const db = supabaseAdmin || supabaseAnon;

const WEBHOOK_EVENT_TYPES = [
  'event.created',
  'event.updated',
  'event.canceled',
  'guest.registered',
  'guest.updated',
];

export async function POST(request: NextRequest) {
  try {
    // Check feature flag
    if (!isLumaApiEnabled()) {
      return NextResponse.json(
        { error: 'Luma API sync is not enabled' },
        { status: 400 }
      );
    }

    // Auth check — admin only
    const userId = request.headers.get('x-user-id') ||
                   request.cookies.get('zo_user_id')?.value;

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: user } = await db
      .from('users')
      .select('zo_roles')
      .eq('id', userId)
      .single();

    if (!user?.zo_roles?.includes('admin')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get webhook URL from request body or use default
    const body = await request.json().catch(() => ({}));
    const baseUrl = body.webhook_base_url || process.env.NEXT_PUBLIC_BASE_URL || 'https://game.zo.xyz';
    const webhookUrl = `${baseUrl}/api/webhooks/luma`;

    const calendars = getActiveLumaCalendars();
    if (calendars.length === 0) {
      return NextResponse.json(
        { error: 'No Luma calendars configured with API keys' },
        { status: 400 }
      );
    }

    devLog.log(`[Luma Setup] Registering webhooks for ${calendars.length} calendar(s)`);

    const results = [];
    for (const calendar of calendars) {
      try {
        const webhook = await lumaClient.createWebhook(
          calendar.apiKey,
          webhookUrl,
          WEBHOOK_EVENT_TYPES
        );
        results.push({
          calendar: calendar.name,
          webhook_id: webhook.api_id,
          url: webhookUrl,
          event_types: WEBHOOK_EVENT_TYPES,
          status: 'created',
        });
        devLog.log(`[Luma Setup] Webhook created for ${calendar.name}: ${webhook.api_id}`);
      } catch (error) {
        results.push({
          calendar: calendar.name,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        devLog.error(`[Luma Setup] Failed for ${calendar.name}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      webhooks: results,
      message: 'Store the webhook secrets in your environment variables',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    devLog.error('[Luma Setup] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
