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
  const [locationLoading, setLocationLoading] = useState(true); // Start as loading
  const [locationError, setLocationError] = useState<string | null>(null);
  const activePopups = useRef<Set<mapboxgl.Popup>>(new Set());
  const zoHouseMarkers = useRef<mapboxgl.Marker[]>([]);
  const partnerNodeMarkers = useRef<mapboxgl.Marker[]>([]);
  const resizeHandlerRef = useRef<(() => void) | undefined>(undefined);

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

      const initialZoom = isMobile() ? 8 : 10; // Start with a wider view
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        center: DEFAULT_CENTER, // Will be updated by getUserLocation
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

        // Get user location immediately on map load
        getUserLocation();
        
        // Add Zo House markers
        addZoHouseMarkers();
        addPartnerNodeMarkers();
      });

    } catch (error) {
      console.error('Error initializing map:', error);
    }
  };

  // Fallback location detection using IP geolocation
  const getLocationFromIP = async () => {
    try {
      console.log('🌐 Trying IP-based location detection...');
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      if (data.latitude && data.longitude) {
        const coords: [number, number] = [data.longitude, data.latitude];
        console.log('✅ IP-based location obtained:', coords);
        
        if (map.current) {
          map.current.flyTo({
            center: coords,
            zoom: 16,
            speed: 1.2,
            curve: 1.4,
            easing: (t: number) => t
          });
          
          // Show popup for IP-based location
          const ipPopup = new mapboxgl.Popup({
            className: 'paper-card',
            closeButton: true,
            offset: [0, -15],
            maxWidth: '280px',
            anchor: 'bottom'
          }).setLngLat(coords).setHTML(`
            <h3>📍 Approximate Location</h3>
            <p>🌐 Detected via IP address</p>
            <p>📍 ${data.city}, ${data.country}</p>
            <p>⚠️ Less accurate than GPS</p>
          `);
          
          setTimeout(() => {
            if (map.current) {
              ipPopup.addTo(map.current!);
              setTimeout(() => ipPopup.remove(), 4000);
            }
          }, 1500);
        }
        
        return true;
      }
    } catch (error) {
      console.warn('IP geolocation failed:', error);
    }
    return false;
  };

  // Get user location with proper error handling
  const getUserLocation = () => {
    if (!navigator.geolocation || !map.current) {
      console.warn('⚠️ Geolocation not available or map not ready');
      setLocationError('Geolocation not supported');
      // Try IP-based fallback
      getLocationFromIP();
      return;
    }

    console.log('📍 Requesting user location...');
    setLocationLoading(true);
    setLocationError(null);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!map.current) return;
        
        const coords: [number, number] = [position.coords.longitude, position.coords.latitude];
        const accuracy = position.coords.accuracy;
        
        console.log('✅ User location obtained:', {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: `${accuracy}m`
        });
        
        setLocationLoading(false);
        
        // Store coordinates in window for wallet sync
        if (typeof window !== 'undefined') {
          window.userLocationCoords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          console.log('📍 User location stored for wallet sync:', window.userLocationCoords);
        }
        
        try {
          // Update map center to user location with smooth animation
          map.current.flyTo({
            center: coords,
            zoom: 18,
            speed: 1.2,
            curve: 1.4,
            easing: (t: number) => t
          });

          // Create popup content matching the event popup style
          const userPopupContent = `
            <h3>📍 Your Location</h3>
            <p>🔵 Current position</p>
            <p>📱 Auto-detected via GPS</p>
            <p>🎯 Accuracy: ${Math.round(accuracy)}m</p>
          `;

          const userPopup = new mapboxgl.Popup({
            className: 'paper-card',
            closeButton: true,
            offset: [0, -15],
            maxWidth: '280px',
            anchor: 'bottom'
          }).setHTML(userPopupContent);
          
          // Show popup briefly after animation
          setTimeout(() => {
            if (map.current) {
              userPopup.addTo(map.current!);
              setTimeout(() => {
                userPopup.remove();
              }, 4000);
            }
          }, 1500);
        } catch (error) {
          console.warn('Error setting user location:', error);
          setLocationError('Failed to update map location');
        }
      },
      (error) => {
        console.error('❌ Geolocation error:', error);
        setLocationLoading(false);
        
        // Provide specific error messages
        let errorMessage = 'Unable to get your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions and refresh.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable. Please check your GPS settings.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please try again.';
            break;
        }
        
        setLocationError(errorMessage);
        console.warn('📍 Geolocation failed:', errorMessage);
        
        // Try IP-based fallback
        getLocationFromIP().then((success) => {
          if (!success) {
            // Show error popup to user only if IP fallback also fails
            if (map.current) {
              const errorPopup = new mapboxgl.Popup({
                className: 'paper-card',
                closeButton: true,
                offset: [0, -15],
                maxWidth: '300px',
                anchor: 'bottom'
              }).setLngLat(DEFAULT_CENTER).setHTML(`
                <h3>⚠️ Location Access</h3>
                <p>${errorMessage}</p>
                <p>📍 Showing default location (Bangalore)</p>
                <div style="margin-top: 12px;">
                  <button onclick="window.location.reload()" class="paper-button">
                    Try Again
                  </button>
                </div>
              `);
              
              setTimeout(() => {
                if (map.current) {
                  errorPopup.addTo(map.current!);
                  setTimeout(() => {
                    errorPopup.remove();
                  }, 8000);
                }
              }, 1000);
            }
          }
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 15000, // Increased timeout
        maximumAge: 300000 // 5 minutes cache
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
        ${flyToNode.website ? `<div style="margin-top: 12px;"><a href="${flyToNode.website}" target="_blank" class="paper-button">Visit</a></div>` : ''}
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
    <div className="relative w-full h-full">
      <div 
        ref={mapContainer} 
        className={className || "w-full h-full"}
        style={{ minHeight: '100vh' }}
      />
      
      {/* Location Controls Overlay */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        {/* Manual Location Button */}
        <button
          onClick={getUserLocation}
          disabled={locationLoading || !mapLoaded}
          className="px-4 py-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 hover:bg-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
        >
          {locationLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span>Getting Location...</span>
            </>
          ) : (
            <>
              <span>📍</span>
              <span>My Location</span>
            </>
          )}
        </button>
        
        {/* Location Status */}
        {locationError && (
          <div className="px-3 py-2 bg-red-100/90 backdrop-blur-sm rounded-lg shadow-lg border border-red-200 text-red-700 text-xs max-w-48">
            <div className="font-medium">⚠️ Location Error</div>
            <div className="mt-1">{locationError}</div>
          </div>
        )}
      </div>
    </div>
  );
} 