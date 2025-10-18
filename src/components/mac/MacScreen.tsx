'use client';

import React from 'react';

interface MacScreenProps {
  title?: string;
  children: React.ReactNode;
}

/**
 * MacScreen - Inner screen with classic Mac title bar and traffic lights
 */
const MacScreen: React.FC<MacScreenProps> = ({ title = 'Unicorn', children }) => {
  return (
    <div className="relative h-full bg-[#f6f6f6] border border-[#bfbfbf] rounded-sm overflow-hidden shadow-[inset_-6px_-6px_0_rgba(0,0,0,0.12)]">
      {/* Classic Mac title bar */}
      <div className="h-7 flex items-center px-2 bg-gradient-to-b from-[#efefef] to-[#dcdcdc] border-b border-[#bdbdbd]">
        {/* Traffic lights */}
        <div className="flex gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57] shadow-sm" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] shadow-sm" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#28c840] shadow-sm" />
        </div>
        
        {/* Title */}
        <div className="ml-3 font-mono text-xs text-[#333] font-semibold">
          {title}
        </div>
      </div>

      {/* Screen content */}
      <div className="relative h-[calc(100%-28px)] overflow-hidden">
        {children}
        
        {/* Scanline overlay for retro CRT effect */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-30 mix-blend-multiply"
          style={{
            backgroundImage: `repeating-linear-gradient(
              0deg,
              rgba(0,0,0,0.03) 0px,
              rgba(0,0,0,0.03) 1px,
              transparent 1px,
              transparent 3px
            )`
          }}
        />
        
        {/* Subtle noise grain */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.04] mix-blend-multiply"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
            backgroundRepeat: 'repeat',
            backgroundSize: '200px 200px'
          }}
        />
      </div>
    </div>
  );
};

export default MacScreen;

