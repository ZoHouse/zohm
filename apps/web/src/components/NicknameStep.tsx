'use client';

import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { upsertUserFromPrivy } from '@/lib/privyDb';

interface NicknameStepProps {
  onNicknameSet: () => void;
}

// Body Type selector component (bro/bae matching ZO API spec)
function BodyTypeSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col items-center gap-3 md:gap-4 lg:gap-5">
      {/* Label */}
      <p className="font-rubik text-[14px] md:text-[16px] lg:text-[18px] font-normal text-white/80 text-center">
        Choose your avatar style
      </p>
      
      <div className="flex gap-4 md:gap-6 lg:gap-8">
        {/* Bro button (male) */}
      <button
          className={`relative flex flex-col items-center gap-2 md:gap-3 p-4 md:p-5 lg:p-6 rounded-2xl border-2 transition-all duration-300 ${
            value === 'bro' 
              ? 'border-zo-accent bg-zo-accent/10 scale-105 shadow-[0_0_20px_rgba(207,255,80,0.4)]' 
              : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10 active:scale-95'
          }`}
          onClick={() => onChange('bro')}
        type="button"
      >
          <div className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600">
            <span className="text-[40px] md:text-[48px] lg:text-[56px]">👨</span>
          </div>
          <span className={`font-rubik text-[14px] md:text-[16px] lg:text-[18px] font-medium transition-colors ${
            value === 'bro' ? 'text-zo-accent' : 'text-white/60'
          }`}>
            Bro
          </span>
          {value === 'bro' && (
            <div className="absolute -top-2 -right-2 md:-top-3 md:-right-3 w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 rounded-full bg-zo-accent flex items-center justify-center">
              <span className="text-zo-dark text-[14px] md:text-[16px] lg:text-[18px] font-bold">✓</span>
        </div>
          )}
      </button>
      
        {/* Bae button (female) */}
      <button
          className={`relative flex flex-col items-center gap-2 md:gap-3 p-4 md:p-5 lg:p-6 rounded-2xl border-2 transition-all duration-300 ${
            value === 'bae' 
              ? 'border-zo-accent bg-zo-accent/10 scale-105 shadow-[0_0_20px_rgba(207,255,80,0.4)]' 
              : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10 active:scale-95'
          }`}
          onClick={() => onChange('bae')}
        type="button"
      >
          <div className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-pink-400 to-pink-600">
            <span className="text-[40px] md:text-[48px] lg:text-[56px]">👩</span>
          </div>
          <span className={`font-rubik text-[14px] md:text-[16px] lg:text-[18px] font-medium transition-colors ${
            value === 'bae' ? 'text-zo-accent' : 'text-white/60'
          }`}>
            Bae
          </span>
          {value === 'bae' && (
            <div className="absolute -top-2 -right-2 md:-top-3 md:-right-3 w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 rounded-full bg-zo-accent flex items-center justify-center">
              <span className="text-zo-dark text-[14px] md:text-[16px] lg:text-[18px] font-bold">✓</span>
        </div>
          )}
      </button>
      </div>
    </div>
  );
}

export default function NicknameStep({ onNicknameSet }: NicknameStepProps) {
  const { user: privyUser, authenticated } = usePrivy();
  
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
    
    if (!privyUser) {
      setError('Not authenticated');
      setIsLoading(false);
      return;
    }
    
    try {
      console.log('🎬 Saving nickname, body_type, and city to database...');
      const user = await upsertUserFromPrivy(privyUser, {
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

  if (!authenticated || !privyUser) return null;

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
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[24px] w-full max-w-[360px] flex items-center justify-center z-10 md:hidden px-4">
        <div className="w-[72px] h-[5px] bg-white rounded-full" />
      </div>

      {/* Zo Logo */}
      <div className="absolute left-4 top-10 md:left-[60px] md:top-[60px] lg:left-20 lg:top-20 w-[40px] h-[40px] md:w-[60px] md:h-[60px] lg:w-[80px] lg:h-[80px] overflow-clip z-10">
        <img src="/figma-assets/landing-zo-logo.png" alt="Zo" className="w-full h-full object-cover" />
      </div>
      
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center px-4 md:px-6 lg:px-8">
        {/* Content Container - Centered with max-width */}
        <div className="w-full max-w-[600px] lg:max-w-[700px] xl:max-w-[800px] flex flex-col items-center gap-4 md:gap-6 lg:gap-8">
          {/* Title - Responsive positioning */}
          <h1 className="font-['Syne'] text-[28px] sm:text-[32px] md:text-[48px] lg:text-[56px] xl:text-[64px] font-extrabold text-white text-center leading-tight md:leading-[50px] lg:leading-[60px] tracking-[0.32px] uppercase w-full max-w-[312px] sm:max-w-[400px] md:max-w-[600px] lg:max-w-[700px] m-0">
            WHO ARE YOU?
          </h1>
          
          {/* Subtitle - Responsive */}
          <p className="font-rubik text-[13px] sm:text-[14px] md:text-[16px] lg:text-[18px] xl:text-[20px] font-normal text-white/60 text-center leading-relaxed m-0 w-full max-w-[312px] sm:max-w-[400px] md:max-w-[500px] lg:max-w-[600px]">
            A difficult question, I know. We'll get to it.<br />
            But let's start with choosing a nick.
          </p>
          
          {/* Nickname Input - Responsive */}
          <div className="w-full max-w-[312px] sm:max-w-[400px] md:max-w-[480px] lg:max-w-[560px] h-[52px] sm:h-[56px] md:h-[64px] lg:h-[72px]">
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value.toLowerCase())}
              placeholder="samurai"
              maxLength={16}
              className="w-full h-full px-4 sm:px-5 md:px-6 bg-black border-[1px] border-[#49494A] rounded-button text-white text-[16px] sm:text-[17px] md:text-[18px] lg:text-[20px] font-rubik font-normal placeholder:text-white/40 focus:outline-none focus:border-zo-accent transition-all duration-200"
              autoFocus
              autoComplete="off"
            />
            {/* Validation feedback */}
            {nickname.length > 0 && (
              <div className="mt-2 flex flex-col gap-1">
                {!isLengthValid && (
                  <p className="text-[12px] md:text-[13px] text-red-400 font-rubik">
                    Must be 4-16 characters
                  </p>
                )}
                {!isAlphanumeric && nickname.length > 0 && (
                  <p className="text-[12px] md:text-[13px] text-red-400 font-rubik">
                    Only lowercase letters and numbers
                  </p>
                )}
                {isChecking && (
                  <p className="text-[12px] md:text-[13px] text-white/60 font-rubik">
                    Checking availability...
                  </p>
                )}
                {isAvailable === true && !isChecking && (
                  <p className="text-[12px] md:text-[13px] text-green-400 font-rubik">
                    ✓ Available
                  </p>
                )}
              </div>
            )}
          </div>
          
          {/* Body Type Selector - Responsive */}
          <div className="w-full flex justify-center scale-100 md:scale-105 lg:scale-110">
            <BodyTypeSelector value={bodyType} onChange={(v) => setBodyType(v as 'bro' | 'bae')} />
          </div>
          
          {/* Location Button - Responsive */}
          {!locationEnabled && (
            <button
              onClick={handleEnableLocation}
              disabled={isGettingLocation}
              className="w-full max-w-[312px] sm:max-w-[400px] md:max-w-[480px] lg:max-w-[560px] h-[48px] sm:h-[52px] md:h-[56px] lg:h-[64px] px-4 sm:px-5 md:px-6 bg-white/10 backdrop-blur-sm text-white/80 border-[1px] border-white/20 rounded-button font-rubik text-[14px] sm:text-[15px] md:text-[16px] lg:text-[18px] font-medium cursor-pointer transition-all duration-200 hover:bg-white/15 hover:border-white/40 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              type="button"
            >
              {isGettingLocation ? '🌐 Detecting location...' : '📍 Enable Location'}
            </button>
          )}
          
          {/* City Display when enabled */}
          {locationEnabled && city && (
            <div className="w-full max-w-[312px] sm:max-w-[400px] md:max-w-[480px] lg:max-w-[560px] px-4 py-3 bg-green-500/20 border border-green-500/40 rounded-button">
              <p className="text-[14px] md:text-[16px] text-green-400 font-rubik text-center">
                ✓ Location: {city}
              </p>
            </div>
          )}
          
          {/* "Get Citizenship" Button - Responsive */}
          <button
            onClick={handleGetCitizenship}
            disabled={!isValid || isLoading}
            className="w-full max-w-[312px] sm:max-w-[400px] md:max-w-[480px] lg:max-w-[560px] h-[52px] sm:h-[56px] md:h-[64px] lg:h-[72px] bg-white flex items-center gap-4 justify-center overflow-clip px-4 sm:px-5 md:px-6 rounded-button cursor-pointer transition-all duration-300 hover:bg-gray-100 hover:shadow-[0_0_30px_rgba(207,255,80,0.2)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
          >
            <span className="font-rubik text-[16px] sm:text-[17px] md:text-[18px] lg:text-[20px] xl:text-[22px] font-medium text-zo-dark leading-normal">
              {isLoading ? 'Processing...' : 'Get Citizenship'}
            </span>
          </button>

          {/* Error Message - Responsive */}
          {error && (
            <p className="w-full max-w-[312px] sm:max-w-[400px] md:max-w-[480px] lg:max-w-[560px] font-rubik text-[13px] sm:text-[14px] md:text-[16px] font-medium text-red-400 text-center px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-lg">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

