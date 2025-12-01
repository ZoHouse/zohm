import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { devLog } from '@/lib/logger';

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

    // Fetch events within bbox (using canonical_events table)
    let eventsQuery = supabase
      .from('canonical_events')
      .select('id, title, lat, lng, starts_at, ends_at, location_raw, source_refs, raw_payload')
      .gte('lat', bbox.south)
      .lte('lat', bbox.north)
      .gte('lng', bbox.west)
      .lte('lng', bbox.east)
      .not('lat', 'is', null)
      .not('lng', 'is', null);

    // Add time filters if provided
    if (from) {
      eventsQuery = eventsQuery.gte('starts_at', from);
    }
    if (to) {
      eventsQuery = eventsQuery.lte('ends_at', to);
    }

    const { data: events, error: eventsError } = await eventsQuery
      .order('starts_at', { ascending: true })
      .limit(500); // Safety limit

    if (eventsError) {
      devLog.error('❌ Events query error:', eventsError);
    }

    devLog.log(`📅 Found ${events?.length || 0} events`);

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
      } catch (e) {
        // Ignore parsing errors
      }

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
          metadata: event.raw_payload,
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
      const { data: nodes, error: nodesError } = await supabase
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

