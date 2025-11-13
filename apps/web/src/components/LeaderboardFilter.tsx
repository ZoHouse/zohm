'use client';

import { useState } from 'react';

interface LeaderboardFilterProps {
  currentScope: 'global' | 'local';
  currentCity?: {
    id: string;
    name: string;
    country: string;
  };
  onScopeChange: (scope: 'global' | 'local') => void;
}

export default function LeaderboardFilter({
  currentScope,
  currentCity,
  onScopeChange,
}: LeaderboardFilterProps) {
  return (
    <div className="flex items-center gap-2 mb-6">
      <button
        onClick={() => onScopeChange('global')}
        className={`flex-1 py-3 px-4 rounded-lg font-rubik font-medium transition-all ${
          currentScope === 'global'
            ? 'bg-[#cfff50] text-black'
            : 'bg-white/5 text-white/60 hover:bg-white/10'
        }`}
      >
        🌍 Global
      </button>
      <button
        onClick={() => onScopeChange('local')}
        disabled={!currentCity}
        className={`flex-1 py-3 px-4 rounded-lg font-rubik font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
          currentScope === 'local'
            ? 'bg-[#cfff50] text-black'
            : 'bg-white/5 text-white/60 hover:bg-white/10'
        }`}
      >
        📍 {currentCity ? currentCity.name : 'Local'}
      </button>
    </div>
  );
}


