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
import { supabase as supabaseAnon } from '@/lib/supabase';
import { isInquiryPipelineEnabled } from '@/lib/featureFlags';
import { matchVenues, saveMatchResults } from '@/lib/venue/matcher';
import { postInquiryToTelegram } from '@/lib/telegram/inquiryNotification';
import { devLog } from '@/lib/logger';
import type { EventInquiry, TypeformAnswer } from '@/types/inquiry';

const db = supabaseAdmin || supabaseAnon;
const TYPEFORM_API_TOKEN = process.env.TYPEFORM_API_TOKEN || '';
const TYPEFORM_FORM_ID = process.env.TYPEFORM_FORM_ID || 'LgcBfa0M';

export async function POST(request: NextRequest) {
  try {
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

      // Parse the response into an inquiry (simplified parsing for poll results)
      const answers: TypeformAnswer[] = response.answers || [];
      const fields = response.definition?.fields || [];

      // Build a simple field map
      const fieldValues = new Map<string, string>();
      for (const answer of answers) {
        const field = fields.find((f: { id: string }) => f.id === answer.field.id);
        const title = (field?.title || '').toLowerCase().trim();
        const value = answer.text || answer.email || answer.phone_number || answer.choice?.label || answer.choices?.labels?.join(', ') || '';
        if (title) fieldValues.set(title, String(value));
      }

      const findVal = (keywords: string[]): string => {
        for (const [title, value] of fieldValues) {
          for (const kw of keywords) {
            if (title.includes(kw)) return value;
          }
        }
        return '';
      };

      // Insert
      const { data: inquiry, error: insertError } = await db
        .from('event_inquiries')
        .insert({
          typeform_token: token,
          host_name: findVal(['name']),
          host_email: findVal(['email']),
          host_phone: findVal(['phone', 'mobile']),
          organization: findVal(['company', 'org']),
          event_type: findVal(['event type', 'type']),
          venue_preference: findVal(['location', 'city', 'venue']),
          event_date: findVal(['date', 'when']),
          expected_headcount: findVal(['guest', 'people', 'headcount']),
          budget: findVal(['budget']),
          duration: findVal(['duration', 'how long']),
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
