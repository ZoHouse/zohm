/**
 * Single Event API
 * 
 * GET    /api/events/[id] - Get event details
 * PUT    /api/events/[id] - Update event (host only)
 * DELETE /api/events/[id] - Cancel event (host only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { devLog } from '@/lib/logger';
import type { CommunityEvent } from '@/types/events';

// ============================================
// GET /api/events/[id] - Get event details
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: event, error } = await supabase
      .from('canonical_events')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Fetch host info
    let host = null;
    if (event.host_id) {
      const { data: hostData } = await supabase
        .from('users')
        .select('id, name, pfp, role, zo_membership')
        .eq('id', event.host_id)
        .single();
      host = hostData;
    }

    // Fetch RSVP stats
    const { data: rsvpStats } = await supabase
      .from('event_rsvps')
      .select('status')
      .eq('event_id', id);

    const stats = {
      going: rsvpStats?.filter(r => r.status === 'going').length || 0,
      interested: rsvpStats?.filter(r => r.status === 'interested').length || 0,
      waitlist: rsvpStats?.filter(r => r.status === 'waitlist').length || 0,
    };

    return NextResponse.json({
      event: { ...event, host } as CommunityEvent,
      stats,
    });
  } catch (error) {
    devLog.error('Error fetching event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================
// PUT /api/events/[id] - Update event
// ============================================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Get user ID
    const userId = request.headers.get('x-user-id') || 
                   request.cookies.get('zo_user_id')?.value;

    devLog.info('PUT /api/events/[id] - userId:', userId, 'eventId:', id);

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Use admin client to bypass RLS for all operations
    const client = supabaseAdmin || supabase;

    // Check ownership
    const { data: event, error: fetchError } = await client
      .from('canonical_events')
      .select('id, host_id')
      .eq('id', id)
      .single();

    if (fetchError) {
      devLog.error('Error fetching event for update:', fetchError);
    }

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    devLog.info('Event found - host_id:', event.host_id, 'userId:', userId);

    if (event.host_id !== userId) {
      // Check if admin
      const { data: user } = await client
        .from('users')
        .select('zo_roles')
        .eq('id', userId)
        .single();

      if (!user?.zo_roles?.includes('admin')) {
        return NextResponse.json(
          { error: 'Not authorized to edit this event' },
          { status: 403 }
        );
      }
    }

    // Update allowed fields only
    const allowedUpdates: Record<string, unknown> = {};
    const editableFields = [
      'title', 'description', 'culture', 'starts_at', 'ends_at',
      'location_name', 'location_raw', 'lat', 'lng', 'meeting_point',
      'max_capacity', 'cover_image_url'
    ];

    for (const field of editableFields) {
      if (body[field] !== undefined) {
        allowedUpdates[field] = body[field];
      }
    }

    allowedUpdates.updated_at = new Date().toISOString();

    devLog.info('Updating event with:', allowedUpdates);

    const { data: updated, error } = await client
      .from('canonical_events')
      .update(allowedUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      devLog.error('Failed to update event:', error);
      return NextResponse.json(
        { error: 'Failed to update event: ' + error.message },
        { status: 500 }
      );
    }

    devLog.info('Event updated successfully:', updated?.id);

    return NextResponse.json({
      success: true,
      event: updated,
      message: 'Event updated successfully',
    });
  } catch (error) {
    devLog.error('Error updating event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/events/[id] - Cancel event
// ============================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get user ID
    const userId = request.headers.get('x-user-id') || 
                   request.cookies.get('zo_user_id')?.value;

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Use admin client to bypass RLS
    const client = supabaseAdmin || supabase;

    // Check ownership
    const { data: event } = await client
      .from('canonical_events')
      .select('id, host_id, starts_at')
      .eq('id', id)
      .single();

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    if (event.host_id !== userId) {
      // Check if admin
      const { data: user } = await client
        .from('users')
        .select('zo_roles')
        .eq('id', userId)
        .single();

      if (!user?.zo_roles?.includes('admin')) {
        return NextResponse.json(
          { error: 'Not authorized to cancel this event' },
          { status: 403 }
        );
      }
    }

    // Can't cancel past events
    if (new Date(event.starts_at) < new Date()) {
      return NextResponse.json(
        { error: 'Cannot cancel past events' },
        { status: 400 }
      );
    }

    // Soft delete - update status to cancelled
    const { error } = await client
      .from('canonical_events')
      .update({
        submission_status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      devLog.error('Failed to cancel event:', error);
      return NextResponse.json(
        { error: 'Failed to cancel event' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Event cancelled',
    });
  } catch (error) {
    devLog.error('Error cancelling event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
