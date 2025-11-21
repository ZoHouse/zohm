'use client';

import React, { useState } from 'react';
import { MapPin, X } from 'lucide-react';

interface LocationPermissionModalProps {
  onLocationGranted: (lat: number, lng: number) => void;
  onClose: () => void;
  userProfile?: {
    id: string;
    name?: string;
  } | null;
}

/**
 * LocationPermissionModal - Requests user's current location
 * 
 * Shows a friendly modal explaining why location is needed
 * Requests browser geolocation permission
 * Saves location to database via callback
 */
export default function LocationPermissionModal({ 
  onLocationGranted, 
  onClose,
  userProfile 
}: LocationPermissionModalProps) {
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequestLocation = async () => {
    setIsRequesting(true);
    setError(null);

    try {
      // Check if geolocation is supported
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by your browser');
      }

      // Request location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const { latitude, longitude } = position.coords;
      console.log('📍 Location obtained:', { latitude, longitude });

      // Save to database via callback
      await onLocationGranted(latitude, longitude);

      // Mark as asked in session storage (prevent asking again this session)
      sessionStorage.setItem('location_permission_asked', 'true');

      // Close modal
      onClose();

    } catch (err: any) {
      console.error('❌ Location request failed:', err);
      
      let errorMessage = 'Failed to get your location';
      
      // Handle GeolocationPositionError
      if (err && typeof err === 'object' && 'code' in err) {
        switch (err.code) {
          case 1: // PERMISSION_DENIED
            errorMessage = 'Location permission denied. Please enable location access in your browser settings to use map features.';
            break;
          case 2: // POSITION_UNAVAILABLE
            errorMessage = 'Location information unavailable. Please try again.';
            break;
          case 3: // TIMEOUT
            errorMessage = 'Location request timed out. Please try again.';
            break;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleSkip = () => {
    // Mark as asked in session storage (prevent asking again this session)
    sessionStorage.setItem('location_permission_asked', 'true');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div 
        className="relative max-w-md w-full rounded-2xl border border-white/10 p-8"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
        }}
      >
        {/* Close Button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
          disabled={isRequesting}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-zo-accent to-pink-500 flex items-center justify-center">
            <MapPin className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-white text-center mb-3">
          Update Your Location
        </h2>

        {/* Description */}
        <p className="text-gray-400 text-center mb-6 text-sm leading-relaxed">
          We'll use your current location to show nearby events, nodes, and communities on the map.
          {userProfile?.name && (
            <span className="block mt-2 text-white/80">
              Let's sync you to your current location, {userProfile.name}!
            </span>
          )}
        </p>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm text-center">{error}</p>
          </div>
        )}

        {/* Benefits List */}
        <div className="space-y-3 mb-8 bg-white/5 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-zo-accent mt-0.5">✓</span>
            <p className="text-sm text-gray-300">Always centered on your current location</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-zo-accent mt-0.5">✓</span>
            <p className="text-sm text-gray-300">Discover events and nodes nearby</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-zo-accent mt-0.5">✓</span>
            <p className="text-sm text-gray-300">Updates automatically each session</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleRequestLocation}
            disabled={isRequesting}
            className="w-full py-4 bg-gradient-to-r from-zo-accent via-pink-500 to-purple-500 hover:opacity-90 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-zo-accent/50"
          >
            {isRequesting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Getting location...</span>
              </>
            ) : (
              <>
                <MapPin className="w-5 h-5" />
                <span>Enable Location</span>
              </>
            )}
          </button>

          <button
            onClick={handleSkip}
            disabled={isRequesting}
            className="w-full py-3 text-gray-400 hover:text-white transition-colors text-sm disabled:opacity-50"
          >
            Skip for now
          </button>
        </div>

        {/* Privacy Note */}
        <p className="text-gray-500 text-xs text-center mt-6">
          Your location is only used to enhance your Zo World experience. We respect your privacy.
        </p>
      </div>
    </div>
  );
}

