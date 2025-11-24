'use client';

import React, { useState, useEffect } from 'react';
import { PrivyUserProfile } from '@/types/user';
import { DashboardAssets } from '@/styles/dashboard-tokens';

interface MobileDashboardHeaderProps {
  userProfile: PrivyUserProfile | null;
  onClose: () => void;
}

const MobileDashboardHeader: React.FC<MobileDashboardHeaderProps> = ({
  userProfile,
  onClose
}) => {
  const [balance, setBalance] = useState(0);
  const userId = userProfile?.id;

  // Fetch token balance (copied from DashboardHeader.tsx)
  useEffect(() => {
    if (!userId) return;

    async function fetchBalance() {
      try {
        const response = await fetch(`/api/users/${userId}/progress`, {
          cache: 'no-cache',
          headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok) {
          const data = await response.json();
          if (data?.quests?.zo_points !== undefined) {
            setBalance(data.quests.zo_points);
          }
        }
      } catch (error) {
        console.warn('Could not fetch balance:', error);
      }
    }

    fetchBalance();
    const intervalId = setInterval(fetchBalance, 3000);
    return () => clearInterval(intervalId);
  }, [userId]);

  return (
    <div
      className="sticky top-0 z-50 h-20 flex items-center justify-between px-4 md:px-6"
      style={{
        backgroundColor: 'transparent',
        paddingTop: 'max(1rem, env(safe-area-inset-top))',
      }}
    >
      {/* Zo Logo (40px) */}
      <div className="w-10 h-10">
        <img
          src={DashboardAssets.logo}
          alt="Zo World"
          className="w-full h-full object-contain"
        />
      </div>

      {/* Avatar + Balance Pill (right side) */}
      <div
        className="flex items-center gap-1 px-2 py-2 rounded-full"
        style={{
          backgroundColor: 'rgba(18, 18, 18, 0.2)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.16)',
        }}
      >
        {/* Avatar (32px for mobile) */}
        <div className="w-8 h-8 rounded-full overflow-hidden">
          <img
            src={userProfile?.pfp || DashboardAssets.profile.photo}
            alt="Profile"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Balance Tag */}
        <div
          className="flex items-center gap-1 px-2 py-1 rounded-full"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.06)' }}
        >
          <span
            className="font-rubik text-xs font-medium text-white"
            style={{
              fontSize: '12px',
              lineHeight: '18px',
              letterSpacing: '0.12px',
            }}
          >
            {balance}
          </span>
          {/* Coin Icon (16px, multi-layer) */}
          <div className="relative w-4 h-4 rounded-full overflow-hidden">
            <img
              src={DashboardAssets.coin.gradient1}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
            <img
              src={DashboardAssets.coin.gradient2}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileDashboardHeader;

