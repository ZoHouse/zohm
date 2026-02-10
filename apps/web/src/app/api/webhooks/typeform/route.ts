/**
 * Typeform Webhook Receiver
 *
 * Receives event inquiry submissions from Typeform.
 * Parses the response, inserts into event_inquiries,
 * runs venue matching, and posts to Telegram.
 *
 * Always returns 200 to prevent Typeform retries.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabase as supabaseAnon } from '@/lib/supabase';
import { isInquiryPipelineEnabled } from '@/lib/featureFlags';
import { parseTypeformResponse } from '@/lib/typeform/parser';
import { matchVenues, saveMatchResults } from '@/lib/venue/matcher';
import { postInquiryToTelegram } from '@/lib/telegram/inquiryNotification';
import { devLog } from '@/lib/logger';
import type { TypeformWebhookPayload, EventInquiry } from '@/types/inquiry';

const db = supabaseAdmin || supabaseAnon;

export async function POST(request: NextRequest) {
  try {
    if (!isInquiryPipelineEnabled()) {
      return NextResponse.json({ ok: true, message: 'Pipeline disabled' });
    }

    const payload: TypeformWebhookPayload = await request.json();

    // Validate it's a form response
    if (payload.event_type !== 'form_response' || !payload.form_response) {
      return NextResponse.json({ ok: true, message: 'Not a form response' });
    }

    const token = payload.form_response.token;

    // Check for duplicate submission
    const { data: existing } = await db
      .from('event_inquiries')
      .select('id')
      .eq('typeform_token', token)
      .maybeSingle();

    if (existing) {
      devLog.log(`[Typeform Webhook] Duplicate submission: ${token}`);
      return NextResponse.json({ ok: true, message: 'Already processed' });
    }

    // Parse the Typeform response
    const parsed = parseTypeformResponse(payload);

    // Insert into event_inquiries
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
      devLog.error('[Typeform Webhook] Insert failed:', insertError);
      return NextResponse.json({ ok: true, error: 'Insert failed' });
    }

    devLog.log(`[Typeform Webhook] New inquiry ${inquiry.id} from ${parsed.host_name}`);

    // Run venue matching (non-blocking but we await to have results for TG)
    const inquiryData = inquiry as EventInquiry;
    const { bestMatch, alternatives } = await matchVenues(inquiryData);
    await saveMatchResults(inquiry.id, bestMatch, alternatives);

    // Refetch with match results for TG notification
    const { data: enriched } = await db
      .from('event_inquiries')
      .select('*')
      .eq('id', inquiry.id)
      .single();

    // Post to Telegram (fire-and-forget)
    if (enriched) {
      postInquiryToTelegram(enriched as EventInquiry).catch(err => {
        devLog.error('[Typeform Webhook] TG notification failed:', err);
      });
    }

    return NextResponse.json({
      ok: true,
      inquiry_id: inquiry.id,
      matched_venue: bestMatch?.property_name || null,
      match_score: bestMatch?.score || null,
    });

  } catch (error) {
    devLog.error('[Typeform Webhook] Error:', error);
    // Always 200 to prevent retries
    return NextResponse.json({ ok: true, error: 'Processing failed' });
  }
}
