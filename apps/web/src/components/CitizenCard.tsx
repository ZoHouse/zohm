'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useState } from 'react';
import QuantumSyncHeader from './QuantumSyncHeader';

interface CitizenCardProps {
  onboardingStep: string;
  userId?: string;
  onComplete: () => void;
}

export default function CitizenCard({ onboardingStep, userId, onComplete }: CitizenCardProps) {
  const { user: privyUser, authenticated } = usePrivy();
  const [isLoading, setIsLoading] = useState(false);

  if (!authenticated || !privyUser) return null;

  // Get user's nickname, avatar, and city from localStorage
  const nickname = localStorage.getItem('zo_nickname') || 'samurai.zo';
  const selectedAvatar = localStorage.getItem('zo_avatar') || '/unicorn images/UnicornMemes_v1-01.png';
  const city = localStorage.getItem('zo_city') || 'San Francisco, CA';
  const citizenNumber = '#69'; // TODO: Get from database
  const walletAddress = '0x98...nkdj'; // TODO: Get from Privy
  const tokenBalance = 0; // Initial token balance

  const handleQuantumSync = () => {
    setIsLoading(true);
    console.log('🌀 Starting Quantum Sync (Portal Animation)');
    // Trigger portal animation
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-start bg-black w-screen h-screen overflow-hidden">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
      >
        <source src="/videos/loading-screen-background.mp4" type="video/mp4" />
      </video>

      <QuantumSyncHeader avatarSrc={selectedAvatar || undefined} userId={userId} />

      {/* Home Indicator at bottom - responsive */}
      <div 
        className="absolute left-1/2 -translate-x-1/2 bg-white rounded-[100px] z-[110]"
        style={{
          bottom: 'clamp(6px, 1vh, 12px)',
          width: 'clamp(100px, 25vw, 150px)',
          height: 'clamp(4px, 0.8vh, 6px)'
        }}
      />

      <div className="relative z-10 w-full h-full flex flex-col items-center">
        {/* Circular Avatar with Glow - centered vertically with viewport-based adjustments */}
        <div 
          className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex flex-col items-center"
          style={{
            gap: 'clamp(12px, 3vh, 28px)'
          }}
        >
          {/* Avatar Circle with Glow Effect - using viewport-based sizing */}
          <div 
            className="relative"
            style={{
              width: 'clamp(160px, 50vw, 360px)',
              height: 'clamp(160px, 50vw, 360px)',
              maxWidth: 'min(50vh, 360px)',
              maxHeight: 'min(50vh, 360px)'
            }}
          >
            {/* Glow layers - responsive blur */}
            <div 
              className="absolute inset-0 rounded-full bg-zo-accent/30 animate-pulse"
              style={{ filter: 'blur(clamp(20px, 5vw, 50px))' }}
            />
            <div 
              className="absolute rounded-full bg-zo-accent/20 animate-pulse"
              style={{ 
                inset: 'clamp(10px, 2.5vw, 25px)',
                filter: 'blur(clamp(15px, 4vw, 40px))',
                animationDelay: '0.5s'
              }}
            />
            
            {/* Avatar container with border */}
            <div 
              className="absolute inset-0 rounded-full bg-gradient-to-b from-zo-accent/50 to-zo-accent/20"
              style={{ padding: 'clamp(2px, 0.5vw, 5px)' }}
            >
              <div 
                className="w-full h-full rounded-full overflow-hidden border-white/10"
                style={{
                  borderWidth: 'clamp(2px, 0.5vw, 4px)',
                  boxShadow: '0 clamp(4px, 1vw, 12px) clamp(16px, 4vw, 40px) rgba(0,0,0,0.3)'
                }}
              >
                <img 
                  src={selectedAvatar} 
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* User Info - Name and City only */}
          <div 
            className="flex flex-col items-center justify-center"
            style={{
              gap: 'clamp(4px, 1vh, 8px)',
              marginTop: 'clamp(8px, 2vh, 16px)'
            }}
          >
            <p 
              className="font-rubik font-bold text-white text-center m-0"
              style={{
                fontSize: 'clamp(18px, 4.5vw, 32px)',
                lineHeight: 'clamp(22px, 5.5vw, 38px)',
                paddingLeft: 'clamp(12px, 3vw, 24px)',
                paddingRight: 'clamp(12px, 3vw, 24px)'
              }}
            >
              {nickname}
            </p>
            <p 
              className="font-rubik font-normal text-white/60 text-center m-0"
              style={{
                fontSize: 'clamp(11px, 2.75vw, 18px)',
                lineHeight: 'clamp(14px, 3.5vw, 22px)',
                paddingLeft: 'clamp(12px, 3vw, 24px)',
                paddingRight: 'clamp(12px, 3vw, 24px)'
              }}
            >
              📍 {city}
            </p>
          </div>
        </div>

        {/* Welcome Text and Button - responsive positioning */}
        <div 
          className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center"
          style={{
            bottom: 'clamp(50px, 8vh, 120px)',
            width: 'min(calc(100% - 2rem), 520px)',
            gap: 'clamp(12px, 3vh, 24px)'
          }}
        >
          <p 
            className="font-['Syne'] font-extrabold text-white text-center uppercase w-full m-0"
            style={{
              fontSize: 'clamp(18px, 4.5vw, 32px)',
              lineHeight: 'clamp(22px, 5.5vw, 38px)',
              letterSpacing: 'clamp(0.15px, 0.04vw, 0.3px)',
              paddingLeft: 'clamp(12px, 3vw, 24px)',
              paddingRight: 'clamp(12px, 3vw, 24px)'
            }}
          >
            WELCOME TO<br />ZO WORLD
          </p>

          {/* Quantum Sync Button */}
          <button
            onClick={handleQuantumSync}
            disabled={isLoading}
            className="bg-white flex items-center justify-center overflow-clip rounded-button w-full cursor-pointer transition-all duration-200 hover:bg-gray-100 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              gap: 'clamp(8px, 2vw, 16px)',
              paddingLeft: 'clamp(12px, 3vw, 20px)',
              paddingRight: 'clamp(12px, 3vw, 20px)',
              paddingTop: 'clamp(10px, 2.5vw, 16px)',
              paddingBottom: 'clamp(10px, 2.5vw, 16px)',
              height: 'clamp(44px, 11vh, 64px)',
              minHeight: '44px'
            }}
            type="button"
          >
            <span 
              className="font-rubik font-medium text-zo-dark text-center"
              style={{
                fontSize: 'clamp(13px, 3.25vw, 20px)',
                lineHeight: 'normal'
              }}
            >
              {isLoading ? 'Syncing...' : 'Quantum Sync'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

