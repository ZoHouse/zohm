'use client';

import { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { ParsedEvent } from '@/lib/icalParser';
import { MAPBOX_TOKEN, DEFAULT_CENTER } from '@/lib/calendarConfig';
import { getNodesFromDB, PartnerNodeRecord } from '@/lib/supabase';

// Zo House locations with precise coordinates
const ZO_HOUSES = [
  {
    name: "Zo House SF",
    lat: 37.781903723962394,
    lng: -122.40089759537564,
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
  className?: string;
}

export default function MapCanvas({ events, onMapReady, flyToEvent, className }: MapCanvasProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [currentOpenPopup, setCurrentOpenPopup] = useState<mapboxgl.Popup | null>(null);
  const [markersMap, setMarkersMap] = useState<Map<string, mapboxgl.Marker>>(new Map());
  const [mapLoaded, setMapLoaded] = useState(false);
  const activePopups = useRef<Set<mapboxgl.Popup>>(new Set());
  const zoHouseMarkers = useRef<mapboxgl.Marker[]>([]);
  const partnerNodeMarkers = useRef<mapboxgl.Marker[]>([]);
  const [listenerBound, setListenerBound] = useState(false);

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
      
      // Fallback: also close any DOM popups that might exist
      const popupElements = document.querySelectorAll('.mapboxgl-popup');
      console.log('Found', popupElements.length, 'popup elements in DOM');
      popupElements.forEach(popupElement => {
        try {
          popupElement.remove();
        } catch (error) {
          console.warn('Error removing popup element:', error);
        }
      });
      
      console.log('✅ All popups closed');
    } catch (error) {
      console.warn('Error closing popups:', error);
    }
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
          <div style="margin-top: 16px;">
            <button onclick="window.open('https://zo.house', '_blank')" class="paper-button">
              Visit Website
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
          if (currentOpenPopup && currentOpenPopup !== zoPopup) {
            try {
              currentOpenPopup.remove();
              activePopups.current.delete(currentOpenPopup);
            } catch (error) {
              console.warn('Error removing popup:', error);
            }
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

  // Add DB node markers (excluding Zo Houses) with default image marker
  const addPartnerNodeMarkers = async () => {
    if (!map.current) return;

    partnerNodeMarkers.current.forEach(m => {
      try { m.remove(); } catch {}
    });
    partnerNodeMarkers.current = [];

    try {
      const nodes = await getNodesFromDB();
      if (!nodes) return;
      const filtered = nodes.filter(n => n.latitude != null && n.longitude != null && !(n.name || '').toLowerCase().startsWith('zo house'));

      filtered.forEach((n: PartnerNodeRecord) => {
        try {
          const img = document.createElement('img');
          const srcs = ['/locationmarker copy.jpg', '/locationmarker.jpg', '/icons/icon-96x96.png'];
          let idx = 0;
          img.src = encodeURI(srcs[idx]);
          img.style.width = '32px';
          img.style.height = '32px';
          img.style.borderRadius = '50%';
          img.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
          img.style.cursor = 'pointer';
          img.alt = n.name;
          img.onerror = () => {
            idx += 1;
            if (idx < srcs.length) {
              img.src = encodeURI(srcs[idx]);
            } else {
              img.style.background = '#111';
            }
          };

          const marker = new mapboxgl.Marker({ element: img, anchor: 'bottom' })
            .setLngLat([Number(n.longitude), Number(n.latitude)])
            .addTo(map.current!);

          partnerNodeMarkers.current.push(marker);
        } catch {}
      });
    } catch {}
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

      // Wait for map to load before setting up features
      map.current.on('load', () => {
        if (!map.current) return;
        
        setMapLoaded(true);
        
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

        // Listen for external fly-to-coords events (from Nodes overlay)
        if (!listenerBound) {
          window.addEventListener('fly-to-coords', (e: Event) => {
            const detail = (e as CustomEvent).detail as { lat: number; lng: number };
            try {
              console.log('🛫 Fly-to received:', detail);
              if (typeof detail.lat !== 'number' || typeof detail.lng !== 'number' || isNaN(detail.lat) || isNaN(detail.lng)) {
                console.warn('Invalid fly-to coordinates', detail);
                return;
              }
              const center: [number, number] = [Number(detail.lng), Number(detail.lat)];
              // Stop any ongoing animations before flying
              try { map.current?.stop(); } catch {}
              // Two-stage fly for precision on some devices
              map.current?.easeTo({ center, zoom: 16, duration: 400, easing: (t) => t });
              map.current?.once('moveend', () => {
                map.current?.flyTo({ center, zoom: 18.2, speed: 1.2, curve: 1.44, easing: (t) => t });
              });
            } catch {}
          });
          setListenerBound(true);
        }

        // Get user location
        getUserLocation();
        
        // Add Zo House markers
        addZoHouseMarkers();
        addPartnerNodeMarkers();
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
        // Create visible default marker for events
        const img = document.createElement('img');
        const srcs = ['/locationmarker copy.jpg', '/locationmarker.jpg', '/icons/icon-96x96.png'];
        let idx = 0;
        img.src = encodeURI(srcs[idx]);
        img.style.width = '28px';
        img.style.height = '28px';
        img.style.borderRadius = '50%';
        img.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
        img.style.cursor = 'pointer';
        img.onerror = () => {
          idx += 1;
          if (idx < srcs.length) {
            img.src = encodeURI(srcs[idx]);
          } else {
            img.style.background = '#111';
          }
        };

        const marker = new mapboxgl.Marker(img)
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

        const popup = new mapboxgl.Popup({
            className: 'paper-card',
            closeButton: true,
            offset: [0, -15],
            maxWidth: '280px',
            anchor: 'bottom'
          })
          .setLngLat([lng, lat])
          .setHTML(popupContent);

        marker.setPopup(popup);
        
        // Handle marker click
        marker.on('click', () => {
          if (currentOpenPopup && currentOpenPopup !== popup) {
            try {
              currentOpenPopup.remove();
              activePopups.current.delete(currentOpenPopup); // Remove from tracked popups
            } catch (error) {
              console.warn('Error removing popup:', error);
            }
          }
          setCurrentOpenPopup(popup);
          activePopups.current.add(popup); // Add to tracked popups
          
          popup.on('close', () => {
            if (currentOpenPopup === popup) {
              setCurrentOpenPopup(null);
            }
            activePopups.current.delete(popup); // Remove from tracked popups
          });
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

  return (
    <div 
      ref={mapContainer} 
      className={className || "w-full h-full"}
      style={{ minHeight: '100vh' }}
    />
  );
} 