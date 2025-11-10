'use client';

import { Globe, MapPin } from 'lucide-react';

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
  return (
    <div className={`inline-flex items-center gap-1 p-1 rounded-full bg-white/90 backdrop-blur-md border border-gray-200 shadow-lg ${className}`}>
      {/* Local Mode Button */}
      <button
        onClick={() => onToggle('local')}
        disabled={isLoading}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200
          ${viewMode === 'local' 
            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md' 
            : 'text-gray-600 hover:text-gray-900'
          }
          ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Getting location...</span>
          </>
        ) : (
          <>
            <MapPin size={16} />
            <span>Local</span>
            {localCount !== undefined && (
              <span className={`
                ml-1 px-2 py-0.5 rounded-full text-xs font-bold
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
        onClick={() => onToggle('global')}
        disabled={isLoading}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200
          ${viewMode === 'global' 
            ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md' 
            : 'text-gray-600 hover:text-gray-900'
          }
          ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <Globe size={16} />
        <span>Global</span>
        {globalCount !== undefined && (
          <span className={`
            ml-1 px-2 py-0.5 rounded-full text-xs font-bold
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

