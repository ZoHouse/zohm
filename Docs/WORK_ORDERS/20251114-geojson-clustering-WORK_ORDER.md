# 🗺️ GeoJSON Clustering for Map Optimization

**Work Order ID**: WO-20251114-GEOJSON  
**Created**: 2025-11-14  
**Owner**: Platform Team  
**Priority**: 🔴 High  
**Effort**: 8-12 hours  
**Status**: 📋 Ready to Start

---

## Objective

Replace individual marker rendering with GeoJSON source + Mapbox clustering to improve map performance from ~50 markers to 500+ markers without degradation.

**Performance Goals**:
- Handle 500+ events without lag
- Reduce memory usage from 180MB → 120MB
- Maintain 60fps pan/zoom on desktop
- Enable spatial queries via bbox

---

## Architecture Overview

### Current (Inefficient)
```
Events API → Client → Create individual markers → Add to map
❌ 100 events = 100 DOM elements
❌ No clustering
❌ Full re-render on every change
```

### Target (Optimized)
```
GeoJSON API + bbox → MapboxGL Source → Cluster Layer → Render
✅ 100 events = 1 GeoJSON source + clustered
✅ Native Mapbox clustering
✅ Only fetch visible events
```

---

## Implementation Steps

### 🗄️ STEP 1: Database Setup (1 hour)

#### A. Ensure Spatial Indexes Exist

```sql
-- File: packages/api/migrations/007_add_spatial_indexes.sql

-- Add spatial index for bounding box queries on events
CREATE INDEX IF NOT EXISTS idx_events_location 
ON events USING GIST (
  ST_MakePoint(longitude::float, latitude::float)
);

-- Add spatial index for nodes
CREATE INDEX IF NOT EXISTS idx_nodes_location 
ON nodes USING GIST (
  ST_MakePoint(longitude::float, latitude::float)
);

-- Add GIN index for faster JSON queries (if needed)
CREATE INDEX IF NOT EXISTS idx_events_metadata 
ON events USING GIN (metadata);

-- Down migration
-- DROP INDEX IF EXISTS idx_events_location;
-- DROP INDEX IF EXISTS idx_nodes_location;
-- DROP INDEX IF EXISTS idx_events_metadata;
```

#### B. Test Spatial Queries

```sql
-- Test bbox query
SELECT id, name, latitude, longitude
FROM events
WHERE latitude BETWEEN 37.7 AND 37.8
  AND longitude BETWEEN -122.5 AND -122.4
ORDER BY starts_at DESC
LIMIT 100;

-- Verify index is used
EXPLAIN ANALYZE
SELECT id, name, latitude, longitude
FROM events
WHERE latitude BETWEEN 37.7 AND 37.8
  AND longitude BETWEEN -122.5 AND -122.4;
```

---

### 🔌 STEP 2: Create GeoJSON API Endpoint (2 hours)

#### A. Create API Route

```typescript
// File: apps/web/src/app/api/events/geojson/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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

    // Fetch events within bbox
    let eventsQuery = supabase
      .from('events')
      .select('id, name, latitude, longitude, starts_at, ends_at, event_url, location, metadata')
      .gte('latitude', bbox.south)
      .lte('latitude', bbox.north)
      .gte('longitude', bbox.west)
      .lte('longitude', bbox.east)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

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

    if (eventsError) throw eventsError;

    // Build GeoJSON FeatureCollection
    const features: GeoJSON.Feature[] = [];

    // Add events as features
    events?.forEach(event => {
      features.push({
        type: 'Feature',
        id: `event-${event.id}`,
        geometry: {
          type: 'Point',
          coordinates: [event.longitude, event.latitude]
        },
        properties: {
          id: event.id,
          name: event.name,
          type: 'event',
          starts_at: event.starts_at,
          ends_at: event.ends_at,
          event_url: event.event_url,
          location: event.location,
          metadata: event.metadata,
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
      const { data: nodes, error: nodesError } = await supabase
        .from('nodes')
        .select('id, name, latitude, longitude, city, country, type, website, metadata')
        .gte('latitude', bbox.south)
        .lte('latitude', bbox.north)
        .gte('longitude', bbox.west)
        .lte('longitude', bbox.east)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .limit(200);

      if (!nodesError && nodes) {
        nodes.forEach(node => {
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

    // Add caching headers
    return NextResponse.json(geojson, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        'Content-Type': 'application/geo+json'
      }
    });

  } catch (error) {
    console.error('GeoJSON API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch GeoJSON data' },
      { status: 500 }
    );
  }
}
```

#### B. Test Endpoint

```bash
# Test bbox query (San Francisco)
curl "http://localhost:3000/api/events/geojson?bbox=-122.5,37.7,-122.4,37.8"

# Test with nodes
curl "http://localhost:3000/api/events/geojson?bbox=-122.5,37.7,-122.4,37.8&includeNodes=true"

# Test time range
curl "http://localhost:3000/api/events/geojson?bbox=-122.5,37.7,-122.4,37.8&from=2025-11-01&to=2025-12-31"
```

---

### 🗺️ STEP 3: Create useMapGeoJSON Hook (2 hours)

```typescript
// File: apps/web/src/hooks/useMapGeoJSON.ts

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';

interface UseMapGeoJSONOptions {
  map: mapboxgl.Map | null;
  sourceId: string;
  includeNodes?: boolean;
}

export function useMapGeoJSON({ map, sourceId, includeNodes = false }: UseMapGeoJSONOptions) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchGeoJSON = async (bbox?: mapboxgl.LngLatBounds) => {
    if (!map) return;

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      // Get map bounds if not provided
      const bounds = bbox || map.getBounds();
      const west = bounds.getWest();
      const south = bounds.getSouth();
      const east = bounds.getEast();
      const north = bounds.getNorth();

      // Construct API URL
      const params = new URLSearchParams({
        bbox: `${west},${south},${east},${north}`,
        includeNodes: includeNodes.toString()
      });

      const url = `/api/events/geojson?${params}`;
      console.log('🔄 Fetching GeoJSON:', url);

      const response = await fetch(url, {
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const geojson = await response.json();
      console.log(`✅ Loaded ${geojson.features.length} features`);

      // Update or create source
      const source = map.getSource(sourceId) as mapboxgl.GeoJSONSource;
      if (source) {
        source.setData(geojson);
      } else {
        map.addSource(sourceId, {
          type: 'geojson',
          data: geojson,
          cluster: true,
          clusterMaxZoom: 14, // Max zoom to cluster points on
          clusterRadius: 50 // Radius of each cluster when clustering points
        });
      }

      setLoading(false);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('🔄 Request aborted');
        return;
      }
      console.error('❌ GeoJSON fetch error:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  // Auto-fetch on map move (debounced)
  useEffect(() => {
    if (!map) return;

    let timeoutId: NodeJS.Timeout;

    const handleMoveEnd = () => {
      // Debounce: wait 300ms after movement stops
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        fetchGeoJSON();
      }, 300);
    };

    map.on('moveend', handleMoveEnd);

    // Initial fetch
    if (map.loaded()) {
      fetchGeoJSON();
    } else {
      map.once('load', () => fetchGeoJSON());
    }

    return () => {
      map.off('moveend', handleMoveEnd);
      clearTimeout(timeoutId);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [map, sourceId, includeNodes]);

  return { loading, error, refetch: fetchGeoJSON };
}
```

---

### 🎨 STEP 4: Add Clustering Layers to MapCanvas (3 hours)

```typescript
// File: apps/web/src/components/MapCanvas.tsx
// Add this section after map initialization

import { useMapGeoJSON } from '@/hooks/useMapGeoJSON';

// Inside MapCanvas component:
const GEOJSON_SOURCE_ID = 'events-and-nodes';

// Add hook
const { loading: geoJSONLoading } = useMapGeoJSON({
  map: map.current,
  sourceId: GEOJSON_SOURCE_ID,
  includeNodes: true
});

// Add layers after map loads
const setupClusteringLayers = () => {
  if (!map.current) return;

  try {
    // 1. Cluster circles (showing count)
    if (!map.current.getLayer('clusters')) {
      map.current.addLayer({
        id: 'clusters',
        type: 'circle',
        source: GEOJSON_SOURCE_ID,
        filter: ['has', 'point_count'],
        paint: {
          // Graduated circle sizes based on point count
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#51bbd6', // < 10 points
            10,
            '#f1f075', // 10-30 points
            30,
            '#f28cb1', // 30-100 points
            100,
            '#ff4d6d'  // > 100 points
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            20,  // < 10 points: 20px
            10,
            30,  // 10-30 points: 30px
            30,
            40,  // 30-100 points: 40px
            100,
            50   // > 100 points: 50px
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff'
        }
      });
    }

    // 2. Cluster count labels
    if (!map.current.getLayer('cluster-count')) {
      map.current.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: GEOJSON_SOURCE_ID,
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 12
        },
        paint: {
          'text-color': '#ffffff'
        }
      });
    }

    // 3. Unclustered event points
    if (!map.current.getLayer('unclustered-events')) {
      map.current.addLayer({
        id: 'unclustered-events',
        type: 'circle',
        source: GEOJSON_SOURCE_ID,
        filter: ['all', 
          ['!', ['has', 'point_count']], 
          ['==', ['get', 'type'], 'event']
        ],
        paint: {
          'circle-color': '#ff4d6d',
          'circle-radius': 8,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff'
        }
      });
    }

    // 4. Unclustered node points
    if (!map.current.getLayer('unclustered-nodes')) {
      map.current.addLayer({
        id: 'unclustered-nodes',
        type: 'circle',
        source: GEOJSON_SOURCE_ID,
        filter: ['all', 
          ['!', ['has', 'point_count']], 
          ['==', ['get', 'type'], 'node']
        ],
        paint: {
          'circle-color': '#cfff50',
          'circle-radius': 10,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff'
        }
      });
    }

    console.log('✅ Clustering layers added');
  } catch (error) {
    console.error('❌ Error adding clustering layers:', error);
  }
};

// 5. Add click handlers for clusters and points
const setupClusterClickHandlers = () => {
  if (!map.current) return;

  // Click on cluster: zoom in
  map.current.on('click', 'clusters', (e) => {
    if (!map.current || !e.features || e.features.length === 0) return;

    const features = e.features;
    const clusterId = features[0].properties.cluster_id;
    const source = map.current.getSource(GEOJSON_SOURCE_ID) as mapboxgl.GeoJSONSource;

    source.getClusterExpansionZoom(clusterId, (err, zoom) => {
      if (err || !map.current) return;

      map.current.easeTo({
        center: (features[0].geometry as any).coordinates,
        zoom: zoom
      });
    });
  });

  // Click on unclustered event: show popup
  map.current.on('click', 'unclustered-events', (e) => {
    if (!map.current || !e.features || e.features.length === 0) return;

    const feature = e.features[0];
    const coordinates = (feature.geometry as any).coordinates.slice();
    const props = feature.properties;

    // Ensure popup doesn't go off-screen
    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
      coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }

    const popupContent = `
      <div style="padding: 0;">
        <h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 900; color: #000; font-family: 'Space Grotesk', sans-serif;">${props.name || "Event"}</h3>
        <p style="margin: 0 0 6px 0; font-size: 13px; color: #1a1a1a; line-height: 1.5;">📅 ${props.formatted_date}</p>
        ${props.location && !props.location.includes('luma.com') ? `<p style="margin: 0 0 16px 0; font-size: 13px; color: #1a1a1a; line-height: 1.5;">📍 ${props.location}</p>` : '<div style="margin-bottom: 16px;"></div>'}
        <div style="display: flex; gap: 8px;">
          ${props.event_url ? `<a href="${props.event_url}" target="_blank" class="glow-popup-button secondary" style="flex: 1;">Register</a>` : ''}
          <button onclick="window.showRouteTo(${coordinates[0]}, ${coordinates[1]})" class="glow-popup-button" style="flex: 1;">Directions</button>
        </div>
      </div>
    `;

    new mapboxgl.Popup({
      className: 'node-popup-clean',
      closeButton: false,
      closeOnClick: true,
      offset: [0, -15],
      maxWidth: '280px',
      anchor: 'bottom'
    })
      .setLngLat(coordinates)
      .setHTML(popupContent)
      .addTo(map.current);
  });

  // Click on unclustered node: show popup
  map.current.on('click', 'unclustered-nodes', (e) => {
    if (!map.current || !e.features || e.features.length === 0) return;

    const feature = e.features[0];
    const coordinates = (feature.geometry as any).coordinates.slice();
    const props = feature.properties;

    const popupContent = `
      <div style="padding: 0;">
        <h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 900; color: #000; font-family: 'Space Grotesk', sans-serif;">${props.name}</h3>
        <p style="margin: 0 0 16px 0; font-size: 13px; color: #1a1a1a; line-height: 1.5;">📍 ${props.city}, ${props.country}</p>
        <div style="display: flex; gap: 8px;">
          ${props.website ? `<a href="${props.website}" target="_blank" class="glow-popup-button secondary" style="flex: 1;">Visit</a>` : ''}
          <button onclick="window.showRouteTo(${coordinates[0]}, ${coordinates[1]})" class="glow-popup-button" style="flex: 1;">Directions</button>
        </div>
      </div>
    `;

    new mapboxgl.Popup({
      className: 'node-popup-clean',
      closeButton: false,
      closeOnClick: true,
      offset: [0, -15],
      maxWidth: '280px',
      anchor: 'bottom'
    })
      .setLngLat(coordinates)
      .setHTML(popupContent)
      .addTo(map.current);
  });

  // Change cursor on hover
  map.current.on('mouseenter', 'clusters', () => {
    if (map.current) map.current.getCanvas().style.cursor = 'pointer';
  });
  map.current.on('mouseleave', 'clusters', () => {
    if (map.current) map.current.getCanvas().style.cursor = '';
  });
  map.current.on('mouseenter', 'unclustered-events', () => {
    if (map.current) map.current.getCanvas().style.cursor = 'pointer';
  });
  map.current.on('mouseleave', 'unclustered-events', () => {
    if (map.current) map.current.getCanvas().style.cursor = '';
  });
  map.current.on('mouseenter', 'unclustered-nodes', () => {
    if (map.current) map.current.getCanvas().style.cursor = 'pointer';
  });
  map.current.on('mouseleave', 'unclustered-nodes', () => {
    if (map.current) map.current.getCanvas().style.cursor = '';
  });

  console.log('✅ Cluster click handlers added');
};

// Call in map load handler:
map.current.on('load', () => {
  setupClusteringLayers();
  setupClusterClickHandlers();
});
```

---

### 🧪 STEP 5: Testing & Validation (2 hours)

#### A. Unit Tests

```typescript
// File: apps/web/src/__tests__/api/events/geojson.test.ts

import { GET } from '@/app/api/events/geojson/route';
import { NextRequest } from 'next/server';

describe('GET /api/events/geojson', () => {
  it('requires bbox parameter', async () => {
    const req = new NextRequest('http://localhost:3000/api/events/geojson');
    const response = await GET(req);
    expect(response.status).toBe(400);
  });

  it('returns GeoJSON for valid bbox', async () => {
    const req = new NextRequest(
      'http://localhost:3000/api/events/geojson?bbox=-122.5,37.7,-122.4,37.8'
    );
    const response = await GET(req);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.type).toBe('FeatureCollection');
    expect(Array.isArray(data.features)).toBe(true);
  });

  it('includes nodes when requested', async () => {
    const req = new NextRequest(
      'http://localhost:3000/api/events/geojson?bbox=-122.5,37.7,-122.4,37.8&includeNodes=true'
    );
    const response = await GET(req);
    const data = await response.json();
    
    const hasNodes = data.features.some((f: any) => f.properties.type === 'node');
    expect(hasNodes).toBe(true);
  });
});
```

#### B. Manual Testing Checklist

```markdown
## Map Clustering Test Plan

### Visual Tests
- [ ] Clusters appear at low zoom levels
- [ ] Cluster size increases with point count
- [ ] Cluster colors change based on count
- [ ] Clusters disappear at high zoom (> 14)
- [ ] Individual markers show at high zoom
- [ ] Cluster count labels are readable

### Interaction Tests
- [ ] Clicking cluster zooms to expand
- [ ] Clicking event marker shows popup
- [ ] Clicking node marker shows popup
- [ ] Cursor changes to pointer on hover
- [ ] Popups contain correct data
- [ ] "Directions" button works

### Performance Tests
- [ ] Map loads < 2 seconds
- [ ] Pan/zoom maintains 60fps
- [ ] Memory usage < 150MB after 5 minutes
- [ ] No console errors
- [ ] Bbox updates on map move
- [ ] Debouncing prevents excessive API calls

### Edge Cases
- [ ] Works with 0 events
- [ ] Works with 500+ events
- [ ] Handles missing coordinates gracefully
- [ ] Works across date line (lng > 180)
- [ ] Works at extreme zoom levels
```

---

### 📊 STEP 6: Performance Monitoring (1 hour)

#### A. Add Telemetry

```typescript
// File: apps/web/src/lib/mapTelemetry.ts

export function trackMapPerformance(metric: {
  action: string;
  duration: number;
  featureCount?: number;
  zoom?: number;
  memory?: number;
}) {
  // Send to analytics
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'map_performance', {
      action: metric.action,
      duration_ms: metric.duration,
      feature_count: metric.featureCount,
      zoom_level: metric.zoom,
      memory_mb: metric.memory
    });
  }

  console.log('📊 Map Performance:', metric);
}

// Usage in hook:
const startTime = performance.now();
await fetchGeoJSON();
const duration = performance.now() - startTime;

trackMapPerformance({
  action: 'geojson_fetch',
  duration,
  featureCount: geojson.features.length,
  zoom: map.getZoom()
});
```

#### B. Memory Monitoring

```typescript
// Add to MapCanvas useEffect:
useEffect(() => {
  const interval = setInterval(() => {
    if ((performance as any).memory) {
      const memoryMB = (performance as any).memory.usedJSHeapSize / 1048576;
      console.log(`💾 Memory: ${memoryMB.toFixed(1)} MB`);
      
      if (memoryMB > 150) {
        console.warn('⚠️ Memory usage high!');
      }
    }
  }, 30000); // Every 30 seconds

  return () => clearInterval(interval);
}, []);
```

---

## 🎯 Acceptance Criteria

### Must Have
- [x] GeoJSON API endpoint with bbox filtering
- [x] Spatial database indexes for performance
- [x] Mapbox clustering layers (clusters, count, points)
- [x] Click handlers (cluster zoom, point popup)
- [x] Automatic bbox updates on map move
- [x] Debounced API calls (300ms)

### Should Have
- [x] Include nodes in GeoJSON
- [x] Time range filtering
- [x] Caching headers
- [x] Error handling
- [x] Loading states
- [x] Telemetry tracking

### Nice to Have
- [ ] Server-side caching (Redis)
- [ ] WebSocket updates for realtime
- [ ] Progressive loading (tiles)
- [ ] Custom cluster icons

---

## 📈 Expected Performance Improvements

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Load Time** | ~1.8s | ~1.2s | 33% faster |
| **Memory Usage** | ~180MB | ~120MB | 33% reduction |
| **FPS (Pan/Zoom)** | ~55fps | ~60fps | Smooth |
| **Max Markers** | ~50 | ~500+ | 10x scalability |
| **API Calls** | Every event | Per viewport | 80% reduction |

---

## 🚨 Known Limitations

1. **Initial Load**: First bbox query loads all events (no tile-based loading yet)
2. **Cluster Icons**: Using default circles (not custom images)
3. **Realtime**: No WebSocket updates (uses polling via moveend)
4. **Offline**: No offline caching (could add Service Worker)

---

## 🔄 Migration Plan

### Phase 1: Add GeoJSON Alongside Current (Day 1-2)
- Keep existing marker system
- Add GeoJSON source and layers
- Hide GeoJSON layers by default
- Test thoroughly

### Phase 2: A/B Test (Day 3-4)
- Feature flag: 50% users get GeoJSON
- Monitor performance metrics
- Compare user feedback

### Phase 3: Full Rollout (Day 5)
- Enable GeoJSON for all users
- Remove old marker code
- Update documentation

### Phase 4: Cleanup (Day 6-7)
- Delete unused code
- Optimize further
- Add advanced features

---

## 📝 Related Files

### Will Modify
- ✅ `apps/web/src/components/MapCanvas.tsx` (add clustering)
- ⚠️ `apps/web/src/app/api/events/geojson/route.ts` (new)
- ✅ `apps/web/src/hooks/useMapGeoJSON.ts` (new)
- ⚠️ `packages/api/migrations/007_add_spatial_indexes.sql` (new)

### Will Reference
- `apps/web/src/lib/supabase.ts`
- `apps/web/src/lib/calendarConfig.ts`
- `Docs/FEATURES/01-mapbox-integration.md`

---

## 🎓 Testing Instructions

### Local Testing

```bash
# 1. Run migration
cd packages/api
node scripts/run-migration.js

# 2. Start dev server
cd apps/web
pnpm dev

# 3. Test API endpoint
curl "http://localhost:3000/api/events/geojson?bbox=-122.5,37.7,-122.4,37.8" | jq

# 4. Open browser
open http://localhost:3000

# 5. Check console for clustering logs
# Should see: "✅ Loaded X features", "✅ Clustering layers added"
```

### Performance Testing

```javascript
// Run in browser console:

// Test 1: Memory usage
console.log(`Memory: ${(performance.memory.usedJSHeapSize / 1048576).toFixed(1)} MB`);

// Test 2: FPS counter
let lastTime = performance.now();
let frames = 0;
function measureFPS() {
  frames++;
  const now = performance.now();
  if (now >= lastTime + 1000) {
    console.log(`FPS: ${frames}`);
    frames = 0;
    lastTime = now;
  }
  requestAnimationFrame(measureFPS);
}
measureFPS();

// Test 3: API response time
const start = performance.now();
fetch('/api/events/geojson?bbox=-122.5,37.7,-122.4,37.8')
  .then(() => console.log(`API took: ${performance.now() - start}ms`));
```

---

## 🚀 Next Steps After Completion

1. **Reality Engine Integration**: Emit signals on cluster interactions
2. **Custom Cluster Icons**: Replace circles with Zo-branded markers
3. **Realtime Updates**: WebSocket for live event additions
4. **Tile-Based Loading**: Progressive enhancement for 1000+ events
5. **Offline Support**: Service Worker for cached tiles

---

**Status**: 📋 Ready to Implement  
**Estimated Time**: 8-12 hours  
**Difficulty**: Medium  
**Impact**: 🔥 High (10x performance improvement)

**Assigned To**: @platform-team  
**Reviewer**: @lead-engineer  
**Last Updated**: 2025-11-14

