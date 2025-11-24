'use client';

import React from 'react';

interface MobileCooldownTimerProps {
  timeRemaining: string;
}

const MobileCooldownTimer: React.FC<MobileCooldownTimerProps> = ({ timeRemaining }) => {
  if (!timeRemaining) return null;
  
  return (
    <div 
      className="w-[240px] h-8 mx-auto flex items-center justify-center gap-1 px-3 py-2"
      style={{
        border: '1px solid rgba(255, 255, 255, 0.16)',
        borderRadius: '100px',
      }}
    >
      {/* Hourglass emoji */}
      <div className="w-4 h-4 overflow-hidden flex items-center justify-center">
        <span className="text-base">⏳</span>
      </div>
      
      {/* Timer text */}
      <p 
        className="font-rubik font-normal text-white text-right"
        style={{
          fontSize: '12px',
          lineHeight: '18px',
          letterSpacing: '0.12px',
        }}
      >
        Portal opens in {timeRemaining}
      </p>
    </div>
  );
};

export default MobileCooldownTimer;

