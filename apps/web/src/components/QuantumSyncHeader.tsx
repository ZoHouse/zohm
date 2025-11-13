'use client';

import { useEffect, useRef, useState } from 'react';

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
  const coinVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    // Get selected avatar from localStorage if not provided
    if (!avatarSrc && typeof window !== 'undefined') {
      const selectedAvatar = localStorage.getItem('zo_avatar');
      if (selectedAvatar) {
        setAvatar(selectedAvatar);
      }
    }
  }, [avatarSrc]);

  // Fetch and refresh balance and avatar periodically
  useEffect(() => {
    if (!userId) return;

    // Fetch user progress to get token balance and avatar
    async function getBalanceAndAvatar(id: string) {
      const progress = await fetchUserProgress(id);
      if (progress?.quests?.zo_points !== undefined) {
          setBalance(progress.quests.zo_points);
        }
      // Update avatar from API if available
      if (progress?.user?.pfp) {
        setAvatar(progress.user.pfp);
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

  // Ensure coin animation plays (mobile browsers may block without interaction)
  useEffect(() => {
    if (coinVideoRef.current) {
      coinVideoRef.current.play().catch((error) => {
        console.warn('⚠️ Coin video autoplay blocked:', error);
      });
    }
  }, [balance]);

  return (
    <div className="quantum-sync-header">
      {/* Zo Logo */}
      <div className="quantum-sync-header__logo">
        <img
          src="/quest-audio-assets/zo-logo.png"
          alt="Zo"
          width="32"
          height="32"
        />
      </div>
      
      {!withoutProfile && (
        /* Profile Container */
        <div className="quantum-sync-header__profile">
          <div className="profile-avatar">
            <img
              src={avatar}
              alt="Avatar"
              width="34"
              height="34"
            />
          </div>
          
          <div className="profile-tokens">
            <span>{balance}</span>
            <div className="coin-icon">
              <video
                ref={coinVideoRef}
                className="coin-video"
                autoPlay
                loop
                muted
                playsInline
              >
                <source src="/videos/zo-coin-slow.mp4" type="video/mp4" />
              </video>
            </div>
          </div>
        </div>
      )}
      <style jsx>{`
        .quantum-sync-header {
          position: absolute;
          top: 48px;
          left: 0;
          right: 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 24px;
          z-index: 140;
        }

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

        .quantum-sync-header__profile {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px 8px 8px;
          background: rgba(18, 18, 18, 0.78);
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 999px;
          box-shadow: 0 12px 36px rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          cursor: pointer;
        }

        .profile-avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.18);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.35);
        }

        .profile-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .profile-tokens {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0.04) 100%);
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 999px;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 12px;
          font-weight: 600;
          line-height: 16px;
          letter-spacing: 0.16px;
          color: white;
        }

        .coin-icon {
          position: relative;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          overflow: hidden;
        }

        .coin-video {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .coin-icon img {
          display: none;
        }
      `}</style>
    </div>
  );
}

