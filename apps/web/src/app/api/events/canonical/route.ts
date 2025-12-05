/**
 * Canonical Events API
 * 
 * Serves events from canonical_events table (cached, geocoded, deduplicated)
 * 
 * Query params:
 * - lat, lng, radius: Filter by location (km)
 * - from, to: Filter by date range (ISO timestamps)
 * - limit: Max results (default 100)
 * 
 * Example:
 *   GET /api/events/canonical?lat=37.7749&lng=-122.4194&radius=100&limit=50
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { FEATURE_FLAGS } from '@/lib/featureFlags';
import { devLog } from '@/lib/logger';

/**
 * Haversine distance calculation (km)
 * Used for filtering events within radius
 */
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function GET(request: NextRequest) {
  try {
    // Check feature flag
    if (!FEATURE_FLAGS.CANONICAL_EVENTS_READ) {
      return NextResponse.json(
        {
          error: 'Canonical events feature not enabled',
          fallback: 'Use /api/calendar instead',
        },
        { status: 503 }
      );
    }
    
    // Parse query params
    const { searchParams } = new URL(request.url);
    const userLat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : null;
    const userLng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : null;
    const radius = searchParams.get('radius') ? parseFloat(searchParams.get('radius')!) : null;
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100;
    
    // Validate location params (must have both or neither)
    if ((userLat === null) !== (userLng === null)) {
      return NextResponse.json(
        { error: 'Must provide both lat and lng for location filtering' },
        { status: 400 }
      );
    }
    
    // Build query
    let query = supabase
      .from('canonical_events')
      .select('*')
      .order('starts_at', { ascending: true })
      .limit(limit);
    
    // Filter by date range
    if (from) {
      query = query.gte('starts_at', from);
    } else {
      // Default: only future events
      query = query.gte('starts_at', new Date().toISOString());
    }
    
    if (to) {
      query = query.lte('starts_at', to);
    }
    
    // Only return events with successful geocoding if location filter requested
    if (userLat !== null && radius !== null) {
      query = query.not('lat', 'is', null).not('lng', 'is', null);
    }
    
    // Execute query
    const { data: events, error } = await query;
    
    if (error) {
      devLog.error('❌ Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch events', details: error.message },
        { status: 500 }
      );
    }
    
    if (!events) {
      return NextResponse.json({ events: [] });
    }
    
    // Client-side distance filtering (if location params provided)
    let filteredEvents = events;
    if (userLat !== null && userLng !== null && radius !== null) {
      filteredEvents = events.filter(event => {
        if (!event.lat || !event.lng) return false;
        const distance = calculateDistance(userLat, userLng, event.lat, event.lng);
        return distance <= radius;
      });
    }
    
    // Transform to match ParsedEvent interface (for UI compatibility)
    const transformedEvents = filteredEvents.map(event => ({
      'Event Name': event.title,
      'Date & Time': event.starts_at,
      Location: event.location_raw || '',
      Latitude: event.lat?.toString() || '',
      Longitude: event.lng?.toString() || '',
      'Event URL': event.description || undefined,
      _canonical: {
        id: event.id,
        uid: event.canonical_uid,
        tz: event.tz,
        geocode_status: event.geocode_status,
        version: event.event_version,
      },
    }));
    
    // Return response with metadata
    return NextResponse.json({
      events: transformedEvents,
      meta: {
        total: transformedEvents.length,
        filtered_by_location: userLat !== null && radius !== null,
        location_filter: userLat !== null ? { lat: userLat, lng: userLng, radius } : null,
        date_range: { from: from || 'now', to: to || 'unlimited' },
        limit,
        source: 'canonical_events',
      },
    }, {
      headers: {
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      },
    });
    
  } catch (error) {
    devLog.error('❌ Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}





