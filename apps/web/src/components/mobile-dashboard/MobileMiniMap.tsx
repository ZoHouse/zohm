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
  reloadProfile?: () => Promise<void>;
}

const MobileMiniMap: React.FC<MobileMiniMapProps> = ({ onOpenMap, userProfile, reloadProfile }) => {
  // Get user location from profile (same as desktop)
  const userLat = userProfile?.lat || 0;
  const userLng = userProfile?.lng || 0;
  const hasLocation = userLat !== 0 && userLng !== 0;
  const [mapKey, setMapKey] = React.useState(0);
  const [isEnteringMap, setIsEnteringMap] = React.useState(false);

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

  // Handle "Enter Map" - fetch current location, save, then open map
  const handleEnterMap = async () => {
    if (!navigator.geolocation) {
      onOpenMap();
      return;
    }

    setIsEnteringMap(true);
    
    try {
      // Get current GPS location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const accuracy = position.coords.accuracy;
      
      devLog.log('📍 Got current location for Enter Map:', { 
        lat, 
        lng, 
        accuracy: `${accuracy}m`,
        timestamp: new Date(position.timestamp).toISOString()
      });
      
      // Log to console for debugging
      console.log(`📍 LOCATION FETCHED: ${lat}, ${lng} (accuracy: ${accuracy}m)`);

      // Save to database if user is logged in
      if (userProfile?.id) {
        const response = await fetch(`/api/users/${userProfile.id}/location`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat, lng })
        });

        if (response.ok) {
          devLog.log('✅ Location saved to database');
          // CRITICAL: Wait for profile reload to complete before opening map
          // This ensures the map uses the fresh location, not stale cached data
          if (reloadProfile) {
            await reloadProfile();
            devLog.log('✅ Profile reloaded with new location');
            // Small delay to ensure state has propagated
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        } else {
          const errorText = await response.text();
          devLog.error('❌ Failed to save location:', errorText);
        }
      }
    } catch (error) {
      devLog.error('❌ Error getting/saving location:', error);
    }

    setIsEnteringMap(false);
    // Open map AFTER location is saved and profile is reloaded
    onOpenMap();
  };

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
          
          {/* Overlay - Enter Map Button */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 1000 }}>
            <button
              onClick={handleEnterMap}
              disabled={isEnteringMap}
              className="pointer-events-auto border border-solid hover:opacity-80 transition-all duration-200 active:scale-95 disabled:opacity-50"
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
                {isEnteringMap ? '📍 Getting Location...' : 'Enter Map'}
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileMiniMap;

