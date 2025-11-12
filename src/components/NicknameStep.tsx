'use client';

import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { upsertUserFromPrivy } from '@/lib/privyDb';
import QuantumSyncHeader from './QuantumSyncHeader';
import type { FormEvent } from 'react';

interface NicknameStepProps {
  onNicknameSet: () => void;
}

// Gender selector component (matching Figma exactly - toggle style)
function GenderSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative flex items-center justify-center h-[48px] w-[116px] bg-[#49494A] rounded-full p-[2px]">
      {/* Selected indicator background */}
      <div 
        className={`absolute top-[2px] h-[44px] w-[56px] bg-zo-accent rounded-full transition-all duration-300 ${
          value === 'male' ? 'left-[2px]' : 'left-[58px]'
        }`}
      />
      
      {/* Male button */}
      <button
        className="relative z-10 flex items-center justify-center h-[44px] w-[56px] rounded-full transition-all duration-300"
        onClick={() => onChange('male')}
        type="button"
      >
        <div className="w-[32px] h-[32px] rounded-full overflow-hidden flex items-center justify-center bg-[#FF6B6B]">
          <span className="text-[20px]">👨</span>
        </div>
      </button>
      
      {/* Female button */}
      <button
        className="relative z-10 flex items-center justify-center h-[44px] w-[56px] rounded-full transition-all duration-300"
        onClick={() => onChange('female')}
        type="button"
      >
        <div className="w-[32px] h-[32px] rounded-full overflow-hidden flex items-center justify-center bg-[#8E8E93]">
          <span className="text-[20px]">👩</span>
        </div>
      </button>
    </div>
  );
}

export default function NicknameStep({ onNicknameSet }: NicknameStepProps) {
  const { user: privyUser, authenticated } = usePrivy();
  
  const [nickname, setNickname] = useState('');
  const [city, setCity] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  
  // Validation states (matching mobile app exactly)
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const isLengthValid = nickname.length >= 4 && nickname.length <= 16;
  const isAlphanumeric = /^[a-z0-9]*$/.test(nickname);
  const isCityValid = locationEnabled && city.trim().length > 0;
  
  const isValid = isLengthValid && isAlphanumeric && isAvailable === true && isCityValid;

  // Check nickname availability (debounced, matching mobile app)
  useEffect(() => {
    if (!nickname || nickname.length < 4) {
      setIsAvailable(null);
      setIsChecking(false);
      return;
    }
    
    if (!isAlphanumeric || !isLengthValid) {
      setIsAvailable(null);
      setIsChecking(false);
      return;
    }
    
    setIsChecking(true);
    const timer = setTimeout(async () => {
      // TODO: Integrate with actual API endpoint
      // For now, just simulate availability check
      console.log('🔍 Checking availability for:', nickname);
      await new Promise(resolve => setTimeout(resolve, 800));
      setIsAvailable(true);
      setIsChecking(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [nickname, isAlphanumeric, isLengthValid]);

  const handleGetCitizenship = async () => {
    if (!isValid) {
      setError('Please fix validation errors');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    if (!privyUser) {
      setError('Not authenticated');
      setIsLoading(false);
      return;
    }
    
    try {
      console.log('🎬 Saving nickname, gender, and city to database...');
      const user = await upsertUserFromPrivy(privyUser, {
        name: nickname,
        city: city || null, // Save city if available
      });
      
      // Save nickname and city to localStorage for subsequent steps
      localStorage.setItem('zo_nickname', nickname);
      localStorage.setItem('zo_city', city);
      
      console.log('✅ Nickname and city saved successfully!', city ? `City: ${city}` : 'No city');
      console.log('➡️ Moving to avatar selection...');
      onNicknameSet();
    } catch (err) {
      console.error('❌ Error saving nickname:', err);
      setError('Failed to save. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle location button click
  const handleEnableLocation = () => {
    if ('geolocation' in navigator) {
      setIsGettingLocation(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            // Use reverse geocoding to get city name
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`
            );
            const data = await response.json();
            const detectedCity = data.city || data.locality || data.principalSubdivision || '';
            if (detectedCity) {
              setCity(detectedCity);
              setLocationEnabled(true);
              console.log('✅ Location detected:', detectedCity);
            }
          } catch (err) {
            console.error('Failed to get city name:', err);
            setError('Failed to detect location. Please try again.');
          } finally {
            setIsGettingLocation(false);
          }
        },
        (error) => {
          console.log('Location permission denied or error:', error);
          setError('Location access denied. Please enable location permissions.');
          setIsGettingLocation(false);
        }
      );
    } else {
      setError('Geolocation is not supported by your browser.');
    }
  };

  if (!authenticated || !privyUser) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-black max-w-screen w-screen h-screen overflow-hidden md:max-w-[360px] md:max-h-[800px] md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-lg md:shadow-[0_0_40px_rgba(0,0,0,0.8)]">
      {/* Background - Figma exact with video */}
      <div className="absolute inset-0 z-0">
        {/* Fallback black background - always visible */}
        <div className="absolute bg-black inset-0" />
        
        {/* Background Video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-40"
          onError={(e) => console.error('❌ Background video failed to load:', e)}
          onLoadedData={() => console.log('✅ Background video loaded')}
          onPlay={() => console.log('▶️ Background video playing')}
        >
          <source src="/videos/loading-screen-background.mp4" type="video/mp4" />
        </video>
        
        {/* Gradient overlay */}
        <div className="absolute bg-gradient-to-b from-[50.721%] from-transparent to-black inset-0" />
      </div>
      
      {/* Home Indicator at bottom */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[24px] w-[360px] flex items-center justify-center z-10">
        <div className="w-[72px] h-[5px] bg-white rounded-full" />
      </div>

      {/* Zo Logo - adjusted positioning */}
      <div className="absolute left-[24px] top-[40px] w-[40px] h-[40px] overflow-clip z-10">
        <img src="/figma-assets/landing-zo-logo.png" alt="Zo" className="w-full h-full object-cover" />
      </div>
      
      <div className="relative z-10 w-full h-full flex flex-col items-center">
        {/* Title - Figma: top-[192px] */}
        <h1 className="absolute top-[192px] left-1/2 -translate-x-1/2 font-['Syne'] text-[32px] font-extrabold text-white text-center leading-[32px] tracking-[0.32px] uppercase w-[312px] m-0">
          WHO ARE YOU?
        </h1>
        
        {/* Subtitle - Figma: top-[244px] */}
        <p className="absolute top-[244px] left-1/2 -translate-x-1/2 font-rubik text-[14px] font-normal text-white/60 text-center leading-[21px] m-0 w-[312px]">
          A difficult question, I know. We'll get to it.<br />
          But let's start with choosing a nick.
        </p>
        
        {/* Nickname Input - Figma: top-[304px] */}
        <div className="absolute top-[304px] left-1/2 -translate-x-1/2 w-[312px] h-[56px]">
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value.toLowerCase())}
            placeholder="samurai"
            maxLength={16}
            className="w-full h-full px-5 bg-black border-[1px] border-[#49494A] rounded-button text-white text-[16px] font-rubik font-normal placeholder:text-white/40 focus:outline-none focus:border-zo-accent transition-all duration-200"
            autoFocus
            autoComplete="off"
          />
        </div>
        
        {/* Gender Selector - Figma: top-[376px] */}
        <div className="absolute top-[376px] left-1/2 -translate-x-1/2">
          <GenderSelector value={gender} onChange={(v) => setGender(v as 'male' | 'female')} />
        </div>
        
        {/* Location Button (hidden in Figma but keeping for functionality) */}
        {!locationEnabled && (
          <button
            onClick={handleEnableLocation}
            disabled={isGettingLocation}
            className="absolute top-[444px] left-1/2 -translate-x-1/2 w-[312px] h-[48px] px-5 py-3 bg-white/10 backdrop-blur-sm text-white/80 border-[1px] border-white/20 rounded-button font-rubik text-[14px] font-medium cursor-pointer transition-all duration-200 hover:bg-white/15 hover:border-white/40 disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
          >
            {isGettingLocation ? '🌐 Detecting location...' : '📍 Enable Location'}
          </button>
        )}
        
        {/* "Get Citizenship" Button - centered */}
        <button
          onClick={handleGetCitizenship}
          disabled={!isValid || isLoading}
          className={`absolute left-1/2 -translate-x-1/2 bg-white flex items-center gap-4 justify-center overflow-clip px-5 py-4 rounded-button w-[312px] h-[56px] cursor-pointer transition-all duration-200 hover:bg-gray-100 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${
            locationEnabled ? 'top-[444px]' : 'top-[508px]'
          }`}
          type="button"
        >
          <span className="font-rubik text-[16px] font-medium text-zo-dark leading-normal">
          {isLoading ? 'Processing...' : 'Get Citizenship'}
          </span>
        </button>

        {error && (
          <p className="absolute bottom-[100px] left-1/2 -translate-x-1/2 font-rubik text-[14px] font-medium text-red-400 text-center w-[312px]">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

