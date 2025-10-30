'use client';

import React from 'react';

interface MacDialogProps {
  title: string;
  children: React.ReactNode;
  offset?: number;
  opacity?: number;
  blur?: boolean;
  active?: boolean;
  width?: string;
  height?: string;
}

/**
 * MacDialog - Classic Mac dialog window with title bar
 */
const MacDialog: React.FC<MacDialogProps> = ({ 
  title, 
  children, 
  offset = 0, 
  opacity = 1,
  blur = false,
  active = true,
  width = '420px',
  height = 'auto'
}) => {
  return (
    <div
      className={`absolute bg-white border border-[#8a8a8a] rounded shadow-[0_6px_18px_rgba(0,0,0,0.2)] transition-all duration-500 ease-out ${
        !active ? 'pointer-events-none' : ''
      }`}
        style={{
          width: width, // Use provided width (e.g., 420px)
          maxWidth: '90vw', // Constrain on small screens without stretching on desktop
          minHeight: height === 'auto' ? '200px' : height, // Taller minimum height on mobile
          maxHeight: '85vh', // Allow more height on mobile
          left: '50%', // Horizontal center
          top: '50%', // Vertical center
          transform: `translate(calc(-50% + ${offset}px), calc(-50% + ${offset}px))`, // Center with stacking offset
          opacity,
          filter: blur ? 'blur(1px)' : 'none',
          zIndex: 100 - offset,
          animation: 'slideIn 0.4s ease-out',
          overflow: 'auto', // Allow scrolling if content is too tall
          margin: '0', // No margin on mobile
        }}
    >
      {/* Dialog title bar - responsive height */}
      <div className="h-4 sm:h-5 bg-gradient-to-b from-[#efefef] to-[#dcdcdc] border-b border-[#bdbdbd] px-1 sm:px-2 flex items-center">
        <span className="font-mono text-[9px] sm:text-[10px] font-semibold text-[#333]">
          {title}
        </span>
      </div>
      
        {/* Dialog content - responsive padding */}
        <div className="p-2 sm:p-2">
          {children}
        </div>
    </div>
  );
};

export default MacDialog;

