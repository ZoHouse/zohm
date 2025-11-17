'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import MapCanvas to avoid SSR issues
const MapCanvas = dynamic(() => import('../MapCanvas'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#0A0A0A]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/40"></div>
    </div>
  ),
});

interface MobileMiniMapProps {
  onOpenMap: () => void;
}

const MobileMiniMap: React.FC<MobileMiniMapProps> = ({ onOpenMap }) => {
  const [hasLocation, setHasLocation] = useState(false);
  const [userLat, setUserLat] = useState(0);
  const [userLng, setUserLng] = useState(0);
  const [mapKey, setMapKey] = useState(0);
  const [locationDebug, setLocationDebug] = useState('');

  // Get user location from localStorage
  useEffect(() => {
    const storedLat = localStorage.getItem('zo_lat');
    const storedLng = localStorage.getItem('zo_lng');
    
    console.log('🗺️ MobileMiniMap: Checking location', { storedLat, storedLng });
    
    if (storedLat && storedLng) {
      const lat = parseFloat(storedLat);
      const lng = parseFloat(storedLng);
      
      console.log('🗺️ MobileMiniMap: Parsed location', { lat, lng });
      
      if (!isNaN(lat) && !isNaN(lng)) {
        setUserLat(lat);
        setUserLng(lng);
        setHasLocation(true);
        setLocationDebug(`✅ ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        // Force map to re-render with new location
        setMapKey(prev => prev + 1);
        console.log('✅ MobileMiniMap: Location set!', { lat, lng });
      } else {
        setLocationDebug('❌ Invalid coordinates');
      }
    } else {
      console.log('❌ MobileMiniMap: No location in localStorage');
      setLocationDebug('❌ No location in storage');
    }
  }, []);

  return (
    <div className="px-6 mt-6">
      <div className="flex flex-col gap-3">
        {/* Section Title */}
        <p className="font-rubik text-[12px] font-medium leading-[16px] tracking-[0.96px] text-white/40 uppercase">
          MAP
        </p>

        {/* Mini Map Container */}
        <div className="relative w-full h-[240px] rounded-2xl overflow-hidden bg-[#0A0A0A]">
          {/* MapCanvas Component */}
          {hasLocation ? (
            <div 
              key={mapKey}
              className="absolute inset-0 w-full h-full"
            >
              <MapCanvas
                events={[]}
                nodes={[]}
                flyToEvent={null}
                flyToNode={null}
                shouldAnimateFromSpace={false}
                userLocation={{ lat: userLat, lng: userLng }}
                className="w-full h-full"
              />
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <p className="font-rubik text-[14px] text-white/60">
                Location not available
              </p>
              <p className="font-rubik text-[12px] text-white/40">
                {locationDebug || 'Checking...'}
              </p>
            </div>
          )}

          {/* Overlay - Enter Map Button */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 1000 }}>
            <button
              onClick={onOpenMap}
              className="pointer-events-auto border border-solid hover:opacity-80 transition-all duration-200 active:scale-95"
              style={{
                backgroundColor: 'rgba(18, 18, 18, 0.4)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                borderColor: 'rgba(255, 255, 255, 0.16)',
                borderRadius: '999px',
                padding: '12px 24px',
              }}
            >
              <p className="font-rubik text-[14px] font-medium leading-[16px] tracking-[1.4px] text-white uppercase">
                Enter Map
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileMiniMap;

