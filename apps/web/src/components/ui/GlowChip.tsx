'use client';

import React from 'react';

interface GlowChipProps {
  children: React.ReactNode;
  showDot?: boolean;
  className?: string;
  onClick?: () => void;
}

/**
 * GlowChip - Capsule-shaped UI element with translucent glow
 * 
 * Features:
 * - Translucent background with backdrop blur
 * - Optional pulsing red dot indicator
 * - Red accent text
 * - Soft rounded capsule shape
 * 
 * Usage:
 * <GlowChip showDot>45 Events</GlowChip>
 * <GlowChip>Active</GlowChip>
 */
export const GlowChip: React.FC<GlowChipProps> = ({ 
  children, 
  showDot = false, 
  className = '',
  onClick 
}) => {
  return (
    <div 
      className={`
        inline-flex items-center gap-3 
        px-5 py-2 
        rounded-full 
        bg-white/20 backdrop-blur-md 
        border border-white/40 
        text-[#ff4d6d] text-sm font-semibold 
        shadow-lg
        ${onClick ? 'cursor-pointer hover:bg-white/30 transition-all' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {showDot && (
        <span 
          className="inline-flex items-center justify-center w-2.5 h-2.5 rounded-full bg-[#ff4d6d]"
          style={{ boxShadow: 'var(--glow-chip-dot-shadow)' }}
        />
      )}
      {children}
    </div>
  );
};

export default GlowChip;

