'use client';

import React from 'react';

interface GlowButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  showDot?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

/**
 * GlowButton - Interactive capsule button with glow effect
 * 
 * Features:
 * - Primary: Solid red background with white text
 * - Secondary: Translucent with red text (like GlowChip but clickable)
 * - Optional pulsing dot indicator
 * - Hover and active states
 * 
 * Usage:
 * <GlowButton variant="primary" onClick={handleClick}>Join Quest</GlowButton>
 * <GlowButton variant="secondary" showDot>Active</GlowButton>
 */
export const GlowButton: React.FC<GlowButtonProps> = ({ 
  children, 
  onClick,
  variant = 'primary',
  disabled = false,
  showDot = false,
  className = '',
  type = 'button'
}) => {
  const baseClasses = `
    inline-flex items-center justify-center gap-3 
    px-6 py-3 
    rounded-full 
    text-sm font-semibold 
    shadow-lg
    transition-all duration-200
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const variantClasses = {
    primary: `
      bg-[#ff4d6d] 
      border border-[#ff4d6d] 
      text-white
      hover:bg-[#ff3355] hover:shadow-[0_0_20px_rgba(255,77,109,0.5)]
      active:scale-95
    `,
    secondary: `
      bg-white/20 backdrop-blur-md 
      border border-white/40 
      text-[#ff4d6d]
      hover:bg-white/30 hover:border-white/50
      active:scale-95
    `
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {showDot && (
        <span 
          className="inline-flex items-center justify-center w-2.5 h-2.5 rounded-full bg-current"
          style={{ 
            boxShadow: variant === 'secondary' 
              ? 'var(--glow-chip-dot-shadow)' 
              : '0 0 10px rgba(255, 255, 255, 0.8)' 
          }}
        />
      )}
      {children}
    </button>
  );
};

export default GlowButton;

