'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import mapboxgl from 'mapbox-gl';
import { MAPBOX_TOKEN } from '@/lib/calendarConfig';

interface City {
  id: string;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  stage: number;
  node_count: number;
}

interface MapSyncFlowProps {
  onClose: () => void;
  onSync: (cityId: string) => void;
}

export default function MapSyncFlow({ onClose, onSync }: MapSyncFlowProps) {
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    fetchCities();
    
    // Play background video
    if (videoRef.current) {
      videoRef.current.play().catch(err => {
        console.log('Video autoplay prevented:', err);
      });
    }
  }, []);

  // Initialize map when city is selected
  useEffect(() => {
    if (!selectedCity || !mapContainerRef.current) return;

    // Clean up existing map
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    // Initialize Mapbox
    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [0, 0], // Start from space
      zoom: 0,
      pitch: 0,
      bearing: 0,
      attributionControl: false,
    });

    mapRef.current = map;

    map.on('load', () => {
      // Animate from space to city location
      const coords: [number, number] = [selectedCity.longitude, selectedCity.latitude];
      
      map.flyTo({
        center: coords,
        zoom: 12,
        pitch: 60,
        bearing: -20,
        duration: 6000, // 6 seconds
        essential: true,
        easing: (t) => {
          // Smooth deceleration curve
          return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        }
      });

      // Add marker to city after animation starts
      setTimeout(() => {
        if (markerRef.current) {
          markerRef.current.remove();
        }

        const el = document.createElement('div');
        el.className = 'custom-marker';
        el.innerHTML = `
          <div style="
            width: 40px;
            height: 40px;
            background: rgba(207, 255, 80, 0.2);
            border: 3px solid #cfff50;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 20px rgba(207, 255, 80, 0.5);
            animation: pulse 2s infinite;
          ">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#cfff50">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
        `;

        markerRef.current = new mapboxgl.Marker(el)
          .setLngLat(coords)
          .addTo(map);
      }, 1000);
    });

    // Cleanup
    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
      }
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, [selectedCity]);

  const fetchCities = async () => {
    try {
      const response = await fetch('/api/cities');
      if (response.ok) {
        const data = await response.json();
        setCities(data.cities || []);
      }
    } catch (error) {
      console.error('Failed to fetch cities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!selectedCity) return;

    setSyncing(true);
    try {
      const response = await fetch('/api/cities/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cityId: selectedCity.id }),
      });

      if (response.ok) {
        onSync(selectedCity.id);
      }
    } catch (error) {
      console.error('Failed to sync city:', error);
    } finally {
      setSyncing(false);
    }
  };

  const filteredCities = cities.filter(city =>
    city.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    city.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStageLabel = (stage: number) => {
    const labels = {
      1: 'Prospect',
      2: 'Outpost',
      3: 'District',
      4: 'City Center',
    };
    return labels[stage as keyof typeof labels] || 'Unknown';
  };

  const getStageColor = (stage: number) => {
    const colors = {
      1: '#666666',
      2: '#888888',
      3: '#cfff50',
      4: '#00ff88',
    };
    return colors[stage as keyof typeof colors] || '#666666';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Background Video - Coin Collection */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        loop
        muted
        playsInline
      >
        <source src="/Coin Collection.mp4" type="video/mp4" />
      </video>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="relative w-full max-w-4xl max-h-[90vh] bg-black/80 border border-[#cfff50] rounded-lg overflow-hidden backdrop-blur-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="font-rubik text-2xl font-bold text-white mb-1">
              Map your Sync
            </h2>
            <p className="font-rubik text-sm text-white/60">
              Choose your home city to get +200 $Zo
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 6L6 18M6 6L18 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex h-[60vh]">
          {/* City List */}
          <div className="w-1/2 border-r border-white/10 flex flex-col">
            {/* Search */}
            <div className="p-4 border-b border-white/10">
              <input
                type="text"
                placeholder="Search cities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#cfff50]"
              />
            </div>

            {/* Cities */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#cfff50] border-t-transparent" />
                </div>
              ) : (
                <div className="p-2">
                  {filteredCities.map((city) => (
                    <button
                      key={city.id}
                      onClick={() => setSelectedCity(city)}
                      className={`w-full text-left p-3 mb-2 rounded-lg transition-all ${
                        selectedCity?.id === city.id
                          ? 'bg-[#cfff50]/20 border border-[#cfff50]'
                          : 'bg-white/5 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-rubik text-white font-medium">
                            {city.name}
                          </div>
                          <div className="font-rubik text-sm text-white/60">
                            {city.country}
                          </div>
                        </div>
                        <div
                          className="px-2 py-1 rounded text-xs font-rubik font-medium"
                          style={{
                            backgroundColor: `${getStageColor(city.stage)}20`,
                            color: getStageColor(city.stage),
                          }}
                        >
                          {getStageLabel(city.stage)}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* City Details */}
          <div className="w-1/2 flex flex-col">
            {selectedCity ? (
              <>
                {/* Animated Map Preview */}
                <div className="h-64 bg-black border-b border-white/10 relative overflow-hidden">
                  <div 
                    ref={mapContainerRef}
                    className="absolute inset-0 w-full h-full"
                  />
                  {/* Coordinates overlay */}
                  <div className="absolute bottom-2 left-2 px-3 py-1 bg-black/80 rounded-lg backdrop-blur-sm">
                    <p className="font-rubik text-white/60 text-xs">
                      {selectedCity.latitude.toFixed(4)}°, {selectedCity.longitude.toFixed(4)}°
                    </p>
                  </div>
                </div>

                {/* City Info */}
                <div className="flex-1 p-6 overflow-y-auto">
                  <h3 className="font-rubik text-2xl font-bold text-white mb-2">
                    {selectedCity.name}
                  </h3>
                  <p className="font-rubik text-white/60 mb-6">
                    {selectedCity.country}
                  </p>

                  <div className="space-y-4">
                    <div>
                      <div className="font-rubik text-sm text-white/40 mb-1">
                        City Stage
                      </div>
                      <div className="font-rubik text-white font-medium">
                        {getStageLabel(selectedCity.stage)}
                      </div>
                    </div>

                    <div>
                      <div className="font-rubik text-sm text-white/40 mb-1">
                        Zo Nodes
                      </div>
                      <div className="font-rubik text-white font-medium">
                        {selectedCity.node_count} active {selectedCity.node_count === 1 ? 'node' : 'nodes'}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/10">
                      <div className="flex items-center gap-2 mb-2">
                        <Image
                          src="/zotoken.png"
                          alt="Zo Token"
                          width={24}
                          height={24}
                        />
                        <span className="font-rubik text-[#cfff50] text-xl font-bold">
                          +200 $Zo
                        </span>
                      </div>
                      <p className="font-rubik text-sm text-white/60">
                        One-time reward for syncing your home city
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sync Button */}
                <div className="p-6 border-t border-white/10">
                  <button
                    onClick={handleSync}
                    disabled={syncing}
                    className="w-full py-4 bg-[#cfff50] text-black font-rubik font-bold rounded-lg hover:bg-[#cfff50]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {syncing ? 'Syncing...' : `Sync ${selectedCity.name}`}
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
                        fill="white"
                        fillOpacity="0.2"
                      />
                    </svg>
                  </div>
                  <p className="font-rubik text-white/40">
                    Select a city to see it on the map
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add keyframe animation for marker pulse */}
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
}

