/**
 * Event RSVP API
 *
 * GET   /api/events/[id]/rsvp - Get attendees (organizer view)
 * POST  /api/events/[id]/rsvp - Create/update RSVP (user self-registration)
 * PATCH /api/events/[id]/rsvp - Update RSVP status (host management)
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { devLog } from '@/lib/logger';
import type { RsvpInput, RsvpResponse, EventAttendeesResponse } from '@/types/events';

// ============================================
// Helper: Update event RSVP count
// ============================================
async function updateEventRsvpCount(client: typeof supabase, eventId: string): Promise<void> {
  // Count all "going" RSVPs for this event
  const { count, error } = await client
    .from('event_rsvps')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .eq('status', 'going');

  if (error) {
    devLog.error('Failed to count RSVPs:', error);
    return;
  }

  // Update the event's current_rsvp_count
  const { error: updateError } = await client
    .from('canonical_events')
    .update({ current_rsvp_count: count || 0 })
    .eq('id', eventId);

  if (updateError) {
    devLog.error('Failed to update event RSVP count:', updateError);
  }
}

// ============================================
// Helper: Promote waitlisted user to "going"
// ============================================
async function promoteFromWaitlist(client: typeof supabase, eventId: string): Promise<string | null> {
  // Get the oldest waitlisted RSVP
  const { data: waitlistEntry, error: waitlistError } = await client
    .from('event_rsvps')
    .select('id, user_id')
    .eq('event_id', eventId)
    .eq('status', 'waitlist')
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  if (waitlistError || !waitlistEntry) {
    // No one on waitlist, that's fine
    return null;
  }

  // Promote them to "going"
  const { error: promoteError } = await client
    .from('event_rsvps')
    .update({
      status: 'going',
      updated_at: new Date().toISOString(),
    })
    .eq('id', waitlistEntry.id);

  if (promoteError) {
    devLog.error('Failed to promote from waitlist:', promoteError);
    return null;
  }

  devLog.log('Promoted user from waitlist:', waitlistEntry.user_id);
  return waitlistEntry.user_id;
}

// ============================================
// GET /api/events/[id]/rsvp - Get attendees
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // Use admin client to bypass RLS for host viewing all RSVPs
    const client = supabaseAdmin || supabase;

    // Build query
    let query = client
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

    // Batch fetch all users in a single query (fixes N+1 problem)
    let rsvpsWithUsers = rsvps || [];
    if (rsvps && rsvps.length > 0) {
      const userIds = [...new Set(rsvps.map(r => r.user_id))];
      const { data: users, error: usersError } = await client
        .from('users')
        .select('id, name, pfp, phone, zo_pid')
        .in('id', userIds);

      if (!usersError && users) {
        // Create a map for quick lookup
        const userMap = new Map(users.map(u => [u.id, u]));
        rsvpsWithUsers = rsvps.map(rsvp => ({
          ...rsvp,
          user: userMap.get(rsvp.user_id) || null,
        }));
      }
    }

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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
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
    const validStatuses = ['pending', 'going', 'interested', 'not_going', 'waitlist', 'cancelled'];
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: 'Invalid RSVP status' },
        { status: 400 }
      );
    }

    // Use admin client to bypass RLS
    const client = supabaseAdmin || supabase;

    // Check if event exists and is approved
    const { data: event, error: eventError } = await client
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

    // Check if RSVP already exists and get previous status
    const { data: existingRsvp } = await client
      .from('event_rsvps')
      .select('id, status')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .single();

    const previousStatus = existingRsvp?.status || null;

    // Default new RSVPs to "interested" (pending host approval)
    // Users cannot directly set themselves to "going" - only host can approve
    let finalStatus = body.status;

    // If this is a new RSVP or user is trying to register, set to "interested"
    if (!existingRsvp && body.status === 'going') {
      finalStatus = 'interested';
    }

    // Check capacity (for "going" status from host approval)
    // Only check capacity if user is newly going (not already going)
    if (finalStatus === 'going' && event.max_capacity && previousStatus !== 'going') {
      // Get fresh count of "going" RSVPs
      const { count: currentGoingCount } = await client
        .from('event_rsvps')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .eq('status', 'going');

      if ((currentGoingCount || 0) >= event.max_capacity) {
        // Auto-add to waitlist if at capacity
        finalStatus = 'waitlist';
      }
    }

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

    // Update the event's RSVP count
    await updateEventRsvpCount(client, eventId);

    // If user changed FROM "going" to something else, promote from waitlist
    let promotedUserId: string | null = null;
    if (previousStatus === 'going' && finalStatus !== 'going' && event.max_capacity) {
      promotedUserId = await promoteFromWaitlist(client, eventId);
      // Update count again after promotion
      if (promotedUserId) {
        await updateEventRsvpCount(client, eventId);
      }
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
        : finalStatus === 'interested'
        ? 'RSVP submitted! Waiting for host approval.'
        : `Successfully RSVP'd as ${finalStatus}`,
    };


    return NextResponse.json(response);
  } catch (error) {
    devLog.error('Error saving RSVP:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH /api/events/[id]/rsvp - Host manages RSVP
// ============================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const body = await request.json();
    const { rsvp_id, user_id, status, checked_in } = body;

    // Get host ID
    const hostId = request.headers.get('x-user-id') ||
                   request.cookies.get('zo_user_id')?.value;

    if (!hostId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const client = supabaseAdmin || supabase;

    // Verify host owns the event
    const { data: event, error: eventError } = await client
      .from('canonical_events')
      .select('id, host_id, max_capacity')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Check if user is host or admin
    if (event.host_id !== hostId) {
      const { data: user } = await client
        .from('users')
        .select('zo_roles')
        .eq('id', hostId)
        .single();

      if (!user?.zo_roles?.includes('admin')) {
        return NextResponse.json(
          { error: 'Not authorized to manage RSVPs for this event' },
          { status: 403 }
        );
      }
    }

    // Get the current RSVP to check previous status
    let previousStatus: string | null = null;
    if (rsvp_id) {
      const { data: currentRsvp } = await client
        .from('event_rsvps')
        .select('status')
        .eq('id', rsvp_id)
        .single();
      previousStatus = currentRsvp?.status || null;
    } else if (user_id) {
      const { data: currentRsvp } = await client
        .from('event_rsvps')
        .select('status')
        .eq('event_id', eventId)
        .eq('user_id', user_id)
        .single();
      previousStatus = currentRsvp?.status || null;
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (status) {
      const validStatuses = ['pending', 'going', 'interested', 'not_going', 'waitlist', 'cancelled', 'approved', 'rejected'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status' },
          { status: 400 }
        );
      }
      updateData.status = status;
    }

    if (typeof checked_in === 'boolean') {
      updateData.checked_in = checked_in;
      if (checked_in) {
        updateData.checked_in_at = new Date().toISOString();
        updateData.checked_in_by = hostId;
      }
    }

    // Find the RSVP to update
    let updated;
    let error;

    if (rsvp_id) {
      const result = await client
        .from('event_rsvps')
        .update(updateData)
        .eq('id', rsvp_id)
        .select()
        .single();
      updated = result.data;
      error = result.error;
    } else if (user_id) {
      const result = await client
        .from('event_rsvps')
        .update(updateData)
        .eq('event_id', eventId)
        .eq('user_id', user_id)
        .select()
        .single();
      updated = result.data;
      error = result.error;
    } else {
      return NextResponse.json(
        { error: 'Must provide rsvp_id or user_id' },
        { status: 400 }
      );
    }

    if (error) {
      devLog.error('Failed to update RSVP:', error);
      return NextResponse.json(
        { error: 'Failed to update RSVP' },
        { status: 500 }
      );
    }

    // Update the event's RSVP count if status changed
    if (status && status !== previousStatus) {
      await updateEventRsvpCount(client, eventId);

      // If changed FROM "going" to something else, promote from waitlist
      if (previousStatus === 'going' && status !== 'going' && event.max_capacity) {
        const promotedUserId = await promoteFromWaitlist(client, eventId);
        if (promotedUserId) {
          await updateEventRsvpCount(client, eventId);
        }
      }
    }


    return NextResponse.json({
      success: true,
      rsvp: updated,
      message: 'RSVP updated successfully',
    });
  } catch (error) {
    devLog.error('Error updating RSVP:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
