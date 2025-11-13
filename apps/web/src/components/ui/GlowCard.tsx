'use client';

import React from 'react';

interface GlowCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

/**
 * GlowCard - Larger surface area with glow capsule aesthetic
 * 
 * Features:
 * - Translucent background with strong backdrop blur
 * - Soft white border
 * - Rounded corners (not full capsule, but softer than paper)
 * - Optional hover lift effect
 * 
 * Usage:
 * <GlowCard>Quest details content</GlowCard>
 * <GlowCard hoverable onClick={handleClick}>Clickable card</GlowCard>
 */
export const GlowCard: React.FC<GlowCardProps> = ({ 
  children, 
  className = '',
  onClick,
  hoverable = false
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white/20 backdrop-blur-md 
        border border-white/40 
        rounded-3xl 
        p-6
        shadow-lg
        ${hoverable || onClick ? 'cursor-pointer hover:bg-white/25 hover:border-white/50 hover:shadow-xl transition-all duration-200' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default GlowCard;

