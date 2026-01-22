/**
 * Events API
 * 
 * GET  /api/events - List events with filters
 * POST /api/events - Create a new community event
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { devLog } from '@/lib/logger';
import type {
  CommunityEvent,
  CreateEventInput,
  CreateEventResponse,
  EventsListResponse,
  EventFilters,
  HostType,
  SubmissionStatus,
} from '@/types/events';

// ============================================
// GET /api/events - List events
// ============================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse filters
    const filters: EventFilters = {
      category: (searchParams.get('category') as EventFilters['category']) || 'all',
      culture: searchParams.get('culture') as EventFilters['culture'] | undefined,
      status: (searchParams.get('status') as SubmissionStatus) || 'approved',
      host_id: searchParams.get('host_id') || undefined,
      start_date: searchParams.get('start_date') || undefined,
      end_date: searchParams.get('end_date') || undefined,
      lat: searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : undefined,
      lng: searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : undefined,
      radius_km: searchParams.get('radius_km') ? parseFloat(searchParams.get('radius_km')!) : undefined,
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0'),
    };

    // Build query - use admin client to bypass RLS for reading
    const client = supabaseAdmin || supabase;
    let query = client
      .from('canonical_events')
      .select(`
        id,
        canonical_uid,
        title,
        description,
        category,
        culture,
        source_type,
        starts_at,
        ends_at,
        tz,
        location_type,
        location_name,
        location_raw,
        lat,
        lng,
        zo_property_id,
        meeting_point,
        max_capacity,
        current_rsvp_count,
        host_id,
        host_type,
        submission_status,
        is_ticketed,
        ticket_price,
        ticket_currency,
        external_rsvp_url,
        luma_event_id,
        cover_image_url,
        created_at,
        updated_at
      `)
      .eq('submission_status', filters.status || 'approved')
      .order('starts_at', { ascending: true });

    // Apply filters
    if (filters.category && filters.category !== 'all') {
      query = query.eq('category', filters.category);
    }

    if (filters.culture) {
      query = query.eq('culture', filters.culture);
    }

    if (filters.host_id) {
      query = query.eq('host_id', filters.host_id);
    }

    // Date filters - default to upcoming events
    const now = new Date().toISOString();
    if (filters.start_date) {
      query = query.gte('starts_at', filters.start_date);
    } else {
      query = query.gte('starts_at', now);
    }

    if (filters.end_date) {
      query = query.lte('starts_at', filters.end_date);
    }

    // Pagination
    query = query.range(filters.offset!, filters.offset! + filters.limit! - 1);

    const { data: events, error, count } = await query;

    if (error) {
      devLog.error('Failed to fetch events:', error);
      return NextResponse.json(
        { error: 'Failed to fetch events' },
        { status: 500 }
      );
    }

    // Fetch host info separately if needed
    const eventsWithHosts = await Promise.all(
      (events || []).map(async (event) => {
        if (event.host_id) {
          const { data: host } = await client
            .from('users')
            .select('id, name, pfp, role, zo_membership')
            .eq('id', event.host_id)
            .single();
          return { ...event, host };
        }
        return event;
      })
    );

    const response: EventsListResponse = {
      events: eventsWithHosts as CommunityEvent[],
      meta: {
        total: count || events?.length || 0,
        page: Math.floor(filters.offset! / filters.limit!) + 1,
        limit: filters.limit!,
        has_more: (events?.length || 0) >= filters.limit!,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    devLog.error('Error in events list API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/events - Create event
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body: CreateEventInput = await request.json();

    // Get user ID from various sources
    const userId = request.headers.get('x-user-id') || 
                   request.cookies.get('zo_user_id')?.value;

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login to create events' },
        { status: 401 }
      );
    }

    // Get user profile to determine host type
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, pfp, role, zo_membership, founder_nfts_count, zo_roles')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      devLog.error('Failed to fetch user:', userError);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Determine host type and submission status
    const { host_type, submission_status } = getHostTypeAndStatus(user);

    // Validate required fields
    if (!body.title || body.title.length < 5) {
      return NextResponse.json(
        { error: 'Title must be at least 5 characters' },
        { status: 400 }
      );
    }

    if (!body.starts_at || !body.ends_at) {
      return NextResponse.json(
        { error: 'Start and end times are required' },
        { status: 400 }
      );
    }

    // Validate dates
    const startTime = new Date(body.starts_at);
    const endTime = new Date(body.ends_at);
    const now = new Date();

    if (startTime <= now) {
      return NextResponse.json(
        { error: 'Event must be in the future' },
        { status: 400 }
      );
    }

    if (endTime <= startTime) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      );
    }

    // Build event data
    const eventData = {
      // Generate a canonical UID for deduplication
      canonical_uid: `community-${userId}-${Date.now()}`,
      
      // Basic info
      title: body.title.trim(),
      description: body.description?.trim() || null,
      
      // Categorization
      category: body.category || 'community',
      culture: body.culture || 'default',
      source_type: 'community',
      
      // Date & Time
      starts_at: body.starts_at,
      ends_at: body.ends_at,
      tz: body.timezone || 'Asia/Kolkata',
      
      // Location
      location_type: body.location_type || 'custom',
      location_name: body.location_name?.trim() || null,
      location_raw: body.location_address?.trim() || null,
      lat: body.lat || null,
      lng: body.lng || null,
      zo_property_id: body.zo_property_id || null,
      meeting_point: body.meeting_point?.trim() || null,
      
      // Capacity
      max_capacity: body.max_capacity || null,
      current_rsvp_count: 0,
      
      // Host
      host_id: userId,
      host_type,
      
      // Workflow
      submission_status,
      
      // Ticketing
      is_ticketed: body.is_ticketed || false,
      ticket_price: body.ticket_price || null,
      ticket_currency: body.ticket_currency || 'INR',
      
      // External
      external_rsvp_url: body.external_rsvp_url || null,
      cover_image_url: body.cover_image_url || null,
    };

    // Use admin client if available to bypass RLS
    const client = supabaseAdmin || supabase;

    const { data: event, error: insertError } = await client
      .from('canonical_events')
      .insert(eventData)
      .select()
      .single();

    if (insertError) {
      devLog.error('Failed to create event:', insertError);
      return NextResponse.json(
        { error: 'Failed to create event: ' + insertError.message },
        { status: 500 }
      );
    }

    // Auto-RSVP the host as attending
    if (event) {
      await client.from('event_rsvps').insert({
        event_id: event.id,
        user_id: userId,
        status: 'going',
        rsvp_type: 'host',
      });
    }

    const response: CreateEventResponse = {
      success: true,
      event: { ...event, host: user } as CommunityEvent,
      message: submission_status === 'approved'
        ? 'Event created and published!'
        : 'Event submitted for review. We\'ll notify you once approved.',
    };

    devLog.log('✅ Event created:', event.id, 'Status:', submission_status);

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    devLog.error('Error creating event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

interface UserForHostType {
  role?: string;
  zo_membership?: string;
  founder_nfts_count?: number;
  zo_roles?: string[];
}

function getHostTypeAndStatus(user: UserForHostType): {
  host_type: HostType;
  submission_status: SubmissionStatus;
} {
  // Check for admin/vibe-curator roles
  if (user.zo_roles?.includes('admin') || user.zo_roles?.includes('vibe-curator')) {
    return { host_type: 'admin', submission_status: 'approved' };
  }

  // Check for founder status (multiple ways)
  if (
    user.role === 'Founder' ||
    user.zo_membership === 'founder' ||
    (user.founder_nfts_count && user.founder_nfts_count > 0)
  ) {
    return { host_type: 'founder_member', submission_status: 'approved' };
  }

  // Default: citizen with pending approval
  return { host_type: 'citizen', submission_status: 'pending' };
}
