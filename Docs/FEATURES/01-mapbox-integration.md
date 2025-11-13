# Mapbox Integration — Feature Spec

**Version**: 1.0  
**Owner**: Frontend / Geo  
**Last Updated**: 2025-11-13  
**Status**: ✅ Implemented (needs optimization)

---

## Purpose

Provide a reliable, performant MapCanvas that shows Nodes, Events, Quests, and User location with smooth updates and low CPU on mobile.

## Key Capabilities

- Render Node markers with resonance state
- Render Event pins and event details on click
- Render Quest markers and progress
- Show user location and navigation to Node/Event
- Support cluster rendering and virtualized markers
- Support server-driven map overlays (heatmaps, active zones)

## API Contracts

- `GET /api/cities/:cityId/nodes` → `{ success, data: [ { nodeId, lat, lng, type, resonance, metadata } ] }`
- `GET /api/cities/:cityId/events?from=&to=` → list of events
- `GET /api/cities/:cityId/quests` → list of active quests
- `GET /api/user/:id/location` → last known location (if allowed)

## DB Surface

**`nodes` table fields needed**:
- `id, city_id, lat, lng, node_type, resonance, metadata_json`

**`events` table fields**:
- `id, node_id, city_id, starts_at, ends_at, metadata_json`

**`quests` table fields**:
- `id, node_id (nullable), quest_type, schedule, metadata_json`

## UX Notes

- Desktop shows rich popover; mobile shows bottom sheet
- Map canvas must lazy-load tiles and markers as user pans
- Marker click opens event/quest modal with CTA
- Use Mapbox GL layer separation: markers / clusters / overlays

## Telemetry

Track these events:
- `map_open` - User opens map view
- `marker_click` - User clicks marker (nodeId, type)
- `quest_click` - User clicks quest marker
- `node_visit` - User arrives at node location

**Event schema**: `{ ts, userId, nodeId, cityId, eventType, metadata }`

## Performance Targets

| Metric | Target | Current Status |
|--------|--------|----------------|
| Map Load Time | < 2s | ~1.8s ✅ |
| Marker Render | < 500ms | ~400ms ✅ |
| Smooth Pan/Zoom | 60fps | ~55fps ⚠️ |
| Memory Usage | < 150MB | ~180MB ⚠️ |

## Acceptance Criteria

- [ ] Map loads within target time on desktop and mobile
- [x] Markers reflect live resonance value within 5s of change
- [ ] Clicking an Event opens detail modal with accurate times and RSVP status
- [x] Container dimension check prevents initialization errors
- [ ] Marker clustering works for 100+ nodes

## Tests

**Unit test**: MapCanvas renders markers given mocked API
```typescript
describe('MapCanvas', () => {
  it('renders markers from API data', () => {
    const mockNodes = [
      { id: '1', lat: 37.7749, lng: -122.4194, type: 'node', resonance: 0.8 }
    ];
    render(<MapCanvas nodes={mockNodes} />);
    expect(screen.getByTestId('marker-1')).toBeInTheDocument();
  });
});
```

**Integration**: Simulate node resonance update via Supabase and assert re-render
```typescript
it('updates marker when resonance changes', async () => {
  // Subscribe to realtime updates
  // Trigger resonance change in DB
  // Assert marker visual updates
});
```

## Current Implementation

**Location**: `apps/web/src/components/MapCanvas.tsx`

**Status**: 
- ✅ Basic rendering working
- ✅ Fixed initialization error with container dimension check
- ⚠️ Needs optimization for mobile performance
- ⚠️ Clustering not yet implemented
- ❌ Realtime updates not connected

## Known Issues

1. **Memory leak on repeated zoom** - MapCanvas holds references to old marker instances
2. **Mobile scroll interference** - Touch events conflict with map pan
3. **Marker clustering needed** - Performance degrades with 50+ markers

## Work Order Snippet

**For optimization work**:

```markdown
# WO-XXX: Optimize MapCanvas Performance

## Scope
- Implement marker clustering (mapbox-gl-js clusters)
- Add viewport-based marker virtualization
- Fix memory leak in marker lifecycle
- Add telemetry tracking

## Files to Modify
- `apps/web/src/components/MapCanvas.tsx`
- `apps/web/src/hooks/useMapMarkers.ts` (new)
- `apps/web/src/lib/telemetry.ts` (add map events)

## Tests
- Load test with 500+ markers
- Memory profiling before/after
- Mobile touch event integration test
```

## Related Documentation

- `Docs/ARCHITECTURE.md` - System architecture
- `Docs/API_ENDPOINTS.md` - Complete API reference
- MapBox GL JS Docs: https://docs.mapbox.com/mapbox-gl-js/

