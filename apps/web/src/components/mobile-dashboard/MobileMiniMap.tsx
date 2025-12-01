'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { PrivyUserProfile } from '@/types/user';
import { devLog } from '@/lib/logger';

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
  userProfile: PrivyUserProfile | null;
}

const MobileMiniMap: React.FC<MobileMiniMapProps> = ({ onOpenMap, userProfile }) => {
  // Get user location from profile (same as desktop)
  const userLat = userProfile?.lat || 0;
  const userLng = userProfile?.lng || 0;
  const hasLocation = userLat !== 0 && userLng !== 0;
  const [mapKey, setMapKey] = React.useState(0);

  // Debug logging
  React.useEffect(() => {
    devLog.log('🗺️ MobileMiniMap: User location from profile:', {
      userLat,
      userLng,
      hasLocation,
      profileHasValues: !!userProfile?.lat && !!userProfile?.lng
    });
  }, [userLat, userLng, hasLocation, userProfile]);
  
  // Force remount when location changes (same as desktop)
  React.useEffect(() => {
    if (hasLocation) {
        setMapKey(prev => prev + 1);
    }
  }, [userLat, userLng, hasLocation]);

  return (
    <div className="px-6 mt-6">
      <div className="flex flex-col gap-3">
        {/* Section Title */}
        <p className="font-rubik text-[12px] font-medium leading-[16px] tracking-[0.96px] text-white/40 uppercase">
          MAP
        </p>

        {/* Mini Map Container */}
        <div className="relative w-full h-[240px] rounded-2xl overflow-hidden">
          {/* MapCanvas Component - No overflow positioning to keep user marker visible */}
            <div 
              key={mapKey}
              className="absolute inset-0 w-full h-full"
            style={{ 
              borderRadius: '16px',
              overflow: 'hidden',
            }}
            >
              <MapCanvas
                events={[]}
                nodes={[]}
                flyToEvent={null}
                flyToNode={null}
                shouldAnimateFromSpace={false}
                userLocation={hasLocation ? { lat: userLat, lng: userLng } : null}
                isMiniMap={true}
                className="w-full h-full"
                userId={userProfile?.id}
                onLocationSaved={(lat, lng) => {
                  devLog.log('✅ Location saved! Reloading page to show map with location...');
                  // Reload the page to update the profile with the new location
                  window.location.reload();
                }}
              />
            </div>
          
          {/* Overlay - Enter Map Button (only show when user has location) */}
          {hasLocation && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 1000 }}>
              <button
                onClick={onOpenMap}
                className="pointer-events-auto border border-solid hover:opacity-80 transition-all duration-200 active:scale-95"
                style={{
                  backgroundColor: 'rgba(18, 18, 18, 0.3)',
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
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileMiniMap;

