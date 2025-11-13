'use client';

import React, { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { upsertUserFromPrivy } from '@/lib/privyDb';

interface ProfileSetupProps {
  isVisible: boolean;
  onComplete: () => void;
  onClose: () => void;
  onOpenDashboard?: () => void;
}

interface ProfileData {
  name: string;
  bio: string;
  culture: string;
  lat: number | null;
  lng: number | null;
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

const ProfileSetup: React.FC<ProfileSetupProps> = ({ 
  isVisible, 
  onComplete, 
  onClose,
  onOpenDashboard
}) => {
  const { user: privyUser, authenticated: privyAuthenticated } = usePrivy();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    bio: '',
    culture: '',
    lat: null,
    lng: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasPostedOnX, setHasPostedOnX] = useState(false);

  if (!isVisible) return null;

  // Privy authentication required
  if (!privyAuthenticated || !privyUser) {
    return (
      <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
        <div className="paper-overlay p-6 max-w-md">
          <h3 className="text-lg font-bold mb-4">🦄 Authentication Required</h3>
          <p className="mb-4">Please sign in with Privy to continue creating your profile.</p>
          <button onClick={onClose} className="paper-button w-full">
            Close
          </button>
        </div>
      </div>
    );
  }

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!profileData.name.trim()) {
          newErrors.name = 'Your unicorn must have a name with at least 2 characters and not more than 12.';
        } else if (profileData.name.length < 2) {
          newErrors.name = 'Your unicorn must have a name with at least 2 characters and not more than 12.';
        } else if (profileData.name.length > 12) {
          newErrors.name = 'Your unicorn must have a name with at least 2 characters and not more than 12.';
        }
        break;
      case 2:
        if (!profileData.bio.trim()) {
          newErrors.bio = 'Please tell us why you deserve to exist as a unicorn.';
        } else if (profileData.bio.length < 10) {
          newErrors.bio = 'Please tell us why you deserve to exist as a unicorn.';
        }
        break;
      case 3:
        if (!profileData.culture) {
          newErrors.culture = 'Please choose a culture for your unicorn';
        }
        break;
      case 4:
        if (!profileData.lat || !profileData.lng) {
          newErrors.location = 'Please tell us where your unicorn is based';
        }
        break;
      case 5:
        // X connection step - optional but recommended
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
    setErrors({}); // Clear previous errors
    
    try {
      console.log('💾 Saving Privy user profile:', {
        privyUserId: privyUser.id,
        email: privyUser.email?.address,
        profileData: {
          name: profileData.name.trim(),
          bio: profileData.bio.trim(),
          culture: profileData.culture,
          lat: profileData.lat,
          lng: profileData.lng,
        }
      });

      // Save to users table via Privy helper
      const result = await upsertUserFromPrivy(privyUser, {
        name: profileData.name.trim(),
        bio: profileData.bio.trim() || null,
        culture: profileData.culture || null,
        lat: profileData.lat,
        lng: profileData.lng,
        onboarding_completed: true,
        role: 'Member',
      });
      
      if (!result) {
        throw new Error('Failed to save profile - no data returned');
      }
      
      console.log('✅ Profile saved successfully:', result);
      console.log('🔄 Calling onComplete callback...');
      onComplete();
      
      // Open dashboard after successful profile creation
      if (onOpenDashboard) {
        setTimeout(() => {
          onOpenDashboard();
        }, 500);
      }
    } catch (error) {
      console.error('❌ Profile setup failed:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to save profile. Please try again.';
      
      setErrors({ 
        submit: errorMessage + ' Check the console for details.' 
      });
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
            <h3 className="text-base sm:text-lg font-bold">What should this unicorn be called?</h3>
            <p className="text-sm">Choose a name for your unicorn — this is how others will see and remember you.</p>
            <input
              type="text"
              value={profileData.name}
              onChange={(e) => updateProfileData('name', e.target.value)}
              placeholder="Sparkles"
              className="paper-input w-full text-sm sm:text-base"
              maxLength={12}
            />
            {errors.name && <p className="text-red-600 text-xs sm:text-sm">{errors.name}</p>}
          </div>
        );

      case 2:
        return (
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-bold">Why will you become a unicorn?</h3>
            <p className="text-sm">Share your mission, dreams, or what makes you a unique unicorn.</p>
            <textarea
              value={profileData.bio}
              onChange={(e) => updateProfileData('bio', e.target.value)}
              placeholder="Because I believe in magic, innovation, and absurd dreams..."
              className="paper-input w-full h-20 sm:h-24 resize-none text-sm sm:text-base"
              maxLength={111}
            />
            <div className="flex justify-between text-xs sm:text-sm">
              <span>{errors.bio && <span className="text-red-600">{errors.bio}</span>}</span>
              <span>{profileData.bio.length}/111</span>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-bold">Choose the culture for your unicorn</h3>
            <p className="text-sm">Choose the culture that best represents your unicorn&apos;s interests or vibe.</p>
            <div className="grid grid-cols-2 gap-2 max-h-40 sm:max-h-48 overflow-y-auto">
              {CULTURE_OPTIONS.map((culture) => (
                <button
                  key={culture}
                  onClick={() => updateProfileData('culture', culture)}
                  className={`p-2 sm:p-3 text-xs sm:text-sm transition-colors ${
                    profileData.culture === culture
                      ? 'paper-button'
                      : 'paper-card hover:shadow-md'
                  }`}
                >
                  {culture}
                </button>
              ))}
            </div>
            {errors.culture && <p className="text-red-600 text-xs sm:text-sm">{errors.culture}</p>}
          </div>
        );

      case 4:
        return (
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-bold">Where is your unicorn based?</h3>
            <p className="text-sm">This helps connect your unicorn with nearby members and events.</p>
            <div className="space-y-3">
              <button
                type="button"
                onClick={getUserLocation}
                className="paper-button w-full p-2 sm:p-3 text-sm sm:text-base"
              >
                📍 Use My Current Location
              </button>
              <div className="text-center text-sm">or</div>
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
                    className={`p-1.5 sm:p-2 text-xs sm:text-sm transition-colors ${
                      profileData.lat === city.lat && profileData.lng === city.lng
                        ? 'paper-button'
                        : 'paper-card hover:shadow-md'
                    }`}
                  >
                    {city.name}
                  </button>
                ))}
              </div>
              {profileData.lat && profileData.lng && (
                <div className="text-center text-sm">
                  ✅ Location set: {profileData.lat.toFixed(2)}, {profileData.lng.toFixed(2)}
                </div>
              )}
            </div>
            {errors.location && <p className="text-red-600 text-xs sm:text-sm">{errors.location}</p>}
          </div>
        );

      case 5:
        return (
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-bold">🦄 Summon your Unicorn on X</h3>
            <p className="text-sm">Share your unicorn transformation with the world!</p>
            
            <div className="paper-card p-4 bg-black text-white space-y-3">
              <p className="text-sm font-mono">
                "I will become a unicorn 🦄"
              </p>
              <p className="text-xs opacity-70">
                Connect your X account and share this post to complete your transformation.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                const tweetText = encodeURIComponent("I will become a unicorn 🦄 @zohouse");
                window.open(`https://twitter.com/intent/tweet?text=${tweetText}`, '_blank');
                setHasPostedOnX(true);
              }}
              className="paper-button w-full p-3 text-sm sm:text-base"
            >
              𝕏 Post "I will become a unicorn"
            </button>

            {hasPostedOnX && (
              <div className="text-center text-sm text-green-600 font-semibold">
                ✅ Thank you for sharing! Your unicorn journey begins now.
              </div>
            )}

            <p className="text-xs text-center opacity-70">
              This step is optional but helps spread the magic! 🪄
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center p-2 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      
      {/* Setup Container */}
      <div className="relative paper-overlay p-4 sm:p-6 w-full max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div>
            <h2 className="text-lg sm:text-xl font-bold">Profile Setup</h2>
            <p className="text-sm">Step {currentStep} of 5</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4 sm:mb-6">
          <div className="flex space-x-1 sm:space-x-2">
            {[1, 2, 3, 4, 5].map((step) => (
              <div
                key={step}
                className={`flex-1 h-2 border-2 border-black ${
                  step <= currentStep ? 'bg-black' : 'bg-white'
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
          <div className="mb-4 paper-card p-2 sm:p-3 border-red-600">
            <p className="text-red-600 text-xs sm:text-sm">{errors.submit}</p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between gap-2">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className={`px-3 sm:px-4 py-2 text-sm sm:text-base ${
              currentStep === 1
                ? 'paper-card opacity-50 cursor-not-allowed'
                : 'paper-card hover:shadow-md'
            }`}
          >
            Back
          </button>
          
          <div className="flex gap-2">
            <button
              onClick={handleNext}
              disabled={isLoading}
              className="paper-button px-4 sm:px-6 py-2 text-sm sm:text-base"
            >
              {isLoading ? 'Summoning...' : currentStep === 5 ? '🦄 Summon Unicorn' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup; 