'use client';

import React, { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { upsertUserFromPrivy } from '@/lib/privyDb';
import MacBezel from './MacBezel';
import MacScreen from './MacScreen';
import MacDialog from './MacDialog';
import MacButton from './MacButton';
import MacInput from './MacInput';

interface MacProfileSetupProps {
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

const CITIES = [
  { name: 'San Francisco', lat: 37.7749, lng: -122.4194 },
  { name: 'New York', lat: 40.7128, lng: -74.0060 },
  { name: 'London', lat: 51.5074, lng: -0.1278 },
  { name: 'Bangalore', lat: 12.9716, lng: 77.5946 },
  { name: 'Singapore', lat: 1.3521, lng: 103.8198 },
  { name: 'Tokyo', lat: 35.6762, lng: 139.6503 }
];

// Unicorn images for each step
const STEP_UNICORNS = [
  '/unicorn images/UnicornMemes_v1-01.png', // Step 1: Name
  '/unicorn images/UnicornMemes_v1-05.png', // Step 2: Bio
  '/unicorn images/UnicornCool.png',         // Step 3: Culture
  '/unicorn images/UnicornRocket.png',       // Step 4: Location
  '/unicorn images/Unicorn_Rainbow.png',     // Step 5: X Post
];

const MacProfileSetup: React.FC<MacProfileSetupProps> = ({
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

  if (!privyAuthenticated || !privyUser) {
    return null;
  }

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!profileData.name.trim() || profileData.name.length < 2 || profileData.name.length > 12) {
          newErrors.name = 'Your unicorn must have a name with at least 2 characters and not more than 12.';
        }
        break;
      case 2:
        if (!profileData.bio.trim() || profileData.bio.length < 10) {
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
        // X connection step - optional
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
    setErrors({});
    
    try {
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
        throw new Error('Failed to save profile');
      }
      
      onComplete();
      
      if (onOpenDashboard) {
        setTimeout(() => {
          onOpenDashboard();
        }, 500);
      }
    } catch (error) {
      console.error('❌ Profile setup failed:', error);
      setErrors({ 
        submit: 'Failed to save profile. Please try again.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfileData = (field: keyof ProfileData, value: string | number) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
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
    }
  };

  const renderStepContent = (step: number) => {
    const unicornImage = STEP_UNICORNS[step - 1];
    
    switch (step) {
      case 1:
        return (
          <div className="flex gap-3">
            <div className="w-24 h-24 flex-shrink-0">
              <img 
                src={unicornImage} 
                alt="Unicorn" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <label className="block font-mono text-xs text-[#222] font-semibold">
                What should this unicorn be called?
              </label>
              <MacInput
                value={profileData.name}
                onChange={(value) => updateProfileData('name', value)}
                placeholder="Sparkles"
                maxLength={12}
                error={errors.name}
              />
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="flex gap-3">
            <div className="w-24 h-24 flex-shrink-0">
              <img 
                src={unicornImage} 
                alt="Unicorn" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <label className="block font-mono text-xs text-[#222] font-semibold">
                Why will you become a unicorn?
              </label>
              <MacInput
                value={profileData.bio}
                onChange={(value) => updateProfileData('bio', value)}
                placeholder="Because I believe in magic..."
                maxLength={111}
                multiline
                rows={3}
                error={errors.bio}
              />
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="flex gap-3">
            <div className="w-24 h-24 flex-shrink-0">
              <img 
                src={unicornImage} 
                alt="Unicorn" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <label className="block font-mono text-xs text-[#222] font-semibold">
                Choose the culture for your unicorn:
              </label>
              <div className="grid grid-cols-2 gap-1.5 max-h-[160px] overflow-y-auto pr-1">
                {CULTURE_OPTIONS.map((culture) => (
                  <button
                    key={culture}
                    onClick={() => updateProfileData('culture', culture)}
                    className={`p-1.5 text-[11px] font-mono text-left rounded border transition-all ${
                      profileData.culture === culture
                        ? 'bg-[#4a8cff] text-white border-[#2b62d6]'
                        : 'bg-white border-[#b0b0b0] hover:border-[#8a8a8a]'
                    }`}
                  >
                    {culture}
                  </button>
                ))}
              </div>
              {errors.culture && <p className="text-xs text-red-600 font-mono">{errors.culture}</p>}
            </div>
          </div>
        );
      
      case 4:
        return (
          <div className="flex gap-3">
            <div className="w-24 h-24 flex-shrink-0">
              <img 
                src={unicornImage} 
                alt="Unicorn" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <label className="block font-mono text-xs text-[#222] font-semibold">
                Where is your unicorn based?
              </label>
              <button
                type="button"
                onClick={getUserLocation}
                className="w-full px-2 py-1.5 font-mono text-[11px] bg-[#e6e6e6] border border-[#7a7a7a] rounded hover:bg-[#ececec]"
              >
                📍 Use My Current Location
              </button>
              <div className="text-center text-[10px] font-mono text-[#666]">or</div>
              <div className="grid grid-cols-3 gap-1.5">
                {CITIES.map((city) => (
                  <button
                    key={city.name}
                    onClick={() => {
                      updateProfileData('lat', city.lat);
                      updateProfileData('lng', city.lng);
                    }}
                    className={`p-1.5 text-[10px] font-mono rounded border transition-all ${
                      profileData.lat === city.lat && profileData.lng === city.lng
                        ? 'bg-[#4a8cff] text-white border-[#2b62d6]'
                        : 'bg-white border-[#b0b0b0] hover:border-[#8a8a8a]'
                    }`}
                  >
                    {city.name}
                  </button>
                ))}
              </div>
              {profileData.lat && profileData.lng && (
                <div className="text-center text-[10px] font-mono text-green-600">
                  ✅ Location set: {profileData.lat.toFixed(2)}, {profileData.lng.toFixed(2)}
                </div>
              )}
              {errors.location && <p className="text-xs text-red-600 font-mono">{errors.location}</p>}
            </div>
          </div>
        );
      
      case 5:
        return (
          <div className="flex gap-3">
            <div className="w-24 h-24 flex-shrink-0">
              <img 
                src={unicornImage} 
                alt="Unicorn" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <label className="block font-mono text-xs text-[#222] font-semibold">
                🦄 Summon your Unicorn on X
              </label>
              <div className="bg-black text-white p-2 rounded font-mono text-[11px]">
                <p>"Unicorns are real @sfoxzo"</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const tweetText = encodeURIComponent("Unicorns are real @sfoxzo");
                  window.open(`https://twitter.com/intent/tweet?text=${tweetText}`, '_blank');
                  setHasPostedOnX(true);
                }}
                className="w-full px-2 py-1.5 font-mono text-[11px] bg-[#4a8cff] text-white border border-[#2b62d6] rounded hover:bg-[#5a9cff]"
              >
                𝕏 Post "Unicorns are real"
              </button>
              {hasPostedOnX && (
                <div className="text-center text-[10px] text-green-600 font-mono font-semibold">
                  ✅ Thank you for sharing!
                </div>
              )}
              <p className="text-[10px] text-center text-[#666] font-mono">
                Optional but helps spread the magic! 🪄
              </p>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <MacBezel>
      <MacScreen title="Unicorn Onboarding">
        <div className="relative h-full p-4">
          {/* Stacked dialogs for visual depth - centered */}
          <div className="absolute inset-x-0 top-24 flex justify-center">
            <div className="relative">
              {/* Background dialog (step - 2) */}
              {currentStep > 2 && (
                <MacDialog
                  title={`Step ${currentStep - 2} of 5`}
                  offset={12}
                  opacity={0.3}
                  blur
                  active={false}
                  width="500px"
                >
                  <div className="h-24" />
                </MacDialog>
              )}
              
              {/* Mid dialog (step - 1) */}
              {currentStep > 1 && (
                <MacDialog
                  title={`Step ${currentStep - 1} of 5`}
                  offset={6}
                  opacity={0.6}
                  blur
                  active={false}
                  width="500px"
                >
                  <div className="h-24" />
                </MacDialog>
              )}
              
              {/* Front dialog (current step) */}
              <MacDialog
                title={`Step ${currentStep} of 5`}
                offset={0}
                opacity={1}
                active={true}
                width="500px"
                height="auto"
              >
                {renderStepContent(currentStep)}
              </MacDialog>
            </div>
          </div>
          
          {/* Progress indicator (top right corner) */}
          <div className="absolute right-4 top-4 w-[100px]">
            <div className="bg-white border border-[#8a8a8a] rounded shadow-md p-1.5">
              <div className="font-mono text-[10px] font-semibold text-[#333] mb-1">Progress</div>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((step) => (
                  <div
                    key={step}
                    className={`flex-1 h-1.5 border border-black ${
                      step <= currentStep ? 'bg-black' : 'bg-white'
                    }`}
                  />
                ))}
              </div>
              <div className="mt-1 text-[9px] font-mono text-[#666] text-center">
                Step {currentStep} of 5
              </div>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
            <MacButton onClick={handleBack} disabled={currentStep === 1 || isLoading}>
              ← Back
            </MacButton>
            <MacButton onClick={handleNext} disabled={isLoading} primary>
              {isLoading ? 'Summoning...' : currentStep === 5 ? '🦄 Summon Unicorn' : 'Next →'}
            </MacButton>
          </div>

          {/* Error display */}
          {errors.submit && (
            <div className="absolute left-4 right-4 bottom-12 bg-red-100 border border-red-600 rounded p-2">
              <p className="text-xs text-red-600 font-mono text-center">{errors.submit}</p>
            </div>
          )}
        </div>
      </MacScreen>
    </MacBezel>
  );
};

export default MacProfileSetup;

