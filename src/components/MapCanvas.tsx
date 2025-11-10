'use client';

import { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { ParsedEvent } from '@/lib/icalParser';
import { PartnerNodeRecord } from '@/lib/supabase';
import { MAPBOX_TOKEN, DEFAULT_CENTER } from '@/lib/calendarConfig';
import { getNodeTypeColor } from '@/lib/nodeTypes';

// Zo House locations with precise coordinates
const ZO_HOUSES = [
  {
    name: "Zo House SF",
    lat: 37.7817309,
    lng: -122.401198,
    address: "300 4th St, San Francisco, CA 94107, United States",
    description: "Zo House San Francisco - The original crypto hub"
  },
  {
    name: "Zo House Koramangala",
    lat: 12.933043207450986,
    lng: 77.63463845876512,
    address: "S-1, P-2, Anaa Infra's Signature Towers, Nirguna Mandir Layout, Cauvery Colony, S.T. Bed, 1st Block Koramangala, Bengaluru, Karnataka 560095, India",
    description: "Zo House Bangalore - Innovation center in India's Silicon Valley"
  },
  {
    name: "Zo House Whitefield",
    lat: 12.972625067533576,
    lng: 77.74648576165846,
    address: "Outer Circle, Dodsworth Layout, Whitefield, Bengaluru, Karnataka, India", 
    description: "Zo House Whitefield - Expanding the ecosystem"
  }
];

interface MapCanvasProps {
  events: ParsedEvent[];
  nodes?: PartnerNodeRecord[];
  onMapReady?: (map: mapboxgl.Map, closeAllPopups: () => void) => void;
  flyToEvent?: ParsedEvent | null;
  flyToNode?: PartnerNodeRecord | null;
  className?: string;
  shouldAnimateFromSpace?: boolean;
  userLocation?: { lat: number; lng: number } | null; // Saved user location from profile
}

export default function MapCanvas({ events, nodes, onMapReady, flyToEvent, flyToNode, className, shouldAnimateFromSpace = false, userLocation }: MapCanvasProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [currentOpenPopup, setCurrentOpenPopup] = useState<mapboxgl.Popup | null>(null);
  const [markersMap, setMarkersMap] = useState<Map<string, mapboxgl.Marker>>(new Map());
  const [mapLoaded, setMapLoaded] = useState(false);
  const activePopups = useRef<Set<mapboxgl.Popup>>(new Set());
  const hasAnimatedFromSpace = useRef(false);
  const zoHouseMarkers = useRef<mapboxgl.Marker[]>([]);
  const partnerNodeMarkers = useRef<mapboxgl.Marker[]>([]);
  const userLocationMarker = useRef<mapboxgl.Marker | null>(null); // 🦄 User location unicorn marker
  const resizeHandlerRef = useRef<(() => void) | undefined>(undefined);
  const currentRouteSourceId = useRef<string>('user-to-destination-route');
  const currentRouteLayerId = useRef<string>('user-to-destination-route-layer');
  const currentRouteMarkers = useRef<mapboxgl.Marker[]>([]);
  const traversalMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const traversalFrameRef = useRef<number | null>(null);
  const progressSourceIdRef = useRef<string>('user-to-destination-route-progress');
  const progressLayerIdRef = useRef<string>('user-to-destination-route-progress-layer');

  // Mobile detection function
  const isMobile = () => window.innerWidth <= 768;

  // Function to close all open popups
  const closeAllPopups = () => {
    console.log('🔄 Closing all popups...');
    try {
      // Close all tracked popups
      activePopups.current.forEach(popup => {
        try {
          if (popup.isOpen()) {
            console.log('Closing popup:', popup);
            popup.remove();
          }
        } catch (error) {
          console.warn('Error closing individual popup:', error);
        }
      });
      
      // Clear the set
      activePopups.current.clear();
      
      // Reset current popup state
      setCurrentOpenPopup(null);
      console.log('✅ All popups closed');
    } catch (error) {
      console.warn('Error closing popups:', error);
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
        console.warn('No route received from Directions API');
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
      } catch {}
      try {
        if (map.current.getSource(currentRouteSourceId.current)) {
          map.current.removeSource(currentRouteSourceId.current);
        }
      } catch {}

      // Clear existing origin/destination markers
      currentRouteMarkers.current.forEach(m => {
        try { m.remove(); } catch {}
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
      console.warn('Error drawing route:', error);
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
      try { cancelAnimationFrame(traversalFrameRef.current); } catch {}
      traversalFrameRef.current = null;
    }
    if (traversalMarkerRef.current) {
      try { traversalMarkerRef.current.remove(); } catch {}
      traversalMarkerRef.current = null;
    }
    // Remove all rainbow layers (7 layers for rainbow gradient)
    for (let i = 0; i < 7; i++) {
      try {
        if (map.current.getLayer(`${progressLayerIdRef.current}-rainbow-${i}`)) {
          map.current.removeLayer(`${progressLayerIdRef.current}-rainbow-${i}`);
        }
      } catch {}
    }
    try {
      if (map.current.getSource(progressSourceIdRef.current)) map.current.removeSource(progressSourceIdRef.current);
    } catch {}

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
    
    const unicornMarker = new mapboxgl.Marker(unicornEl)
      .setLngLat(coordinates[0])
      .addTo(map.current);
    
    // Force the marker container to be on top with high z-index
    const markerElement = unicornMarker.getElement();
    if (markerElement) {
      markerElement.style.zIndex = '9999';
    }
    
    traversalMarkerRef.current = unicornMarker;
    
    console.log('🦄 Unicorn marker created at:', coordinates[0]);

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
      try { traversalMarkerRef.current?.setLngLat([lng, lat]); } catch {}
      try {
        const progressed = coordinates.slice(0, i);
        progressed.push([lng, lat]);
        (map.current.getSource(progressSourceIdRef.current) as mapboxgl.GeoJSONSource)?.setData({
          type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: progressed }
        } as any);
      } catch {}

      // Keep camera centered without changing angle
      try { map.current.setCenter([lng, lat]); } catch {}

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
            console.warn('Error removing unicorn marker:', e);
          }
        }
      }
    };

    traversalFrameRef.current = requestAnimationFrame(step);
  };

  // Clear any drawn route and its markers
  const clearRoute = () => {
    if (!map.current) return;
    try {
      // Remove route layer/source
      try {
        if (map.current.getLayer(currentRouteLayerId.current)) {
          map.current.removeLayer(currentRouteLayerId.current);
        }
      } catch {}
      try {
        if (map.current.getSource(currentRouteSourceId.current)) {
          map.current.removeSource(currentRouteSourceId.current);
        }
      } catch {}

      // Remove route markers
      currentRouteMarkers.current.forEach(m => {
        try { m.remove(); } catch {}
      });
      currentRouteMarkers.current = [];

      // Cancel traversal and remove marker
      if (traversalFrameRef.current) {
        try { cancelAnimationFrame(traversalFrameRef.current); } catch {}
        traversalFrameRef.current = null;
      }
      if (traversalMarkerRef.current) {
        try { traversalMarkerRef.current.remove(); } catch {}
        traversalMarkerRef.current = null;
      }

      // Remove progress line
      try { if (map.current.getLayer(progressLayerIdRef.current)) map.current.removeLayer(progressLayerIdRef.current); } catch {}
      try { if (map.current.getSource(progressSourceIdRef.current)) map.current.removeSource(progressSourceIdRef.current); } catch {}
    } catch (e) {
      console.warn('Error clearing route:', e);
    }
  };

  const clearAllPopupsAndRoute = () => {
    try {
      closeAllPopups();
    } catch {}
    try {
      clearRoute();
    } catch {}
  };

  // Add Zo House markers with custom animated icon
  const addZoHouseMarkers = () => {
    if (!map.current) return;

    // Clear any existing Zo House markers
    zoHouseMarkers.current.forEach(marker => {
      try {
        marker.remove();
      } catch (error) {
        console.warn('Error removing existing marker:', error);
      }
    });
    zoHouseMarkers.current = [];

    console.log('🏠 Adding Zo House markers with precise coordinates...');
    ZO_HOUSES.forEach((house) => {
      console.log(`📍 Adding marker for ${house.name} at [${house.lat}, ${house.lng}]`);
      try {
        // Create custom PNG marker for Zo House (using proven approach)
        const markerElement = document.createElement('img');
        markerElement.src = '/Zo_flexing_white.png';
        markerElement.style.width = '50px';
        markerElement.style.height = '50px';
        markerElement.style.borderRadius = '50%';
        markerElement.style.cursor = 'pointer';
        markerElement.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
        markerElement.title = house.name;

        const zoMarker = new mapboxgl.Marker(markerElement)
          .setLngLat([house.lng, house.lat])
          .addTo(map.current!);

        console.log(`🏠 Added PNG marker for ${house.name}`);

        // Store marker reference
        zoHouseMarkers.current.push(zoMarker);

        // Create popup content for Zo House
        const zoPopupContent = `
          <div style="padding: 0;">
            <h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 900; color: #000; font-family: 'Space Grotesk', sans-serif;">${house.name}</h3>
            <p style="margin: 0 0 16px 0; font-size: 13px; color: #1a1a1a; line-height: 1.5;">📍 ${house.address}</p>
            <div style="display: flex; gap: 8px;">
              <button onclick="window.open('https://zo.house', '_blank')" class="glow-popup-button secondary" style="flex: 1;">Visit</button>
              <button onclick="window.showRouteTo(${house.lng}, ${house.lat})" class="glow-popup-button" style="flex: 1;">Directions</button>
            </div>
          </div>
        `;

        const zoPopup = new mapboxgl.Popup({
          className: 'node-popup-clean',
          closeButton: false,
          closeOnClick: true,
          offset: [0, -45],
          maxWidth: '280px',
          anchor: 'bottom'
        }).setHTML(zoPopupContent);

        zoMarker.setPopup(zoPopup);

        // Handle marker click
        markerElement.addEventListener('click', () => {
          // Ensure previous popups are closed via central mechanism
          closeAllPopups();
          if (currentOpenPopup && currentOpenPopup !== zoPopup) {
            try {
              currentOpenPopup.remove();
              activePopups.current.delete(currentOpenPopup);
            } catch (error) {
              console.warn('Error removing popup:', error);
            }
          }
          // Open the popup anchored to this marker
          try {
            zoMarker.togglePopup();
          } catch (error) {
            console.warn('Error opening Zo House popup:', error);
          }
          setCurrentOpenPopup(zoPopup);
          activePopups.current.add(zoPopup);
          
          zoPopup.on('close', () => {
            if (currentOpenPopup === zoPopup) {
              setCurrentOpenPopup(null);
            }
            activePopups.current.delete(zoPopup);
          });
        });

        console.log(`✅ Added Zo House marker: ${house.name}`);
      } catch (error) {
        console.warn('Error creating Zo House marker:', house.name, error);
      }
    });
  };

  // 🦄 Add partner node markers (Unicorn: all use Zo logo)
  const addPartnerNodeMarkers = async () => {
    if (!map.current) return;

    // Clear any existing partner node markers
    partnerNodeMarkers.current.forEach(marker => {
      try {
        marker.remove();
      } catch (error) {
        console.warn('Error removing existing partner node marker:', error);
      }
    });
    partnerNodeMarkers.current = [];

    // Use passed nodes prop, or fetch from database if not provided
    let nodesToDisplay = nodes;
    if (!nodesToDisplay) {
      console.log('🦄 Loading partner nodes from database...');
      try {
        const { getNodesFromDB } = await import('@/lib/supabase');
        const fetchedNodes = await getNodesFromDB();
        nodesToDisplay = fetchedNodes || undefined; // Convert null to undefined
      } catch (error) {
        console.error('Error loading nodes:', error);
        return;
      }
    }
    
    if (!nodesToDisplay || nodesToDisplay.length === 0) {
      console.log('🦄 No partner nodes to display');
      return;
    }
    
    console.log(`🦄 Adding ${nodesToDisplay.length} partner node markers...`);
    
    nodesToDisplay.forEach((node) => {
      if (!node.latitude || !node.longitude) {
        console.warn(`⚠️ Skipping ${node.name} - missing coordinates`);
        return;
      }
      
      try {
        // 🦄 UNICORN: All nodes use the Zo flexing white logo
        const markerElement = document.createElement('img');
        markerElement.src = '/Zo_flexing_white.png';
        markerElement.style.width = '50px';
        markerElement.style.height = '50px';
        markerElement.style.borderRadius = '50%';
        markerElement.style.cursor = 'pointer';
        markerElement.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
        markerElement.title = node.name;
        
        const nodeMarker = new mapboxgl.Marker(markerElement)
          .setLngLat([node.longitude, node.latitude])
          .addTo(map.current!);
        
        console.log(`🦄 Added marker for ${node.name}`);
        
        // Store marker reference
        partnerNodeMarkers.current.push(nodeMarker);
        
        // Create popup for the node
        const popupContent = `
          <div style="padding: 0;">
            <h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 900; color: #000; font-family: 'Space Grotesk', sans-serif;">${node.name}</h3>
            <p style="margin: 0 0 16px 0; font-size: 13px; color: #1a1a1a; line-height: 1.5;">📍 ${node.city}, ${node.country}</p>
            <div style="display: flex; gap: 8px;">
              ${node.website ? `<a href="${node.website}" target="_blank" class="glow-popup-button secondary" style="flex: 1;">Visit</a>` : ''}
              <button onclick="window.showRouteTo(${node.longitude}, ${node.latitude})" class="glow-popup-button" style="flex: 1;">Directions</button>
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
              console.warn('Error closing previous popup:', error);
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
        console.error(`❌ Error creating marker for ${node.name}:`, error);
      }
    });
    
    console.log(`✅ Added ${partnerNodeMarkers.current.length} partner node markers to map`);
    
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
              console.warn('Error removing popup:', error);
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

        console.log('✅ Partner node marker (legacy)');
      } catch (error) {
        console.warn('Error creating partner node marker:', error);
      }
    */
  };

  // Initialize map with proper error handling
  const initializeMap = () => {
    if (!mapContainer.current || map.current) return;
    
    try {
      mapboxgl.accessToken = MAPBOX_TOKEN;

      // 🚀 Start from outer space if animation is requested
      const initialZoom = shouldAnimateFromSpace ? 0 : (isMobile() ? 17.5 : 17); // 🦄 Zoomed in to see 3D buildings
      const initialPitch = shouldAnimateFromSpace ? 0 : (isMobile() ? 65 : 65); // 🦄 Tilted for dramatic 3D view
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        center: DEFAULT_CENTER,
        zoom: initialZoom,
        pitch: initialPitch,
        bearing: shouldAnimateFromSpace ? 0 : -30,
        style: 'mapbox://styles/mapbox/standard'
      });

      // Ensure the map resizes correctly when container size changes
      const handleResize = () => {
        try {
          map.current?.resize();
        } catch (error) {
          console.warn('Map resize error:', error);
        }
      };
      resizeHandlerRef.current = handleResize;
      window.addEventListener('resize', handleResize);

      // Wait for map to load before setting up features
      map.current.on('load', () => {
        if (!map.current) return;
        
        setMapLoaded(true);

        // Force a resize after load to render tiles if container was hidden/absolute
        try {
          map.current.resize();
          setTimeout(() => map.current && map.current.resize(), 50);
          setTimeout(() => map.current && map.current.resize(), 250);
        } catch (error) {
          console.warn('Post-load resize error:', error);
        }
        
        // Set up lighting - use DAY mode so colors stay bright!
        try {
          map.current.setConfigProperty('basemap', 'lightPreset', 'day');  // Changed from 'night' to 'day'
          map.current.setConfigProperty('basemap', 'showPointOfInterestLabels', false);
          map.current.setConfigProperty('basemap', 'showPlaceLabels', false);
          map.current.setConfigProperty('basemap', 'showRoadLabels', false);
          map.current.setConfigProperty('basemap', 'showTransitLabels', false);
        } catch (error) {
          console.warn('Could not set map configuration:', error);
        }

        // Add 3D buildings layer
        try {
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
          } else {
            console.log('🏢 3D buildings not available with current map style');
          }
        } catch (error) {
          console.warn('Could not add 3D buildings:', error);
        }

        // Notify parent that map is ready
        if (onMapReady) {
          onMapReady(map.current, closeAllPopups);
        }

        // Get user location - use saved location first, otherwise prompt
        if (userLocation?.lat && userLocation?.lng) {
          console.log('📍 Using saved user location from profile:', userLocation);
          createUserLocationMarker(userLocation.lat, userLocation.lng);
        } else {
          console.log('📍 No saved location, prompting user...');
          getUserLocation();
        }
        
        // Add Zo House markers
        addZoHouseMarkers();
        addPartnerNodeMarkers();

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
          }
        } catch {}
      });

    } catch (error) {
      console.error('Error initializing map:', error);
    }
  };

  // Create user location marker (reusable for both saved location and geolocation)
  const createUserLocationMarker = (lat: number, lng: number) => {
    if (!map.current) return;
    
    const coords: [number, number] = [lng, lat];
    
    // Store coordinates in window for wallet sync
    if (typeof window !== 'undefined') {
      window.userLocationCoords = { lat, lng };
      console.log('📍 User location set:', window.userLocationCoords);
    }
    
    try {
      // 🚀 Animate from space to user location if requested
      console.log('🎬 Animation check:', {
        shouldAnimateFromSpace,
        hasAnimatedFromSpace: hasAnimatedFromSpace.current
      });
      
      if (shouldAnimateFromSpace && !hasAnimatedFromSpace.current) {
        console.log('🚀 Flying from outer space to user location...');
        hasAnimatedFromSpace.current = true;
        
        map.current.flyTo({
          center: coords,
          zoom: isMobile() ? 17.5 : 17,
          pitch: isMobile() ? 65 : 65,
          bearing: -30,
          duration: 8000, // 8 seconds for dramatic effect
          essential: true,
          easing: (t) => {
            // Custom easing for space entry effect
            return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
          }
        });
      } else {
        // Normal update without animation
        map.current.setCenter(coords);
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

      const userMarker = new mapboxgl.Marker(userMarkerElement)
        .setLngLat(coords)
        .addTo(map.current!);

      // Set high z-index to ensure user marker is always on top
      const userMarkerEl = userMarker.getElement();
      if (userMarkerEl) {
        userMarkerEl.style.zIndex = '10000'; // Higher than all other markers
      }

      // Store marker reference
      userLocationMarker.current = userMarker;

      console.log('🦄 Added unicorn marker for user location');

      // Create popup content matching the event popup style
      const userPopupContent = `
        <div style="padding: 0;">
          <h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 900; color: #000; font-family: 'Space Grotesk', sans-serif;">🦄 Your Location</h3>
          <p style="margin: 0 0 6px 0; font-size: 13px; color: #1a1a1a; line-height: 1.5;">📍 Current position</p>
          <p style="margin: 0; font-size: 13px; color: #1a1a1a; line-height: 1.5;">📱 ${userLocation ? 'Saved location' : 'Auto-detected via GPS'}</p>
        </div>
      `;

      const userPopup = new mapboxgl.Popup({
        className: 'node-popup-clean',
        closeButton: false,
        closeOnClick: true,
        offset: [0, -15],
        maxWidth: '280px',
        anchor: 'bottom'
      }).setHTML(userPopupContent);

      // Attach popup to marker
      userMarker.setPopup(userPopup);
      
      // Handle marker click
      userMarkerElement.addEventListener('click', () => {
        if (currentOpenPopup && currentOpenPopup !== userPopup) {
          try {
            currentOpenPopup.remove();
            activePopups.current.delete(currentOpenPopup);
          } catch (error) {
            console.warn('Error closing previous popup:', error);
          }
        }
        setCurrentOpenPopup(userPopup);
        activePopups.current.add(userPopup);
        
        userPopup.once('close', () => {
          if (currentOpenPopup === userPopup) {
            setCurrentOpenPopup(null);
          }
          activePopups.current.delete(userPopup);
        });
      });
      
      // Show popup briefly
      setTimeout(() => {
        if (map.current) {
          userPopup.addTo(map.current!);
          setTimeout(() => {
            userPopup.remove();
          }, 3000);
        }
      }, 1000);
    } catch (error) {
      console.warn('Error setting user location:', error);
    }
  };

  // Get user location with proper error handling (prompt for permission)
  const getUserLocation = () => {
    if (!navigator.geolocation || !map.current) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        createUserLocationMarker(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        console.warn('⚠️ Geolocation permission denied or unavailable:', error.message);
        console.log('💡 To enable location: Click the location icon in your browser address bar');
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
    initializeMap();

    return () => {
      if (map.current) {
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
    console.log('🎬 Animation prop effect:', {
      shouldAnimateFromSpace,
      hasAnimatedFromSpace: hasAnimatedFromSpace.current,
      hasMap: !!map.current,
      hasUserMarker: !!userLocationMarker.current
    });
    
    if (shouldAnimateFromSpace && !hasAnimatedFromSpace.current && map.current && userLocationMarker.current) {
      // If location was already obtained before animation flag was set, animate now
      const userCoords = userLocationMarker.current.getLngLat();
      console.log('🚀 Animation flag changed - flying from space to existing location:', userCoords);
      hasAnimatedFromSpace.current = true;
      
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
    } else if (shouldAnimateFromSpace && hasAnimatedFromSpace.current) {
      console.log('⏭️ Animation already played this session');
    } else if (shouldAnimateFromSpace && !userLocationMarker.current) {
      console.log('⏳ Animation flag set but waiting for user location marker...');
    }
  }, [shouldAnimateFromSpace]);

  // Add markers for events
  useEffect(() => {
    console.log('🔄 Event markers useEffect triggered');
    console.log('Map current:', !!map.current);
    console.log('Map loaded:', mapLoaded);
    console.log('Events length:', events.length);
    
    if (!map.current || !mapLoaded || !events.length) {
      console.log('❌ Skipping event markers - conditions not met');
      return;
    }

    // Clear existing markers
    markersMap.forEach(marker => {
      try {
        marker.remove();
      } catch (error) {
        console.warn('Error removing marker:', error);
      }
    });
    
    const newMarkersMap = new Map<string, mapboxgl.Marker>();

    console.log('📋 Processing events:', events.length);
    events.forEach((event, index) => {
      console.log(`📍 Processing event ${index + 1}: ${event['Event Name']} at [${event.Latitude}, ${event.Longitude}]`);
      
      if (!event.Latitude || !event.Longitude || !map.current) {
        console.log(`❌ Skipping event ${index + 1} - missing coordinates or map`);
        return;
      }

      const lat = parseFloat(event.Latitude);
      const lng = parseFloat(event.Longitude);

      if (isNaN(lat) || isNaN(lng)) return;

      try {
        // Create custom image marker element
        const markerElement = document.createElement('img');
        markerElement.src = '/event-marker.jpg';
        markerElement.alt = 'Event location';
        markerElement.style.width = '36px';
        markerElement.style.height = '36px';
        markerElement.style.borderRadius = '50%';
        markerElement.style.cursor = 'pointer';
        markerElement.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
        
        const marker = new mapboxgl.Marker(markerElement)
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
        
        const popupContent = `
          <div style="padding: 0;">
            <h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 900; color: #000; font-family: 'Space Grotesk', sans-serif;">${event['Event Name'] || "N/A"}</h3>
            <p style="margin: 0 0 6px 0; font-size: 13px; color: #1a1a1a; line-height: 1.5;">📅 ${formattedDate}</p>
            ${displayLocation ? `<p style="margin: 0 0 16px 0; font-size: 13px; color: #1a1a1a; line-height: 1.5;">📍 ${displayLocation}</p>` : '<div style="margin-bottom: 16px;"></div>'}
            <div style="display: flex; gap: 8px;">
              ${eventUrl ? `<a href="${eventUrl}" target="_blank" class="glow-popup-button secondary" style="flex: 1;">Register</a>` : `<button class="glow-popup-button secondary" style="flex: 1; opacity: 0.5; cursor: not-allowed;" disabled>Register</button>`}
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
          console.log('🖱️ Event marker clicked:', event['Event Name']);
          
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
              
              console.log('✅ Event popup opened for:', event['Event Name']);
              
              // Handle popup close
              popup.once('close', () => {
                activePopups.current.delete(popup);
                if (currentOpenPopup === popup) {
                  setCurrentOpenPopup(null);
                }
              });
            }
            
          } catch (error) {
            console.error('❌ Error opening event popup:', error);
          }
        });

        // Store marker in map
        const eventKey = `${event['Event Name']}-${event.Latitude}-${event.Longitude}`;
        newMarkersMap.set(eventKey, marker);
      } catch (error) {
        console.error('❌ Error creating marker for event:', event['Event Name'], error);
        console.error('Event details:', event);
      }
    });

    setMarkersMap(newMarkersMap);
    
    // Debug: Add a test marker to see if markers work at all
    if (map.current && newMarkersMap.size === 0) {
      console.log('🧪 Adding test marker since no events were processed');
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
      
      // Fly to the event location with smooth animation
      map.current.flyTo({
        center: [lng, lat],
        zoom: 18,
        speed: 1.2,
        curve: 1.4,
        easing: (t: number) => t
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
      console.warn('Error flying to event:', error);
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

      // Animate camera to node location
      map.current.flyTo({
        center: [lng, lat],
        zoom: 17.5,
        speed: 1.2,
        curve: 1.4,
        easing: (t: number) => t
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
      console.warn('Error flying to node:', error);
    }
  }, [flyToNode, mapLoaded, currentOpenPopup]);

  // Re-render node markers when nodes prop changes (e.g., switching between local/global mode)
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    
    console.log('🔄 Nodes changed, updating markers...');
    addPartnerNodeMarkers();
  }, [nodes, mapLoaded]);

  return (
    <div 
      ref={mapContainer} 
      className={className || "w-full h-full"}
      style={{ minHeight: '100vh' }}
    />
  );
} 