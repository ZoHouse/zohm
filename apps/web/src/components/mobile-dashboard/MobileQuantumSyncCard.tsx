'use client';

import React from 'react';

interface MobileQuantumSyncCardProps {
  canPlay: boolean;
  onLaunchGame: () => void;
  timeRemaining?: string; // Optional: "10h 14m 12s" format
}

const MobileQuantumSyncCard: React.FC<MobileQuantumSyncCardProps> = ({ 
  canPlay,
  onLaunchGame,
  timeRemaining 
}) => {
  return (
    <div 
      onClick={canPlay ? onLaunchGame : undefined}
      className="w-[327px] h-[107px] mx-auto flex items-start justify-between relative"
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
      
      {/* Cooldown Overlay - Shown INSIDE card when on cooldown */}
      {!canPlay && timeRemaining && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderRadius: '24px',
        }}>
          <div className="flex flex-col items-center gap-2">
            <p className="font-rubik text-[14px] font-medium text-white/60 uppercase tracking-[1.4px]">
              On Cooldown
            </p>
            <p className="font-rubik text-[20px] font-bold text-white tracking-[0.2px]">
              ⏳ {timeRemaining}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileQuantumSyncCard;

