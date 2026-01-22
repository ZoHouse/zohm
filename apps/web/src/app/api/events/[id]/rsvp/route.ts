/**
 * Event RSVP API
 * 
 * GET  /api/events/[id]/rsvp - Get attendees (organizer view)
 * POST /api/events/[id]/rsvp - Create/update RSVP
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { devLog } from '@/lib/logger';
import type { RsvpInput, RsvpResponse, EventAttendeesResponse } from '@/types/events';

// ============================================
// GET /api/events/[id]/rsvp - Get attendees
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: eventId } = params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // Build query
    let query = supabase
      .from('event_rsvps')
      .select(`
        id,
        event_id,
        user_id,
        status,
        rsvp_type,
        checked_in,
        checked_in_at,
        created_at,
        updated_at
      `)
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: rsvps, error } = await query;

    if (error) {
      devLog.error('Failed to fetch RSVPs:', error);
      return NextResponse.json(
        { error: 'Failed to fetch attendees' },
        { status: 500 }
      );
    }

    // Fetch user details for each RSVP
    const rsvpsWithUsers = await Promise.all(
      (rsvps || []).map(async (rsvp) => {
        const { data: user } = await supabase
          .from('users')
          .select('id, name, pfp, phone, zo_pid')
          .eq('id', rsvp.user_id)
          .single();
        return { ...rsvp, user };
      })
    );

    // Calculate stats
    const stats = {
      total: rsvps?.length || 0,
      going: rsvps?.filter(r => r.status === 'going').length || 0,
      interested: rsvps?.filter(r => r.status === 'interested').length || 0,
      waitlist: rsvps?.filter(r => r.status === 'waitlist').length || 0,
      checked_in: rsvps?.filter(r => r.checked_in).length || 0,
    };

    const response: EventAttendeesResponse = {
      attendees: rsvpsWithUsers as any,  // Type assertion for joined data
      meta: stats,
    };

    return NextResponse.json(response);
  } catch (error) {
    devLog.error('Error fetching attendees:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/events/[id]/rsvp - Create/Update RSVP
// ============================================

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: eventId } = params;
    const body: RsvpInput = await request.json();

    // Get user ID
    const userId = request.headers.get('x-user-id') || 
                   request.cookies.get('zo_user_id')?.value;

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login to RSVP' },
        { status: 401 }
      );
    }

    // Validate status
    const validStatuses = ['going', 'interested', 'not_going', 'waitlist', 'cancelled'];
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: 'Invalid RSVP status' },
        { status: 400 }
      );
    }

    // Check if event exists and is approved
    const { data: event, error: eventError } = await supabase
      .from('canonical_events')
      .select('id, title, submission_status, max_capacity, current_rsvp_count, starts_at')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    if (event.submission_status !== 'approved') {
      return NextResponse.json(
        { error: 'Cannot RSVP to unapproved events' },
        { status: 400 }
      );
    }

    // Check if event has already started
    if (new Date(event.starts_at) < new Date()) {
      return NextResponse.json(
        { error: 'Cannot RSVP to past events' },
        { status: 400 }
      );
    }

    // Check capacity (for "going" status)
    let finalStatus = body.status;
    if (body.status === 'going' && event.max_capacity) {
      if (event.current_rsvp_count >= event.max_capacity) {
        // Auto-add to waitlist if at capacity
        finalStatus = 'waitlist';
      }
    }

    // Upsert RSVP (update if exists, insert if not)
    const client = supabaseAdmin || supabase;
    
    // Check if RSVP already exists
    const { data: existingRsvp } = await client
      .from('event_rsvps')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .single();

    let rsvp;
    let error;

    if (existingRsvp) {
      // Update existing RSVP
      const result = await client
        .from('event_rsvps')
        .update({
          status: finalStatus,
          rsvp_type: body.rsvp_type || 'standard',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingRsvp.id)
        .select()
        .single();
      rsvp = result.data;
      error = result.error;
    } else {
      // Insert new RSVP
      const result = await client
        .from('event_rsvps')
        .insert({
          event_id: eventId,
          user_id: userId,
          status: finalStatus,
          rsvp_type: body.rsvp_type || 'standard',
        })
        .select()
        .single();
      rsvp = result.data;
      error = result.error;
    }

    if (error) {
      devLog.error('Failed to save RSVP:', error);
      return NextResponse.json(
        { error: 'Failed to save RSVP' },
        { status: 500 }
      );
    }

    // Get user info for response
    const { data: user } = await client
      .from('users')
      .select('id, name, pfp')
      .eq('id', userId)
      .single();

    const response: RsvpResponse = {
      success: true,
      rsvp: { ...rsvp, user },
      message: finalStatus === 'waitlist' 
        ? 'Event is at capacity. You\'ve been added to the waitlist.'
        : `Successfully RSVP'd as ${finalStatus}`,
    };

    devLog.log('✅ RSVP saved:', eventId, userId, finalStatus);

    return NextResponse.json(response);
  } catch (error) {
    devLog.error('Error saving RSVP:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
