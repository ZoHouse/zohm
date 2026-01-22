import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { devLog } from '@/lib/logger';

// Use admin client to bypass RLS
const client = supabaseAdmin || supabase;

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface BBox {
  west: number;
  south: number;
  east: number;
  north: number;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    // Parse bbox parameter: ?bbox=west,south,east,north
    const bboxParam = searchParams.get('bbox');
    if (!bboxParam) {
      return NextResponse.json(
        { error: 'bbox parameter required (format: west,south,east,north)' },
        { status: 400 }
      );
    }

    const [west, south, east, north] = bboxParam.split(',').map(Number);
    if ([west, south, east, north].some(isNaN)) {
      return NextResponse.json(
        { error: 'Invalid bbox coordinates' },
        { status: 400 }
      );
    }

    const bbox: BBox = { west, south, east, north };

    // Optional: Filter by time range
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    
    // Optional: Include node markers
    const includeNodes = searchParams.get('includeNodes') === 'true';

    devLog.log('🗺️ GeoJSON request:', { bbox, from, to, includeNodes });

    // Fetch nodes first to look up coordinates for events at zo_property
    const { data: allNodes } = await client.from('nodes').select('id, latitude, longitude');
    const nodesMap: Record<string, { lat: number; lng: number }> = {};
    allNodes?.forEach(node => {
      if (node.latitude && node.longitude) {
        nodesMap[node.id] = { lat: node.latitude, lng: node.longitude };
      }
    });

    // Fetch ALL events first (to handle zo_property coordinate lookup)
    // Include host info by joining with user_profiles
    let eventsQuery = client
      .from('canonical_events')
      .select(`
        id, title, lat, lng, starts_at, ends_at, location_raw, location_name, source_refs, raw_payload, 
        zo_property_id, category, culture, submission_status, host_id, host_type, max_capacity, cover_image_url,
        host:user_profiles!canonical_events_host_id_fkey(id, display_name, avatar_url)
      `)
      .eq('submission_status', 'approved');

    // Add time filters if provided
    if (from) {
      eventsQuery = eventsQuery.gte('starts_at', from);
    }
    if (to) {
      eventsQuery = eventsQuery.lte('ends_at', to);
    }

    const { data: rawEvents, error: eventsError } = await eventsQuery
      .order('starts_at', { ascending: true })
      .limit(500); // Safety limit

    if (eventsError) {
      devLog.error('❌ Events query error:', eventsError);
    }

    // Process events - fill in missing coordinates from zo_property
    const events = (rawEvents || []).map(event => {
      let lat = event.lat;
      let lng = event.lng;
      
      // If no coords but has zo_property_id, look up from node
      if ((!lat || !lng) && event.zo_property_id && nodesMap[event.zo_property_id]) {
        lat = nodesMap[event.zo_property_id].lat;
        lng = nodesMap[event.zo_property_id].lng;
        devLog.log(`📍 Using node coords for ${event.title}: ${lat}, ${lng}`);
      }
      
      return { ...event, lat, lng };
    }).filter(event => {
      // Only include events with valid coordinates within bbox
      if (!event.lat || !event.lng) return false;
      return event.lat >= bbox.south && event.lat <= bbox.north &&
             event.lng >= bbox.west && event.lng <= bbox.east;
    });

    devLog.log(`📅 Found ${events?.length || 0} events (after coord lookup)`);

    // Build GeoJSON FeatureCollection
    const features: GeoJSON.Feature[] = [];

    // Add events as features
    events?.forEach(event => {
      if (!event.lat || !event.lng) return;

      // Extract first event URL from source_refs if available
      let eventUrl = null;
      try {
        const sourceRefs = Array.isArray(event.source_refs) ? event.source_refs : [];
        if (sourceRefs.length > 0 && sourceRefs[0].event_url) {
          eventUrl = sourceRefs[0].event_url;
        }
      } catch {
        // Ignore parsing errors
      }

      // Extract host info
      const hostInfo = event.host as { id?: string; display_name?: string; avatar_url?: string } | null;
      
      features.push({
        type: 'Feature',
        id: `event-${event.id}`,
        geometry: {
          type: 'Point',
          coordinates: [event.lng, event.lat]
        },
        properties: {
          id: event.id,
          name: event.title,
          type: 'event',
          starts_at: event.starts_at,
          ends_at: event.ends_at,
          event_url: eventUrl,
          location: event.location_raw,
          location_name: event.location_name,
          metadata: event.raw_payload,
          // Community event fields
          category: event.category,
          culture: event.culture,
          cover_image_url: (event as any).cover_image_url || null,
          // Host info
          host_id: event.host_id,
          host_type: event.host_type,
          host_name: hostInfo?.display_name || null,
          host_avatar: hostInfo?.avatar_url || null,
          max_capacity: event.max_capacity,
          // Add formatted date for popup
          formatted_date: new Date(event.starts_at).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })
        }
      });
    });

    // Optionally include nodes
    if (includeNodes) {
      devLog.log('📍 Fetching nodes with bbox:', bbox);
      
      //  Query nodes with bbox filtering
      const { data: nodes, error: nodesError } = await client
        .from('nodes')
        .select('*')
        .gte('latitude', bbox.south)
        .lte('latitude', bbox.north)
        .gte('longitude', bbox.west)
        .lte('longitude', bbox.east);

      if (nodesError) {
        devLog.error('❌ Nodes query error:', nodesError);
      } else {
        devLog.log(`📍 Found ${nodes?.length || 0} nodes`);
        
        nodes?.forEach(node => {
          if (!node.latitude || !node.longitude) {
            devLog.log('⚠️ Skipping node without coordinates:', node.id);
            return;
          }

          features.push({
            type: 'Feature',
            id: `node-${node.id}`,
            geometry: {
              type: 'Point',
              coordinates: [node.longitude, node.latitude]
            },
            properties: {
              id: node.id,
              name: node.name,
              type: 'node',
              city: node.city,
              country: node.country,
              node_type: node.type,
              website: node.website,
              metadata: node.metadata
            }
          });
        });
      }
    }

    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features
    };

    devLog.log(`✅ Returning ${features.length} features (${events?.length || 0} events, ${includeNodes ? features.length - (events?.length || 0) : 0} nodes)`);

    // Add caching headers
    return NextResponse.json(geojson, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        'Content-Type': 'application/geo+json'
      }
    });

  } catch (error) {
    devLog.error('❌ GeoJSON API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch GeoJSON data' },
      { status: 500 }
    );
  }
}

