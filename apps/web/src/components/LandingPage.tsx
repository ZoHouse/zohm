'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PhoneLoginModal from './PhoneLoginModal';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';

interface LandingPageProps {
  onConnect: () => void; // Keep for Email/Wallet buttons
}

export default function LandingPage({ onConnect }: LandingPageProps) {
  const router = useRouter();
  const { reloadProfile } = useUnifiedAuth();
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const handleButtonPress = () => {
    setIsPressed(true);
    // Open phone login modal instead of Privy
    setTimeout(() => {
      setShowPhoneModal(true);
    }, 200);
  };

  const handlePhoneLoginSuccess = async (userId: string, userData: any) => {
    // User logged in successfully via phone
    console.log('✅ Phone login success, reloading profile...');
    
    // Reload the profile to update auth state
    await reloadProfile();
    
    // Refresh page to show dashboard
    router.refresh();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-black w-screen h-screen overflow-hidden">
      {/* Video Background - Full screen on all devices */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 w-full h-full object-cover z-[1] pointer-events-none"
      >
        <source src="/videos/loading-screen-background.mp4" type="video/mp4" />
      </video>
      <div className="fixed inset-0 bg-gradient-to-b from-[50.721%] from-transparent to-black z-[2] pointer-events-none" />
      
      {/* Home Indicator at bottom - Mobile only */}
      <div 
        className="absolute left-1/2 -translate-x-1/2 h-[24px] w-[360px] flex items-center justify-center z-10 md:hidden"
        style={{
          bottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="w-[72px] h-[5px] bg-white rounded-full" />
      </div>
      
      {/* Zo Logo */}
      <img 
        src="/figma-assets/landing-zo-logo.png" 
        alt="Zo" 
        className="absolute left-[24px] top-[40px] w-[40px] h-[40px] md:w-[60px] md:h-[60px] md:left-[60px] md:top-[60px] overflow-clip z-10 object-cover"
      />
      
      {/* Main Content */}
      <div className="relative z-10 w-full h-full flex flex-col items-center">
        {/* Title - Mobile: fixed position, Desktop: responsive */}
        <h1 className="absolute top-[378px] md:top-[35vh] left-1/2 -translate-x-1/2 font-['Syne'] text-[32px] md:text-[56px] lg:text-[72px] font-extrabold text-white text-center leading-[32px] md:leading-[60px] lg:leading-[76px] tracking-[0.32px] uppercase w-[312px] md:w-[600px] lg:w-[800px] m-0">
          ZOHMMM!
        </h1>
        
        {/* Description - Mobile: fixed position, Desktop: responsive */}
        <div className="absolute top-[452px] md:top-[50vh] left-1/2 -translate-x-1/2 font-rubik text-[16px] md:text-[20px] lg:text-[24px] font-normal text-white text-center leading-[24px] md:leading-[32px] lg:leading-[36px] tracking-[0.16px] w-[312px] md:w-[600px] lg:w-[700px]">
          <p className="m-0 mb-2">Welcome to Zo World</p>
          <p className="m-0 mb-2">A parallel reality where you live your best life, by following your heart.</p>
          <p className="m-0">
            <br />
            Are you ready to tune in, Anon?
          </p>
        </div>

        {/* Main CTA Button - Mobile: fixed, Desktop: responsive */}
        <button
          onClick={handleButtonPress}
          className="absolute top-[600px] md:top-[calc(50vh+240px)] left-1/2 -translate-x-1/2 bg-black border-2 border-white/20 flex items-center justify-center overflow-clip px-5 py-4 rounded-button w-[312px] md:w-[400px] lg:w-[480px] h-[56px] md:h-[64px] cursor-pointer transition-all duration-300 hover:bg-[#1a1a1a] hover:border-white/40 hover:shadow-[0_0_30px_rgba(207,255,80,0.2)] active:scale-[0.98]"
          type="button"
        >
          <span className="font-rubik text-[16px] md:text-[18px] lg:text-[20px] font-medium text-white leading-normal">Tune into Zo World</span>
        </button>

        {/* "or login with" text - Mobile: fixed, Desktop: responsive */}
        <p className="absolute top-[680px] md:top-[calc(50vh+328px)] left-1/2 -translate-x-1/2 font-rubik text-[16px] md:text-[18px] font-normal text-white/44 leading-[24px] tracking-[0.16px] text-center m-0">
          or login with
        </p>

        {/* Email and Wallet Buttons - Mobile: fixed, Desktop: responsive */}
        <div className="absolute top-[704px] md:top-[calc(50vh+364px)] left-1/2 -translate-x-1/2 flex gap-4 w-[312px] md:w-[400px] justify-center">
          <button
            onClick={onConnect}
            className="flex items-center gap-1 md:gap-2 justify-center overflow-clip px-4 py-[18px] rounded-button h-[56px] md:h-[64px] w-[132px] md:w-[180px] cursor-pointer transition-all duration-300 hover:bg-white/10 hover:border hover:border-white/20 active:scale-[0.98]"
            type="button"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6" viewBox="0 0 20 20" fill="none">
              <path d="M3 4C3 3.44772 3.44772 3 4 3H16C16.5523 3 17 3.44772 17 4V16C17 16.5523 16.5523 17 16 17H4C3.44772 17 3 16.5523 3 16V4Z" stroke="white" strokeWidth="2"/>
              <path d="M3 7L10 11L17 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="font-rubik text-[16px] md:text-[18px] font-medium text-white leading-normal">Email</span>
          </button>
          
          <button
            onClick={onConnect}
            className="flex items-center gap-1 md:gap-2 justify-center overflow-clip px-4 py-[18px] rounded-button h-[56px] md:h-[64px] w-[132px] md:w-[180px] cursor-pointer transition-all duration-300 hover:bg-white/10 hover:border hover:border-white/20 active:scale-[0.98]"
            type="button"
          >
            <svg className="w-6 h-6 md:w-7 md:h-7" viewBox="0 0 24 24" fill="none">
              <rect x="4" y="4" width="16" height="16" rx="2" stroke="white" strokeWidth="2"/>
              <path d="M8 8L12 12L16 8" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span className="font-rubik text-[16px] md:text-[18px] font-medium text-white leading-normal">Wallet</span>
          </button>
        </div>
      </div>

      {/* Phone Login Modal */}
      <PhoneLoginModal
        isOpen={showPhoneModal}
        onClose={() => setShowPhoneModal(false)}
        onSuccess={handlePhoneLoginSuccess}
      />
    </div>
  );
}
