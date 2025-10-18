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
      className={`absolute left-1/2 bg-white border border-[#8a8a8a] rounded shadow-[0_6px_18px_rgba(0,0,0,0.2)] transition-all duration-500 ease-out ${
        !active ? 'pointer-events-none' : ''
      }`}
      style={{
        width: width === '420px' ? 'calc(100vw - 2rem)' : width, // Full width minus padding on mobile
        maxWidth: width === '420px' ? '420px' : width,
        minHeight: height === 'auto' ? '120px' : height,
        maxHeight: '80vh', // Prevent dialog from being too tall on mobile
        transform: `translate(calc(-50% + ${offset}px), ${offset}px)`,
        opacity,
        filter: blur ? 'blur(1px)' : 'none',
        zIndex: 100 - offset,
        animation: 'slideIn 0.4s ease-out',
        overflow: 'auto', // Allow scrolling if content is too tall
        margin: '0 1rem', // Add margin to prevent edge cutoff
      }}
    >
      {/* Dialog title bar - responsive height */}
      <div className="h-4 sm:h-5 bg-gradient-to-b from-[#efefef] to-[#dcdcdc] border-b border-[#bdbdbd] px-1 sm:px-2 flex items-center">
        <span className="font-mono text-[9px] sm:text-[10px] font-semibold text-[#333]">
          {title}
        </span>
      </div>
      
      {/* Dialog content - responsive padding */}
      <div className="p-1.5 sm:p-2">
        {children}
      </div>
    </div>
  );
};

export default MacDialog;

