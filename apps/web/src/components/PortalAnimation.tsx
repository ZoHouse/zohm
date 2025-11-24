'use client';

import { useEffect, useRef } from 'react';

interface PortalAnimationProps {
  onComplete: () => void;
}

export default function PortalAnimation({ onComplete }: PortalAnimationProps) {
  const openingVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    console.log('🎬 Portal animation started - playing opening disks only');
    
    // Auto-complete after 2 seconds (duration of opening disks)
    const timer = setTimeout(() => {
      console.log('✅ Opening disks complete, moving to mic permission');
      onComplete();
    }, 2000);

    return () => {
      clearTimeout(timer);
    };
  }, [onComplete]);

  // Handle opening video end
  const handleOpeningVideoEnd = () => {
    console.log('✅ Opening disks video ended naturally');
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black w-screen h-screen overflow-hidden">
      {/* Base Background Video - Always visible, full screen on all devices */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-[1]"
      >
        <source src="/videos/loading-screen-background.mp4" type="video/mp4" />
      </video>

      {/* Opening Disks Video - Plays for 2 seconds then goes to mic permission, full screen on all devices */}
      <video 
        ref={openingVideoRef}
        src="/opening-disks.mp4" 
        autoPlay 
        muted 
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-[2]"
        onLoadedData={() => console.log('✅ Opening Disks video loaded')}
        onPlay={() => console.log('▶️ Opening Disks video playing')}
        onEnded={handleOpeningVideoEnd}
        onError={(e) => {
          console.error('❌ Opening Disks video error');
          // Fallback: complete immediately
          onComplete();
        }}
      />
    </div>
  );
}

