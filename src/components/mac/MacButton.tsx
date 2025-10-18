'use client';

import React from 'react';

interface MacButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  primary?: boolean;
  type?: 'button' | 'submit';
}

/**
 * MacButton - Classic beveled Mac button
 */
const MacButton: React.FC<MacButtonProps> = ({ 
  children, 
  onClick, 
  disabled = false, 
  primary = false,
  type = 'button'
}) => {
  const baseClasses = "font-mono text-[11px] font-semibold rounded-sm transition-all duration-150 active:translate-y-[1px]";
  
  const primaryClasses = `
    ${baseClasses}
    px-4 py-1.5
    bg-[#4a8cff] 
    border border-[#2b62d6] 
    text-white 
    shadow-[0_2px_0_rgba(0,0,0,0.12)]
    hover:bg-[#5a9cff]
    active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]
    disabled:opacity-50 disabled:cursor-not-allowed
    focus:outline-none focus:ring-1 focus:ring-[#4a8cff] focus:ring-opacity-50
  `;
  
  const secondaryClasses = `
    ${baseClasses}
    px-4 py-1.5
    bg-[#e6e6e6] 
    border border-[#7a7a7a] 
    text-[#111] 
    shadow-[inset_0_1px_0_rgba(255,255,255,0.6),inset_0_-1px_0_rgba(0,0,0,0.08)]
    hover:bg-[#ececec]
    active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.15)]
    disabled:opacity-50 disabled:cursor-not-allowed
    focus:outline-none focus:ring-1 focus:ring-[#7a7a7a] focus:ring-opacity-50
  `;
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={primary ? primaryClasses : secondaryClasses}
    >
      {children}
    </button>
  );
};

export default MacButton;

