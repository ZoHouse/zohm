'use client';

import { useEffect, useState } from 'react';

// Fetch user progress function
async function fetchUserProgress(userId: string) {
  try {
    const response = await fetch(`/api/users/${userId}/progress`);
    if (response.ok) {
      const data = await response.json();
      return data;
    }
  } catch (error) {
    console.error('Error fetching user progress:', error);
  }
  return null;
}

/**
 * QuantumSyncHeader - Now fetches user progress to show real token balance
 * Automatically refreshes balance every 3 seconds to stay in sync
 */
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
  const [avatar, setAvatar] = useState(avatarSrc || '/quest-audio-assets/avatar.png');
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    // Get selected avatar from localStorage if not provided
    if (!avatarSrc && typeof window !== 'undefined') {
      const selectedAvatar = localStorage.getItem('zo_avatar');
      if (selectedAvatar) {
        setAvatar(selectedAvatar);
      }
    }
  }, [avatarSrc]);

  // Fetch and refresh balance periodically
  useEffect(() => {
    if (!userId) return;

    // Fetch user progress to get token balance
    async function getBalance(id: string) {
      const progress = await fetchUserProgress(id);
      if (progress?.quests?.zo_points !== undefined) {
        setBalance(progress.quests.zo_points);
      }
    }

    // Fetch immediately on mount
    getBalance(userId);

    // Set up polling interval to keep balance fresh
    const intervalId = setInterval(() => {
      getBalance(userId);
    }, refreshInterval);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [userId, refreshInterval]);

  return (
    <div className="quantum-sync-header">
      {/* Zo Logo - 20% smaller: 40px → 32px */}
      <div className="quantum-sync-header__logo">
        <img
          src="/quest-audio-assets/zo-logo.png"
          alt="Zo"
          width="32"
          height="32"
        />
      </div>
      
      {!withoutProfile && (
        /* Profile Container - 20% smaller */
        <div className="quantum-sync-header__profile">
          {/* Avatar - 20% smaller: 32px → 26px */}
          <div className="profile-avatar">
            <img
              src={avatar}
              alt="Avatar"
              width="26"
              height="26"
            />
          </div>
          
          {/* Tags Container - 20% smaller */}
          <div className="profile-tokens">
            <span>{balance}</span>
            {/* Coin Icon - 20% smaller: 16px → 13px */}
            <div className="coin-icon">
              <img
                src="/quest-audio-assets/coin-1.png"
                alt="Coin"
                width="13"
                height="13"
              />
              <img
                src="/quest-audio-assets/coin-2.png"
                alt=""
                width="13"
                height="13"
                className="coin-overlay"
              />
            </div>
          </div>
        </div>
      )}
      <style jsx>{`
        /* Header Container */
        .quantum-sync-header {
          position: absolute;
          top: 52px;
          left: 0;
          right: 0;
          height: 80px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 24px;
          z-index: 100;
        }

        /* Zo Logo - 20% smaller: 40px → 32px */
        .quantum-sync-header__logo {
          width: 32px;
          height: 32px;
          cursor: pointer;
          overflow: hidden;
          border-radius: 4px;
        }

        .quantum-sync-header__logo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        /* Profile Container - 20% smaller padding: 8px → 6px */
        .quantum-sync-header__profile {
          display: flex;
          align-items: center;
          gap: 3px;
          padding: 6px;
          background: rgba(18, 18, 18, 0.2);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 100px;
          cursor: pointer;
        }

        /* Avatar - 20% smaller: 32px → 26px */
        .profile-avatar {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          overflow: hidden;
        }

        .profile-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        /* Tags Container - 20% smaller */
        .profile-tokens {
          display: flex;
          align-items: center;
          gap: 3px;
          background: rgba(255, 255, 255, 0.06);
          border-radius: 100px;
          padding: 3px 6px;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 10px;
          font-weight: 400;
          line-height: 14px;
          letter-spacing: 0.1px;
          color: white;
        }

        /* Coin Icon - 20% smaller: 16px → 13px */
        .coin-icon {
          position: relative;
          width: 13px;
          height: 13px;
        }

        .coin-icon img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .coin-overlay {
          z-index: 1;
        }
      `}</style>
    </div>
  );
}

