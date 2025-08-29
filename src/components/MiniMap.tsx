
'use client';

import React, { useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useRouter } from 'next/navigation';

// Replace with your Mapbox access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

const MiniMap = () => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const router = useRouter();

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
            
    }, []);
    
    const handleMapClick = () => {
        router.push('/');
    };

    return (
        <div 
            ref={mapContainer} 
            className="relative h-full w-full rounded-lg cursor-pointer"
            onClick={handleMapClick}
        >
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <span className="text-white font-bold text-lg">Zo House SF</span>
            </div>
        </div>
    );
};

export default MiniMap; 