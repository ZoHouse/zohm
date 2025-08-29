'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface ProfileSetupProps {
  isVisible: boolean;
  walletAddress: string;
  onComplete: () => void;
  onClose: () => void;
}

interface ProfileData {
  name: string;
  bio: string;
  culture: string;
  calendar_url: string;
  lat: number | null;
  lng: number | null;
}

const CULTURE_OPTIONS = [
  'Tech & Innovation',
  'Art & Design',
  'Music & Audio',
  'Film & Media',
  'Gaming',
  'DeFi & Finance',
  'NFTs & Collectibles',
  'Web3 Development',
  'Community Building',
  'Education',
  'Health & Wellness',
  'Sustainability',
  'Other'
];

const ProfileSetup: React.FC<ProfileSetupProps> = ({ 
  isVisible, 
  walletAddress, 
  onComplete, 
  onClose 
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    bio: '',
    culture: '',
    calendar_url: '',
    lat: null,
    lng: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isVisible) return null;

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!profileData.name.trim()) {
          newErrors.name = 'Name is required';
        } else if (profileData.name.length < 2) {
          newErrors.name = 'Name must be at least 2 characters';
        }
        break;
      case 2:
        if (!profileData.bio.trim()) {
          newErrors.bio = 'Bio is required';
        } else if (profileData.bio.length < 10) {
          newErrors.bio = 'Bio must be at least 10 characters';
        }
        break;
      case 3:
        if (!profileData.culture) {
          newErrors.culture = 'Please select a culture';
        }
        break;
      case 4:
        if (!profileData.lat || !profileData.lng) {
          newErrors.location = 'Please select your location';
        }
        break;
      case 5:
        if (profileData.calendar_url && !isValidUrl(profileData.calendar_url)) {
          newErrors.calendar_url = 'Please enter a valid URL';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 5) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('members')
        .update({
          name: profileData.name.trim(),
          bio: profileData.bio.trim(),
          culture: profileData.culture,
          lat: profileData.lat,
          lng: profileData.lng,
          calendar_url: profileData.calendar_url.trim() || null,
          last_seen: new Date().toISOString()
        })
        .eq('wallet', walletAddress);

      if (error) {
        throw error;
      }

      console.log('✅ Profile setup completed successfully');
      onComplete();
    } catch (error) {
      console.error('❌ Profile setup failed:', error);
      setErrors({ submit: 'Failed to save profile. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfileData = (field: keyof ProfileData, value: string | number) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          updateProfileData('lat', position.coords.latitude);
          updateProfileData('lng', position.coords.longitude);
        },
        (error) => {
          console.error('Error getting location:', error);
          setErrors(prev => ({ ...prev, location: 'Could not get your location. Please select a city.' }));
        }
      );
    } else {
      setErrors(prev => ({ ...prev, location: 'Geolocation is not supported by this browser.' }));
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-bold">What&apos;s your name?</h3>
            <p className="text-gray-300 text-xs sm:text-sm">This is how other members will see you</p>
            <input
              type="text"
              value={profileData.name}
              onChange={(e) => updateProfileData('name', e.target.value)}
              placeholder="Enter your name"
              className="w-full p-2 sm:p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none text-sm sm:text-base"
              maxLength={50}
            />
            {errors.name && <p className="text-red-400 text-xs sm:text-sm">{errors.name}</p>}
          </div>
        );

      case 2:
        return (
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-bold">Tell us about yourself</h3>
            <p className="text-gray-300 text-xs sm:text-sm">Share your interests, background, or what you&apos;re working on</p>
            <textarea
              value={profileData.bio}
              onChange={(e) => updateProfileData('bio', e.target.value)}
              placeholder="I'm passionate about..."
              className="w-full p-2 sm:p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none h-20 sm:h-24 resize-none text-sm sm:text-base"
              maxLength={300}
            />
            <div className="flex justify-between text-xs sm:text-sm text-gray-400">
              <span>{errors.bio && <span className="text-red-400">{errors.bio}</span>}</span>
              <span>{profileData.bio.length}/300</span>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-bold">What&apos;s your primary culture?</h3>
            <p className="text-gray-300 text-xs sm:text-sm">Choose the community that best represents your interests</p>
            <div className="grid grid-cols-2 gap-2 max-h-40 sm:max-h-48 overflow-y-auto">
              {CULTURE_OPTIONS.map((culture) => (
                <button
                  key={culture}
                  onClick={() => updateProfileData('culture', culture)}
                  className={`p-2 sm:p-3 text-xs sm:text-sm rounded-lg border transition-colors ${
                    profileData.culture === culture
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  {culture}
                </button>
              ))}
            </div>
            {errors.culture && <p className="text-red-400 text-xs sm:text-sm">{errors.culture}</p>}
          </div>
        );

      case 4:
        return (
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-bold">Where are you located?</h3>
            <p className="text-gray-300 text-xs sm:text-sm">This helps connect you with nearby members</p>
            <div className="space-y-3">
              <button
                type="button"
                onClick={getUserLocation}
                className="w-full p-2 sm:p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm sm:text-base"
              >
                📍 Use My Current Location
              </button>
              <div className="text-center text-gray-400 text-xs sm:text-sm">or</div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { name: 'San Francisco', lat: 37.7749, lng: -122.4194 },
                  { name: 'New York', lat: 40.7128, lng: -74.0060 },
                  { name: 'London', lat: 51.5074, lng: -0.1278 },
                  { name: 'Bangalore', lat: 12.9716, lng: 77.5946 },
                  { name: 'Singapore', lat: 1.3521, lng: 103.8198 },
                  { name: 'Tokyo', lat: 35.6762, lng: 139.6503 }
                ].map((city) => (
                  <button
                    key={city.name}
                    onClick={() => {
                      updateProfileData('lat', city.lat);
                      updateProfileData('lng', city.lng);
                    }}
                    className={`p-1.5 sm:p-2 text-xs sm:text-sm rounded-lg border transition-colors ${
                      profileData.lat === city.lat && profileData.lng === city.lng
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    {city.name}
                  </button>
                ))}
              </div>
              {profileData.lat && profileData.lng && (
                <div className="text-center text-green-400 text-xs sm:text-sm">
                  ✅ Location set: {profileData.lat.toFixed(2)}, {profileData.lng.toFixed(2)}
                </div>
              )}
            </div>
            {errors.location && <p className="text-red-400 text-xs sm:text-sm">{errors.location}</p>}
          </div>
        );

      case 5:
        return (
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-bold">Calendar Integration (Optional)</h3>
            <p className="text-gray-300 text-xs sm:text-sm">Share your calendar so others can see when you&apos;re available</p>
            <input
              type="url"
              value={profileData.calendar_url}
              onChange={(e) => updateProfileData('calendar_url', e.target.value)}
              placeholder="https://calendar.google.com/calendar/..."
              className="w-full p-2 sm:p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none text-sm sm:text-base"
            />
            {errors.calendar_url && <p className="text-red-400 text-xs sm:text-sm">{errors.calendar_url}</p>}
            <p className="text-gray-400 text-xs">
              You can add your Google Calendar, Calendly, or any public calendar URL
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-70 backdrop-blur-sm" />
      
      {/* Setup Container */}
      <div className="relative liquid-glass-pane p-4 sm:p-6 w-full max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div>
            <h2 className="text-lg sm:text-xl font-bold">Profile Setup</h2>
            <p className="text-gray-400 text-xs sm:text-sm">Step {currentStep} of 5</p>
          </div>
          <button
            onClick={onClose}
            className="glass-icon-button w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-sm sm:text-base"
          >
            ✕
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-4 sm:mb-6">
          <div className="flex space-x-1 sm:space-x-2">
            {[1, 2, 3, 4, 5].map((step) => (
              <div
                key={step}
                className={`flex-1 h-1.5 sm:h-2 rounded-full ${
                  step <= currentStep ? 'bg-blue-500' : 'bg-gray-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="mb-4 sm:mb-6">
          {renderStep()}
        </div>

        {/* Error Message */}
        {errors.submit && (
          <div className="mb-4 p-2 sm:p-3 bg-red-900 border border-red-700 rounded-lg">
            <p className="text-red-300 text-xs sm:text-sm">{errors.submit}</p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between gap-2">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className={`px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base ${
              currentStep === 1
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'glass-icon-button'
            }`}
          >
            Back
          </button>
          
          <button
            onClick={handleNext}
            disabled={isLoading}
            className="solid-button px-4 sm:px-6 py-2 text-sm sm:text-base"
          >
            {isLoading ? 'Saving...' : currentStep === 5 ? 'Complete Setup' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup; 