'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';
import { DashboardColors, DashboardTypography, DashboardSpacing, DashboardRadius, DashboardBlur, DashboardAssets } from '@/styles/dashboard-tokens';

interface DashboardHeaderProps {
  onClose?: () => void;
}

// Get initial avatar synchronously to prevent flash
function getInitialAvatar(): string {
  if (typeof window !== 'undefined') {
    const storedAvatar = localStorage.getItem('zo_avatar');
    if (storedAvatar) {
      console.log('🎨 Loading avatar from localStorage:', storedAvatar);
      return storedAvatar;
    }
  }
  console.log('🎨 No avatar in localStorage, using default');
  return '/quest-audio-assets/avatar.png';
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onClose }) => {
  const { userProfile, isFounder, authenticated, login, logout } = useUnifiedAuth();
  const [balance, setBalance] = useState(0);
  const [avatar, setAvatar] = useState(getInitialAvatar);
  const [showMenu, setShowMenu] = useState(false);
  const userId = userProfile?.id;
  const menuRef = useRef<HTMLDivElement>(null);

  // Update avatar when userProfile loads from API (but only if different)
  useEffect(() => {
    if (userProfile?.pfp && userProfile.pfp !== avatar) {
      console.log('🎨 Updating avatar from API:', userProfile.pfp);
      setAvatar(userProfile.pfp);
      // Also update localStorage for next time
      localStorage.setItem('zo_avatar', userProfile.pfp);
    }
  }, [userProfile?.pfp, avatar]);

  // Fetch token balance
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

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  return (
    <div 
      className="sticky top-0 w-full border-b border-solid z-50"
      style={{
        backdropFilter: `blur(${DashboardBlur.light})`,
        WebkitBackdropFilter: `blur(${DashboardBlur.light})`,
        backgroundColor: DashboardColors.background.secondary,
        borderColor: DashboardColors.border.primary,
      }}
    >
      <div className="flex items-center justify-between h-[80px]" style={{ padding: `${DashboardSpacing.sm} ${DashboardSpacing.xl}` }}>
        {/* Left: Zo World Logo + Founder Badge */}
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-16 h-16">
            <img 
              src={DashboardAssets.logo}
              alt="Zo World" 
              className="w-10 h-10 object-contain"
            />
          </div>
          {isFounder && (
            <div className="flex items-center justify-center px-4">
              <p 
                className="uppercase whitespace-nowrap"
                style={{
                  fontFamily: DashboardTypography.fontFamily.display,
                  fontWeight: DashboardTypography.fontWeight.extraBold,
                  fontSize: '24px',
                  lineHeight: '32px',
                  letterSpacing: '-0.96px',
                  color: DashboardColors.text.primary,
                }}
              >
                Founder Member
              </p>
            </div>
          )}
        </div>

        {/* Right: Avatar + Token Balance, Menu Button, Close Button */}
        <div className="flex items-center" style={{ gap: DashboardSpacing.md }}>
          {/* Avatar + Token Balance Pill */}
          <div
            className="flex items-center gap-1 px-2 py-2 border border-solid"
            style={{
              backgroundColor: 'rgba(18, 18, 18, 0.2)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderColor: 'rgba(255, 255, 255, 0.16)',
              borderRadius: DashboardRadius.pill,
            }}
          >
            {/* Avatar */}
            <div 
              className="w-[26px] h-[26px] overflow-hidden flex-shrink-0"
              style={{
                borderRadius: '50%',
              }}
            >
              <img 
                src={avatar} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Token Balance */}
            <div 
              className="flex items-center gap-1 px-2 py-1"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                borderRadius: DashboardRadius.pill,
              }}
            >
              <span 
                style={{
                  fontFamily: DashboardTypography.fontFamily.primary,
                  fontSize: '10px',
                  fontWeight: 400,
                  lineHeight: '14px',
                  letterSpacing: '0.1px',
                  color: DashboardColors.text.primary,
                }}
              >
                {balance}
              </span>
              {/* Coin Icon */}
              <div className="relative w-[13px] h-[13px]">
                <img 
                  src={DashboardAssets.coin.gradient1}
                  alt="Coin" 
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <img 
                  src={DashboardAssets.coin.gradient2}
                  alt="" 
                  className="absolute inset-0 w-full h-full object-cover z-[1]"
                />
              </div>
            </div>
          </div>

          {/* Menu Button (Separate) */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="w-10 h-10 flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity border border-solid"
              style={{
                backgroundColor: 'rgba(18, 18, 18, 0.2)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderColor: 'rgba(255, 255, 255, 0.16)',
                borderRadius: DashboardRadius.sm,
              }}
              aria-label="Menu"
            >
              {/* Menu Dots (2x2 grid) */}
              <div className="flex flex-col items-center justify-center gap-[3px]">
                <div className="flex gap-[3px]">
                  <div className="w-[4px] h-[4px] rounded-full" style={{ backgroundColor: DashboardColors.text.primary }} />
                  <div className="w-[4px] h-[4px] rounded-full" style={{ backgroundColor: DashboardColors.text.primary }} />
                </div>
                <div className="flex gap-[3px]">
                  <div className="w-[4px] h-[4px] rounded-full" style={{ backgroundColor: DashboardColors.text.primary }} />
                  <div className="w-[4px] h-[4px] rounded-full" style={{ backgroundColor: DashboardColors.text.primary }} />
                </div>
              </div>
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <div 
                className="absolute right-0 mt-2 w-48 border border-solid overflow-hidden"
                style={{
                  backgroundColor: DashboardColors.background.primary,
                  backdropFilter: `blur(${DashboardBlur.medium})`,
                  WebkitBackdropFilter: `blur(${DashboardBlur.medium})`,
                  borderColor: DashboardColors.border.primary,
                  borderRadius: DashboardRadius.md,
                  boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.4)',
                }}
              >
                {!authenticated && (
                  <button
                    onClick={() => {
                      login();
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors"
                    style={{
                      fontFamily: DashboardTypography.fontFamily.primary,
                      fontSize: DashboardTypography.size.body.fontSize,
                      fontWeight: DashboardTypography.fontWeight.medium,
                      color: DashboardColors.text.primary,
                    }}
                  >
                    Connect Wallet
                  </button>
                )}
                <button
                  onClick={() => {
                    logout();
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors border-t border-solid"
                  style={{
                    fontFamily: DashboardTypography.fontFamily.primary,
                    fontSize: DashboardTypography.size.body.fontSize,
                    fontWeight: DashboardTypography.fontWeight.medium,
                    color: DashboardColors.text.primary,
                    borderColor: DashboardColors.border.primary,
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* Close Button - Removed per user request */}
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;

