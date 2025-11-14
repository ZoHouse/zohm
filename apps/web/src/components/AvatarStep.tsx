'use client';

import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { updateUserProfile } from '@/lib/privyDb';

interface AvatarStepProps {
  onAvatarSet: () => void;
}

export default function AvatarStep({ onAvatarSet }: AvatarStepProps) {
  const { user: privyUser, authenticated } = usePrivy();
  
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
    if (authenticated && privyUser && !isGenerating && !avatarUrl) {
      handleGenerateAvatar();
    }
  }, [authenticated, privyUser]);

  const handleGenerateAvatar = async () => {
    if (!privyUser?.id) {
      setError('Not authenticated');
      return;
    }

    setIsGenerating(true);
    setError('');
    console.log('🎨 Starting avatar generation...', { userId: privyUser.id, bodyType });

    try {
      // TODO: Replace with real ZO API call when credentials are available
      // For now, use fallback unicorn avatar
      console.log('⚠️ ZO API credentials not configured - using fallback avatar');
      
      // Simulate generation delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Use unicorn avatar as fallback
      const fallbackAvatar = bodyType === 'bro' 
        ? '/unicorn images/UnicornMemes_v1-01.png'
        : '/unicorn images/UnicornMemes_v1-02.png';
      
      // Save body_type to database
      if (privyUser?.id) {
        const { updateUserProfile } = await import('@/lib/privyDb');
        const result = await updateUserProfile(privyUser.id, {
          body_type: bodyType,
          pfp: fallbackAvatar
        });
        
        if (!result) {
          console.warn('⚠️ Failed to save to database, but continuing anyway');
        } else {
          console.log('✅ Saved to database:', result);
        }
      }
      
      console.log('✅ Fallback avatar set:', fallbackAvatar);
      setAvatarUrl(fallbackAvatar);
      setIsGenerating(false);
      
      // Auto-advance after showing avatar briefly
      setTimeout(() => {
        console.log('➡️ Moving to next step...');
        onAvatarSet();
      }, 2000);
      
    } catch (err) {
      console.error('❌ Error generating avatar:', err);
      setError('Failed to generate avatar. Please try again.');
      setIsGenerating(false);
    }
  };

  const pollForAvatar = async () => {
    if (!privyUser?.id) return;

    let attempts = 0;
    const maxAttempts = 10; // 10 seconds max (1 attempt per second)

    const poll = async () => {
      attempts++;
      console.log(`🔍 Polling attempt ${attempts}/${maxAttempts}...`);

      try {
        const statusResponse = await fetch(`/api/avatar/status?userId=${privyUser.id}`);
        const data = await statusResponse.json();

        if (data.success && data.avatarUrl) {
          console.log('🎉 Avatar ready!', data.avatarUrl);
          setAvatarUrl(data.avatarUrl);
          setIsPolling(false);
          
          // Auto-advance after showing avatar briefly
          setTimeout(() => {
            console.log('➡️ Moving to next step...');
            onAvatarSet();
          }, 2000);
          return;
        }

        // Continue polling if not ready yet
        if (attempts < maxAttempts) {
          setTimeout(poll, 1000); // Poll every 1 second
        } else {
          console.log('⏱️ Polling timeout - continuing anyway');
          setIsPolling(false);
          setError('Avatar generation is taking longer than expected. Continuing anyway...');
          setTimeout(onAvatarSet, 2000);
        }
      } catch (err) {
        console.error('❌ Error polling for avatar:', err);
        if (attempts < maxAttempts) {
          setTimeout(poll, 1000);
        } else {
          setIsPolling(false);
          setError('Failed to check avatar status. Continuing anyway...');
          setTimeout(onAvatarSet, 2000);
        }
      }
    };

    poll();
  };

  if (!authenticated || !privyUser) return null;

  const isLoading = isGenerating || isPolling;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-black max-w-screen w-screen h-screen overflow-hidden md:max-w-[360px] md:max-h-[800px] md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-lg md:shadow-[0_0_40px_rgba(0,0,0,0.8)]">
      {/* Background - consistent with other screens */}
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
      
      {/* Home Indicator at bottom */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[24px] w-[360px] flex items-center justify-center z-10">
        <div className="w-[72px] h-[5px] bg-white rounded-full" />
      </div>

      {/* Zo Logo */}
      <div className="absolute left-[24px] top-[40px] w-[40px] h-[40px] overflow-clip z-10">
        <img src="/figma-assets/landing-zo-logo.png" alt="Zo" className="w-full h-full object-cover" />
      </div>
      
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center">
        {isLoading && !avatarUrl && (
          <>
            {/* Generating state */}
            <div className="flex flex-col items-center gap-8">
              {/* Avatar placeholder with pulse animation */}
              <div className="relative w-[200px] h-[200px]">
                <div className="absolute inset-0 rounded-full bg-zo-accent/20 animate-pulse" />
                <div className="absolute inset-4 rounded-full bg-zo-accent/30 animate-pulse" style={{ animationDelay: '0.5s' }} />
                <div className="absolute inset-8 rounded-full bg-zo-accent/40 animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-6xl">{bodyType === 'bro' ? '👨' : '👩'}</span>
                </div>
              </div>
              
              <div className="text-center space-y-2">
                <h2 className="font-['Syne'] text-[28px] font-extrabold text-white uppercase tracking-[0.28px]">
                  {isGenerating ? 'Generating Avatar' : 'Almost Ready'}
                </h2>
                <p className="font-rubik text-[14px] text-white/60 w-[312px]">
                  {isGenerating 
                    ? 'Creating your unique ZO avatar...' 
                    : 'Checking avatar status...'
                  }
                </p>
              </div>

              {/* Loading indicator */}
              <div className="flex gap-2">
                <div className="w-2 h-2 rounded-full bg-zo-accent animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-zo-accent animate-bounce" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 rounded-full bg-zo-accent animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          </>
        )}

        {avatarUrl && (
          <>
            {/* Avatar ready state */}
            <div className="flex flex-col items-center gap-8">
              {/* Generated avatar with success animation */}
              <div className="relative w-[200px] h-[200px]">
                <div className="absolute inset-0 rounded-full bg-zo-accent/20 animate-ping" />
                <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-zo-accent shadow-[0_0_40px_rgba(207,255,80,0.6)]">
                  <img 
                    src={avatarUrl} 
                    alt="Generated Avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Success checkmark */}
                <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-full bg-zo-accent flex items-center justify-center text-zo-dark text-2xl font-bold shadow-lg">
                  ✓
                </div>
              </div>
              
              <div className="text-center space-y-2">
                <h2 className="font-['Syne'] text-[28px] font-extrabold text-white uppercase tracking-[0.28px]">
                  Avatar Ready!
                </h2>
                <p className="font-rubik text-[14px] text-white/60 w-[312px]">
                  Your unique ZO identity has been created
                </p>
              </div>
            </div>
          </>
        )}

        {error && !isLoading && (
          <div className="flex flex-col items-center gap-8">
            <div className="w-[200px] h-[200px] rounded-full bg-red-500/20 flex items-center justify-center">
              <span className="text-6xl">⚠️</span>
            </div>
            <div className="text-center space-y-2">
              <h2 className="font-['Syne'] text-[24px] font-extrabold text-white uppercase">
                Oops!
              </h2>
              <p className="font-rubik text-[14px] text-red-400 w-[312px]">
                {error}
              </p>
            </div>
            <button
              onClick={handleGenerateAvatar}
              className="bg-white px-8 py-4 rounded-button font-rubik text-[16px] font-medium text-zo-dark hover:bg-gray-100 transition-all duration-200"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
