'use client';

import React, { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { upsertUserFromPrivy } from '@/lib/privyDb';

interface SimpleOnboardingProps {
  isVisible: boolean;
  onComplete: () => void;
}

const CULTURE_OPTIONS = [
  'Follow your heart',
  'Zo Accelerator',
  'Design',
  'Studio',
  'Science & Technology',
  'duh',
  'Food',
  'Games',
  'FIFA',
  'Poker',
  'Catan',
  '64xZo (Chess)',
  'Sports',
  'PickleballxZo',
  'Travel & Adventure',
  'Business',
  'Photography',
  'Television & Cinema',
  'Health & Fitness/ Longevity',
  'Literature',
  'Music & Entertainment',
  'Law & Order',
  'Nature & Wildlife',
  'Stories & Journals',
  'Home & Lifestyle',
  'Spiritual'
];

const CITIES = [
  { name: 'San Francisco', lat: 37.7749, lng: -122.4194 },
  { name: 'New York', lat: 40.7128, lng: -74.0060 },
  { name: 'London', lat: 51.5074, lng: -0.1278 },
  { name: 'Bangalore', lat: 12.9716, lng: 77.5946 },
  { name: 'Singapore', lat: 1.3521, lng: 103.8198 },
  { name: 'Tokyo', lat: 35.6762, lng: 139.6503 }
];

const SimpleOnboarding: React.FC<SimpleOnboardingProps> = ({
  isVisible,
  onComplete,
}) => {
  const { user: privyUser, authenticated: privyAuthenticated } = usePrivy();
  
  const [name, setName] = useState('');
  const [city, setCity] = useState<{ name: string; lat: number; lng: number } | null>(null);
  const [culture, setCulture] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; city?: string; culture?: string; submit?: string }>({});
  const [citySearch, setCitySearch] = useState('');
  const [cultureSearch, setCultureSearch] = useState('');
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showCultureDropdown, setShowCultureDropdown] = useState(false);

  if (!isVisible) return null;

  if (!privyAuthenticated || !privyUser) {
    return null;
  }

  const filteredCities = citySearch 
    ? CITIES.filter(c => c.name.toLowerCase().includes(citySearch.toLowerCase()))
    : CITIES;

  const filteredCultures = cultureSearch 
    ? CULTURE_OPTIONS.filter(c => c.toLowerCase().includes(cultureSearch.toLowerCase()))
    : CULTURE_OPTIONS;

  const handleSubmit = async () => {
    const newErrors: { name?: string; city?: string; culture?: string } = {};

    // Validate
    if (!name.trim() || name.length < 2 || name.length > 12) {
      newErrors.name = 'Name must be 2-12 characters';
    }

    if (!city) {
      newErrors.city = 'Please select a city';
    }

    if (!culture) {
      newErrors.culture = 'Please select a culture';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const result = await upsertUserFromPrivy(privyUser, {
        name: name.trim(),
        culture: culture,
        lat: city!.lat,
        lng: city!.lng,
        onboarding_completed: true,
        role: 'Member',
      });

      if (!result) {
        throw new Error('Failed to save profile');
      }

      onComplete();
    } catch (error) {
      console.error('❌ Profile setup failed:', error);
      setErrors({ 
        submit: 'Failed to save profile. Please try again.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          
          // Find closest city
          let closestCity = CITIES[0];
          let minDistance = Infinity;
          
          CITIES.forEach(c => {
            const distance = Math.sqrt(
              Math.pow(userLat - c.lat, 2) + Math.pow(userLng - c.lng, 2)
            );
            if (distance < minDistance) {
              minDistance = distance;
              closestCity = c;
            }
          });
          
          setCity(closestCity);
          setErrors(prev => ({ ...prev, city: '' }));
        },
        (error) => {
          console.error('Error getting location:', error);
          setErrors(prev => ({ ...prev, city: 'Could not get your location. Please select a city.' }));
        }
      );
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        setShowCityDropdown(false);
        setShowCultureDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div 
      className="fixed inset-0 bg-black flex items-center justify-center z-[9999] p-4"
      style={{
        backgroundImage: "url('/assets/loading background.gif')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="bg-black/40 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-5xl mx-auto p-6 sm:p-8 border border-white/20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Name */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-white">
              What is your name?
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
              }}
              placeholder="Enter name"
              maxLength={12}
              className="w-full px-4 py-2.5 bg-white/10 border border-white/30 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent backdrop-blur-sm"
            />
            {errors.name && (
              <p className="text-xs text-red-400">{errors.name}</p>
            )}
            <p className="text-xs text-gray-400">2-12 characters</p>
          </div>

          {/* City */}
          <div className="space-y-3 dropdown-container">
            <label className="block text-sm font-semibold text-white">
              Where are you from?
            </label>
            <div className="relative">
              <input
                type="text"
                value={city ? city.name : citySearch}
                onChange={(e) => {
                  setCitySearch(e.target.value);
                  setCity(null);
                  setShowCityDropdown(true);
                }}
                onFocus={() => setShowCityDropdown(true)}
                placeholder="Search and select city..."
                className="w-full px-4 py-2.5 pl-10 bg-white/10 border border-white/30 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent backdrop-blur-sm"
              />
              <svg 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {showCityDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-black/90 backdrop-blur-md border border-white/30 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredCities.length > 0 ? filteredCities.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => {
                        setCity(c);
                        setCitySearch('');
                        setShowCityDropdown(false);
                        if (errors.city) setErrors(prev => ({ ...prev, city: '' }));
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-white hover:bg-red-500/20 transition-colors border-b border-white/10 last:border-b-0"
                    >
                      {c.name}
                    </button>
                  )) : (
                    <div className="px-4 py-2 text-sm text-gray-400">No cities found</div>
                  )}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={getUserLocation}
              className="w-full px-3 py-1.5 text-xs bg-white/10 border border-white/30 text-white rounded-lg hover:bg-white/20 transition-colors backdrop-blur-sm"
            >
              📍 Use My Location
            </button>
            {errors.city && (
              <p className="text-xs text-red-400">{errors.city}</p>
            )}
          </div>

          {/* Culture */}
          <div className="space-y-3 dropdown-container">
            <label className="block text-sm font-semibold text-white">
              What is your culture?
            </label>
            <div className="relative">
              <input
                type="text"
                value={culture || cultureSearch}
                onChange={(e) => {
                  setCultureSearch(e.target.value);
                  setCulture('');
                  setShowCultureDropdown(true);
                }}
                onFocus={() => setShowCultureDropdown(true)}
                placeholder="Search and select culture..."
                className="w-full px-4 py-2.5 pl-10 bg-white/10 border border-white/30 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent backdrop-blur-sm"
              />
              <svg 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {showCultureDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-black/90 backdrop-blur-md border border-white/30 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                  {filteredCultures.length > 0 ? filteredCultures.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        setCulture(c);
                        setCultureSearch('');
                        setShowCultureDropdown(false);
                        if (errors.culture) setErrors(prev => ({ ...prev, culture: '' }));
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-white hover:bg-red-500/20 transition-colors border-b border-white/10 last:border-b-0"
                    >
                      {c}
                    </button>
                  )) : (
                    <div className="px-4 py-2 text-sm text-gray-400">No cultures found</div>
                  )}
                </div>
              )}
            </div>
            {errors.culture && (
              <p className="text-xs text-red-400">{errors.culture}</p>
            )}
          </div>
        </div>

        {/* Error Message */}
        {errors.submit && (
          <div className="mt-6 bg-red-500/20 border border-red-400 text-red-300 px-4 py-3 rounded-lg text-sm text-center backdrop-blur-sm">
            {errors.submit}
          </div>
        )}

        {/* Submit Button */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-8 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {isLoading ? 'Entering...' : 'Enter Zo World'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleOnboarding;
