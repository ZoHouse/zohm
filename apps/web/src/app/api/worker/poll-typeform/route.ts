/**
 * Typeform Polling Worker
 *
 * Fallback for missed webhooks — polls Typeform API for new responses.
 * Designed to be called by a cron job every 10 minutes.
 *
 * Requires: TYPEFORM_API_TOKEN, TYPEFORM_FORM_ID
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isInquiryPipelineEnabled } from '@/lib/featureFlags';
import { parseTypeformResponse } from '@/lib/typeform/parser';
import { matchVenues, saveMatchResults } from '@/lib/venue/matcher';
import { postInquiryToTelegram } from '@/lib/telegram/inquiryNotification';
import { devLog } from '@/lib/logger';
import type { EventInquiry, TypeformAnswer, TypeformWebhookPayload } from '@/types/inquiry';

if (!supabaseAdmin) {
  throw new Error('[Typeform Poll] SUPABASE_SERVICE_ROLE_KEY is required');
}
const db = supabaseAdmin;
const TYPEFORM_API_TOKEN = process.env.TYPEFORM_API_TOKEN || '';
const TYPEFORM_FORM_ID = process.env.TYPEFORM_FORM_ID || 'LgcBfa0M';
const CRON_SECRET = process.env.CRON_SECRET || '';

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized invocations
    if (CRON_SECRET) {
      const authHeader = request.headers.get('authorization') || '';
      if (authHeader !== `Bearer ${CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    if (!isInquiryPipelineEnabled()) {
      return NextResponse.json({ ok: true, message: 'Pipeline disabled' });
    }

    if (!TYPEFORM_API_TOKEN) {
      return NextResponse.json({ ok: false, error: 'TYPEFORM_API_TOKEN not configured' }, { status: 500 });
    }

    // Fetch recent responses from Typeform API
    const since = new Date();
    since.setMinutes(since.getMinutes() - 15); // Last 15 minutes overlap

    const url = `https://api.typeform.com/forms/${TYPEFORM_FORM_ID}/responses?since=${since.toISOString()}&page_size=25`;
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${TYPEFORM_API_TOKEN}` },
    });

    if (!res.ok) {
      const err = await res.text();
      devLog.error('[Typeform Poll] API error:', err);
      return NextResponse.json({ ok: false, error: 'Typeform API error' }, { status: 502 });
    }

    const data = await res.json();
    const responses = data.items || [];

    let processed = 0;
    let skipped = 0;

    for (const response of responses) {
      const token = response.token;

      // Check if already exists
      const { data: existing } = await db
        .from('event_inquiries')
        .select('id')
        .eq('typeform_token', token)
        .maybeSingle();

      if (existing) {
        skipped++;
        continue;
      }

      // Reuse the shared Typeform parser for consistent field extraction
      const fakePayload: TypeformWebhookPayload = {
        event_id: '',
        event_type: 'form_response',
        form_response: {
          form_id: TYPEFORM_FORM_ID,
          token,
          submitted_at: response.submitted_at || new Date().toISOString(),
          definition: { fields: response.definition?.fields || [] },
          answers: response.answers || [],
        },
      };
      const parsed = parseTypeformResponse(fakePayload);

      // Insert
      const { data: inquiry, error: insertError } = await db
        .from('event_inquiries')
        .insert({
          typeform_token: parsed.typeform_token,
          host_name: parsed.host_name,
          host_email: parsed.host_email,
          host_phone: parsed.host_phone,
          organization: parsed.organization,
          event_type: parsed.event_type,
          venue_preference: parsed.venue_preference,
          event_date: parsed.event_date,
          expected_headcount: parsed.expected_headcount,
          budget: parsed.budget,
          duration: parsed.duration,
          needs_projector: parsed.needs_projector,
          needs_music: parsed.needs_music,
          needs_catering: parsed.needs_catering,
          needs_accommodation: parsed.needs_accommodation,
          needs_convention_hall: parsed.needs_convention_hall,
          needs_outdoor_area: parsed.needs_outdoor_area,
          additional_notes: parsed.additional_notes,
          inquiry_status: 'new',
        })
        .select()
        .single();

      if (insertError || !inquiry) {
        devLog.error('[Typeform Poll] Insert failed:', insertError);
        continue;
      }

      // Run venue matching
      const inquiryData = inquiry as EventInquiry;
      const { bestMatch, alternatives } = await matchVenues(inquiryData);
      await saveMatchResults(inquiry.id, bestMatch, alternatives);

      // Refetch and post to TG
      const { data: enriched } = await db
        .from('event_inquiries')
        .select('*')
        .eq('id', inquiry.id)
        .single();

      if (enriched) {
        postInquiryToTelegram(enriched as EventInquiry).catch(err => {
          devLog.error('[Typeform Poll] TG notification failed:', err);
        });
      }

      processed++;
    }

    devLog.log(`[Typeform Poll] ${processed} new, ${skipped} already processed`);

    return NextResponse.json({
      ok: true,
      total: responses.length,
      processed,
      skipped,
    });

  } catch (error) {
    devLog.error('[Typeform Poll] Error:', error);
    return NextResponse.json({ ok: false, error: 'Poll failed' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'typeform-poll-worker',
    enabled: isInquiryPipelineEnabled(),
    form_id: TYPEFORM_FORM_ID,
    has_token: !!TYPEFORM_API_TOKEN,
  });
}
