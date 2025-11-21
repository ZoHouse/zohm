'use client';

import { useZoAuth } from '@/hooks/useZoAuth';
import { useState } from 'react';
import QuantumSyncHeader from './QuantumSyncHeader';

interface CitizenCardProps {
  onboardingStep: string;
  userId?: string;
  onComplete: () => void;
}

export default function CitizenCard({ onboardingStep, userId, onComplete }: CitizenCardProps) {
  const { authenticated, user } = useZoAuth();
  const [isLoading, setIsLoading] = useState(false);

  if (!authenticated || !user) return null;

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

      {/* Home Indicator at bottom */}
      <div className="absolute bottom-[8px] left-1/2 -translate-x-1/2 w-[134px] h-[5px] bg-white rounded-[100px] z-[110]" />

      <div className="relative z-10 w-full h-full flex flex-col items-center">
        {/* Circular Avatar with Glow - centered vertically */}
        <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex flex-col items-center gap-6">
          {/* Avatar Circle with Glow Effect */}
          <div className="relative w-[280px] h-[280px]">
            {/* Glow layers */}
            <div className="absolute inset-0 rounded-full bg-zo-accent/30 blur-[40px] animate-pulse" />
            <div className="absolute inset-[20px] rounded-full bg-zo-accent/20 blur-[30px] animate-pulse" style={{ animationDelay: '0.5s' }} />
            
            {/* Avatar container with border */}
            <div className="absolute inset-0 rounded-full p-[4px] bg-gradient-to-b from-zo-accent/50 to-zo-accent/20">
              <div className="w-full h-full rounded-full overflow-hidden border-4 border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          <img 
            src={selectedAvatar} 
                  alt="Avatar"
                  className="w-full h-full object-cover"
          />
              </div>
            </div>
        </div>

          {/* User Info - Name and City only */}
          <div className="flex flex-col gap-2 items-center justify-center">
            <p className="font-rubik text-[24px] font-bold text-white leading-[28px] text-center m-0">
              {nickname}
            </p>
            <p className="font-rubik text-[14px] font-normal text-white/60 leading-[18px] text-center m-0">
              📍 {city}
            </p>
          </div>
        </div>

        {/* Welcome Text and Button - moved down for better spacing */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-[80px] w-[312px] flex flex-col gap-6 items-start">
          <p className="font-['Syne'] text-[24px] font-extrabold text-white text-center leading-[28px] tracking-[0.24px] uppercase w-full m-0">
          WELCOME TO<br />ZO WORLD
          </p>

        {/* Quantum Sync Button */}
        <button
          onClick={handleQuantumSync}
          disabled={isLoading}
            className="bg-white flex items-center gap-4 justify-center overflow-clip px-5 py-4 rounded-button w-full h-[56px] cursor-pointer transition-all duration-200 hover:bg-gray-100 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
        >
            <span className="font-rubik text-[16px] font-medium text-zo-dark leading-normal text-center">
          {isLoading ? 'Syncing...' : 'Quantum Sync'}
            </span>
        </button>
        </div>
      </div>
    </div>
  );
}

