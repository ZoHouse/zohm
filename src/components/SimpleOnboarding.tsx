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
  { name: 'New York', lat: 40.7128, lng: -74.006 },
  { name: 'London', lat: 51.5074, lng: -0.1278 },
  { name: 'Bangalore', lat: 12.9716, lng: 77.5946 },
  { name: 'Singapore', lat: 1.3521, lng: 103.8198 },
  { name: 'Tokyo', lat: 35.6762, lng: 139.6503 }
];

const SimpleOnboarding: React.FC<SimpleOnboardingProps> = ({ isVisible, onComplete }) => {
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

  if (!isVisible || !privyAuthenticated || !privyUser) return null;

  const filteredCities = citySearch
    ? CITIES.filter(c => c.name.toLowerCase().includes(citySearch.toLowerCase()))
    : CITIES;

  const filteredCultures = cultureSearch
    ? CULTURE_OPTIONS.filter(c => c.toLowerCase().includes(cultureSearch.toLowerCase()))
    : CULTURE_OPTIONS;

  const handleSubmit = async () => {
    const newErrors: { name?: string; city?: string; culture?: string } = {};

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
        culture,
        lat: city!.lat,
        lng: city!.lng,
        onboarding_completed: true,
        role: 'Member'
      });

      if (!result) {
        throw new Error('Failed to save profile');
      }

      onComplete();
    } catch (error) {
      console.error('❌ Profile setup failed:', error);
      setErrors({ submit: 'Failed to save profile. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;

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
        error => {
          console.error('Error getting location:', error);
          setErrors(prev => ({ ...prev, city: 'Could not get your location. Please select a city.' }));
        }
      );
    }
  };

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
      className="fixed inset-0 bg-black flex items-center justify-center z-[10001] p-4"
      style={{
        backgroundImage: "url('/loading background.gif')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="bg-black/40 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-5xl mx-auto p-6 sm:p-8 border border-white/20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-white">
              What is your name?
            </label>
            <input
              type="text"
              value={name}
              onChange={e => {
                setName(e.target.value);
                if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
              }}
              placeholder="Enter name"
              maxLength={12}
              className="w-full px-4 py-2.5 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent backdrop-blur-sm"
            />
            {errors.name && <p className="text-red-400 text-xs">{errors.name}</p>}
          </div>

          <div className="space-y-3 dropdown-container">
            <label className="block text-sm font-semibold text-white">
              Where do you want to build?
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowCityDropdown(v => !v)}
                className="w-full px-4 py-2.5 bg-white/10 border border-white/30 rounded-lg text-white text-left focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {city ? city.name : 'Select city'}
              </button>
              <button
                type="button"
                onClick={getUserLocation}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-white/70 hover:text-white"
              >
                Use my location
              </button>
              {showCityDropdown && (
                <div className="absolute z-10 w-full mt-2 bg-black/80 border border-white/20 rounded-lg max-h-48 overflow-y-auto">
                  <div className="p-2">
                    <input
                      type="text"
                      value={citySearch}
                      onChange={e => setCitySearch(e.target.value)}
                      placeholder="Search city"
                      className="w-full px-3 py-2 bg-black/60 border border-white/20 rounded text-white text-sm focus:outline-none"
                    />
                  </div>
                  {filteredCities.map(c => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => {
                        setCity(c);
                        setShowCityDropdown(false);
                        if (errors.city) setErrors(prev => ({ ...prev, city: '' }));
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10"
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {errors.city && <p className="text-red-400 text-xs">{errors.city}</p>}
          </div>

          <div className="space-y-3 dropdown-container">
            <label className="block text-sm font-semibold text-white">
              What culture fuels you?
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowCultureDropdown(v => !v)}
                className="w-full px-4 py-2.5 bg-white/10 border border-white/30 rounded-lg text-white text-left focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {culture || 'Select culture'}
              </button>
              {showCultureDropdown && (
                <div className="absolute z-10 w-full mt-2 bg-black/80 border border-white/20 rounded-lg max-h-48 overflow-y-auto">
                  <div className="p-2">
                    <input
                      type="text"
                      value={cultureSearch}
                      onChange={e => setCultureSearch(e.target.value)}
                      placeholder="Search culture"
                      className="w-full px-3 py-2 bg-black/60 border border-white/20 rounded text-white text-sm focus:outline-none"
                    />
                  </div>
                  {filteredCultures.map(option => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        setCulture(option);
                        setShowCultureDropdown(false);
                        if (errors.culture) setErrors(prev => ({ ...prev, culture: '' }));
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {errors.culture && <p className="text-red-400 text-xs">{errors.culture}</p>}
          </div>
        </div>

        {errors.submit && (
          <p className="text-red-400 text-sm mt-4 text-center">{errors.submit}</p>
        )}

        <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
          <div className="text-xs text-white/60">
            Your data is used to build better quests, events, and city drops.
          </div>
          <button
            type="button"
            disabled={isLoading}
            onClick={handleSubmit}
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving...' : 'Enter Zo World'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleOnboarding;
