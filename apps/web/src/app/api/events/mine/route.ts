/**
 * My Events API
 * 
 * GET /api/events/mine - Get user's hosted events and RSVPs
 * 
 * For the "My Events" section in Zo Passport
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { devLog } from '@/lib/logger';
import type { MyEventsResponse } from '@/types/events';

// Use admin client to bypass RLS
const client = supabaseAdmin || supabase;

export async function GET(request: NextRequest) {
  try {
    // Get user ID
    const userId = request.headers.get('x-user-id') || 
                   request.cookies.get('zo_user_id')?.value;

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const now = new Date().toISOString();

    devLog.log('🎫 Fetching events for user:', userId);

    // 1. Fetch events user is hosting (use admin client to bypass RLS)
    const { data: hosted, error: hostedError } = await client
      .from('canonical_events')
      .select('*')
      .eq('host_id', userId)
      .eq('source_type', 'community')
      .order('starts_at', { ascending: true });

    if (hostedError) {
      devLog.error('Failed to fetch hosted events:', hostedError);
    }

    devLog.log('🎫 Found hosted events:', hosted?.length || 0, hosted?.map(e => ({ id: e.id, title: e.title, status: e.submission_status })));

    // 2. Fetch user's RSVPs with event details
    const { data: rsvps, error: rsvpsError } = await client
      .from('event_rsvps')
      .select(`
        id,
        event_id,
        status,
        rsvp_type,
        checked_in,
        checked_in_at,
        created_at
      `)
      .eq('user_id', userId)
      .in('status', ['going', 'interested', 'waitlist'])
      .order('created_at', { ascending: false });

    if (rsvpsError) {
      devLog.error('Failed to fetch RSVPs:', rsvpsError);
    }

    // Batch fetch all events in a single query (fixes N+1 problem)
    let rsvpsWithEvents: any[] = [];
    if (rsvps && rsvps.length > 0) {
      const eventIds = [...new Set(rsvps.map(r => r.event_id))];
      const { data: events, error: eventsError } = await client
        .from('canonical_events')
        .select(`
          id,
          title,
          category,
          culture,
          starts_at,
          ends_at,
          location_name,
          lat,
          lng,
          submission_status
        `)
        .in('id', eventIds);

      if (!eventsError && events) {
        // Create a map for quick lookup
        const eventMap = new Map(events.map(e => [e.id, e]));
        rsvpsWithEvents = rsvps.map(rsvp => ({
          ...rsvp,
          event: eventMap.get(rsvp.event_id) || null,
        }));
      } else {
        // Fallback: return RSVPs without event details
        rsvpsWithEvents = rsvps.map(rsvp => ({ ...rsvp, event: null }));
      }
    }

    // Filter out past events for upcoming RSVPs
    const upcomingRsvps = rsvpsWithEvents.filter(
      r => r.event && new Date(r.event.starts_at) >= new Date()
    );

    // 3. Fetch past attended events (checked_in = true)
    const { data: pastRsvps } = await client
      .from('event_rsvps')
      .select('event_id')
      .eq('user_id', userId)
      .eq('checked_in', true);

    let pastEvents: any[] = [];
    if (pastRsvps && pastRsvps.length > 0) {
      const eventIds = pastRsvps.map(r => r.event_id);
      const { data } = await client
        .from('canonical_events')
        .select('*')
        .in('id', eventIds)
        .lt('starts_at', now)
        .order('starts_at', { ascending: false })
        .limit(20);
      pastEvents = data || [];
    }

    // Calculate stats
    const stats = {
      total_hosted: hosted?.length || 0,
      total_attended: pastEvents.length,
      upcoming_count: upcomingRsvps.length,
    };

    // Separate upcoming and past hosted events
    const upcomingHosted = (hosted || []).filter(
      e => new Date(e.starts_at) >= new Date()
    );
    const pastHosted = (hosted || []).filter(
      e => new Date(e.starts_at) < new Date()
    );

    const response: MyEventsResponse = {
      hosted: upcomingHosted as any,
      rsvps: upcomingRsvps as any,  // Type assertion for joined data
      past: [...pastEvents, ...pastHosted].sort(
        (a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime()
      ).slice(0, 20) as any,
      stats,
    };

    return NextResponse.json(response);
  } catch (error) {
    devLog.error('Error fetching my events:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
