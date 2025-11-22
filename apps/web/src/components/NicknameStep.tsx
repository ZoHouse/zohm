'use client';

import { useState, useEffect } from 'react';
import { useZoAuth } from '@/hooks/useZoAuth';
import { upsertUserFromPrivy } from '@/lib/privyDb';
import QuantumSyncHeader from './QuantumSyncHeader';
import type { FormEvent } from 'react';

interface NicknameStepProps {
  onNicknameSet: () => void;
}

// Body Type selector component (bro/bae matching ZO API spec)
function BodyTypeSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col items-center gap-3">
      {/* Label */}
      <p className="font-rubik text-[14px] font-normal text-white/80 text-center">
        Choose your avatar style
      </p>
      
      <div className="flex gap-4">
        {/* Bro button (male) */}
        <button
          className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 bg-white/20 backdrop-blur-sm transition-all duration-300 ${
            value === 'bro' 
              ? 'border-zo-accent shadow-[0_0_20px_rgba(207,255,80,0.4)] scale-105' 
              : 'border-white/30 hover:border-zo-accent/50 hover:bg-white/30'
          }`}
          onClick={() => onChange('bro')}
          type="button"
        >
          <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center bg-white/10">
            <img 
              src="/bro.png" 
              alt="Bro avatar" 
              className="w-full h-full object-cover"
            />
          </div>
          <span className="font-rubik text-[14px] font-medium text-white">
            Bro
          </span>
          {value === 'bro' && (
            <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-zo-accent flex items-center justify-center">
              <span className="text-zo-dark text-[14px] font-bold">✓</span>
            </div>
          )}
        </button>
      
        {/* Bae button (female) */}
        <button
          className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 bg-white/20 backdrop-blur-sm transition-all duration-300 ${
            value === 'bae' 
              ? 'border-zo-accent shadow-[0_0_20px_rgba(207,255,80,0.4)] scale-105' 
              : 'border-white/30 hover:border-zo-accent/50 hover:bg-white/30'
          }`}
          onClick={() => onChange('bae')}
          type="button"
        >
          <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center bg-white/10">
            <img 
              src="/bae.png" 
              alt="Bae avatar" 
              className="w-full h-full object-cover"
            />
          </div>
          <span className="font-rubik text-[14px] font-medium text-white">
            Bae
          </span>
          {value === 'bae' && (
            <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-zo-accent flex items-center justify-center">
              <span className="text-zo-dark text-[14px] font-bold">✓</span>
            </div>
          )}
        </button>
      </div>
    </div>
  );
}

export default function NicknameStep({ onNicknameSet }: NicknameStepProps) {
  const { authenticated, userProfile, user: privyUser } = useZoAuth();
  
  const [nickname, setNickname] = useState('');
  const [city, setCity] = useState('');
  const [bodyType, setBodyType] = useState<'bro' | 'bae'>('bro');
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
    
    if (!authenticated || (!privyUser && !userProfile)) {
      setError('Not authenticated');
      setIsLoading(false);
      return;
    }
    
    try {
      console.log('🎬 Saving nickname, body_type, and city to database...');
      // For ZO users, use userProfile; for Privy users, use privyUser
      const authUser = privyUser || userProfile;
      const user = await upsertUserFromPrivy(authUser as any, {
        name: nickname,
        city: city || null, // Save city if available
        body_type: bodyType, // Save body type for avatar generation
      });
      
      // Save data to localStorage for subsequent steps
      localStorage.setItem('zo_nickname', nickname);
      localStorage.setItem('zo_city', city);
      localStorage.setItem('zo_body_type', bodyType);
      
      console.log('✅ Nickname, body type, and city saved successfully!', { bodyType, city: city || 'No city' });
      console.log('➡️ Moving to avatar generation...');
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

  if (!authenticated) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-black w-screen h-screen overflow-hidden">
      {/* Background - Full screen on all devices */}
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
      
      {/* Home Indicator at bottom - Mobile only */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[24px] w-[360px] flex items-center justify-center z-10 md:hidden">
        <div className="w-[72px] h-[5px] bg-white rounded-full" />
      </div>

      {/* Zo Logo */}
      <div className="absolute left-[24px] top-[40px] w-[40px] h-[40px] md:w-[60px] md:h-[60px] md:left-[60px] md:top-[60px] overflow-clip z-10">
        <img src="/figma-assets/landing-zo-logo.png" alt="Zo" className="w-full h-full object-cover" />
      </div>
      
      <div className="relative z-10 w-full h-full flex flex-col items-center">
        {/* Title - Mobile: fixed position, Desktop: responsive */}
        <h1 className="absolute top-[192px] md:top-[20vh] left-1/2 -translate-x-1/2 font-['Syne'] text-[32px] md:text-[48px] lg:text-[56px] font-extrabold text-white text-center leading-[32px] md:leading-[50px] lg:leading-[60px] tracking-[0.32px] uppercase w-[312px] md:w-[600px] m-0">
          WHO ARE YOU?
        </h1>
        
        {/* Subtitle - Mobile: fixed position, Desktop: responsive */}
        <p className="absolute top-[244px] md:top-[30vh] left-1/2 -translate-x-1/2 font-rubik text-[14px] md:text-[16px] lg:text-[18px] font-normal text-white/60 text-center leading-[21px] md:leading-[24px] lg:leading-[28px] m-0 w-[312px] md:w-[500px]">
          A difficult question, I know. We'll get to it.<br />
          But let's start with choosing a nick.
        </p>
        
        {/* Nickname Input - Mobile: fixed position, Desktop: responsive */}
        <div className="absolute top-[304px] md:top-[40vh] left-1/2 -translate-x-1/2 w-[312px] md:w-[360px] h-[56px] md:h-[56px]">
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value.toLowerCase())}
            placeholder="samurai"
            maxLength={16}
            className="w-full h-full px-5 bg-black border-[1px] border-[#49494A] rounded-button text-white text-[16px] md:text-[16px] font-rubik font-normal placeholder:text-white/40 focus:outline-none focus:border-zo-accent transition-all duration-200"
            autoFocus
            autoComplete="off"
          />
        </div>
        
        {/* Body Type Selector - Mobile: fixed position, Desktop: responsive */}
        <div className="absolute top-[420px] md:top-[50vh] left-1/2 -translate-x-1/2 scale-100 md:scale-100">
          <BodyTypeSelector value={bodyType} onChange={(v) => setBodyType(v as 'bro' | 'bae')} />
        </div>
        
        {/* Location Button - Mobile: fixed position, Desktop: responsive */}
        {!locationEnabled && (
          <button
            onClick={handleEnableLocation}
            disabled={isGettingLocation}
            className="absolute top-[600px] md:top-[72vh] left-1/2 -translate-x-1/2 w-[312px] md:w-[360px] h-[48px] md:h-[48px] px-5 py-3 bg-white/10 backdrop-blur-sm text-white/80 border-[1px] border-white/20 rounded-button font-rubik text-[14px] md:text-[14px] font-medium cursor-pointer transition-all duration-200 hover:bg-white/15 hover:border-white/40 disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
          >
            {isGettingLocation ? '🌐 Detecting location...' : '📍 Enable Location'}
          </button>
        )}
        
        {/* "Get Citizenship" Button - Mobile: fixed position, Desktop: responsive */}
        <button
          onClick={handleGetCitizenship}
          disabled={!isValid || isLoading}
          className={`absolute left-1/2 -translate-x-1/2 bg-white flex items-center gap-4 justify-center overflow-clip px-5 py-4 rounded-button w-[312px] md:w-[360px] h-[56px] md:h-[56px] cursor-pointer transition-all duration-300 hover:bg-gray-100 hover:shadow-[0_0_30px_rgba(207,255,80,0.2)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${
            locationEnabled ? 'top-[600px] md:top-[72vh]' : 'top-[664px] md:top-[82vh]'
          }`}
          type="button"
        >
          <span className="font-rubik text-[16px] md:text-[16px] font-medium text-zo-dark leading-normal">
          {isLoading ? 'Processing...' : 'Get Citizenship'}
          </span>
        </button>

        {error && (
          <p className="absolute bottom-[100px] md:bottom-[10vh] left-1/2 -translate-x-1/2 font-rubik text-[14px] md:text-[16px] font-medium text-red-400 text-center w-[312px] md:w-[400px]">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

