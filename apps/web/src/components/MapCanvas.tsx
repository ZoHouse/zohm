'use client';

import { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { ParsedEvent } from '@/lib/icalParser';
import { PartnerNodeRecord } from '@/lib/supabase';
import { MAPBOX_TOKEN, DEFAULT_CENTER } from '@/lib/calendarConfig';
import { getNodeTypeColor, getNodeIcon, isLogoNode, getNodeTypeEmoji, NodeType } from '@/lib/nodeTypes';
import { useMapGeoJSON } from '@/hooks/useMapGeoJSON';
import {
  GEOJSON_SOURCE_ID,
  setupClusteringLayers,
  setupClusterClickHandlers,
  removeClusteringLayers
} from '@/lib/mapClustering';
import { devLog } from '@/lib/logger';
import { getEventCoverImage } from '@/lib/eventCoverDefaults';

// 🔇 DISABLE VERBOSE LOGGING (causing console spam)
const VERBOSE_LOGGING = false;
const mapLog = VERBOSE_LOGGING ? console.log : () => { };

// 🎨 MAP STYLE CONFIGURATION
// Change this to test different Mapbox styles:
const MAP_STYLE = 'mapbox://styles/mapbox/navigation-night-v1';

/* 🗺️ AVAILABLE STYLES - Copy/paste to test:
 * 
 * Dark Themes:
 * 'mapbox://styles/mapbox/dark-v11'                    // Dark (current) - Best for dark UI
 * 'mapbox://styles/mapbox/navigation-night-v1'          // Navigation Dark - Optimized for driving
 * 
 * Light Themes:
 * 'mapbox://styles/mapbox/light-v11'                   // Light - Clean minimal
 * 'mapbox://styles/mapbox/streets-v12'                 // Streets - Default Google Maps style
 * 'mapbox://styles/mapbox/navigation-day-v1'            // Navigation Light - Optimized for driving
 * 
 * Satellite:
 * 'mapbox://styles/mapbox/satellite-v9'                // Satellite - Real satellite imagery
 * 'mapbox://styles/mapbox/satellite-streets-v12'       // Satellite + Streets - Hybrid view
 * 
 * Outdoor/Terrain:
 * 'mapbox://styles/mapbox/outdoors-v12'                // Outdoors - Terrain + hiking trails
 * 
 * Modern/Standard:
 * 'mapbox://styles/mapbox/standard'                    // Standard - New Mapbox 3D style
 */

// 🌍 MAP PROJECTION CONFIGURATION
// 'globe' = 3D Earth sphere (zoom out to see the full globe!)
// 'mercator' = Traditional flat map
const MAP_PROJECTION: 'globe' | 'mercator' = 'globe';

// Zo House locations with precise coordinates
// ❌ REMOVED: All nodes now managed in database via partner_nodes table
// Previously hardcoded Zo Houses (SF, Koramangala, Whitefield) should be added to database
// const ZO_HOUSES = [...];

interface MapCanvasProps {
  events: ParsedEvent[];
  nodes?: PartnerNodeRecord[];
  onMapReady?: (map: mapboxgl.Map, closeAllPopups: () => void) => void;
  flyToEvent?: ParsedEvent | null;
  flyToNode?: PartnerNodeRecord | null;
  className?: string;
  shouldAnimateFromSpace?: boolean;
  userLocation?: { lat: number; lng: number } | null; // Saved user location from profile
  isMiniMap?: boolean; // Indicates this is a mini map view (adjusts zoom/pitch for better visibility)
  userId?: string; // User ID for saving location to profile
  onLocationSaved?: (lat: number, lng: number) => void; // Callback when location is saved
}

export default function MapCanvas({ events, nodes, onMapReady, flyToEvent, flyToNode, className, shouldAnimateFromSpace = false, userLocation, isMiniMap = false, userId, onLocationSaved }: MapCanvasProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [currentOpenPopup, setCurrentOpenPopup] = useState<mapboxgl.Popup | null>(null);
  const [markersMap, setMarkersMap] = useState<Map<string, mapboxgl.Marker>>(new Map());
  const [mapLoaded, setMapLoaded] = useState(false);
  const activePopups = useRef<Set<mapboxgl.Popup>>(new Set());
  const hasAnimatedFromSpace = useRef(false);
  const partnerNodeMarkers = useRef<mapboxgl.Marker[]>([]); // All nodes (including Zo Houses) managed here
  const userLocationMarker = useRef<mapboxgl.Marker | null>(null); // 🦄 User location unicorn marker
  const resizeHandlerRef = useRef<(() => void) | undefined>(undefined);
  const currentRouteSourceId = useRef<string>('user-to-destination-route');
  const currentRouteLayerId = useRef<string>('user-to-destination-route-layer');
  const currentRouteMarkers = useRef<mapboxgl.Marker[]>([]);
  const traversalMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const traversalFrameRef = useRef<number | null>(null);
  const progressSourceIdRef = useRef<string>('user-to-destination-route-progress');
  const progressLayerIdRef = useRef<string>('user-to-destination-route-progress-layer');

  // 📋 User RSVPs - track which events user has already RSVP'd to
  const [userRsvps, setUserRsvps] = useState<Map<string, string>>(new Map()); // eventId -> status

  // Fetch user RSVPs when userId changes
  useEffect(() => {
    if (!userId) {
      setUserRsvps(new Map());
      return;
    }

    const fetchUserRsvps = async () => {
      try {
        const res = await fetch('/api/events/mine', {
          headers: { 'x-user-id': userId }
        });
        if (res.ok) {
          const data = await res.json();
          const rsvpMap = new Map<string, string>();
          // Map RSVP events by event_id
          data.rsvps?.forEach((rsvp: { event_id: string; status: string }) => {
            rsvpMap.set(rsvp.event_id, rsvp.status);
            devLog.log('  📌 Event:', rsvp.event_id, '→ Status:', rsvp.status);
          });
          setUserRsvps(rsvpMap);
          devLog.log('📋 Loaded user RSVPs:', rsvpMap.size, 'events');
        }
      } catch (error) {
        devLog.error('Failed to fetch user RSVPs:', error);
      }
    };

    fetchUserRsvps();
  }, [userId]);

  // 🗺️ GeoJSON clustering hook - auto-fetches events and nodes
  const { loading: geoJSONLoading, featureCount } = useMapGeoJSON({
    map: map.current,
    sourceId: GEOJSON_SOURCE_ID,
    includeNodes: true,
    enabled: mapLoaded // Only fetch after map loads
  });

  // 🎯 Setup clustering layers AFTER GeoJSON source is loaded
  useEffect(() => {
    if (!map.current || !mapLoaded || geoJSONLoading) return;

    // Check if source exists and clustering layers don't
    const source = map.current.getSource(GEOJSON_SOURCE_ID);
    const clustersLayer = map.current.getLayer('clusters');

    if (source && !clustersLayer) {
      mapLog('🗺️ GeoJSON source ready - setting up clustering layers...');
      try {
        setupClusteringLayers(map.current);
        setupClusterClickHandlers(map.current);
        mapLog('✅ Clustering layers setup complete');
      } catch (error) {
        devLog.error('❌ Error setting up clustering layers:', error);
      }
    }
  }, [mapLoaded, geoJSONLoading]);

  // 💫 Inject CSS animations for markers
  useEffect(() => {
    const styleId = 'zo-marker-animations';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        /* Zo House marker pulse animation - uses box-shadow only to avoid overriding Mapbox transform */
        @keyframes zoPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(255, 77, 109, 0.8), 0 0 40px rgba(255, 77, 109, 0.4); }
          50% { box-shadow: 0 0 30px rgba(255, 77, 109, 1), 0 0 50px rgba(255, 77, 109, 0.6); }
        }
        /* Zo House marker pulse animation */
        .zo-house-marker-pulse {
          animation: zoPulse 2s ease-in-out infinite;
        }
        @keyframes eventBadgePulse {
          0%, 100% { 
            transform: scale(1); 
            box-shadow: 0 2px 8px rgba(255, 77, 109, 0.5);
          }
          50% { 
            transform: scale(1.15); 
            box-shadow: 0 3px 12px rgba(255, 77, 109, 0.8);
          }
        }
        /* Hide event badges when zoomed out */
        .map-zoomed-out .node-event-badge,
        .map-zoomed-out .node-event-count {
          opacity: 0 !important;
          transform: scale(0) !important;
          pointer-events: none !important;
        }
        /* Hide all custom markers when very zoomed out */
        .map-zoomed-out .mapboxgl-marker {
          opacity: 0 !important;
          visibility: hidden !important;
          pointer-events: none !important;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // Mobile detection function
  const isMobile = () => window.innerWidth <= 768;

  // Function to close all open popups
  const closeAllPopups = () => {
    mapLog('🔄 Closing all popups...');
    try {
      // Close all tracked popups
      activePopups.current.forEach(popup => {
        try {
          if (popup.isOpen()) {
            mapLog('Closing popup:', popup);
            popup.remove();
          }
        } catch (error) {
          devLog.warn('Error closing individual popup:', error);
        }
      });

      // Clear the set
      activePopups.current.clear();

      // Reset current popup state
      setCurrentOpenPopup(null);
      mapLog('✅ All popups closed');
    } catch (error) {
      devLog.warn('Error closing popups:', error);
    }
  };

  // Draw route from user's location to destination coordinates
  const drawRouteTo = async (destinationLng: number, destinationLat: number) => {
    if (!map.current) return;

    try {
      // Determine origin from stored user location or map center as fallback
      const originLat = (typeof window !== 'undefined' && (window as any).userLocationCoords?.lat) ?? map.current.getCenter().lat;
      const originLng = (typeof window !== 'undefined' && (window as any).userLocationCoords?.lng) ?? map.current.getCenter().lng;

      // Fetch route from Mapbox Directions API
      const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${originLng},${originLat};${destinationLng},${destinationLat}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`;
      const resp = await fetch(url);
      const data = await resp.json();
      const route = data?.routes?.[0]?.geometry;
      if (!route) {
        devLog.warn('No route received from Directions API');
        return;
      }

      const routeGeojson: GeoJSON.Feature<GeoJSON.LineString> = {
        type: 'Feature',
        properties: {},
        geometry: route
      };

      // Remove existing route layer/source if present
      try {
        if (map.current.getLayer(currentRouteLayerId.current)) {
          map.current.removeLayer(currentRouteLayerId.current);
        }
      } catch { }
      try {
        if (map.current.getSource(currentRouteSourceId.current)) {
          map.current.removeSource(currentRouteSourceId.current);
        }
      } catch { }

      // Clear existing origin/destination markers
      currentRouteMarkers.current.forEach(m => {
        try { m.remove(); } catch { }
      });
      currentRouteMarkers.current = [];

      // Add new source and layer for the route (with lineMetrics for rainbow gradient)
      map.current.addSource(currentRouteSourceId.current, {
        type: 'geojson',
        data: routeGeojson,
        lineMetrics: true
      });

      // Add faint route line (full path preview) - on top of buildings
      const layers = map.current.getStyle().layers;
      let firstSymbolId;
      for (const lyr of layers || []) {
        if (lyr.type === 'symbol') {
          firstSymbolId = lyr.id;
          break;
        }
      }

      map.current.addLayer({
        id: currentRouteLayerId.current,
        type: 'line',
        source: currentRouteSourceId.current,
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#FFFFFF',  // White path preview
          'line-width': 4,
          'line-opacity': 0.2,  // Very faint (rainbow trail will be bright)
          'line-blur': 1,
          'line-dasharray': [2, 2]  // Dashed line
        }
      }, firstSymbolId);

      // Hide origin and destination markers (unicorn will show the way!)
      // const originMarker = new mapboxgl.Marker({ color: '#3b82f6' })
      //   .setLngLat([originLng, originLat])
      //   .addTo(map.current);
      // const destinationMarker = new mapboxgl.Marker({ color: '#ef4444' })
      //   .setLngLat([destinationLng, destinationLat])
      //   .addTo(map.current);
      // currentRouteMarkers.current.push(originMarker, destinationMarker);

      // Fit bounds to the route, preserving current camera angle
      const bounds = new mapboxgl.LngLatBounds();
      route.coordinates.forEach((c: [number, number]) => bounds.extend(c));
      const currentPitch = map.current.getPitch();
      const currentBearing = map.current.getBearing();
      map.current.fitBounds(bounds, { padding: 60, duration: 800, pitch: currentPitch, bearing: currentBearing });

      // Start traversal animation after bounds fit
      startRouteTraversal(route.coordinates as [number, number][]);
    } catch (error) {
      devLog.warn('Error drawing route:', error);
    }
  };

  // Haversine distance in meters
  const haversineMeters = (lng1: number, lat1: number, lng2: number, lat2: number): number => {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const R = 6371000; // meters
    const φ1 = toRad(lat1);
    const φ2 = toRad(lat2);
    const Δφ = toRad(lat2 - lat1);
    const Δλ = toRad(lng2 - lng1);
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Animate a marker along the route and show progress line, following the camera
  const startRouteTraversal = (coordinates: [number, number][]) => {
    if (!map.current || !coordinates || coordinates.length < 2) return;

    // Cancel any existing traversal
    if (traversalFrameRef.current) {
      try { cancelAnimationFrame(traversalFrameRef.current); } catch { }
      traversalFrameRef.current = null;
    }
    if (traversalMarkerRef.current) {
      try { traversalMarkerRef.current.remove(); } catch { }
      traversalMarkerRef.current = null;
    }
    // Remove all rainbow layers (7 layers for rainbow gradient)
    for (let i = 0; i < 7; i++) {
      try {
        if (map.current.getLayer(`${progressLayerIdRef.current}-rainbow-${i}`)) {
          map.current.removeLayer(`${progressLayerIdRef.current}-rainbow-${i}`);
        }
      } catch { }
    }
    try {
      if (map.current.getSource(progressSourceIdRef.current)) map.current.removeSource(progressSourceIdRef.current);
    } catch { }

    // Add progress source/layer (rainbow trail that appears behind unicorn)
    const progressGeojson: GeoJSON.Feature<GeoJSON.LineString> = {
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: [coordinates[0]] }
    };
    map.current.addSource(progressSourceIdRef.current, {
      type: 'geojson',
      data: progressGeojson,
      lineMetrics: true
    });
    // Rainbow gradient trail - ROYGBIV colors stacked for gradient effect
    const rainbowLayers = [
      { color: '#FF0000', width: 28, opacity: 0.9, blur: 2 },  // Red (outer)
      { color: '#FF7F00', width: 24, opacity: 0.95, blur: 1.5 }, // Orange
      { color: '#FFFF00', width: 20, opacity: 1.0, blur: 1 },  // Yellow
      { color: '#00FF00', width: 16, opacity: 1.0, blur: 0.8 }, // Green
      { color: '#00BFFF', width: 12, opacity: 1.0, blur: 0.5 }, // Sky Blue
      { color: '#4B0082', width: 8, opacity: 0.95, blur: 0.3 }, // Indigo
      { color: '#9400D3', width: 4, opacity: 0.9, blur: 0 }    // Violet (inner)
    ];

    rainbowLayers.forEach((layer, i) => {
      // Add layer absolutely on top of everything - no beforeId means it goes on top
      const layerId = `${progressLayerIdRef.current}-rainbow-${i}`;
      map.current!.addLayer({
        id: layerId,
        type: 'line',
        source: progressSourceIdRef.current,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': layer.color,
          'line-width': layer.width,
          'line-opacity': layer.opacity,
          'line-blur': layer.blur
        }
      }); // No beforeId - this puts it on top of EVERYTHING

      // Add pulsing animation to the outer layers
      if (i === 0 || i === 1) {
        let pulseDirection = 1;
        let currentWidth = layer.width;
        setInterval(() => {
          try {
            currentWidth += pulseDirection * 1;
            if (currentWidth >= layer.width + 5 || currentWidth <= layer.width - 5) {
              pulseDirection *= -1;
            }
            map.current?.setPaintProperty(layerId, 'line-width', currentWidth);
          } catch {
            // Layer might be removed
          }
        }, 50); // Pulse every 50ms
      }
    });

    // Create unicorn emoji marker 🦄 with glow and high z-index to stay on top
    const unicornEl = document.createElement('div');
    unicornEl.textContent = '🦄';
    unicornEl.style.fontSize = '50px';
    unicornEl.style.lineHeight = '1';
    unicornEl.style.filter = 'drop-shadow(0 0 8px rgba(255,255,255,0.9)) drop-shadow(0 0 15px rgba(255,200,0,0.6))';

    const unicornMarker = new mapboxgl.Marker({
      element: unicornEl,
      anchor: 'center',
      offset: [0, 0]
    })
      .setLngLat(coordinates[0])
      .addTo(map.current);

    // Force the marker container to be on top with high z-index
    const markerElement = unicornMarker.getElement();
    if (markerElement) {
      markerElement.style.zIndex = '9999';
    }

    traversalMarkerRef.current = unicornMarker;

    mapLog('🦄 Unicorn marker created at:', coordinates[0]);

    // Precompute cumulative distances
    const cum: number[] = [0];
    for (let i = 1; i < coordinates.length; i++) {
      const [lng1, lat1] = coordinates[i - 1];
      const [lng2, lat2] = coordinates[i];
      const d = haversineMeters(lng1, lat1, lng2, lat2);
      cum.push(cum[i - 1] + d);
    }
    const total = cum[cum.length - 1] || 1;
    const durationMs = Math.min(20000, Math.max(6000, total / 0.8)); // ~0.8 m/ms -> ~1.25 m/s, clamped 6s..20s
    const start = performance.now();

    const step = () => {
      if (!map.current) return;
      const now = performance.now();
      const t = Math.min(1, (now - start) / durationMs);
      const targetDist = t * total;

      // Find segment index
      let idx = 1;
      while (idx < cum.length && cum[idx] < targetDist) idx++;
      const i = Math.min(idx, coordinates.length - 1);
      const prev = i - 1;
      const segLen = Math.max(1e-6, cum[i] - cum[prev]);
      const segT = Math.min(1, Math.max(0, (targetDist - cum[prev]) / segLen));
      const [lng1, lat1] = coordinates[prev];
      const [lng2, lat2] = coordinates[i];
      const lng = lng1 + (lng2 - lng1) * segT;
      const lat = lat1 + (lat2 - lat1) * segT;

      // Update marker and progress line
      try { traversalMarkerRef.current?.setLngLat([lng, lat]); } catch { }
      try {
        const progressed = coordinates.slice(0, i);
        progressed.push([lng, lat]);
        (map.current.getSource(progressSourceIdRef.current) as mapboxgl.GeoJSONSource)?.setData({
          type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: progressed }
        } as any);
      } catch { }

      // Keep camera centered without changing angle
      try { map.current.setCenter([lng, lat]); } catch { }

      if (t < 1) {
        traversalFrameRef.current = requestAnimationFrame(step);
      } else {
        // Animation complete - make unicorn disappear! ✨
        traversalFrameRef.current = null;
        if (traversalMarkerRef.current) {
          try {
            traversalMarkerRef.current.remove();
            traversalMarkerRef.current = null;
          } catch (e) {
            devLog.warn('Error removing unicorn marker:', e);
          }
        }
      }
    };

    traversalFrameRef.current = requestAnimationFrame(step);
  };

  // Helper function to safely remove a source and all its layers
  const removeMapsourceWithLayers = (sourceId: string) => {
    if (!map.current) return;
    try {
      const source = map.current.getSource(sourceId);
      if (!source) return;

      // Get all layers that use this source
      const style = map.current.getStyle();
      if (style && style.layers) {
        const layersUsingSource = style.layers.filter((layer: any) => layer.source === sourceId);

        // Remove all layers using this source
        layersUsingSource.forEach((layer: any) => {
          try {
            if (map.current!.getLayer(layer.id)) {
              map.current!.removeLayer(layer.id);
            }
          } catch (e) {
            devLog.warn(`Could not remove layer ${layer.id}:`, e);
          }
        });
      }

      // Now remove the source
      try {
        if (map.current.getSource(sourceId)) {
          map.current.removeSource(sourceId);
        }
      } catch (e) {
        devLog.warn(`Could not remove source ${sourceId}:`, e);
      }
    } catch (e) {
      devLog.warn(`Error in removeMapsourceWithLayers for ${sourceId}:`, e);
    }
  };

  // Clear any drawn route and its markers
  const clearRoute = () => {
    if (!map.current) return;
    try {
      // Remove route markers
      currentRouteMarkers.current.forEach(m => {
        try { m.remove(); } catch { }
      });
      currentRouteMarkers.current = [];

      // Cancel traversal and remove marker
      if (traversalFrameRef.current) {
        try { cancelAnimationFrame(traversalFrameRef.current); } catch { }
        traversalFrameRef.current = null;
      }
      if (traversalMarkerRef.current) {
        try { traversalMarkerRef.current.remove(); } catch { }
        traversalMarkerRef.current = null;
      }

      // Remove route source and all its layers
      removeMapsourceWithLayers(currentRouteSourceId.current);

      // Remove progress source and all its layers (including rainbow layers)
      removeMapsourceWithLayers(progressSourceIdRef.current);
    } catch (e) {
      devLog.warn('Error clearing route:', e);
    }
  };

  const clearAllPopupsAndRoute = () => {
    try {
      closeAllPopups();
    } catch { }
    try {
      clearRoute();
    } catch { }
  };

  // Add Zo House markers with custom animated icon
  // ❌ REMOVED: addZoHouseMarkers() - All nodes now managed via addPartnerNodeMarkers()
  // Zo Houses should be added to partner_nodes table in database

  // 🦄 Add partner node markers (Unicorn: all use Zo logo)
  const addPartnerNodeMarkers = async () => {
    if (!map.current) return;

    // Clear any existing partner node markers
    partnerNodeMarkers.current.forEach(marker => {
      try {
        marker.remove();
      } catch (error) {
        devLog.warn('Error removing existing partner node marker:', error);
      }
    });
    partnerNodeMarkers.current = [];

    // Use passed nodes prop, or fetch from database if not provided
    let nodesToDisplay = nodes;
    if (!nodesToDisplay) {
      mapLog('🦄 Loading partner nodes from database...');
      try {
        const { getNodesFromDB } = await import('@/lib/supabase');
        const fetchedNodes = await getNodesFromDB();
        nodesToDisplay = fetchedNodes || undefined; // Convert null to undefined
      } catch (error) {
        devLog.error('Error loading nodes:', error);
        return;
      }
    }

    if (!nodesToDisplay || nodesToDisplay.length === 0) {
      mapLog('🦄 No partner nodes to display');
      return;
    }

    mapLog(`🦄 Adding ${nodesToDisplay.length} partner node markers...`);

    nodesToDisplay.forEach((node) => {
      // Parse coordinates as numbers (same as event markers)
      const nodeLat = typeof node.latitude === 'number' ? node.latitude : parseFloat(String(node.latitude));
      const nodeLng = typeof node.longitude === 'number' ? node.longitude : parseFloat(String(node.longitude));
      
      if (!nodeLat || !nodeLng || isNaN(nodeLat) || isNaN(nodeLng)) {
        devLog.warn(`⚠️ Skipping ${node.name} - missing or invalid coordinates: lat=${node.latitude}, lng=${node.longitude}`);
        return;
      }

      try {
        // 🎯 Create marker element based on node type
        const nodeIcon = getNodeIcon(node.type as NodeType);
        const nodeColor = getNodeTypeColor(node.type as NodeType);
        
        // Simple flat marker element - EXACT same pattern as working event markers
        let markerElement: HTMLDivElement;

        if (nodeIcon.type === 'logo' && node.type === 'zo_house') {
          // Zo House marker - animated with glow
          markerElement = document.createElement('div');
          markerElement.style.width = '70px';
          markerElement.style.height = '70px';
          markerElement.style.borderRadius = '50%';
          markerElement.style.cursor = 'pointer';
          markerElement.style.display = 'flex';
          markerElement.style.alignItems = 'center';
          markerElement.style.justifyContent = 'center';
          markerElement.style.overflow = 'hidden';
          markerElement.style.background = '#000';
          markerElement.style.boxShadow = '0 0 20px rgba(255, 77, 109, 0.8), 0 0 40px rgba(255, 77, 109, 0.4)';
          markerElement.style.border = '3px solid #ff4d6d';
          markerElement.className = 'zo-house-marker-pulse zo-node-marker';
          markerElement.title = node.name;
          
          const img = document.createElement('img');
          img.src = '/zo.gif';
          img.alt = node.name;
          img.style.width = '60px';
          img.style.height = '60px';
          img.style.objectFit = 'contain';
          markerElement.appendChild(img);
        } else if (nodeIcon.type === 'logo') {
          // For zostel and other logo nodes
          markerElement = document.createElement('div');
          markerElement.style.width = '56px';
          markerElement.style.height = '56px';
          markerElement.style.borderRadius = '50%';
          markerElement.style.cursor = 'pointer';
          markerElement.style.display = 'flex';
          markerElement.style.alignItems = 'center';
          markerElement.style.justifyContent = 'center';
          markerElement.style.overflow = 'hidden';
          markerElement.style.background = 'white';
          markerElement.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
          markerElement.style.border = '2px solid rgba(255, 255, 255, 0.9)';
          markerElement.className = 'zo-node-marker';
          markerElement.title = node.name;
          
          const img = document.createElement('img');
          img.src = nodeIcon.value;
          img.alt = node.name;
          img.style.width = '100%';
          img.style.height = '100%';
          img.style.objectFit = 'contain';
          markerElement.appendChild(img);
        } else {
          // Use emoji for all other node types
          markerElement = document.createElement('div');
          markerElement.style.width = '44px';
          markerElement.style.height = '44px';
          markerElement.style.borderRadius = '50%';
          markerElement.style.cursor = 'pointer';
          markerElement.style.display = 'flex';
          markerElement.style.alignItems = 'center';
          markerElement.style.justifyContent = 'center';
          markerElement.style.overflow = 'hidden';
          markerElement.style.backgroundColor = nodeColor;
          markerElement.style.boxShadow = `0 4px 12px ${nodeColor}66, 0 2px 4px rgba(0, 0, 0, 0.3)`;
          markerElement.style.border = '2px solid rgba(255, 255, 255, 0.9)';
          markerElement.style.fontSize = '22px';
          markerElement.className = 'zo-node-marker';
          markerElement.title = node.name;
          markerElement.textContent = nodeIcon.value;
        }

        // Create node marker using parsed coordinates
        const nodeMarker = new mapboxgl.Marker({
          element: markerElement,
          anchor: 'center',
          offset: [0, 0]
        })
          .setLngLat([nodeLng, nodeLat])
          .addTo(map.current!);
        
        devLog.log(`📍 Node marker for ${node.name} at [${nodeLng}, ${nodeLat}]`);

        mapLog(`🦄 Added marker for ${node.name}`);

        // Store marker reference
        partnerNodeMarkers.current.push(nodeMarker);

        // Create popup for the node
        const popupContent = `
          <div style="padding: 0;">
            <h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 900; color: #000; font-family: 'Space Grotesk', sans-serif;">${node.name}</h3>
            <p style="margin: 0 0 16px 0; font-size: 13px; color: #1a1a1a; line-height: 1.5;">📍 ${node.city}, ${node.country}</p>
            <div style="display: flex; gap: 8px;">
              ${node.website ? `<a href="${node.website}" target="_blank" class="glow-popup-button secondary" style="flex: 1;">Visit</a>` : ''}
              <button onclick="window.showRouteTo(${nodeLng}, ${nodeLat})" class="glow-popup-button" style="flex: 1;">Directions</button>
            </div>
          </div>
        `;

        const popup = new mapboxgl.Popup({
          className: 'node-popup-clean',
          closeButton: false,
          closeOnClick: true,
          offset: [0, -15],
          maxWidth: '280px',
          anchor: 'bottom'
        })
          .setHTML(popupContent);

        // Attach popup to marker
        nodeMarker.setPopup(popup);

        // Handle marker click to track popup state
        markerElement.addEventListener('click', () => {
          if (currentOpenPopup && currentOpenPopup !== popup) {
            try {
              currentOpenPopup.remove();
              activePopups.current.delete(currentOpenPopup);
            } catch (error) {
              devLog.warn('Error closing previous popup:', error);
            }
          }
          setCurrentOpenPopup(popup);
          activePopups.current.add(popup);

          popup.once('close', () => {
            if (currentOpenPopup === popup) {
              setCurrentOpenPopup(null);
            }
            activePopups.current.delete(popup);
          });
        });

      } catch (error) {
        devLog.error(`❌ Error creating marker for ${node.name}:`, error);
      }
    });

    mapLog(`✅ Added ${partnerNodeMarkers.current.length} partner node markers to map`);

    /* Legacy example code removed
      try {
        const nodePopup = new mapboxgl.Popup({
          closeButton: true,
          closeOnClick: false,
          className: 'glass-popup partner-node-popup'
        });

        // Get type-specific color (using centralized function)
        const nodeColor = getNodeTypeColor(node.type);

        // Create custom marker element
        const markerElement = document.createElement('div');
        markerElement.className = 'partner-node-marker';
        markerElement.innerHTML = '';

        // Add hover effects
        markerElement.addEventListener('mouseenter', () => {
          markerElement.style.transform = 'scale(1.1)';
        });
        markerElement.addEventListener('mouseleave', () => {
          markerElement.style.transform = 'scale(1)';
        });

        // Create marker
        const nodeMarker = new mapboxgl.Marker({
          element: markerElement,
          anchor: 'center'
        })
        .setLngLat([node.location.longitude, node.location.latitude])
        .addTo(map.current);

        partnerNodeMarkers.current.push(nodeMarker);

        // Format member count
        const formatMemberCount = (count?: number): string => {
          if (!count) return '';
          if (count < 1000) return `${count} members`;
          return `${(count / 1000).toFixed(1)}k members`;
        };

        // Create popup content
        const popupContent = '';

        nodePopup.setHTML(popupContent);

        // Handle marker click
        markerElement.addEventListener('click', () => {
          if (currentOpenPopup && currentOpenPopup !== nodePopup) {
            try {
              currentOpenPopup.remove();
              activePopups.current.delete(currentOpenPopup);
            } catch (error) {
              devLog.warn('Error removing popup:', error);
            }
          }
          setCurrentOpenPopup(nodePopup);
          activePopups.current.add(nodePopup);
          
          nodePopup.addTo(map.current);
          
          nodePopup.on('close', () => {
            if (currentOpenPopup === nodePopup) {
              setCurrentOpenPopup(null);
            }
            activePopups.current.delete(nodePopup);
          });
        });

        mapLog('✅ Partner node marker (legacy)');
      } catch (error) {
        devLog.warn('Error creating partner node marker:', error);
      }
    */
  };

  // Initialize map with proper error handling
  const initializeMap = () => {
    if (!mapContainer.current || map.current) return;

    // 🔧 FIX: Ensure container has dimensions before initializing map
    const containerWidth = mapContainer.current.offsetWidth;
    const containerHeight = mapContainer.current.offsetHeight;

    if (containerWidth === 0 || containerHeight === 0) {
      devLog.warn('⚠️ Map container has no dimensions yet, waiting...');
      // Retry after a short delay
      setTimeout(initializeMap, 100);
      return;
    }

    try {
      mapboxgl.accessToken = MAPBOX_TOKEN;

      // 🎯 SIMPLE LOGIC:
      // - shouldAnimateFromSpace = true → Start at zoom 0 (will animate)
      // - Has location + NO animation → Start at zoom 17 (returning user)
      // - No location → Start at zoom 0 (space view, no specific location)

      const hasUserLocation = userLocation?.lat && userLocation?.lng;

      let initialZoom: number;
      let initialPitch: number;
      let initialBearing: number;
      let initialCenter: [number, number];

      if (shouldAnimateFromSpace) {
        // Animation requested: Start from space at user location
        initialZoom = 0;
        initialPitch = 0;
        initialBearing = 0;
        initialCenter = hasUserLocation ? [userLocation.lng, userLocation.lat] : [0, 0];
        mapLog('🚀 Starting from space (will animate to:', initialCenter, ')');
      } else if (hasUserLocation) {
        // Returning user with location: Start at street level
        // Mini maps use slightly zoomed out view for better context and visibility
        if (isMiniMap) {
          initialZoom = isMobile() ? 15.5 : 15;
          initialPitch = 45; // Less tilted for mini map
          initialBearing = -20;
        } else {
          initialZoom = isMobile() ? 17.5 : 17;
          initialPitch = isMobile() ? 65 : 65;
          initialBearing = -30;
        }
        initialCenter = [userLocation.lng, userLocation.lat];
        mapLog('🏠 Returning user: Starting at street level:', initialCenter, isMiniMap ? '(mini map)' : '');
      } else {
        // No location: Show space view at neutral position (zoom 0)
        initialZoom = 0;
        initialPitch = 0;
        initialBearing = 0;
        initialCenter = [0, 0]; // Neutral center, zoom 0 shows whole world
        mapLog('🌌 No location: Starting at space view (0, 0)');
      }

      mapLog('🗺️ Map initializing:', {
        center: initialCenter,
        zoom: initialZoom,
        pitch: initialPitch,
        hasUserLocation,
        shouldAnimateFromSpace,
        containerDimensions: { width: containerWidth, height: containerHeight }
      });

      mapLog('🔑 Mapbox token:', MAPBOX_TOKEN ? `${MAPBOX_TOKEN.substring(0, 20)}...` : 'MISSING!');

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        center: initialCenter,
        zoom: initialZoom,
        pitch: initialPitch,
        bearing: initialBearing,
        style: MAP_STYLE, // 🎨 Uses MAP_STYLE constant from top of file
        projection: MAP_PROJECTION, // 🌍 'globe' or 'mercator' - set at top of file
        preserveDrawingBuffer: true // Helps prevent rendering issues
      });

      mapLog('✅ Map object created:', !!map.current);
      mapLog('🎨 Map container dimensions:', {
        width: mapContainer.current.offsetWidth,
        height: mapContainer.current.offsetHeight,
        display: window.getComputedStyle(mapContainer.current).display
      });

      // Add comprehensive error handlers
      map.current.on('error', (e) => {
        devLog.error('❌ Mapbox error:', e.error);
        devLog.error('❌ Error details:', e);
      });

      map.current.on('styledata', () => {
        mapLog('🎨 Map style loaded successfully');
      });

      map.current.on('style.load', () => {
        mapLog('🎨 Map style load event fired');

        // 🔧 FIX: Remove 'mapbox-incidents' source causing 404s
        // Defer removal to next tick to avoid "reading 'get' of undefined" errors during style load
        setTimeout(() => {
          try {
            if (!map.current) return;
            const style = map.current.getStyle();
            if (style && style.sources) {
              Object.keys(style.sources).forEach(sourceId => {
                const source = style.sources[sourceId];
                // Check if source url or tiles contain mapbox-incidents
                if ((source as any).url?.includes('mapbox-incidents') ||
                  (source as any).tiles?.[0]?.includes('mapbox-incidents')) {

                  // Find and remove all layers using this source
                  style.layers?.forEach(layer => {
                    if (layer.source === sourceId) {
                      if (map.current?.getLayer(layer.id)) {
                        map.current.removeLayer(layer.id);
                        mapLog(`🔧 Removed incidents layer: ${layer.id}`);
                      }
                    }
                  });

                  // Remove the source
                  if (map.current?.getSource(sourceId)) {
                    map.current.removeSource(sourceId);
                    mapLog(`🔧 Removed incidents source: ${sourceId}`);
                  }
                }
              });
            }
          } catch (e) {
            devLog.warn('Error removing incidents source:', e);
          }
        }, 100);
      });

      // 🖼️ Handle missing images (like "in-state-4") by providing a transparent placeholder
      map.current.on('styleimagemissing', (e) => {
        const id = e.id;
        if (!map.current) return;

        // Check if we already handled this image to avoid infinite loops
        if (map.current.hasImage(id)) return;

        mapLog(`🖼️ Handling missing image: ${id}`);

        // Create a 1x1 transparent pixel
        const width = 1;
        const height = 1;
        const data = new Uint8Array(width * height * 4); // Transparent by default (all zeros)

        try {
          map.current.addImage(id, { width, height, data });
        } catch (err) {
          devLog.warn(`Failed to add placeholder for ${id}:`, err);
        }
      });

      map.current.on('sourcedataloading', (e) => {
        mapLog('📦 Source data loading:', e.sourceId);
      });

      map.current.on('sourcedata', (e) => {
        if (e.isSourceLoaded) {
          mapLog('📦 Source data loaded:', e.sourceId);
        }
      });

      map.current.on('dataloading', (e) => {
        mapLog('🔄 Map data loading...');
      });

      // Ensure the map resizes correctly when container size changes
      const handleResize = () => {
        try {
          map.current?.resize();
        } catch (error) {
          devLog.warn('Map resize error:', error);
        }
      };
      resizeHandlerRef.current = handleResize;
      window.addEventListener('resize', handleResize);

      // Wait for map to load before setting up features
      mapLog('📡 Attaching map load event listener...');
      const isAlreadyLoaded = map.current.loaded();
      mapLog('📡 Map state before load:', { loaded: isAlreadyLoaded, isMoving: map.current.isMoving() });

      // Function to set up map features (called when map is loaded)
      const setupMapFeatures = () => {
        mapLog('🎉 Setting up map features...');
        if (!map.current) return;

        setMapLoaded(true);
        mapLog('✅ setMapLoaded(true) called');

        // Force a resize after load to render tiles if container was hidden/absolute
        try {
          map.current.resize();
          setTimeout(() => map.current && map.current.resize(), 50);
          setTimeout(() => map.current && map.current.resize(), 250);
        } catch (error) {
          devLog.warn('Post-load resize error:', error);
        }

        // Add zoom listener to show/hide markers based on zoom level
        const MARKER_MIN_ZOOM = 10; // Markers only visible at zoom 10+
        const container = mapContainer.current;
        
        // Set initial state to zoomed-out (hidden) - markers will fade in as we zoom
        if (container) {
          container.classList.add('map-zoomed-out');
        }
        
        const updateMarkerVisibility = () => {
          if (!map.current || !container) return;
          const zoom = map.current.getZoom();
          if (zoom < MARKER_MIN_ZOOM) {
            container.classList.add('map-zoomed-out');
          } else {
            container.classList.remove('map-zoomed-out');
          }
        };
        
        // Listen for zoom changes
        map.current.on('zoom', updateMarkerVisibility);
        map.current.on('zoomend', updateMarkerVisibility);

        // Set up lighting - use DAY mode so colors stay bright!
        try {
          map.current.setConfigProperty('basemap', 'lightPreset', 'day');  // Changed from 'night' to 'day'
          map.current.setConfigProperty('basemap', 'showPointOfInterestLabels', false);
          map.current.setConfigProperty('basemap', 'showPlaceLabels', false);
          map.current.setConfigProperty('basemap', 'showRoadLabels', false);
          map.current.setConfigProperty('basemap', 'showTransitLabels', false);
        } catch (error) {
          devLog.warn('Could not set map configuration:', error);
        }

        // Add 3D buildings layer
        try {
          // Check if layer already exists (React Strict Mode calls this twice)
          if (!map.current.getLayer('3d-buildings')) {
            // Check if composite source exists before adding 3D buildings
            const style = map.current.getStyle();
            if (style.sources && style.sources.composite) {
              map.current.addLayer({
                id: '3d-buildings',
                source: 'composite',
                'source-layer': 'building',
                filter: ['==', 'extrude', 'true'],
                type: 'fill-extrusion',
                minzoom: 15,
                paint: {
                  'fill-extrusion-color': '#aaa',
                  'fill-extrusion-height': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    15,
                    0,
                    15.05,
                    ['get', 'height']
                  ],
                  'fill-extrusion-base': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    15,
                    0,
                    15.05,
                    ['get', 'min_height']
                  ],
                  'fill-extrusion-opacity': 0.6
                }
              });
              mapLog('✅ 3D buildings layer added');
            } else {
              mapLog('🏢 3D buildings not available with current map style');
            }
          } else {
            mapLog('ℹ️ 3D buildings layer already exists, skipping');
          }
        } catch (error) {
          devLog.warn('Could not add 3D buildings:', error);
        }

        // Notify parent that map is ready
        if (onMapReady) {
          onMapReady(map.current, closeAllPopups);
        }

        // Get user location - use provided location or request current
        if (userLocation?.lat && userLocation?.lng) {
          mapLog('📍 Using provided user location:', userLocation);
          mapLog('🎬 Should animate from space?', shouldAnimateFromSpace);

          // Create marker at provided location and trigger animation if needed
          createUserLocationMarker(userLocation.lat, userLocation.lng);
          
          // Don't fetch again - location was already saved by Enter Map button
        } else {
          // No location provided - request current GPS location
          mapLog('📍 No location provided, requesting current GPS location...');
          getUserLocation();
        }

        // Note: All node markers (including Zo Houses) are added via useEffect when nodes prop is available
        // No hardcoded markers - everything managed from database

        // Expose directions helper on window for popup buttons
        try {
          if (typeof window !== 'undefined') {
            (window as any).showRouteTo = (lng: number, lat: number) => {
              closeAllPopups();
              drawRouteTo(lng, lat);
            };
            (window as any).clearRoute = () => {
              clearAllPopupsAndRoute();
            };
            // RSVP function for event popups
            (window as any).rsvpToEvent = async (eventId: string, eventName: string) => {
              if (!userId) {
                const shouldLogin = confirm(
                  'Please sign in to RSVP for events.\n\n' +
                  'Click OK to go to Zo Passport and sign in, or Cancel to stay here.'
                );
                if (shouldLogin) {
                  window.location.href = '/zopassport';
                }
                return;
              }
              
              const btn = document.getElementById(`rsvp-btn-${eventId}`);
              if (btn) {
                btn.innerHTML = 'Registering...';
                btn.setAttribute('disabled', 'true');
              }
              
              try {
                devLog.log('🎫 RSVP request starting...');
                devLog.log('   Event ID:', eventId);
                devLog.log('   Event Name:', eventName);
                devLog.log('   User ID:', userId);

                if (!eventId) {
                  throw new Error('No event ID found');
                }

                const res = await fetch(`/api/events/${eventId}/rsvp`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': userId,
                  },
                  body: JSON.stringify({ status: 'going' }),
                });

                devLog.log('🎫 RSVP response received');
                devLog.log('   Status:', res.status);
                devLog.log('   Status Text:', res.statusText);

                const responseText = await res.text();
                devLog.log('   Response Text:', responseText);

                let data;
                try {
                  data = JSON.parse(responseText);
                  devLog.log('   Parsed Data:', data);
                } catch (parseError) {
                  devLog.error('   Failed to parse JSON:', parseError);
                  throw new Error('Invalid JSON response from server');
                }

                if (res.ok) {
                  // Update button to show registered status
                  if (btn) {
                    const statusText = data.rsvp?.status === 'going' ? '✓ Going'
                      : data.rsvp?.status === 'interested' ? '✓ Registered'
                      : data.rsvp?.status === 'waitlist' ? '⏳ Waitlisted'
                      : '✓ Registered';
                    const statusColor = data.rsvp?.status === 'going' ? '#22c55e'
                      : data.rsvp?.status === 'waitlist' ? '#f59e0b'
                      : '#3b82f6';
                    btn.innerHTML = statusText;
                    btn.style.background = `${statusColor}20`;
                    btn.style.color = statusColor;
                    btn.style.border = 'none';
                    btn.style.cursor = 'default';
                  }
                  // Update local RSVPs state via callback
                  if ((window as any).updateUserRsvp) {
                    (window as any).updateUserRsvp(eventId, data.rsvp?.status || 'interested');
                  }
                  devLog.log('✅ RSVP successful for:', eventName, 'status:', data.rsvp?.status);

                  // Show success message to user
                  if (data.message) {
                    alert(data.message);
                  }
                } else {
                  throw new Error(data.error || 'Failed to RSVP');
                }
              } catch (error) {
                devLog.error('❌ RSVP error:', error);
                if (btn) {
                  btn.innerHTML = 'Register';
                  btn.removeAttribute('disabled');
                }
                alert(error instanceof Error ? error.message : 'Failed to register. Please try again.');
              }
            };
            
            // Function to update user RSVP state (called after successful RSVP)
            (window as any).updateUserRsvp = (eventId: string, status: string) => {
              setUserRsvps(prev => {
                const newMap = new Map(prev);
                newMap.set(eventId, status);
                return newMap;
              });
            };
          }
        } catch { }

        // 🗺️ GeoJSON clustering is now handled by dedicated useEffect
        // that waits for the GeoJSON source to be loaded first
      };

      // If map is already loaded, set up features immediately
      // Otherwise, wait for load or idle event
      if (isAlreadyLoaded) {
        mapLog('⚡ Map already loaded - setting up features immediately');
        setupMapFeatures();
      } else {
        mapLog('⏳ Waiting for map load event...');

        let hasSetup = false;

        const doSetup = (source: string) => {
          if (hasSetup) return;
          hasSetup = true;
          mapLog(`🎉 MAP LOADED (via ${source})!`);
          setupMapFeatures();
        };

        // Listen for load event (primary)
        map.current.on('load', () => doSetup('load'));

        // Listen for idle event (backup - fires when map is fully loaded and idle)
        map.current.on('idle', () => doSetup('idle'));

        // Fallback: Force setup after 3 seconds if style is loaded
        setTimeout(() => {
          if (!hasSetup && map.current && map.current.isStyleLoaded()) {
            devLog.warn('⚠️ Load event timeout - forcing setup (style is loaded)');
            doSetup('timeout');
          }
        }, 3000);
      }

    } catch (error) {
      devLog.error('Error initializing map:', error);
    }
  };

  // Create user location marker (reusable for both saved location and geolocation)
  const createUserLocationMarker = (lat: number, lng: number) => {
    if (!map.current) return;

    const coords: [number, number] = [lng, lat];

    // Store coordinates in window for wallet sync
    if (typeof window !== 'undefined') {
      window.userLocationCoords = { lat, lng };
      mapLog('📍 User location set:', window.userLocationCoords);
    }

    try {
      // 🚀 Animate from space to user location if requested
      mapLog('🎬 Animation check:', {
        shouldAnimateFromSpace,
        hasAnimatedFromSpace: hasAnimatedFromSpace.current
      });

      if (shouldAnimateFromSpace && !hasAnimatedFromSpace.current) {
        mapLog('🚀🚀🚀 STARTING SPACE-TO-LOCATION ANIMATION 🚀🚀🚀');
        mapLog('📍 Target:', coords);
        mapLog('🎯 Duration: 8 seconds');
        hasAnimatedFromSpace.current = true;

        // Wait for map to be fully ready before animating
        const startAnimation = () => {
          if (!map.current) {
            devLog.error('❌ Map not available for animation!');
            return;
          }

          // Verify map is loaded and has valid dimensions
          const mapLoaded = map.current.loaded();
          const container = map.current.getContainer();
          const hasValidDimensions = container && container.offsetWidth > 0 && container.offsetHeight > 0;

          mapLog('🔍 Animation readiness:', { mapLoaded, hasValidDimensions });

          if (!mapLoaded || !hasValidDimensions) {
            devLog.warn('⏳ Map not ready, retrying in 200ms...');
            setTimeout(startAnimation, 200);
            return;
          }

          mapLog('✈️ Executing flyTo animation...');
          // Mini maps use slightly zoomed out view for better visibility
          const targetZoom = isMiniMap ? (isMobile() ? 15.5 : 15) : (isMobile() ? 17.5 : 17);
          const targetPitch = isMiniMap ? 45 : (isMobile() ? 65 : 65);
          const targetBearing = isMiniMap ? -20 : -30;

          map.current.flyTo({
            center: coords,
            zoom: targetZoom,
            pitch: targetPitch,
            bearing: targetBearing,
            duration: 8000, // 8 seconds
            essential: true,
            easing: (t) => {
              // Custom easing for space entry effect
              return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
            }
          });
          mapLog('🎬 Animation started successfully!');
        };

        // Start the animation
        startAnimation();
      } else {
        mapLog('⏭️ Skipping animation:', {
          shouldAnimateFromSpace,
          hasAnimatedFromSpace: hasAnimatedFromSpace.current,
          reason: !shouldAnimateFromSpace ? 'Flag not set' : 'Already animated'
        });
        // Normal update without animation - do nothing if animating
        if (!shouldAnimateFromSpace) {
          map.current.setCenter(coords);
        }
      }

      // 🦄 Remove old user location marker if it exists
      if (userLocationMarker.current) {
        userLocationMarker.current.remove();
      }

      // 🦄 UNICORN: Create custom user location marker with unicorn GIF
      const userMarkerElement = document.createElement('img');
      userMarkerElement.src = '/Green+Day+Unicorn.gif';
      userMarkerElement.style.width = '60px';
      userMarkerElement.style.height = '60px';
      userMarkerElement.style.borderRadius = '50%';
      userMarkerElement.style.cursor = 'pointer';
      userMarkerElement.style.boxShadow = '0 4px 16px rgba(255, 105, 180, 0.5)'; // Pink glow
      userMarkerElement.style.border = '3px solid #ff69b4'; // Pink border
      userMarkerElement.title = 'Your Location 🦄';

      const userMarker = new mapboxgl.Marker({
        element: userMarkerElement,
        anchor: 'center',
        offset: [0, 0]
      })
        .setLngLat(coords)
        .addTo(map.current!);

      // Set high z-index to ensure user marker is always on top
      const userMarkerEl = userMarker.getElement();
      if (userMarkerEl) {
        userMarkerEl.style.zIndex = '10000'; // Higher than all other markers
      }

      // Store marker reference
      userLocationMarker.current = userMarker;

      mapLog('🦄 Added unicorn marker for user location');

      // Note: User location marker popup removed - no popup on click
    } catch (error) {
      devLog.warn('Error setting user location:', error);
    }
  };

  // Get user location with proper error handling (prompt for permission)
  const getUserLocation = async () => {
    if (!navigator.geolocation || !map.current) return;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        devLog.log('📍 Got user location:', { lat, lng });
        
        // Fly to user's current location with animation
        map.current?.flyTo({
          center: [lng, lat],
          zoom: 16,
          pitch: 60,
          bearing: -20,
          duration: 3000,
          essential: true,
          easing: (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
        });
        
        // Create the user marker
        createUserLocationMarker(lat, lng);

        // Save to database if userId is provided
        if (userId) {
          try {
            devLog.log('💾 Saving location to database for user:', userId);
            const response = await fetch(`/api/users/${userId}/location`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ lat, lng })
            });

            if (response.ok) {
              devLog.log('✅ Location saved to database');
              // Call callback if provided
              if (onLocationSaved) {
                onLocationSaved(lat, lng);
              }
            } else {
              devLog.error('❌ Failed to save location:', await response.text());
            }
          } catch (error) {
            devLog.error('❌ Error saving location:', error);
          }
        }
      },
      (error) => {
        devLog.warn('⚠️ Geolocation permission denied or unavailable:', error.message);
        mapLog('💡 To enable location: Click the location icon in your browser address bar');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  // Initialize map on component mount
  useEffect(() => {
    mapLog('🎬 MapCanvas component mounting/updating with props:', {
      shouldAnimateFromSpace,
      hasUserLocation: !!(userLocation?.lat && userLocation?.lng),
      userLocation
    });

    initializeMap();

    return () => {
      if (map.current) {
        // 🗺️ Clean up GeoJSON clustering layers
        try {
          removeClusteringLayers(map.current);
        } catch (error) {
          devLog.warn('Error removing clustering layers:', error);
        }

        map.current.remove();
        map.current = null;
        setMapLoaded(false);
      }
      // Clean up resize listener
      if (resizeHandlerRef.current) {
        try {
          window.removeEventListener('resize', resizeHandlerRef.current);
        } catch (error) {
          // ignore
        }
      }
    };
  }, []);

  // Handle animation when shouldAnimateFromSpace prop changes (race condition fix)
  useEffect(() => {
    mapLog('🎬 Animation prop effect:', {
      shouldAnimateFromSpace,
      hasAnimatedFromSpace: hasAnimatedFromSpace.current,
      hasMap: !!map.current,
      hasUserMarker: !!userLocationMarker.current
    });

    if (shouldAnimateFromSpace && !hasAnimatedFromSpace.current && map.current && userLocationMarker.current) {
      // Ensure map is fully loaded and has valid dimensions before animating
      const mapLoaded = map.current.loaded();
      const container = map.current.getContainer();
      const hasValidDimensions = container && container.offsetWidth > 0 && container.offsetHeight > 0;

      if (!mapLoaded || !hasValidDimensions) {
        mapLog(`⏳ Map/marker ready but map not fully loaded (loaded: ${mapLoaded}, valid dims: ${hasValidDimensions})`);
        return; // Wait for retry mechanism below
      }

      // If location was already obtained before animation flag was set, animate now
      const userCoords = userLocationMarker.current.getLngLat();
      mapLog('🚀 Animation flag changed - flying from space to existing location:', userCoords);
      hasAnimatedFromSpace.current = true;

      // Add small delay to ensure map is stable
      setTimeout(() => {
        if (!map.current) return;

        map.current.flyTo({
          center: [userCoords.lng, userCoords.lat],
          zoom: isMobile() ? 17.5 : 17,
          pitch: isMobile() ? 65 : 65,
          bearing: -30,
          duration: 8000,
          essential: true,
          easing: (t) => {
            return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
          }
        });
      }, 100);
    } else if (shouldAnimateFromSpace && hasAnimatedFromSpace.current) {
      mapLog('⏭️ Animation already played this session');
    } else if (shouldAnimateFromSpace && !userLocationMarker.current) {
      mapLog('⏳ Animation flag set but waiting for user location marker...');

      // Retry every 500ms until marker is ready (max 10 seconds)
      const maxRetries = 20;
      let retryCount = 0;

      const retryInterval = setInterval(() => {
        retryCount++;
        mapLog(`🔄 Retry ${retryCount}/${maxRetries}: Checking for user location marker...`);

        if (userLocationMarker.current && map.current && !hasAnimatedFromSpace.current) {
          // Extra checks: ensure map is fully loaded and has valid dimensions
          const mapLoaded = map.current.loaded();
          const container = map.current.getContainer();
          const hasValidDimensions = container && container.offsetWidth > 0 && container.offsetHeight > 0;

          if (!mapLoaded || !hasValidDimensions) {
            mapLog(`⏳ Map not ready yet (loaded: ${mapLoaded}, valid dims: ${hasValidDimensions})`);
            return; // Keep retrying
          }

          clearInterval(retryInterval);
          const userCoords = userLocationMarker.current.getLngLat();
          mapLog('🚀 Marker ready and map loaded - starting animation:', userCoords);
          hasAnimatedFromSpace.current = true;

          // Use setTimeout to ensure map has one more render cycle
          setTimeout(() => {
            if (!map.current) return;

            map.current.flyTo({
              center: [userCoords.lng, userCoords.lat],
              zoom: isMobile() ? 17.5 : 17,
              pitch: isMobile() ? 65 : 65,
              bearing: -30,
              duration: 8000,
              essential: true,
              easing: (t) => {
                return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
              }
            });
          }, 100);
        } else if (retryCount >= maxRetries) {
          clearInterval(retryInterval);
          devLog.warn('⚠️ Animation timeout: User marker not ready after 10 seconds');
        }
      }, 500);

      // Cleanup on unmount
      return () => clearInterval(retryInterval);
    }
  }, [shouldAnimateFromSpace]);

  // Add markers for events
  useEffect(() => {
    mapLog('🔄 Event markers useEffect triggered');
    mapLog('Map current:', !!map.current);
    mapLog('Map loaded:', mapLoaded);
    mapLog('Events length:', events.length);

    if (!map.current || !mapLoaded || !events.length) {
      mapLog('❌ Skipping event markers - conditions not met');
      return;
    }

    // Clear existing markers
    markersMap.forEach(marker => {
      try {
        marker.remove();
      } catch (error) {
        devLog.warn('Error removing marker:', error);
      }
    });

    const newMarkersMap = new Map<string, mapboxgl.Marker>();

    devLog.log('📋 Processing events for markers:', events.length);
    devLog.log('📋 Events data:', events.map((e: any) => ({ 
      name: e['Event Name'], 
      lat: e.Latitude, 
      lng: e.Longitude,
      zo_property_id: e._zo_property_id,
      category: e._category 
    })));
    
    events.forEach((event, index) => {
      devLog.log(`📍 Processing event ${index + 1}: ${event['Event Name']} at [${event.Latitude}, ${event.Longitude}]`);

      // All events get standalone markers (including community events at Zo Nodes)
      // Badge-on-node approach disabled for now due to positioning issues
      const eventAny = event as any;
      devLog.log(`📍 Creating standalone marker for "${event['Event Name']}" at [${event.Longitude}, ${event.Latitude}]`);

      if (!event.Latitude || !event.Longitude || !map.current) {
        mapLog(`❌ Skipping event ${index + 1} - missing coordinates or map`);
        return;
      }

      const lat = parseFloat(event.Latitude);
      const lng = parseFloat(event.Longitude);

      if (isNaN(lat) || isNaN(lng)) return;

      try {
        // Create custom image marker element
        // Event markers are smaller than node markers and layered above them
        const markerElement = document.createElement('div');
        markerElement.style.width = '32px';
        markerElement.style.height = '32px';
        markerElement.style.borderRadius = '50%';
        markerElement.style.cursor = 'pointer';
        markerElement.style.display = 'flex';
        markerElement.style.alignItems = 'center';
        markerElement.style.justifyContent = 'center';
        markerElement.style.overflow = 'hidden';
        markerElement.className = 'zo-event-marker';
        
        // Check if this is a community event with a culture
        const culture = eventAny._culture;
        const isCommunityEvent = eventAny._category === 'community';
        
        if (isCommunityEvent && culture && culture !== 'default') {
          // Use culture PNG as marker for community events
          const cultureAssets: Record<string, string> = {
            'science_technology': 'Science&Technology.png',
            'business': 'Business.png',
            'design': 'Design.png',
            'food': 'Food.png',
            'game': 'Game.png',
            'health_fitness': 'Health&Fitness.png',
            'home_lifestyle': 'Home&Lifestyle.png',
            'law': 'Law.png',
            'literature_stories': 'Literature&Stories.png',
            'music_entertainment': 'Music&Entertainment.png',
            'nature_wildlife': 'Nature&Wildlife.png',
            'photography': 'Photography.png',
            'spiritual': 'Spiritual.png',
            'travel_adventure': 'Travel&Adventure.png',
            'television_cinema': 'Television&Cinema.png',
            'stories_journal': 'Stories&Journal.png',
            'sport': 'Sport.png',
            'follow_your_heart': 'FollowYourHeart.png',
          };
          const assetFile = cultureAssets[culture] || 'Default%20(2).jpg';
          
          markerElement.style.backgroundColor = '#fff';
          markerElement.style.border = '3px solid #ff4d6d';
          markerElement.style.boxShadow = '0 4px 12px rgba(255, 77, 109, 0.4)';
          
          const img = document.createElement('img');
          img.src = `/Cultural%20Stickers/${assetFile}`;
          img.style.width = '85%';
          img.style.height = '85%';
          img.style.objectFit = 'contain';
          markerElement.appendChild(img);
        } else {
          // Default event marker for sponsored/iCal events
          markerElement.style.backgroundColor = '#000';
        markerElement.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
          
          const img = document.createElement('img');
          img.src = '/event-marker.jpg';
          img.alt = 'Event location';
          img.style.width = '100%';
          img.style.height = '100%';
          img.style.objectFit = 'cover';
          img.style.borderRadius = '50%';
          markerElement.appendChild(img);
        }

        const marker = new mapboxgl.Marker({
          element: markerElement,
          anchor: 'center',
          offset: [0, 0]
        })
          .setLngLat([lng, lat])
          .addTo(map.current!);

        const formattedDate = new Date(event['Date & Time']).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });

        // Create popup content
        // Determine the event URL - check Event URL field first, then Location if it contains luma.com
        const eventUrl = event['Event URL'] || (event.Location?.includes('luma.com') ? event.Location : null);
        const displayLocation = event.Location?.includes('luma.com') ? '' : event.Location;
        
        // Extract community event data
        const eventAnyForPopup = event as any;
        const eventId = eventAnyForPopup._id || eventAnyForPopup.id;
        const isCommunityEventPopup = eventAnyForPopup._category === 'community';
        const hostId = eventAnyForPopup._host_id;
        const hostName = eventAnyForPopup._host_name;
        const locationName = eventAnyForPopup._location_name;
        const eventCulture = eventAnyForPopup._culture;
        const eventCategory = eventAnyForPopup._category;
        const coverImageUrl = getEventCoverImage({
          coverImageUrl: eventAnyForPopup._cover_image_url,
          culture: eventCulture,
          category: eventCategory,
        });
        const isOwnEvent = userId && hostId && userId === hostId;
        
        // Build hosted by HTML
        const hostedByHtml = hostName 
          ? `<p style="margin: 0 0 8px 0; font-size: 12px; color: #1a1a1a; line-height: 1.4;">👤 Hosted by <strong>${hostName}</strong></p>`
          : '';
        
        // Build location HTML - prefer location_name over raw location
        const locationDisplay = locationName || displayLocation;
        const locationHtml = locationDisplay 
          ? `<p style="margin: 0 0 12px 0; font-size: 13px; color: #1a1a1a; line-height: 1.5;">📍 ${locationDisplay}</p>` 
          : '<div style="margin-bottom: 12px;"></div>';
        
        // Build register button - different for community vs external events
        // Check if user has already RSVP'd to this event
        const existingRsvpStatus = eventId ? userRsvps.get(eventId) : null;

        // Debug log to check RSVP status
        if (eventId && userId) {
          devLog.log('🎫 Popup for event:', eventId, '| User RSVP status:', existingRsvpStatus || 'none', '| Total RSVPs loaded:', userRsvps.size);
        }

        let registerButtonHtml: string;
        if (isCommunityEventPopup && eventId) {
          if (isOwnEvent) {
            // Host's own event - show "Your Event" badge
            registerButtonHtml = `<span style="flex: 1; padding: 10px; text-align: center; font-size: 13px; font-weight: 600; color: #ff4d6d; background: rgba(255,77,109,0.1); border-radius: 100px;">Your Event</span>`;
          } else if (existingRsvpStatus) {
            // User has already RSVP'd - show status
            const statusText = existingRsvpStatus === 'going' ? '✓ Going' 
              : existingRsvpStatus === 'interested' ? '✓ Registered'
              : existingRsvpStatus === 'waitlist' ? '⏳ Waitlisted'
              : '✓ Registered';
            const statusColor = existingRsvpStatus === 'going' ? '#22c55e' 
              : existingRsvpStatus === 'waitlist' ? '#f59e0b' 
              : '#3b82f6';
            registerButtonHtml = `<span style="flex: 1; padding: 10px; text-align: center; font-size: 13px; font-weight: 600; color: ${statusColor}; background: ${statusColor}20; border-radius: 100px;">${statusText}</span>`;
          } else {
            // Community event - RSVP button
            registerButtonHtml = `<button id="rsvp-btn-${eventId}" onclick="window.rsvpToEvent('${eventId}', '${(event['Event Name'] || '').replace(/'/g, "\\'")}'); event.stopPropagation();" class="glow-popup-button secondary" style="flex: 1;">Register</button>`;
          }
        } else if (eventUrl) {
          // External event with URL
          registerButtonHtml = `<a href="${eventUrl}" target="_blank" class="glow-popup-button secondary" style="flex: 1;">Register</a>`;
        } else {
          // No registration available
          registerButtonHtml = `<button class="glow-popup-button secondary" style="flex: 1; opacity: 0.5; cursor: not-allowed;" disabled>Register</button>`;
        }

        // Build cover image HTML - always show (with default fallback)
        const coverImageHtml = `<div style="margin: -12px -12px 12px -12px; border-radius: 12px 12px 0 0; overflow: hidden;">
            <img src="${coverImageUrl}" alt="${event['Event Name']}" style="width: 100%; height: 100px; object-fit: cover; display: block;" />
          </div>`;

        const popupContent = `
          <div style="padding: 0;">
            ${coverImageHtml}
            <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 900; color: #000; font-family: 'Space Grotesk', sans-serif;">${event['Event Name'] || "N/A"}</h3>
            ${hostedByHtml}
            <p style="margin: 0 0 6px 0; font-size: 13px; color: #1a1a1a; line-height: 1.5;">📅 ${formattedDate}</p>
            ${locationHtml}
            <div style="display: flex; gap: 8px;">
              ${registerButtonHtml}
              <button onclick="window.showRouteTo(${lng}, ${lat})" class="glow-popup-button" style="flex: 1;">Directions</button>
            </div>
          </div>
        `;

        // Create popup once and reuse it
        const popup = new mapboxgl.Popup({
          className: 'node-popup-clean',
          closeButton: false,
          closeOnClick: true,
          offset: [0, -15],
          maxWidth: '280px',
          anchor: 'bottom'
        })
          .setLngLat([lng, lat])
          .setHTML(popupContent);

        // Handle marker click - use the single popup
        markerElement.addEventListener('click', (e) => {
          e.stopPropagation();
          mapLog('🖱️ Event marker clicked:', event['Event Name']);

          try {
            // Close all other popups first
            activePopups.current.forEach(p => {
              if (p !== popup) {
                try { p.remove(); } catch (err) { /* ignore */ }
              }
            });
            activePopups.current.clear();

            // Open this popup if not already open
            if (!popup.isOpen() && map.current) {
              popup.addTo(map.current);
              activePopups.current.add(popup);
              setCurrentOpenPopup(popup);

              mapLog('✅ Event popup opened for:', event['Event Name']);

              // Handle popup close
              popup.once('close', () => {
                activePopups.current.delete(popup);
                if (currentOpenPopup === popup) {
                  setCurrentOpenPopup(null);
                }
              });
            }

          } catch (error) {
            devLog.error('❌ Error opening event popup:', error);
          }
        });

        // Store marker in map
        const eventKey = `${event['Event Name']}-${event.Latitude}-${event.Longitude}`;
        newMarkersMap.set(eventKey, marker);
      } catch (error) {
        devLog.error('❌ Error creating marker for event:', event['Event Name'], error);
        devLog.error('Event details:', event);
      }
    });

    setMarkersMap(newMarkersMap);

    // Debug: Add a test marker to see if markers work at all
    if (map.current && newMarkersMap.size === 0) {
      mapLog('🧪 Adding test marker since no events were processed');
      const testMarker = new mapboxgl.Marker({ color: '#ff0000' })
        .setLngLat([77.634402, 12.932658]) // Zo House Bangalore
        .addTo(map.current!);
    }
  }, [events, mapLoaded, currentOpenPopup]);

  // Handle flyToEvent
  useEffect(() => {
    if (!flyToEvent || !map.current || !mapLoaded || !flyToEvent.Latitude || !flyToEvent.Longitude) return;

    const lat = parseFloat(flyToEvent.Latitude);
    const lng = parseFloat(flyToEvent.Longitude);

    if (isNaN(lat) || isNaN(lng)) return;

    try {
      // Close any currently open popup
      if (currentOpenPopup) {
        currentOpenPopup.remove();
      }

      // Find the marker for this event first
      const eventKey = `${flyToEvent['Event Name']}-${flyToEvent.Latitude}-${flyToEvent.Longitude}`;
      const marker = markersMap.get(eventKey);

      // Fly to the event location with smooth animation at 40° tilt
      map.current.flyTo({
        center: [lng, lat],
        zoom: 17.5,
        pitch: 40,        // 40 degree tilt as requested
        bearing: -15,     // Slight rotation
        speed: 1.2,
        curve: 1.4,
        easing: (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
      });

      // Show popup only after fly animation completes
      if (marker) {
        const popup = marker.getPopup();
        if (popup && map.current) {
          const onMoveEnd = () => {
            // Small delay for polish after animation completes
            setTimeout(() => {
              popup.addTo(map.current!);
              setCurrentOpenPopup(popup);
              activePopups.current.add(popup); // Add to tracked popups

              popup.on('close', () => {
                if (currentOpenPopup === popup) {
                  setCurrentOpenPopup(null);
                  activePopups.current.delete(popup); // Remove from tracked popups
                }
              });
            }, 150); // Small delay for polish

            // Remove the event listener after use
            map.current?.off('moveend', onMoveEnd);
          };

          // Listen for fly animation completion
          map.current.on('moveend', onMoveEnd);
        }
      }
    } catch (error) {
      devLog.warn('Error flying to event:', error);
    }
  }, [flyToEvent, markersMap, mapLoaded, currentOpenPopup]);

  // Handle flyToNode (Partner Nodes)
  useEffect(() => {
    if (!flyToNode || !map.current || !mapLoaded) return;

    const lat = typeof flyToNode.latitude === 'number' ? flyToNode.latitude : null;
    const lng = typeof flyToNode.longitude === 'number' ? flyToNode.longitude : null;

    if (lat === null || lng === null) return;

    try {
      // Close any currently open popup
      if (currentOpenPopup) {
        currentOpenPopup.remove();
      }

      // Prepare popup content for the node
      const popupContent = `
        <div style="padding: 0;">
          <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold;">${flyToNode.name}</h3>
          <p style="margin: 4px 0; font-size: 13px;">📍 ${flyToNode.city}, ${flyToNode.country}</p>
          <div style="margin-top: 12px; display: flex; gap: 8px;">
            ${flyToNode.website ? `<a href="${flyToNode.website}" target="_blank" class="paper-button" style="flex: 1; text-align: center; font-size: 13px;">Visit</a>` : ''}
            <button onclick="window.showRouteTo(${lng}, ${lat})" class="paper-button" style="flex: 1; font-size: 13px;">Directions</button>
          </div>
        </div>
      `;

      const nodePopup = new mapboxgl.Popup({
        className: 'node-popup-clean',
        closeButton: false,
        closeOnClick: true,
        offset: [0, -15],
        maxWidth: '280px',
        anchor: 'bottom'
      })
        .setLngLat([lng, lat])
        .setHTML(popupContent);

      // Animate camera to node location with 40° tilt
      map.current.flyTo({
        center: [lng, lat],
        zoom: 17.5,
        pitch: 40,        // 40 degree tilt as requested
        bearing: -15,     // Slight rotation for dramatic view
        speed: 1.0,
        curve: 1.6,
        easing: (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2 // Smooth ease-in-out
      });

      const onMoveEnd = () => {
        setTimeout(() => {
          if (!map.current) return;
          nodePopup.addTo(map.current!);
          setCurrentOpenPopup(nodePopup);
          activePopups.current.add(nodePopup);
          nodePopup.on('close', () => {
            if (currentOpenPopup === nodePopup) {
              setCurrentOpenPopup(null);
            }
            activePopups.current.delete(nodePopup);
          });
        }, 150);

        map.current?.off('moveend', onMoveEnd);
      };

      map.current.on('moveend', onMoveEnd);
    } catch (error) {
      devLog.warn('Error flying to node:', error);
    }
  }, [flyToNode, mapLoaded, currentOpenPopup]);

  // Re-render node markers when nodes prop changes (e.g., switching between local/global mode)
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    mapLog('🔄 Nodes or events changed, updating markers...');
    addPartnerNodeMarkers();
  }, [nodes, mapLoaded, events]); // Added events dependency so badges update when events load

  return (
    <div className="relative w-full h-full" style={{ minHeight: '100vh' }}>
      {/* ✨ Star field background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundColor: '#0a0e27',
          backgroundImage: `
            radial-gradient(2px 2px at 20px 30px, white, transparent),
            radial-gradient(2px 2px at 60px 70px, white, transparent),
            radial-gradient(1px 1px at 50px 50px, white, transparent),
            radial-gradient(1px 1px at 130px 80px, white, transparent),
            radial-gradient(2px 2px at 90px 10px, white, transparent),
            radial-gradient(1px 1px at 10px 90px, white, transparent),
            radial-gradient(1px 1px at 110px 30px, white, transparent),
            radial-gradient(2px 2px at 150px 120px, white, transparent),
            radial-gradient(1px 1px at 40px 110px, white, transparent),
            radial-gradient(1px 1px at 170px 40px, white, transparent)
          `,
          backgroundSize: '200px 200px',
          backgroundRepeat: 'repeat',
          opacity: 0.6
        }}
      />

      {/* 🗺️ Map container */}
      <div
        ref={mapContainer}
        className={className || "w-full h-full"}
        style={{
          minHeight: '100vh',
          position: 'relative',
          zIndex: 1
        }}
      />

      {/* 📍 Location Prompt Overlay (only show if no location) */}
      {!userLocation?.lat && !userLocation?.lng && (
        <div
          style={{
            position: 'absolute',
            top: isMiniMap ? '45%' : '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 10,
            textAlign: 'center',
            background: 'rgba(18, 18, 18, 0.95)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            padding: isMiniMap ? '18px 28px 20px' : '40px 48px',
            borderRadius: isMiniMap ? '16px' : '20px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), inset 0 1px 1px rgba(255, 255, 255, 0.05)',
            maxWidth: isMiniMap ? '260px' : '380px',
          }}
        >
          <div style={{
            fontSize: isMiniMap ? '32px' : '56px',
            marginBottom: isMiniMap ? '8px' : '20px',
            filter: 'drop-shadow(0 4px 12px rgba(255, 255, 255, 0.1))'
          }}>
            📍
          </div>
          <h3 style={{
            color: '#FFFFFF',
            fontSize: isMiniMap ? '14px' : '20px',
            fontWeight: '700',
            letterSpacing: '-0.02em',
            marginBottom: isMiniMap ? '6px' : '12px',
            fontFamily: "'Space Grotesk', -apple-system, sans-serif",
            lineHeight: '1.2'
          }}>
            Enable Location to Explore
          </h3>
          {!isMiniMap && (
            <p style={{
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: '13px',
              marginBottom: '28px',
              lineHeight: '1.5',
              fontFamily: "'Rubik', -apple-system, sans-serif",
              fontWeight: '400'
            }}>
              Discover local nodes, events, and<br />citizens near you
            </p>
          )}
          <button
            onClick={() => {
              devLog.log('📍 Manual location request triggered');
              getUserLocation();
            }}
            style={{
              background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
              color: '#FFFFFF',
              padding: isMiniMap ? '10px 24px' : '14px 28px',
              borderRadius: isMiniMap ? '8px' : '10px',
              border: 'none',
              fontSize: isMiniMap ? '12px' : '14px',
              fontWeight: '600',
              letterSpacing: '0.02em',
              cursor: 'pointer',
              fontFamily: "'Space Grotesk', -apple-system, sans-serif",
              boxShadow: '0 4px 20px rgba(139, 92, 246, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
              transition: 'all 0.2s ease',
              width: '100%',
              marginTop: isMiniMap ? '12px' : '0',
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.transform = 'translateY(-2px)';
              (e.target as HTMLButtonElement).style.boxShadow = '0 6px 28px rgba(139, 92, 246, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.1)';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
              (e.target as HTMLButtonElement).style.boxShadow = '0 4px 20px rgba(139, 92, 246, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.1)';
            }}
          >
            Enable Location
          </button>
        </div>
      )}
    </div>
  );
} 