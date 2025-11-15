'use client';

import React from 'react';
import { PrivyUserProfile } from '@/types/privy';
import { DashboardAssets } from '@/styles/dashboard-tokens';

interface MobileProfilePhotoCardProps {
  userProfile: PrivyUserProfile | null;
}

const MobileProfilePhotoCard: React.FC<MobileProfilePhotoCardProps> = ({ userProfile }) => {
  return (
    <div className="flex flex-col items-center justify-center w-full">
      {/* Profile Photo with Animated GIF Frame */}
      <div 
        className="relative"
        style={{
          width: '355px',
          height: '355px',
        }}
      >
        {/* Animated GIF Frame (transparent) */}
        <img 
          src="/Profileacrd.gif"
          alt="Profile Frame" 
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />
        
        {/* Profile Photo - Absolutely positioned inside frame */}
        <div
          className="absolute overflow-hidden"
          style={{
            width: '181px',
            height: '175px',
            left: 'calc(50% + 0.5px)',
            top: '61px',
            transform: 'translateX(-50%)',
            borderRadius: '8px',
            backgroundColor: 'transparent',
          }}
        >
          <img 
            src={userProfile?.pfp || DashboardAssets.profile.photo}
            alt="Profile" 
            className="w-full h-full"
            style={{
              objectFit: 'contain',
              backgroundColor: 'transparent',
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default MobileProfilePhotoCard;

