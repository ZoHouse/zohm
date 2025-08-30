
'use client';

import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useRouter } from 'next/navigation';

// Replace with your Mapbox access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

const MiniMap = () => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const router = useRouter();
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);
    const liveLocationMarker = useRef<mapboxgl.Marker | null>(null);

    // Create a custom marker element for live location
    const createCustomMarker = () => {
        const markerEl = document.createElement('div');
        markerEl.className = 'custom-marker';
        markerEl.innerHTML = `
            <div style="width: 16px; height: 16px; background: #10b981; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(16, 185, 129, 0.5); position: relative;"></div>
            <div style="width: 8px; height: 8px; background: #34d399; border-radius: 50%; position: absolute; top: 2px; left: 2px; animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        `;
        markerEl.style.position = 'relative';
        markerEl.style.width = '16px';
        markerEl.style.height = '16px';
        return markerEl;
    };

    // Get user's live location
    const getUserLocation = () => {
        if (!navigator.geolocation) {
            setLocationError('Geolocation not supported');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const coords: [number, number] = [position.coords.longitude, position.coords.latitude];
                setUserLocation(coords);
                setLocationError(null);
                
                // Update map center to user location
                if (map.current) {
                    map.current.setCenter(coords);
                    
                    // Add or update live location marker
                    if (liveLocationMarker.current) {
                        liveLocationMarker.current.setLngLat(coords);
                    } else {
                        liveLocationMarker.current = new mapboxgl.Marker({
                            color: '#00ff00',
                            scale: 1.2,
                            element: createCustomMarker()
                        })
                        .setLngLat(coords)
                        .addTo(map.current);
                    }
                }
            },
            (error) => {
                console.error('Geolocation error:', error);
                setLocationError('Could not get location');
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 30000
            }
        );
    };

    // Watch for location changes
    const startLocationWatching = () => {
        if (!navigator.geolocation) return;

        navigator.geolocation.watchPosition(
            (position) => {
                const coords: [number, number] = [position.coords.longitude, position.coords.latitude];
                setUserLocation(coords);
                
                // Update live location marker
                if (map.current && liveLocationMarker.current) {
                    liveLocationMarker.current.setLngLat(coords);
                }
            },
            (error) => {
                console.error('Location watching error:', error);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 30000
            }
        );
    };

    useEffect(() => {
        if (map.current || !mapContainer.current) return; // Initialize map only once

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/streets-v12', // Streets theme
            center: [-122.4194, 37.7749], // Default to SF
            zoom: 12,
            interactive: false, // Make the map not interactive
        });

        // Add a marker for Zo House SF
        new mapboxgl.Marker()
            .setLngLat([-122.4194, 37.7749])
            .addTo(map.current);

        // Get initial user location
        getUserLocation();
        
        // Start watching for location changes
        startLocationWatching();

        // Add a pulsing effect to the live location marker
        const pulseInterval = setInterval(() => {
            if (liveLocationMarker.current && liveLocationMarker.current.getElement()) {
                const markerEl = liveLocationMarker.current.getElement();
                if (markerEl) {
                    markerEl.style.transform = markerEl.style.transform === 'scale(1.2)' ? 'scale(1)' : 'scale(1.2)';
                }
            }
        }, 1000);

        // Cleanup function
        return () => {
            if (liveLocationMarker.current) {
                liveLocationMarker.current.remove();
            }
            clearInterval(pulseInterval);
        };
    }, []);
    
    const handleMapClick = () => {
        router.push('/');
    };

    return (
        <>
            <style jsx>{`
                @keyframes ping {
                    75%, 100% {
                        transform: scale(2);
                        opacity: 0;
                    }
                }
            `}</style>
            <div 
                ref={mapContainer} 
                className="relative h-full w-full rounded-lg cursor-pointer"
                onClick={handleMapClick}
            >
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <span className="text-white font-bold text-lg">Zo House SF</span>
            </div>
            
            {/* Live location indicator */}
            {userLocation && (
                <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    Live Location
                </div>
            )}
            
            {/* Location error indicator */}
            {locationError && (
                <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {locationError}
                </div>
            )}
        </div>
        </>
    );
};

export default MiniMap; 