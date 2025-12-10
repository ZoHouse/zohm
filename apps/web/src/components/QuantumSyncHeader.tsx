'use client';

import { useEffect, useState } from 'react';
import { devLog } from '@/lib/logger';

// Fetch user progress function
async function fetchUserProgress(userId: string) {
  try {
    const response = await fetch(`/api/users/${userId}/progress`, {
      // Add cache control to prevent aggressive caching
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      // Silently fail for non-critical data
      devLog.warn(`⚠️ User progress fetch returned ${response.status}`);
    }
  } catch (error) {
    // Silently fail - header should still render without live balance
    devLog.warn('⚠️ Could not fetch user progress (non-critical):', error instanceof Error ? error.message : 'Unknown error');
  }
  return null;
}

/**
 * QuantumSyncHeader - Now fetches user progress to show real token balance
 * Automatically refreshes balance every 3 seconds to stay in sync
 */
// Get initial avatar synchronously to prevent flash
function getInitialAvatar(avatarSrc?: string): string {
  if (avatarSrc) {
    devLog.log('🎨 Using avatar from props:', avatarSrc);
    return avatarSrc;
  }
  if (typeof window !== 'undefined') {
    // Check new cache first (from avatar generation), then fallback to old cache
    const newAvatar = localStorage.getItem('zo_avatar_url');
    if (newAvatar) {
      devLog.log('🎨 Loading avatar from localStorage (zo_avatar_url):', newAvatar);
      return newAvatar;
    }
    const storedAvatar = localStorage.getItem('zo_avatar');
    if (storedAvatar) {
      devLog.log('🎨 Loading avatar from localStorage (zo_avatar):', storedAvatar);
      return storedAvatar;
    }
  }
  devLog.log('🎨 No avatar found, using default');
  return '/quest-audio-assets/avatar.png';
}

export default function QuantumSyncHeader({
  withoutProfile = false,
  avatarSrc,
  userId,
  refreshInterval = 3000,
}: {
  withoutProfile?: boolean;
  avatarSrc?: string;
  userId?: string;
  refreshInterval?: number; // milliseconds between balance refreshes
}) {
  const [avatar, setAvatar] = useState(() => getInitialAvatar(avatarSrc));
  const [balance, setBalance] = useState(0);

  // Update avatar if avatarSrc prop changes
  useEffect(() => {
    if (avatarSrc && avatarSrc !== avatar) {
      devLog.log('🎨 Updating avatar from props:', avatarSrc);
      setAvatar(avatarSrc);
      // Also update localStorage for next time
      localStorage.setItem('zo_avatar', avatarSrc);
    }
  }, [avatarSrc, avatar]);

  // Fetch and refresh balance and avatar periodically
  useEffect(() => {
    if (!userId) return;

    // Fetch user progress to get token balance and avatar
    async function getBalanceAndAvatar(id: string) {
      const progress = await fetchUserProgress(id);
      if (progress?.quests?.zo_points !== undefined) {
        setBalance(progress.quests.zo_points);
      }
      // Update avatar from API if available and different
      if (progress?.user?.pfp && progress.user.pfp !== avatar) {
        devLog.log('🎨 Updating avatar from API:', progress.user.pfp);
        setAvatar(progress.user.pfp);
        // Also update localStorage for next time
        localStorage.setItem('zo_avatar', progress.user.pfp);
      }
    }

    // Fetch immediately on mount
    getBalanceAndAvatar(userId);

    // Set up polling interval to keep balance and avatar fresh
    const intervalId = setInterval(() => {
      getBalanceAndAvatar(userId);
    }, refreshInterval);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [userId, refreshInterval]);

  return (
    <div className="quantum-sync-header">
      {/* Zo Logo */}
      <div className="quantum-sync-header__logo">
        <img
          src="/quest-audio-assets/zo-logo.png"
          alt="Zo"
          width="40"
          height="40"
        />
      </div>

      {!withoutProfile && (
        /* Profile Container */
        <div className="quantum-sync-header__profile">
          {/* Avatar */}
          <div className="profile-avatar">
            <img
              src={avatar}
              alt="Avatar"
              width="36"
              height="36"
            />
          </div>

          {/* Tags Container */}
          <div className="profile-tokens">
            <span>{balance}</span>
            {/* Coin Video */}
            <div className="coin-icon">
              <video
                autoPlay
                loop
                muted
                playsInline
                width="18"
                height="18"
              >
                <source src="/videos/zo-coin.mp4" type="video/mp4" />
              </video>
            </div>
          </div>
        </div>
      )}
      <style jsx>{`
        /* Header Container */
        .quantum-sync-header {
          position: absolute;
          top: 16px;
          left: 0;
          right: 0;
          height: 60px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 8px 0 24px;
          z-index: 100;
        }

        /* Zo Logo */
        .quantum-sync-header__logo {
          width: 40px;
          height: 40px;
          cursor: pointer;
          overflow: hidden;
          border-radius: 4px;
          visibility: hidden;
        }

        .quantum-sync-header__logo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        /* Profile Container */
        .quantum-sync-header__profile {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 8px;
          background: rgba(18, 18, 18, 0.2);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 100px;
          cursor: pointer;
        }

        /* Avatar */
        .profile-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          overflow: hidden;
        }

        .profile-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        /* Tags Container */
        .profile-tokens {
          display: flex;
          align-items: center;
          gap: 4px;
          background: rgba(255, 255, 255, 0.06);
          border-radius: 100px;
          padding: 4px 8px;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 13px;
          font-weight: 400;
          line-height: 16px;
          letter-spacing: 0.1px;
          color: white;
        }

        /* Coin Icon */
        .coin-icon {
          position: relative;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          overflow: hidden;
        }

        .coin-icon video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      `}</style>
    </div>
  );
}

