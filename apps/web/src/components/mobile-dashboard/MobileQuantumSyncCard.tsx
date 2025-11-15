'use client';

import React from 'react';

interface MobileQuantumSyncCardProps {
  canPlay: boolean;
  onLaunchGame: () => void;
}

const MobileQuantumSyncCard: React.FC<MobileQuantumSyncCardProps> = ({ 
  canPlay,
  onLaunchGame 
}) => {
  return (
    <div 
      onClick={canPlay ? onLaunchGame : undefined}
      className="w-[327px] h-[107px] mx-auto flex items-start justify-between"
      style={{
        backgroundColor: '#000000',
        backdropFilter: 'blur(32px)',
        WebkitBackdropFilter: 'blur(32px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '24px',
        padding: '24px',
        cursor: canPlay ? 'pointer' : 'not-allowed',
        opacity: canPlay ? 1 : 0.7,
      }}
    >
      {/* Left: Text content */}
      <div className="flex-1 flex flex-col justify-between h-full">
        {/* "QUANTUM" label */}
        <p 
          className="font-rubik font-medium uppercase text-white/40"
          style={{
            fontSize: '12px',
            lineHeight: '16px',
            letterSpacing: '0.12px',
          }}
        >
          QUANTUM
        </p>
        
        {/* "SYNC" heading - Abril Fatface */}
        <h2 
          className="text-white"
          style={{
            fontFamily: '"Abril Fatface", serif',
            fontSize: '48px',
            lineHeight: '40px',
            letterSpacing: '-1.44px',
          }}
        >
          SYNC
        </h2>
      </div>
      
      {/* Right: Mic video (30% smaller than desktop) */}
      <div 
        className="overflow-hidden"
        style={{
          width: '78px',
          height: '78px',
          borderRadius: '12px',
          animation: canPlay ? 'none' : 'pulse 2s infinite',
        }}
      >
        <video 
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
          style={{ pointerEvents: 'none' }}
        >
          <source src="/videos/mic-recording.mp4" type="video/mp4" />
        </video>
      </div>
    </div>
  );
};

export default MobileQuantumSyncCard;

