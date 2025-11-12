'use client';

import { useState } from 'react';

interface LandingPageProps {
  onConnect: () => void;
}

export default function LandingPage({ onConnect }: LandingPageProps) {
  const [isPressed, setIsPressed] = useState(false);

  const handleButtonPress = () => {
    setIsPressed(true);
    // Add slight delay for button animation
    setTimeout(() => {
      onConnect();
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-black max-w-screen w-screen h-screen overflow-hidden md:max-w-[360px] md:max-h-[800px] md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-lg md:shadow-[0_0_40px_rgba(0,0,0,0.8)]">
      {/* Video Background - matching Figma */}
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
      
      {/* Home Indicator at bottom */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[24px] w-[360px] flex items-center justify-center z-10">
        <div className="w-[72px] h-[5px] bg-white rounded-full" />
      </div>
      
      {/* Zo Logo - adjusted positioning without status bar */}
      <img 
        src="/figma-assets/landing-zo-logo.png" 
        alt="Zo" 
        className="absolute left-[24px] top-[40px] w-[40px] h-[40px] overflow-clip z-10 object-cover"
      />
      
      {/* Main Content - Figma exact layout */}
      <div className="relative z-10 w-full h-full flex flex-col items-center">
        {/* Title - Figma: top-[378px], centered */}
        <h1 className="absolute top-[378px] left-1/2 -translate-x-1/2 font-['Syne'] text-[32px] font-extrabold text-white text-center leading-[32px] tracking-[0.32px] uppercase w-[312px] m-0">
          ZOHMMM!
        </h1>
        
        {/* Description - Figma: top-[452px], centered */}
        <div className="absolute top-[452px] left-1/2 -translate-x-1/2 font-rubik text-[16px] font-normal text-white text-center leading-[24px] tracking-[0.16px] w-[312px]">
          <p className="m-0 mb-2">Welcome to Zo World</p>
          <p className="m-0 mb-2">A parallel reality where you live your best life, by following your heart.</p>
          <p className="m-0">
            <br />
            Are you ready to tune in, Anon?
          </p>
        </div>

        {/* Main CTA Button - centered */}
        <button
          onClick={handleButtonPress}
          className="absolute top-[600px] left-1/2 -translate-x-1/2 bg-black border-2 border-white/20 flex items-center justify-center overflow-clip px-5 py-4 rounded-button w-[312px] h-[56px] cursor-pointer transition-all duration-200 hover:bg-[#1a1a1a] hover:border-white/40 active:scale-[0.98]"
          type="button"
        >
          <span className="font-rubik text-[16px] font-medium text-white leading-normal">Tune into Zo World</span>
        </button>

        {/* "or login with" text - centered */}
        <p className="absolute top-[680px] left-1/2 -translate-x-1/2 font-rubik text-[16px] font-normal text-white/44 leading-[24px] tracking-[0.16px] text-center m-0">
          or login with
        </p>

        {/* Email and Wallet Buttons - centered with flex gap */}
        <div className="absolute top-[704px] left-1/2 -translate-x-1/2 flex gap-4 w-[312px] justify-center">
          <button
            onClick={onConnect}
            className="flex items-center gap-1 justify-center overflow-clip px-4 py-[18px] rounded-button h-[56px] w-[132px] cursor-pointer transition-all duration-200 hover:bg-white/10 active:scale-[0.98]"
            type="button"
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none">
              <path d="M3 4C3 3.44772 3.44772 3 4 3H16C16.5523 3 17 3.44772 17 4V16C17 16.5523 16.5523 17 16 17H4C3.44772 17 3 16.5523 3 16V4Z" stroke="white" strokeWidth="2"/>
              <path d="M3 7L10 11L17 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="font-rubik text-[16px] font-medium text-white leading-normal">Email</span>
          </button>
          
          <button
            onClick={onConnect}
            className="flex items-center gap-1 justify-center overflow-clip px-4 py-[18px] rounded-button h-[56px] w-[132px] cursor-pointer transition-all duration-200 hover:bg-white/10 active:scale-[0.98]"
            type="button"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
              <rect x="4" y="4" width="16" height="16" rx="2" stroke="white" strokeWidth="2"/>
              <path d="M8 8L12 12L16 8" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span className="font-rubik text-[16px] font-medium text-white leading-normal">Wallet</span>
          </button>
        </div>
      </div>
    </div>
  );
}
