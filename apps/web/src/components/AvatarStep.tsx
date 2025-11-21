'use client';

import { useState, useEffect } from 'react';
import { useZoAuth } from '@/hooks/useZoAuth';
import { updateUserProfile } from '@/lib/privyDb';

interface AvatarStepProps {
  onAvatarSet: () => void;
}

export default function AvatarStep({ onAvatarSet }: AvatarStepProps) {
  const { authenticated, userProfile, user: privyUser } = useZoAuth();
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [bodyType, setBodyType] = useState<'bro' | 'bae'>('bro');

  // Load body_type from localStorage (set in NicknameStep)
  useEffect(() => {
    const storedBodyType = localStorage.getItem('zo_body_type') as 'bro' | 'bae' | null;
    if (storedBodyType) {
      setBodyType(storedBodyType);
    }
  }, []);

  // Automatically start generation when component loads
  useEffect(() => {
    if (authenticated && (privyUser || userProfile) && !isGenerating && !avatarUrl) {
      console.log('🎨 Starting avatar generation on mount...');
      updateProfileWithBodyType();
    }
  }, [authenticated, privyUser, userProfile]);

  // ============================================================================
  // REAL AVATAR GENERATION IMPLEMENTATION
  // ============================================================================

  // Update profile with body_type (triggers avatar generation on backend)
  const updateProfileWithBodyType = async () => {
    const userId = userProfile?.id || privyUser?.id;
    if (!userId) {
      setError('Not authenticated');
      return;
    }

    setIsGenerating(true);
    setError('');
    
    try {
      // Get data from localStorage (set in NicknameStep)
      const nickname = localStorage.getItem('zo_nickname');
      const bodyType = localStorage.getItem('zo_body_type') as 'bro' | 'bae';
      const city = localStorage.getItem('zo_city');
      const accessToken = localStorage.getItem('zo_access_token');
      
      if (!accessToken) {
        console.warn('⚠️ No ZO access token found - using fallback avatar');
        useFallbackAvatar();
        return;
      }
      
      console.log('📡 Updating profile with body type...', { bodyType, nickname, city });
      
      // Call ZO API to update profile (triggers avatar generation on backend)
      const { updateProfile } = await import('@/lib/zo-api/profile');
      const result = await updateProfile(accessToken, {
        first_name: nickname || undefined,
        body_type: bodyType,
        place_name: city || undefined
      }, userId);
      
      if (!result.success) {
        console.error('❌ Failed to update profile:', result.error);
        throw new Error(result.error || 'Failed to update profile');
      }
      
      console.log('✅ Profile updated, starting polling...');
      
      // Start polling immediately
      startPolling(accessToken, userId, bodyType);
      
    } catch (err) {
      console.error('❌ Error updating profile:', err);
      setError('Failed to update profile');
      setIsGenerating(false);
      
      // Fallback to unicorn avatar on error
      useFallbackAvatar();
    }
  };

  // Poll for avatar completion
  const startPolling = async (
    accessToken: string,
    userId: string,
    bodyType: 'bro' | 'bae'
  ) => {
    setIsPolling(true);
    let attempts = 0;
    const maxAttempts = 15; // 15 attempts * 2 seconds = 30 seconds max

    const poll = async () => {
      attempts++;
      console.log(`🔍 Polling attempt ${attempts}/${maxAttempts}...`);

      try {
        // Fetch profile from ZO API
        const { getProfile } = await import('@/lib/zo-api/profile');
        const result = await getProfile(accessToken, userId);
        
        if (!result.success || !result.profile) {
          throw new Error(result.error || 'Failed to fetch profile');
        }
        
        const profile = result.profile;
        
        console.log('📊 Profile data:', {
          hasAvatar: !!profile.avatar?.image,
          avatarUrl: profile.avatar?.image || 'null',
          avatarStatus: profile.avatar?.status || 'unknown'
        });
        
        // Check if avatar is ready
        if (profile.avatar?.image && profile.avatar.image.length > 0) {
          // SUCCESS! Avatar is ready
          console.log('🎉 Avatar ready!', profile.avatar.image);
          
          setAvatarUrl(profile.avatar.image);
          setIsGenerating(false);
          setIsPolling(false);
          
          // Save to Supabase
          try {
            const { updateUserProfile } = await import('@/lib/privyDb');
            await updateUserProfile(userId, {
              pfp: profile.avatar.image,
              body_type: bodyType
            });
            console.log('✅ Saved avatar to Supabase');
          } catch (dbErr) {
            console.warn('⚠️ Failed to save to Supabase, but continuing', dbErr);
          }
          
          // Auto-advance after 2 seconds
          setTimeout(() => {
            console.log('➡️ Moving to next step...');
            onAvatarSet();
          }, 2000);
          
          return; // Stop polling
        }
        
        // Avatar not ready yet
        if (attempts < maxAttempts) {
          console.log('⏳ Avatar not ready, polling again in 2 seconds...');
          setTimeout(poll, 2000); // Poll every 2 seconds
        } else {
          // TIMEOUT - Use fallback
          console.warn('⏱️ Polling timeout after 30 seconds, using fallback');
          setIsPolling(false);
          setIsGenerating(false);
          useFallbackAvatar();
        }
        
      } catch (err) {
        console.error('❌ Error polling for avatar:', err);
        
        // Retry on error (unless max attempts reached)
        if (attempts < maxAttempts) {
          console.log('🔄 Retrying in 2 seconds...');
          setTimeout(poll, 2000);
        } else {
          console.error('❌ Max polling attempts reached, using fallback');
          setIsPolling(false);
          setIsGenerating(false);
          useFallbackAvatar();
        }
      }
    };

    // Start polling
    poll();
  };

  // Fallback to unicorn avatar
  const useFallbackAvatar = async () => {
    const userId = userProfile?.id || privyUser?.id;
    const bodyType = localStorage.getItem('zo_body_type') as 'bro' | 'bae';
    
    const fallbackAvatar = bodyType === 'bro' 
      ? '/unicorn images/UnicornMemes_v1-01.png'
      : '/unicorn images/UnicornMemes_v1-02.png';
    
    console.log('🦄 Using fallback avatar:', fallbackAvatar);
    setAvatarUrl(fallbackAvatar);
    
    // Save fallback to database
    if (userId) {
      try {
        const { updateUserProfile } = await import('@/lib/privyDb');
        await updateUserProfile(userId, {
          pfp: fallbackAvatar,
          body_type: bodyType
        });
        console.log('✅ Saved fallback avatar to Supabase');
      } catch (err) {
        console.warn('⚠️ Failed to save fallback to Supabase', err);
      }
    }
    
    // Auto-advance after showing fallback
    setTimeout(() => {
      console.log('➡️ Moving to next step with fallback...');
      onAvatarSet();
    }, 2000);
  };

  if (!authenticated) return null;

  const isLoading = isGenerating || isPolling;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-black w-screen h-screen overflow-hidden">
      {/* Background - Full screen on all devices */}
      <div className="absolute inset-0 z-0">
        <div className="absolute bg-black inset-0" />
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        >
          <source src="/videos/loading-screen-background.mp4" type="video/mp4" />
        </video>
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
      
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center">
        {isLoading && !avatarUrl && (
          <>
            {/* Generating state - Minimal zen-like (matching mobile) */}
            <div className="flex flex-col items-center justify-center">
              {/* Single pulsing circle with body type image - breathing effect like mobile */}
              <div className="relative w-[200px] h-[200px] md:w-[280px] md:h-[280px] lg:w-[320px] lg:h-[320px]">
                {/* Body type image pulsing (breathing animation like mobile) */}
                <div className="absolute inset-0 rounded-full border-2 border-white/20 bg-white/10 flex items-center justify-center overflow-hidden animate-pulse">
                  <img 
                    src={bodyType === 'bro' ? '/bro.png' : '/bae.png'} 
                    alt={bodyType === 'bro' ? 'Bro' : 'Bae'}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {avatarUrl && (
          <>
            {/* Avatar ready state */}
            <div className="flex flex-col items-center gap-8 md:gap-12">
              {/* Generated avatar with success animation - scales on desktop */}
              <div className="relative w-[200px] h-[200px] md:w-[280px] md:h-[280px] lg:w-[320px] lg:h-[320px]">
                <div className="absolute inset-0 rounded-full bg-zo-accent/20 animate-ping" />
                <div className="relative w-full h-full rounded-full overflow-hidden border-4 md:border-6 border-zo-accent shadow-[0_0_40px_rgba(207,255,80,0.6)] md:shadow-[0_0_60px_rgba(207,255,80,0.7)]">
                  <img 
                    src={avatarUrl} 
                    alt="Generated Avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Success checkmark */}
                <div className="absolute -bottom-2 -right-2 w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full bg-zo-accent flex items-center justify-center text-zo-dark text-2xl md:text-4xl lg:text-5xl font-bold shadow-lg">
                  ✓
                </div>
              </div>
              
              <div className="text-center space-y-2 md:space-y-4">
                <h2 className="font-['Syne'] text-[28px] md:text-[42px] lg:text-[56px] font-extrabold text-white uppercase tracking-[0.28px] md:tracking-[0.42px]">
                  Citizenship Minted
                </h2>
                <p className="font-rubik text-[14px] md:text-[18px] lg:text-[20px] text-white/60 w-[312px] md:w-[500px]">
                  Welcome to the brave new world.
                </p>
              </div>
            </div>
          </>
        )}

        {error && !isLoading && (
          <div className="flex flex-col items-center gap-8 md:gap-12">
            <div className="w-[200px] h-[200px] md:w-[280px] md:h-[280px] lg:w-[320px] lg:h-[320px] rounded-full bg-red-500/20 flex items-center justify-center">
              <span className="text-6xl md:text-8xl lg:text-9xl">⚠️</span>
            </div>
            <div className="text-center space-y-2 md:space-y-4">
              <h2 className="font-['Syne'] text-[24px] md:text-[36px] lg:text-[48px] font-extrabold text-white uppercase">
                Oops!
              </h2>
              <p className="font-rubik text-[14px] md:text-[18px] lg:text-[20px] text-red-400 w-[312px] md:w-[500px]">
                {error}
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="bg-white px-8 py-4 md:px-12 md:py-5 rounded-button font-rubik text-[16px] md:text-[18px] lg:text-[20px] font-medium text-zo-dark hover:bg-gray-100 hover:shadow-[0_0_30px_rgba(207,255,80,0.2)] transition-all duration-300 active:scale-[0.98]"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
