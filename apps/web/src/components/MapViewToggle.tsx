'use client';

import { Globe, MapPin } from 'lucide-react';
import { devLog } from '@/lib/logger';

interface MapViewToggleProps {
  viewMode: 'local' | 'global';
  onToggle: (mode: 'local' | 'global') => void;
  localCount?: number;
  globalCount?: number;
  className?: string;
  isLoading?: boolean;
}

const MapViewToggle: React.FC<MapViewToggleProps> = ({
  viewMode,
  onToggle,
  localCount,
  globalCount,
  className = '',
  isLoading = false,
}) => {
  const handleToggle = (mode: 'local' | 'global') => {
    devLog.log('🎯 MapViewToggle clicked:', mode);
    onToggle(mode);
  };

  return (
    <div 
      className={`inline-flex items-center gap-0.5 p-0.5 rounded-full bg-white/90 backdrop-blur-md border border-gray-200 shadow-lg ${className}`}
      style={{ touchAction: 'auto' }}
    >
      {/* Local Mode Button */}
      <button
        onClick={() => handleToggle('local')}
        onTouchEnd={(e) => {
          e.preventDefault();
          if (!isLoading) handleToggle('local');
        }}
        disabled={isLoading}
        className={`
          flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200
          ${viewMode === 'local' 
            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md' 
            : 'text-gray-600 hover:text-gray-900'
          }
          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}
        `}
        style={{ touchAction: 'auto' }}
      >
        {isLoading ? (
          <>
            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Getting location...</span>
          </>
        ) : (
          <>
            <MapPin size={14} />
            <span>Local</span>
            {localCount !== undefined && (
              <span className={`
                ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold
                ${viewMode === 'local' ? 'bg-white/20' : 'bg-gray-200'}
              `}>
                {localCount}
              </span>
            )}
          </>
        )}
      </button>

      {/* Global Mode Button */}
      <button
        onClick={() => handleToggle('global')}
        onTouchEnd={(e) => {
          e.preventDefault();
          if (!isLoading) handleToggle('global');
        }}
        disabled={isLoading}
        className={`
          flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200
          ${viewMode === 'global' 
            ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md' 
            : 'text-gray-600 hover:text-gray-900'
          }
          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}
        `}
        style={{ touchAction: 'auto' }}
      >
        <Globe size={14} />
        <span>Global</span>
        {globalCount !== undefined && (
          <span className={`
            ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold
            ${viewMode === 'global' ? 'bg-white/20' : 'bg-gray-200'}
          `}>
            {globalCount}
          </span>
        )}
      </button>
    </div>
  );
};

export default MapViewToggle;

