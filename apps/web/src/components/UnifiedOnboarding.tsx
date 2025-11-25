'use client';

import { useState, useEffect, useRef } from 'react';
import { useZoAuth } from '@/hooks/useZoAuth';
import { upsertUser } from '@/lib/userDb';
import { updateProfile, getProfile } from '@/lib/zo-api/profile';
import PortalAnimation from './PortalAnimation';

interface UnifiedOnboardingProps {
  onComplete: () => void;
  userId?: string;
}

type OnboardingStep = 'input' | 'generating' | 'success' | 'portal';
type BodyType = 'bro' | 'bae';

export default function UnifiedOnboarding({ onComplete, userId }: UnifiedOnboardingProps) {
  const { authenticated, userProfile, reloadProfile } = useZoAuth();
  
  // Flow State
  const [step, setStep] = useState<OnboardingStep>('input');
  
  // Form State
  const [nickname, setNickname] = useState('');
  const [bodyType, setBodyType] = useState<BodyType>('bro');
  const [city, setCity] = useState('');
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  
  // Logic State
  const [isSaving, setIsSaving] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  // Refs for polling
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const attemptsRef = useRef(0);

  // Validation
  const isNicknameValid = nickname.length >= 4 && nickname.length <= 16 && /^[a-z0-9]*$/.test(nickname);
  const canSubmit = isNicknameValid && locationEnabled && bodyType && !isSaving;

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearTimeout(pollingRef.current);
    };
  }, []);

  // Handlers
  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNickname(e.target.value.toLowerCase());
    setError('');
  };

  const handleLocationEnable = () => {
    if ('geolocation' in navigator) {
      setIsLoadingLocation(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`
            );
            const data = await response.json();
            const detectedCity = data.city || data.locality || data.principalSubdivision || 'Unknown City';
            
            // Only enable after we have the city name
            setCity(detectedCity);
            setLocationEnabled(true);
            setIsLoadingLocation(false);
            setError('');
          } catch (err) {
            console.error('Failed to get city:', err);
            setError('Failed to detect location. Please try again.');
            setLocationEnabled(false);
            setIsLoadingLocation(false);
          }
        },
        (err) => {
          console.error('Location error:', err);
          setError('Location access denied. Please enable permissions.');
          setLocationEnabled(false);
          setIsLoadingLocation(false);
        }
      );
    } else {
      setError('Geolocation is not supported by your browser.');
    }
  };

  const getAccessToken = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('zo_access_token') || localStorage.getItem('zo_token');
  };

  const handleGetCitizenship = async () => {
    if (!canSubmit || !userProfile) return;
    
    setIsSaving(true);
    setError('');

    try {
      console.log('🎬 Saving user data...');
      // 1. Save user data to Supabase
      await upsertUser(userProfile, {
        name: nickname,
        city: city,
        body_type: bodyType
      });

      // 2. Save to localStorage
      localStorage.setItem('zo_nickname', nickname);
      localStorage.setItem('zo_city', city);
      localStorage.setItem('zo_body_type', bodyType);

      console.log('✅ User data saved, starting generation...');
      
      // 3. Transition to generation step
      setStep('generating');
      
      // 4. Trigger generation (background)
      triggerAvatarGeneration();
      
    } catch (err) {
      console.error('❌ Error saving user:', err);
      setError('Failed to save. Please try again.');
      setIsSaving(false);
    }
  };

  const triggerAvatarGeneration = async () => {
    const token = getAccessToken();
    if (!token) {
      console.error('❌ No access token found for avatar generation');
      console.error('Available localStorage keys:', {
        zo_access_token: !!localStorage.getItem('zo_access_token'),
        zo_token: !!localStorage.getItem('zo_token'),
        zo_user_id: !!localStorage.getItem('zo_user_id'),
        zo_device_id: !!localStorage.getItem('zo_device_id'),
        zo_device_secret: !!localStorage.getItem('zo_device_secret'),
      });
      // Don't go to success - show error and stay in generating step
      setError('Authentication required. Please log in again.');
      setIsPolling(false);
      // Don't set step to success - let user see the error
      return;
    }

    // Trigger generation by updating profile with all data via API
    // This tells the backend to generate the avatar
    // Web approach: send all fields in one request for efficiency
    try {
      console.log('🚀 Triggering avatar generation via API...');
      console.log('📝 Profile data:', { 
        first_name: nickname,
        body_type: bodyType,
        place_name: city,
        userId: userProfile?.id
      });
      
      // Pass userId and device credentials from localStorage (stored after login)
      const userId = userProfile?.id || localStorage.getItem('zo_user_id');
      const deviceId = localStorage.getItem('zo_device_id');
      const deviceSecret = localStorage.getItem('zo_device_secret');
      
      // Use device credentials from localStorage if available (preferred)
      const deviceCredentials = (deviceId && deviceSecret) 
        ? { deviceId, deviceSecret }
        : undefined;
      
      console.log('🔑 Avatar generation credentials:', {
        hasAccessToken: !!token,
        hasDeviceId: !!deviceId,
        hasDeviceSecret: !!deviceSecret,
        userId,
      });
      
      console.log('📞 Calling updateProfile API...');
      const apiStartTime = Date.now();
      
      const result = await updateProfile(
        token, 
        { 
          first_name: nickname,
          body_type: bodyType,
          place_name: city
        }, 
        userId || undefined,
        deviceCredentials
      );
      
      const apiDuration = Date.now() - apiStartTime;
      console.log(`📡 updateProfile API call completed in ${apiDuration}ms`);
      console.log('📡 updateProfile result:', {
        success: result.success,
        hasProfile: !!result.profile,
        hasAvatar: !!result.profile?.avatar,
        avatarImage: result.profile?.avatar?.image || 'NOT_READY',
        avatarStatus: result.profile?.avatar?.status || 'unknown',
        error: result.error,
        fullResponse: result.profile ? JSON.stringify(result.profile, null, 2) : 'NO_PROFILE',
      });
      
      // CRITICAL: Always wait for API response before deciding what to do
      // Even if updateProfile fails, we should still poll because:
      // 1. The API might have accepted the request server-side
      // 2. Avatar generation might have been triggered even if response indicates failure
      // 3. Network errors might be temporary
      
      if (!result.success) {
        console.error('❌ Profile update API call failed:', result.error);
        console.log('⚠️ Will still attempt to poll - avatar generation might have been triggered server-side');
        // DO NOT fallback here - continue to polling
      } else {
        console.log('✅ Profile update API call succeeded');
      }
      
      // Check if avatar is already ready (unlikely but possible for new users)
      const avatarImage = result.profile?.avatar?.image;
      const avatarStatus = result.profile?.avatar?.status;
      
      console.log('📊 Avatar status from updateProfile:', {
        hasAvatar: !!result.profile?.avatar,
        image: avatarImage || 'null',
        status: avatarStatus || 'unknown',
        imageLength: avatarImage?.length || 0,
      });
      
      // Only skip polling if avatar is actually ready (has valid image URL)
      if (result.success && avatarImage && avatarImage.trim() !== '' && avatarImage !== 'null' && avatarImage.length > 10) {
        console.log('✅ Avatar already ready from updateProfile response!', avatarImage);
        setAvatarUrl(avatarImage);
        setIsPolling(false);
        setTimeout(() => {
          setStep('success');
        }, 1000);
        return;
      } else {
        console.log('⏳ Avatar not ready yet, will start polling...');
        // Continue to polling - avatar is generating
      }
      
      // Start polling (even if updateProfile failed - avatar might still be generating)
      console.log('⏳ Starting avatar polling...');
      console.log('🔍 Pre-polling check:', {
        step,
        isPolling,
        hasToken: !!token,
        hasDeviceId: !!deviceId,
        hasDeviceSecret: !!deviceSecret,
        userId,
      });
      
      setIsPolling(true);
      attemptsRef.current = 0; // Reset polling attempts
      
      // Ensure we stay in generating step
      setStep('generating');
      
      // Start polling immediately (use setTimeout to ensure state updates are applied)
      setTimeout(() => {
        console.log('🚀 Actually starting poll now...');
        pollForAvatar(token);
      }, 100);
    } catch (err) {
      console.error('❌ Exception in triggerAvatarGeneration:', err);
      console.error('Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
      });
      
      // Even on exception, try to poll - avatar generation might have been triggered
      console.log('⚠️ Exception occurred, but attempting to poll anyway...');
      console.log('🔍 Post-exception check:', {
        step,
        hasToken: !!token,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
      
      setIsPolling(true);
      attemptsRef.current = 0;
      
      // Ensure we stay in generating step
      setStep('generating');
      
      // Start polling immediately (use setTimeout to ensure state updates are applied)
      setTimeout(() => {
        console.log('🚀 Starting poll after exception...');
        pollForAvatar(token);
      }, 100);
    }
  };

  const pollForAvatar = async (token: string) => {
    // CRITICAL: Always ensure we're in generating step during polling
    setStep('generating');
    
    attemptsRef.current += 1;
    const maxAttempts = 30; // 30 seconds timeout

    console.log(`🔄 Polling attempt ${attemptsRef.current}/${maxAttempts}...`);
    console.log(`📊 Current state:`, {
      step: 'generating', // Always generating during polling
      isPolling,
      hasAvatarUrl: !!avatarUrl,
      attempts: attemptsRef.current,
      hasToken: !!token,
    });

    // CRITICAL: Only fallback to placeholder after ALL polling attempts are exhausted
    // This ensures we wait for the full 30 seconds before giving up
    if (attemptsRef.current > maxAttempts) {
      console.warn(`⚠️ Avatar generation timeout after ${maxAttempts} attempts (${maxAttempts} seconds)`);
      console.log('📊 Final timeout state:', {
        attempts: attemptsRef.current,
        maxAttempts,
        isPolling,
        hasAvatarUrl: !!avatarUrl,
      });
      setIsPolling(false);
      // Only now do we fallback to placeholder - after waiting the full duration
      setAvatarUrl(bodyType === 'bro' ? '/bro.png' : '/bae.png');
      setStep('success');
      return;
    }

    try {
      // Get device credentials from localStorage (stored after login)
      const userId = userProfile?.id || localStorage.getItem('zo_user_id');
      const deviceId = localStorage.getItem('zo_device_id');
      const deviceSecret = localStorage.getItem('zo_device_secret');
      
      if (!deviceId || !deviceSecret) {
        console.error('❌ Missing device credentials in localStorage during polling');
        // Continue polling anyway - might get credentials later
      }
      
      // Use device credentials from localStorage if available (preferred)
      const deviceCredentials = (deviceId && deviceSecret) 
        ? { deviceId, deviceSecret }
        : undefined;
      
      console.log(`🔍 Poll ${attemptsRef.current} - Calling getProfile API...`);
      const pollStartTime = Date.now();
      
      const result = await getProfile(
        token, 
        userId || undefined,
        deviceCredentials
      );
      
      const pollDuration = Date.now() - pollStartTime;
      console.log(`📡 Poll ${attemptsRef.current} API call completed in ${pollDuration}ms`);
      console.log(`📊 Poll ${attemptsRef.current} result:`, {
        success: result.success,
        hasProfile: !!result.profile,
        hasAvatar: !!result.profile?.avatar,
        avatarStatus: result.profile?.avatar?.status || 'unknown',
        avatarImage: result.profile?.avatar?.image ? result.profile.avatar.image.substring(0, 50) + '...' : 'NULL',
        error: result.error,
        fullAvatarObject: result.profile?.avatar ? JSON.stringify(result.profile.avatar, null, 2) : 'NO_AVATAR',
      });
      
      // CRITICAL: Always wait for API response - never fallback early
      if (!result.success) {
        console.warn(`⚠️ Poll ${attemptsRef.current} - Profile fetch API call failed:`, result.error);
        console.log(`⏳ Will continue polling - this might be a temporary error (attempt ${attemptsRef.current}/${maxAttempts})`);
        // Continue polling - might be temporary error, don't give up yet
        pollingRef.current = setTimeout(() => pollForAvatar(token), 1000);
        return;
      }
      
      // API call succeeded - check avatar status
      console.log(`✅ Poll ${attemptsRef.current} - API call succeeded, checking avatar status...`);
      
      // Check if avatar is ready - must have valid image URL
      const avatarImage = result.profile?.avatar?.image;
      const avatarStatus = result.profile?.avatar?.status;
      
      console.log(`🔍 Checking avatar readiness:`, {
        hasImage: !!avatarImage,
        imageLength: avatarImage?.length || 0,
        imagePreview: avatarImage ? avatarImage.substring(0, 50) + '...' : 'NULL',
        status: avatarStatus || 'unknown',
        isImageValid: avatarImage && avatarImage.trim() !== '' && avatarImage !== 'null' && avatarImage.length > 10,
      });
      
      // Only proceed to success if we have a valid avatar image URL
      if (avatarImage && avatarImage.trim() !== '' && avatarImage !== 'null' && avatarImage.length > 10) {
        console.log(`✅ Avatar ready on attempt ${attemptsRef.current}!`, avatarImage);
        setAvatarUrl(avatarImage);
        setIsPolling(false);
        
        // Wait a moment for image to be ready/cached
        setTimeout(() => {
          setStep('success');
        }, 1000);
        return;
      }
      
      // Avatar not ready yet - continue polling
      console.log(`⏳ Avatar not ready yet (status: ${avatarStatus || 'unknown'}), polling again in 1s... (attempt ${attemptsRef.current}/${maxAttempts})`);
      pollingRef.current = setTimeout(() => pollForAvatar(token), 1000);
    } catch (err) {
      console.error(`❌ Polling error on attempt ${attemptsRef.current}:`, err);
      console.error('Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
      });
      // Continue polling despite error (might be network issue)
      pollingRef.current = setTimeout(() => pollForAvatar(token), 1000);
    }
  };

  // Render Logic
  if (step === 'portal') {
    return <PortalAnimation onComplete={onComplete} />;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-black w-screen h-screen overflow-hidden font-rubik">
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-40 z-0 pointer-events-none"
      >
        <source src="/videos/loading-screen-background.mp4" type="video/mp4" />
      </video>
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black z-0 pointer-events-none" />

      {/* Zo Logo */}
      <div className="absolute left-6 top-10 w-10 h-10 md:left-[60px] md:top-[60px] md:w-[60px] md:h-[60px] z-50">
        <img src="/figma-assets/landing-zo-logo.png" alt="Zo" className="w-full h-full object-cover" />
      </div>

      {/* Main Container */}
      <div className={`relative z-10 w-full h-full flex flex-col items-center overflow-y-auto pt-[120px] pb-10 md:justify-center md:pt-20 transition-opacity duration-500 ${step === 'input' ? 'opacity-100' : 'opacity-100'}`}>
        
        {step === 'input' && (
          <div className="w-full flex flex-col items-center animate-fade-in">
            {/* Title */}
            <h1 className="font-syne font-extrabold text-white text-center uppercase tracking-[0.32px] leading-[1.2] mb-6
              text-[clamp(24px,4vw,48px)] w-[min(312px,90vw)] md:w-[600px] md:max-w-none">
              WHO ARE YOU?
            </h1>

            {/* Subtitle */}
            <p className="font-rubik font-normal text-white/60 text-center leading-[1.5] mb-10
              text-[clamp(14px,1.5vw,16px)] w-[min(312px,90vw)] md:w-[500px] md:max-w-none">
              A difficult question, I know. We'll get to it.<br />
              But let's start with choosing a nick.
            </p>

            {/* Nickname Input */}
            <div className="w-[min(312px,90vw)] md:w-[360px] h-[56px] mb-10 relative">
              <input
                type="text"
                value={nickname}
                onChange={handleNicknameChange}
                placeholder="samurai"
                maxLength={16}
                className="w-full h-full px-5 bg-black border border-[#49494A] rounded-xl text-white font-rubik text-base
                  placeholder:text-white/40 focus:outline-none focus:border-zo-accent focus:shadow-[0_0_0_2px_rgba(207,255,80,0.2)]
                  transition-all duration-200"
                autoFocus
              />
            </div>

            {/* Body Type Selection */}
            <div className="w-full flex flex-col items-center mb-8">
              <p className="font-rubik text-sm text-white/80 text-center mb-4">
                Choose your avatar style
              </p>
              
              <div className="flex gap-4 justify-center flex-wrap max-w-[90vw]">
                {/* Bae Option */}
                <button
                  onClick={() => setBodyType('bae')}
                  className={`relative flex flex-col items-center gap-2 p-3 md:p-4 rounded-2xl border-2 backdrop-blur-md transition-all duration-300
                    w-[clamp(120px,25vw,140px)] min-w-[120px]
                    ${bodyType === 'bae' 
                      ? 'border-zo-accent bg-white/30 shadow-[0_0_20px_rgba(207,255,80,0.4)] scale-105' 
                      : 'border-white/30 bg-white/20 hover:border-zo-accent/50 hover:bg-white/30'
                    }`}
                >
                  <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center bg-white/10">
                    <img src="/bae.png" alt="Bae" className="w-full h-full object-cover" />
                  </div>
                  <span className="font-rubik text-sm font-medium text-white">Bae</span>
                  {bodyType === 'bae' && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-zo-accent flex items-center justify-center text-zo-dark font-bold text-sm">✓</div>
                  )}
                </button>

                {/* Bro Option */}
                <button
                  onClick={() => setBodyType('bro')}
                  className={`relative flex flex-col items-center gap-2 p-3 md:p-4 rounded-2xl border-2 backdrop-blur-md transition-all duration-300
                    w-[clamp(120px,25vw,140px)] min-w-[120px]
                    ${bodyType === 'bro' 
                      ? 'border-zo-accent bg-white/30 shadow-[0_0_20px_rgba(207,255,80,0.4)] scale-105' 
                      : 'border-white/30 bg-white/20 hover:border-zo-accent/50 hover:bg-white/30'
                    }`}
                >
                  <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center bg-white/10">
                    <img src="/bro.png" alt="Bro" className="w-full h-full object-cover" />
                  </div>
                  <span className="font-rubik text-sm font-medium text-white">Bro</span>
                  {bodyType === 'bro' && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-zo-accent flex items-center justify-center text-zo-dark font-bold text-sm">✓</div>
                  )}
                </button>
              </div>
            </div>

            {/* Location Button / Display */}
            <div className="w-[min(312px,90vw)] md:w-[360px] h-12 mb-6">
              {!locationEnabled ? (
                <button
                  onClick={handleLocationEnable}
                  disabled={isLoadingLocation}
                  className={`w-full h-full px-5 backdrop-blur-md border rounded-xl
                    font-rubik text-sm font-medium transition-all duration-200
                    flex items-center justify-center gap-2
                    ${isLoadingLocation 
                      ? 'bg-white/5 border-white/10 text-white/40 cursor-wait' 
                      : 'bg-white/10 border-white/20 text-white/80 hover:bg-white/15 hover:border-white/40 cursor-pointer'
                    }`}
                >
                  📍 {isLoadingLocation ? 'Detecting...' : 'Enable Location'}
                </button>
              ) : (
                <div className="w-full h-full px-5 bg-[#CFFF50]/10 border border-[#CFFF50]/50 rounded-xl
                  text-[#CFFF50] font-rubik text-sm font-medium flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(207,255,80,0.1)]">
                  📍 <span className="text-white">{city}</span>
                </div>
              )}
            </div>

            {/* Get Citizenship Button */}
            <button
              onClick={handleGetCitizenship}
              disabled={!canSubmit}
              className={`w-[min(312px,90vw)] md:w-[360px] h-14 px-5 bg-white rounded-xl
                text-zo-dark font-rubik text-base font-medium transition-all duration-300
                flex items-center justify-center
                ${canSubmit 
                  ? 'hover:bg-gray-100 hover:shadow-[0_0_30px_rgba(207,255,80,0.2)] active:scale-[0.98] opacity-100 cursor-pointer' 
                  : 'opacity-50 cursor-not-allowed'
                }`}
            >
              {isSaving ? 'Processing...' : 'Get Citizenship'}
            </button>

            {/* Error Message */}
            {error && (
              <p className="text-red-400 text-sm font-medium mt-4 text-center animate-fade-in">
                {error}
              </p>
            )}
          </div>
        )}

        {/* GENERATING STEP - Pulsating Avatar Only */}
        {step === 'generating' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="w-[200px] h-[200px] rounded-full border-2 border-white/20 bg-white/10 backdrop-blur-md flex items-center justify-center overflow-hidden mb-6">
              <img 
                src={bodyType === 'bro' ? '/bro.png' : '/bae.png'} 
                alt="Generating..." 
                className="w-full h-full object-cover opacity-80 animate-zo-pulse"
              />
            </div>
            {/* Polling status indicator */}
            {isPolling && (
              <p className="text-white/60 text-sm font-rubik animate-fade-in">
                Generating your avatar... {attemptsRef.current > 0 && `(${attemptsRef.current}/30)`}
              </p>
            )}
            {/* Error display in generating step */}
            {error && (
              <p className="text-red-400 text-sm font-medium mt-4 text-center animate-fade-in max-w-[90vw]">
                {error}
              </p>
            )}
          </div>
        )}

        {/* SUCCESS STEP - Circular Text + Final Avatar */}
        {step === 'success' && (
          <div className="absolute inset-0 flex items-center justify-center">
            
            {/* Rotating Text Rings */}
            <div className="relative w-[320px] h-[320px] md:w-[400px] md:h-[400px] flex items-center justify-center">
              
              {/* Large Ring - Clockwise */}
              <div 
                className="absolute inset-0 opacity-80"
                style={{
                  animation: 'rotate 20s linear infinite'
                }}
              >
                <svg viewBox="0 0 400 400" className="w-full h-full">
                  <defs>
                    <path id="circleLarge" d="M 200,200 m -180,0 a 180,180 0 1,1 360,0 a 180,180 0 1,1 -360,0"/>
                  </defs>
                  <text className="font-rubik text-[16px] md:text-[22px] font-medium fill-white tracking-[4px] uppercase">
                    <textPath href="#circleLarge" startOffset="0%" textAnchor="start">
                      ZO • BRAVE NEW CITIZEN • ZO • WELCOME HOME • ZO • BRAVE NEW CITIZEN 
                    </textPath>
                  </text>
                </svg>
              </div>

              {/* Medium Ring - Counter Clockwise */}
              <div 
                className="absolute inset-[30px] opacity-80"
                style={{
                  animation: 'rotate 25s linear infinite reverse'
                }}
              >
                <svg viewBox="0 0 340 340" className="w-full h-full">
                  <defs>
                    <path id="circleMedium" d="M 170,170 m -150,0 a 150,150 0 1,1 300,0 a 150,150 0 1,1 -300,0"/>
                  </defs>
                  <text className="font-rubik text-[15px] md:text-[20px] font-medium fill-white tracking-[4px] uppercase">
                    <textPath href="#circleMedium" startOffset="15%" textAnchor="start">
                      ZO ZO • FOLLOW YOUR HEART • ZO ZO • FOLLOW YOUR HEART • ZO ZO 
                    </textPath>
                  </text>
                </svg>
              </div>

              {/* Small Ring - Clockwise */}
              <div 
                className="absolute inset-[60px] opacity-80"
                style={{
                  animation: 'rotate 30s linear infinite'
                }}
              >
                <svg viewBox="0 0 280 280" className="w-full h-full">
                  <defs>
                    <path id="circleSmall" d="M 140,140 m -120,0 a 120,120 0 1,1 240,0 a 120,120 0 1,1 -240,0"/>
                  </defs>
                  <text className="font-rubik text-[14px] md:text-[18px] font-medium fill-white tracking-[4px] uppercase">
                    <textPath href="#circleSmall" startOffset="30%" textAnchor="start">
                      ZO ZO ZO • TUNE IN CITIZEN • ZO ZO ZO 
                    </textPath>
                  </text>
                </svg>
              </div>

              {/* Center Content - Final Avatar */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-[140px] h-[140px] md:w-[200px] md:h-[200px] rounded-full border-4 border-white shadow-[0_0_40px_rgba(255,255,255,0.6)] overflow-hidden animate-scale-in z-10 relative">
                  <img 
                    src={avatarUrl || (bodyType === 'bro' ? '/bro.png' : '/bae.png')} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Success Button */}
            <button
              onClick={() => setStep('portal')}
              className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[min(312px,90vw)] md:w-[360px] h-14 
                bg-white/90 backdrop-blur-md border border-white/40 rounded-xl
                text-zo-dark font-rubik text-base font-bold uppercase tracking-wider
                flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.3)]
                hover:bg-white hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(255,255,255,0.2)]
                active:scale-[0.98] transition-all duration-300 animate-slide-up z-[100]"
            >
              Zo Zo Zo! Let's Go
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
