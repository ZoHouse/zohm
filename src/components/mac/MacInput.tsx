'use client';

import React from 'react';

interface MacInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  multiline?: boolean;
  rows?: number;
  error?: string;
}

/**
 * MacInput - Classic Mac-styled input field
 */
const MacInput: React.FC<MacInputProps> = ({ 
  value, 
  onChange, 
  placeholder = '',
  maxLength,
  multiline = false,
  rows = 3,
  error
}) => {
  const baseClasses = `
    w-full 
    px-2 sm:px-2 py-1.5
    font-mono text-[10px] sm:text-xs
    bg-[#fbfbfb] 
    border border-[#b0b0b0] 
    rounded
    placeholder-[#9a9a9a]
    focus:outline-none 
    focus:ring-1 
    focus:ring-[#4a8cff] 
    focus:ring-opacity-30
    focus:border-[#4a8cff]
    transition-all
  `;
  
  return (
    <div className="space-y-1">
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          rows={rows}
          className={`${baseClasses} resize-none`}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className={baseClasses}
        />
      )}
      
      {error && (
        <p className="text-[9px] sm:text-[10px] text-red-600 font-mono">{error}</p>
      )}
      
      {maxLength && (
        <div className="text-right text-[9px] sm:text-[10px] text-[#666] font-mono">
          {value.length}/{maxLength}
        </div>
      )}
    </div>
  );
};

export default MacInput;

