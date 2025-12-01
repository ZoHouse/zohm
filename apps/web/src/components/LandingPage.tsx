'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PhoneLoginModal from './PhoneLoginModal';
import { useZoAuth } from '@/hooks/useZoAuth';
import { devLog } from '@/lib/logger';

interface LandingPageProps {
  onConnect: () => void; // Keep for Email/Wallet buttons
}

export default function LandingPage({ }: LandingPageProps) {
  const router = useRouter();
  const { reloadProfile } = useZoAuth();
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const handleButtonPress = () => {
    setIsPressed(true);
    // Open phone login modal
    setTimeout(() => {
      setShowPhoneModal(true);
    }, 200);
  };

  const handlePhoneLoginSuccess = async (userId: string, userData: any) => {
    // User logged in successfully via phone
    devLog.log('✅ Phone login success, reloading profile...');

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

      {/* Main Content - Flexbox layout for better responsiveness */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center px-6">
        <div className="flex flex-col items-center justify-center w-full max-w-[480px] lg:max-w-[800px] gap-8 md:gap-12">

          {/* Header Section */}
          <div className="flex flex-col items-center gap-4 md:gap-6">
            <h1 className="font-['Syne'] text-[32px] md:text-[56px] lg:text-[72px] font-extrabold text-white text-center leading-[1.1] tracking-[0.32px] uppercase w-full m-0">
              ZOHMMM!
            </h1>

            <div className="font-rubik text-[16px] md:text-[20px] lg:text-[24px] font-normal text-white text-center leading-[1.5] tracking-[0.16px] w-full max-w-[320px] md:max-w-[600px]">
              <p className="m-0 mb-2">Welcome to Zo World</p>
              <p className="m-0 mb-2">A parallel reality where you live your best life, by following your heart.</p>
              <p className="m-0 mt-4">
                Are you ready to tune in, Anon?
              </p>
            </div>
          </div>

          {/* Actions Section */}
          <div className="flex flex-col items-center gap-4 w-full">
            <button
              onClick={handleButtonPress}
              className="bg-black border-2 border-white/20 flex items-center justify-center overflow-clip px-5 py-4 rounded-button w-full md:w-[400px] h-[56px] md:h-[64px] cursor-pointer transition-all duration-300 hover:bg-[#1a1a1a] hover:border-white/40 hover:shadow-[0_0_30px_rgba(207,255,80,0.2)] active:scale-[0.98]"
              type="button"
            >
              <span className="font-rubik text-[16px] md:text-[18px] lg:text-[20px] font-medium text-white leading-normal">Tune into Zo World</span>
            </button>

          </div>
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
