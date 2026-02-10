/**
 * Quote Generation Engine
 *
 * Calculates a structured price quote from Zoeventsmaster venue data.
 * Handles missing pricing gracefully (most venues have empty pricing columns).
 */

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabase as supabaseAnon } from '@/lib/supabase';
import { devLog } from '@/lib/logger';
import type { EventInquiry, QuoteBreakdown, QuoteLineItem, ZoeventsVenue } from '@/types/inquiry';

const db = supabaseAdmin || supabaseAnon;
const GST_RATE = 0.18;

function parseAmount(val: string | null | undefined): number {
  if (!val) return 0;
  const cleaned = val.replace(/[^0-9.]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function parseDays(duration: string): number {
  const lower = (duration || '').toLowerCase();
  if (lower.includes('multi') || lower.includes('2') || lower.includes('3')) {
    const match = lower.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 2;
  }
  if (lower.includes('half')) return 0.5;
  return 1;
}

/**
 * Generate a quote for an inquiry using the matched venue's pricing data.
 * Returns null if the venue has no pricing data at all.
 */
export async function generateQuote(inquiry: EventInquiry): Promise<QuoteBreakdown | null> {
  if (!inquiry.matched_venue) {
    devLog.error('[Quote Engine] No matched venue on inquiry', inquiry.id);
    return null;
  }

  // Fetch venue pricing data
  const { data: venue, error } = await db
    .from('Zoeventsmaster')
    .select('*')
    .eq('property_name', inquiry.matched_venue)
    .maybeSingle();

  if (error || !venue) {
    devLog.error('[Quote Engine] Failed to fetch venue:', error);
    return null;
  }

  const v = venue as ZoeventsVenue;
  const guests = parseInt(inquiry.expected_headcount || '0', 10) || 0;
  const days = parseDays(inquiry.duration);

  // Check if venue has ANY pricing data
  const hasAnyPricing = [
    v.hourly_rate, v.half_day_rate, v.full_day_rate,
    v.buffet_veg_per_pax, v.buffet_nonveg_per_pax,
    v.cleanup_fee,
  ].some(val => parseAmount(val) > 0);

  if (!hasAnyPricing) {
    devLog.log(`[Quote Engine] No pricing data for ${v.property_name} — manual quote needed`);
    return null;
  }

  const lineItems: QuoteLineItem[] = [];

  // 1. VENUE CHARGES
  const halfDay = parseAmount(v.half_day_rate);
  const fullDay = parseAmount(v.full_day_rate);
  const hourly = parseAmount(v.hourly_rate);

  if (days === 0.5 && halfDay > 0) {
    lineItems.push({ category: 'Venue', description: 'Half-day rate', amount: halfDay });
  } else if (fullDay > 0) {
    const venueTotal = fullDay * Math.ceil(days);
    lineItems.push({
      category: 'Venue',
      description: days > 1 ? `Full day rate x ${Math.ceil(days)} days` : 'Full day rate',
      amount: venueTotal,
    });
  } else if (hourly > 0) {
    const hours = days * 8; // estimate 8 hours per day
    lineItems.push({ category: 'Venue', description: `Hourly rate x ${hours} hours`, amount: hourly * hours });
  }

  // 2. F&B PACKAGE
  if (inquiry.needs_catering && guests > 0) {
    const vegRate = parseAmount(v.buffet_veg_per_pax);
    const nonVegRate = parseAmount(v.buffet_nonveg_per_pax);
    const fbRate = nonVegRate || vegRate;

    if (fbRate > 0) {
      const fbTotal = fbRate * guests * Math.ceil(days);
      lineItems.push({
        category: 'F&B',
        description: `${nonVegRate ? 'Non-veg' : 'Veg'} buffet (${guests} pax x ${Math.ceil(days)} day${days > 1 ? 's' : ''})`,
        amount: fbTotal,
      });
    }
  }

  // 3. CONVENTION HALL
  const hallCharges = parseAmount(v.convention_hall_charges);
  if (inquiry.needs_convention_hall && hallCharges > 0) {
    lineItems.push({ category: 'Services', description: 'Convention hall charges', amount: hallCharges });
  }

  // 4. CLEANUP FEE
  const cleanup = parseAmount(v.cleanup_fee);
  if (cleanup > 0) {
    lineItems.push({ category: 'Logistics', description: 'Cleanup fee', amount: cleanup });
  }

  // If we still have no line items, return null
  if (lineItems.length === 0) {
    return null;
  }

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const securityDeposit = parseAmount(v.security_deposit);
  const gstAmount = Math.round(subtotal * GST_RATE);
  const grandTotal = subtotal + gstAmount + securityDeposit;

  // Seasonal adjustment (future: check event date against peak_season_dates)
  const seasonalAdjustment = null;

  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + 10);

  return {
    venue_name: v.property_name,
    generated_at: new Date().toISOString(),
    currency: 'INR',
    line_items: lineItems,
    subtotal,
    seasonal_adjustment: seasonalAdjustment,
    gst_rate: GST_RATE,
    gst_amount: gstAmount,
    security_deposit: securityDeposit,
    grand_total: grandTotal,
    notes: [
      ...(securityDeposit > 0 ? [`Security deposit of ${securityDeposit.toLocaleString('en-IN')} is refundable post-event.`] : []),
      'Prices are indicative and subject to final confirmation.',
      'Cancellation policy applies as per venue terms.',
    ],
    valid_until: validUntil.toISOString(),
  };
}

/**
 * Save the generated quote to the inquiry row
 */
export async function saveQuote(inquiryId: string, quote: QuoteBreakdown): Promise<void> {
  await db
    .from('event_inquiries')
    .update({
      quote_json: quote,
      quote_total: quote.grand_total,
      inquiry_status: 'quoted',
      updated_at: new Date().toISOString(),
    })
    .eq('id', inquiryId);
}
