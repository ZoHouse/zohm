/**
 * Quote Email Sender
 *
 * Sends professional quote emails to event inquirers via Resend.
 * Falls back gracefully if Resend is not configured.
 */

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabase as supabaseAnon } from '@/lib/supabase';
import { devLog } from '@/lib/logger';
import type { EventInquiry, QuoteBreakdown } from '@/types/inquiry';

const db = supabaseAdmin || supabaseAnon;
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const EMAIL_FROM = process.env.EMAIL_FROM || 'events@zo.world';

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amount);
}

/**
 * Send a quote email to the inquirer via Resend
 */
export async function sendQuoteEmail(
  inquiry: EventInquiry,
  quote: QuoteBreakdown
): Promise<boolean> {
  if (!RESEND_API_KEY) {
    devLog.error('[Email] RESEND_API_KEY not configured — skipping email');
    return false;
  }

  if (!inquiry.host_email) {
    devLog.error('[Email] No email on inquiry', inquiry.id);
    return false;
  }

  const subject = `Your Event Quote from Zo Events — ${inquiry.event_type || 'Event'} at ${quote.venue_name}`;
  const html = buildQuoteEmailHtml(inquiry, quote);

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [inquiry.host_email],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      devLog.error('[Email] Resend API error:', err);
      return false;
    }

    // Mark quote as sent
    await db
      .from('event_inquiries')
      .update({
        quote_sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', inquiry.id);

    devLog.log(`[Email] Quote sent to ${inquiry.host_email} for inquiry ${inquiry.id}`);
    return true;
  } catch (err) {
    devLog.error('[Email] Failed to send:', err);
    return false;
  }
}

function buildQuoteEmailHtml(inquiry: EventInquiry, quote: QuoteBreakdown): string {
  const name = inquiry.host_name || 'there';
  const eventType = inquiry.event_type || 'event';
  const validUntil = new Date(quote.valid_until).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const lineItemsHtml = quote.line_items.map(item =>
    `<tr>
      <td style="padding:8px 0;border-bottom:1px solid #eee;">${item.description}</td>
      <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;font-family:monospace;">₹${formatINR(item.amount)}</td>
    </tr>`
  ).join('');

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333;">

<div style="background:#f8f8f8;padding:24px;border-radius:12px;margin-bottom:24px;">
  <h1 style="margin:0 0 8px;color:#111;font-size:22px;">Zo Events</h1>
  <p style="margin:0;color:#666;font-size:14px;">Event Quote</p>
</div>

<p>Hi ${name},</p>

<p>Thank you for your interest in hosting your ${eventType} at <strong>${quote.venue_name}</strong>!</p>

<p>Based on your requirements, here is our proposed quote:</p>

<div style="background:#fafafa;padding:20px;border-radius:8px;margin:20px 0;">
  <h3 style="margin:0 0 12px;font-size:16px;">Event Summary</h3>
  <table style="width:100%;font-size:14px;">
    <tr><td style="padding:4px 0;color:#666;">Type:</td><td>${inquiry.event_type || 'Not specified'}</td></tr>
    <tr><td style="padding:4px 0;color:#666;">Date:</td><td>${inquiry.event_date || 'Flexible'}</td></tr>
    <tr><td style="padding:4px 0;color:#666;">Guests:</td><td>${inquiry.expected_headcount || '?'} people</td></tr>
    <tr><td style="padding:4px 0;color:#666;">Duration:</td><td>${inquiry.duration || 'Not specified'}</td></tr>
    <tr><td style="padding:4px 0;color:#666;">Venue:</td><td><strong>${quote.venue_name}</strong></td></tr>
  </table>
</div>

<div style="margin:20px 0;">
  <h3 style="margin:0 0 12px;font-size:16px;">Cost Breakdown</h3>
  <table style="width:100%;font-size:14px;border-collapse:collapse;">
    ${lineItemsHtml}
    <tr>
      <td style="padding:12px 0 4px;font-weight:bold;">Subtotal</td>
      <td style="padding:12px 0 4px;text-align:right;font-weight:bold;font-family:monospace;">₹${formatINR(quote.subtotal)}</td>
    </tr>
    <tr>
      <td style="padding:4px 0;color:#666;">GST (18%)</td>
      <td style="padding:4px 0;text-align:right;font-family:monospace;">₹${formatINR(quote.gst_amount)}</td>
    </tr>
    <tr style="border-top:2px solid #333;">
      <td style="padding:12px 0;font-weight:bold;font-size:16px;">Grand Total</td>
      <td style="padding:12px 0;text-align:right;font-weight:bold;font-size:16px;font-family:monospace;">₹${formatINR(quote.grand_total)}</td>
    </tr>
    ${quote.security_deposit > 0 ? `
    <tr>
      <td style="padding:4px 0;color:#666;font-size:13px;">Security deposit (refundable)</td>
      <td style="padding:4px 0;text-align:right;font-family:monospace;color:#666;font-size:13px;">₹${formatINR(quote.security_deposit)}</td>
    </tr>` : ''}
  </table>
</div>

<div style="background:#f0f7ff;padding:16px;border-radius:8px;margin:20px 0;font-size:13px;color:#555;">
  <p style="margin:0 0 8px;"><strong>Notes</strong></p>
  <ul style="margin:0;padding-left:20px;">
    ${quote.notes.map(n => `<li style="margin:4px 0;">${n}</li>`).join('')}
    <li style="margin:4px 0;">This quote is valid until ${validUntil}.</li>
  </ul>
</div>

<p>To confirm this booking or discuss further, simply reply to this email or reach out to us at <a href="mailto:events@zo.world">events@zo.world</a>.</p>

<p>We look forward to hosting your event!</p>

<p>Warm regards,<br><strong>Zo Events Team</strong></p>

</body>
</html>`;
}
