'use client';

import React from 'react';

interface MacBezelProps {
  children: React.ReactNode;
}

/**
 * MacBezel - Classic Macintosh outer frame with bezel and shadow
 */
const MacBezel: React.FC<MacBezelProps> = ({ children }) => {
  return (
    <div 
      className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 via-gray-900 to-black p-0 sm:p-4"
      style={{ animation: 'fadeIn 0.5s ease-out' }}
    >
      {/* Outer bezel with drop shadow - responsive sizing */}
      <div 
        className="relative rounded-xl bg-[#d7d7d7] p-0 sm:p-2 shadow-[0_20px_60px_rgba(0,0,0,0.55)]"
        style={{
          border: '4px solid #cfcfcf',
          maxWidth: '820px',
          width: '100%',
          height: '100%',
          maxHeight: '98vh', // Allow almost full height on mobile
          minHeight: '500px', // Ensure minimum usable height
          animation: 'slideIn 0.6s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default MacBezel;

