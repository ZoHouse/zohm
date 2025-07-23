'use client';

import React, { useState } from 'react';

interface MediaDisplayProps {
  src: string;
  alt: string;
  mediaType: 'image' | 'gif' | 'video' | 'unknown';
  className?: string;
  fallbackSeed?: string;
  showMediaType?: boolean;
}

const MediaDisplay: React.FC<MediaDisplayProps> = ({ 
  src, 
  alt, 
  mediaType, 
  className = '', 
  fallbackSeed,
  showMediaType = false
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  const getFallbackImage = () => {
    const seed = fallbackSeed || src || 'default';
    return `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(seed)}&backgroundColor=1a1a1a`;
  };

  if (hasError) {
    return (
      <img
        src={getFallbackImage()}
        alt={alt}
        className={className}
        onLoad={handleLoad}
      />
    );
  }

  const renderMedia = () => {
    switch (mediaType) {
      case 'gif':
        return (
          <div className="relative">
            <img
              src={src}
              alt={alt}
              className={className}
              onError={handleError}
              onLoad={handleLoad}
            />
            {showMediaType && (
              <div className="absolute top-1 left-1 bg-purple-500 text-white text-xs px-2 py-1 rounded">
                GIF
              </div>
            )}
          </div>
        );

      case 'video':
        return (
          <div className="relative">
            <video
              src={src}
              className={className}
              autoPlay
              loop
              muted
              playsInline
              onError={handleError}
              onLoadedData={handleLoad}
            />
            {showMediaType && (
              <div className="absolute top-1 left-1 bg-red-500 text-white text-xs px-2 py-1 rounded">
                VIDEO
              </div>
            )}
          </div>
        );

      case 'image':
      case 'unknown':
      default:
        return (
          <div className="relative">
            <img
              src={src}
              alt={alt}
              className={className}
              onError={handleError}
              onLoad={handleLoad}
            />
            {showMediaType && mediaType === 'image' && (
              <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                IMG
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="relative">
      {isLoading && (
        <div className={`${className} bg-gray-800 flex items-center justify-center`}>
          <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      )}
      {renderMedia()}
    </div>
  );
};

export default MediaDisplay; 