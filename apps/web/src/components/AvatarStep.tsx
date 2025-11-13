'use client';

import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { updateUserProfile } from '@/lib/privyDb';

interface AvatarStepProps {
  onAvatarSet: () => void;
}

// All 14 unicorn avatars (matching mobile app)
const AVATAR_OPTIONS = [
  '/unicorn images/UnicornMemes_v1-01.png',
  '/unicorn images/UnicornMemes_v1-02.png',
  '/unicorn images/UnicornMemes_v1-03.png',
  '/unicorn images/UnicornMemes_v1-04.png',
  '/unicorn images/UnicornMemes_v1-05.png',
  '/unicorn images/UnicornMemes_v1-06.png',
  '/unicorn images/UnicornMemes_v1-07.png',
  '/unicorn images/Unicorn_Crying.png',
  '/unicorn images/Unicorn_Rainbow.png',
  '/unicorn images/UnicornCool.png',
  '/unicorn images/UnicornMagnifyingGlass.png',
  '/unicorn images/UnicornMemes_poppedeye.png',
  '/unicorn images/UnicornRainbowPuke.png',
  '/unicorn images/UnicornRocket.png'
];

export default function AvatarStep({ onAvatarSet }: AvatarStepProps) {
  const { user: privyUser, authenticated } = usePrivy();
  
  const [selectedAvatar, setSelectedAvatar] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleQuantumSync = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      console.log('🎬 Saving avatar to database...');
      
      // Save selected avatar to localStorage for CitizenCard
      localStorage.setItem('zo_avatar', AVATAR_OPTIONS[selectedAvatar]);
      
      // Save avatar to database
      if (privyUser?.id) {
        await updateUserProfile(privyUser.id, {
          pfp: AVATAR_OPTIONS[selectedAvatar]
        });
        
        console.log('✅ Avatar saved successfully!');
        console.log('➡️ Moving to citizen card...');
        onAvatarSet();
      }
    } catch (err) {
      console.error('❌ Error saving avatar:', err);
      setError('Failed to save avatar. Please try again.');
      setIsLoading(false);
    }
  };

  if (!authenticated || !privyUser) return null;

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
      
      <div className="relative z-10 w-full h-full flex flex-col items-center overflow-y-auto">
        {/* Title */}
        <h1 className="absolute top-[120px] left-1/2 -translate-x-1/2 font-['Syne'] text-[28px] font-extrabold text-white text-center leading-[28px] tracking-[0.28px] uppercase w-[312px] m-0">
          CHOOSE YOUR AVATAR
        </h1>
        
        <p className="absolute top-[180px] left-1/2 -translate-x-1/2 font-rubik text-[14px] font-normal text-white/60 text-center leading-[21px] m-0 w-[312px]">
          Pick your digital identity in Zo World
        </p>
        
        {/* Avatar Grid - compact 3x5 grid with proper spacing */}
        <div className="absolute top-[230px] left-1/2 -translate-x-1/2 grid grid-cols-3 gap-3 w-[312px]">
          {AVATAR_OPTIONS.slice(0, 12).map((avatar, index) => (
            <div
              key={index}
              className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer transition-all duration-300 border-2 ${
                selectedAvatar === index 
                  ? 'border-zo-accent shadow-[0_0_20px_rgba(207,255,80,0.6)] scale-105' 
                  : 'border-white/20 hover:border-white/40'
              }`}
              onClick={() => setSelectedAvatar(index)}
            >
              <img 
                src={avatar} 
                alt={`Avatar ${index + 1}`}
                className="w-full h-full object-cover"
              />
              {selectedAvatar === index && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <div className="w-8 h-8 rounded-full bg-zo-accent flex items-center justify-center text-zo-dark text-lg font-bold">
                    ✓
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* "Select Avatar" Button - centered with proper spacing below grid */}
        <button
          onClick={handleQuantumSync}
          disabled={isLoading}
          className="absolute top-[660px] left-1/2 -translate-x-1/2 bg-white flex items-center gap-4 justify-center overflow-clip px-5 py-4 rounded-button w-[312px] h-[56px] cursor-pointer transition-all duration-200 hover:bg-gray-100 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          type="button"
        >
          <span className="font-rubik text-[16px] font-medium text-zo-dark leading-normal">
            {isLoading ? 'Selecting...' : 'Select Avatar'}
          </span>
        </button>

        {error && (
          <p className="absolute bottom-[60px] left-1/2 -translate-x-1/2 font-rubik text-[14px] font-medium text-red-400 text-center w-[312px]">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

