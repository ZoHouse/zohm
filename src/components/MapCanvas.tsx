'use client';

import { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { ParsedEvent } from '@/lib/icalParser';
import { PartnerNodeRecord } from '@/lib/supabase';
import { MAPBOX_TOKEN, DEFAULT_CENTER } from '@/lib/calendarConfig';

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
  onMapReady?: (map: mapboxgl.Map, closeAllPopups: () => void) => void;
  flyToEvent?: ParsedEvent | null;
  flyToNode?: PartnerNodeRecord | null;
  className?: string;
}

export default function MapCanvas({ events, onMapReady, flyToEvent, flyToNode, className }: MapCanvasProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [currentOpenPopup, setCurrentOpenPopup] = useState<mapboxgl.Popup | null>(null);
  const [markersMap, setMarkersMap] = useState<Map<string, mapboxgl.Marker>>(new Map());
  const [mapLoaded, setMapLoaded] = useState(false);
  const activePopups = useRef<Set<mapboxgl.Popup>>(new Set());
  const zoHouseMarkers = useRef<mapboxgl.Marker[]>([]);
  const partnerNodeMarkers = useRef<mapboxgl.Marker[]>([]);
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

      // Add new source and layer for the route
      map.current.addSource(currentRouteSourceId.current, {
        type: 'geojson',
        data: routeGeojson
      });

      map.current.addLayer({
        id: currentRouteLayerId.current,
        type: 'line',
        source: currentRouteSourceId.current,
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#90EE90',
          'line-width': 9,
          'line-opacity': 1,
          'line-blur': 0.15
        }
      });

      // Add simple origin and destination markers
      const originMarker = new mapboxgl.Marker({ color: '#3b82f6' })
        .setLngLat([originLng, originLat])
        .addTo(map.current);
      const destinationMarker = new mapboxgl.Marker({ color: '#ef4444' })
        .setLngLat([destinationLng, destinationLat])
        .addTo(map.current);
      currentRouteMarkers.current.push(originMarker, destinationMarker);

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
    try {
      if (map.current.getLayer(progressLayerIdRef.current)) map.current.removeLayer(progressLayerIdRef.current);
    } catch {}
    try {
      if (map.current.getSource(progressSourceIdRef.current)) map.current.removeSource(progressSourceIdRef.current);
    } catch {}

    // Add progress source/layer
    const progressGeojson: GeoJSON.Feature<GeoJSON.LineString> = {
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: [coordinates[0]] }
    };
    map.current.addSource(progressSourceIdRef.current, {
      type: 'geojson',
      data: progressGeojson
    });
    map.current.addLayer({
      id: progressLayerIdRef.current,
      type: 'line',
      source: progressSourceIdRef.current,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': '#90EE90',
        'line-width': 9,
        'line-opacity': 0.9
      }
    });

    // Moving marker
    traversalMarkerRef.current = new mapboxgl.Marker({ color: '#22c55e' })
      .setLngLat(coordinates[0])
      .addTo(map.current);

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
        traversalFrameRef.current = null;
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
          <h3>🏠 ${house.name}</h3>
          <p>📍 ${house.address}</p>
          <p>✨ ${house.description}</p>
          <div style="margin-top: 16px; display: flex; gap: 8px;">
            <button onclick="window.open('https://zo.house', '_blank')" class="paper-button">
              Visit
            </button>
            <button onclick="window.showRouteTo(${house.lng}, ${house.lat})" class="paper-button">
              Directions
            </button>
          </div>
        `;

        const zoPopup = new mapboxgl.Popup({
          className: 'paper-card',
          closeButton: true,
          offset: [0, -45],
          maxWidth: '320px',
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

  // Add partner node markers with custom icons
  const addPartnerNodeMarkers = () => {
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

    console.log('🌐 Adding partner node markers...');
    return; // partner node markers handled elsewhere
    
    /* Legacy example code removed
      try {
        const nodePopup = new mapboxgl.Popup({
          closeButton: true,
          closeOnClick: false,
          className: 'glass-popup partner-node-popup'
        });

        // Get type-specific icon and color
        const getTypeIcon = (type: 'hacker_space' | 'culture_house' | 'schelling_point' | 'flo_zone' | 'house' | 'collective' | 'protocol' | 'space' | 'festival' | 'dao'): string => {
          switch (type) {
            case 'house': return '🏠';
            case 'collective': return '🌐';
            case 'protocol': return '⚡';
            case 'space': return '🏢';
            case 'festival': return '🎪';
            case 'dao': return '🏛️';
            default: return '🔗';
          }
        };

        const getTypeColor = (type: 'hacker_space' | 'culture_house' | 'schelling_point' | 'flo_zone' | 'house' | 'collective' | 'protocol' | 'space' | 'festival' | 'dao'): string => {
          switch (type) {
            case 'house': return '#10b981'; // emerald
            case 'collective': return '#3b82f6'; // blue
            case 'protocol': return '#8b5cf6'; // violet
            case 'space': return '#f59e0b'; // amber
            case 'festival': return '#ec4899'; // pink
            case 'dao': return '#06b6d4'; // cyan
            default: return '#6b7280'; // gray
          }
        };

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

      const initialZoom = isMobile() ? 12.5 : 18.5;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        center: DEFAULT_CENTER,
        zoom: initialZoom,
        pitch: 60,
        bearing: -30,
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
        
        // Set up night mode and hide labels
        try {
          map.current.setConfigProperty('basemap', 'lightPreset', 'night');
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

        // Get user location
        getUserLocation();
        
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

  // Get user location with proper error handling
  const getUserLocation = () => {
    if (!navigator.geolocation || !map.current) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!map.current) return;
        
        const coords: [number, number] = [position.coords.longitude, position.coords.latitude];
        
        // Store coordinates in window for wallet sync
        if (typeof window !== 'undefined') {
          window.userLocationCoords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          console.log('📍 User location stored for wallet sync:', window.userLocationCoords);
        }
        
        try {
          // Update map center to user location
          map.current.setCenter(coords);

          // Create popup content matching the event popup style
          const userPopupContent = `
            <h3>📍 Your Location</h3>
            <p>🔵 Current position</p>
            <p>📱 Auto-detected via GPS</p>
          `;

          const userPopup = new mapboxgl.Popup({
            className: 'paper-card',
            closeButton: true,
            offset: [0, -15],
            maxWidth: '280px',
            anchor: 'bottom'
          }).setHTML(userPopupContent);
          
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
      },
      (error) => {
        console.log('Geolocation error:', error);
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
        const popupContent = `
          <h3>${event['Event Name'] || "N/A"}</h3>
          <p>📅 ${formattedDate}</p>
          <p>📍 ${event.Location || "N/A"}</p>
          ${event['Event URL'] ? `
            <div style="margin-top: 16px;">
              <a href="${event['Event URL']}" target="_blank" class="paper-button">Register</a>
            </div>
          ` : ''}
        `;

        // Create popup once and reuse it
        const popup = new mapboxgl.Popup({
            className: 'paper-card',
            closeButton: true,
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
      const membersText = '';
      const popupContent = `
        <h3>${flyToNode.name}</h3>
        <p>🏷️ ${flyToNode.type.replace('_', ' ')}</p>
        <p>📍 ${flyToNode.city}, ${flyToNode.country}</p>
        <p class="line-clamp-3">${flyToNode.description || ''}</p>
        <div style="margin-top: 12px; display: flex; gap: 8px;">
          ${flyToNode.website ? `<a href="${flyToNode.website}" target="_blank" class="paper-button">Visit</a>` : ''}
          <button onclick="window.showRouteTo(${lng}, ${lat})" class="paper-button">Directions</button>
        </div>
      `;

      const nodePopup = new mapboxgl.Popup({
        className: 'paper-card',
        closeButton: true,
        offset: [0, -15],
        maxWidth: '300px',
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

  return (
    <div 
      ref={mapContainer} 
      className={className || "w-full h-full"}
      style={{ minHeight: '100vh' }}
    />
  );
} 