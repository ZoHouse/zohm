'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { PrivyUserProfile } from '@/types/user';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useQuestCooldown } from '@/hooks/useQuestCooldown';
import { DashboardColors, DashboardTypography, DashboardSpacing, DashboardRadius, DashboardBlur, DashboardAssets } from '@/styles/dashboard-tokens';
import DesktopLeaderboard from './DesktopLeaderboard';

// Dynamically import MapCanvas to avoid SSR issues
const MapCanvas = dynamic(() => import('@/components/MapCanvas'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
    </div>
  ),
});

interface CenterColumnProps {
  userProfile: PrivyUserProfile | null;
  onOpenMap?: () => void;
  onLaunchGame?: (userId: string) => void;
}

const CenterColumn: React.FC<CenterColumnProps> = ({ userProfile, onOpenMap, onLaunchGame }) => {
  const { visitedNodes } = useDashboardData();
  const [mapKey, setMapKey] = React.useState(0);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [balance, setBalance] = useState(0);
  
  // Get user location for map centering
  const userLat = userProfile?.lat || 0;
  const userLng = userProfile?.lng || 0;
  const hasLocation = userLat !== 0 && userLng !== 0;
  
  // game1111 quest cooldown (12 hours)
  // Hook signature: useQuestCooldown(questId, userId)
  const { canPlay, nextAvailableAt } = useQuestCooldown(
    'game-1111', // Must match quest_id used in QuestAudio.tsx
    userProfile?.id // User ID for localStorage key
  );

  // Fetch user balance
  useEffect(() => {
    if (!userProfile?.id) return;

    async function fetchBalance() {
      if (!userProfile?.id) return;

      try {
        const response = await fetch(`/api/users/${userProfile.id}/progress`);
        if (response.ok) {
          const data = await response.json();
          setBalance(data.quests?.zo_points || 0);
        }
      } catch (error) {
        console.error('Error fetching balance:', error);
      }
    }

    fetchBalance();
  }, [userProfile?.id]);
  
  // Update time every 10ms for smooth milliseconds display
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 10);
    return () => clearInterval(interval);
  }, []);
  
  // Calculate countdown
  const getCountdown = () => {
    if (canPlay || !nextAvailableAt) {
      return { hours: 0, minutes: 0, seconds: 0, milliseconds: 0, isAvailable: true };
    }
    
    const now = currentTime;
    const target = new Date(nextAvailableAt).getTime();
    const diff = Math.max(0, target - now);
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    const milliseconds = Math.floor((diff % 1000) / 10); // Show centiseconds (2 digits)
    
    return { hours, minutes, seconds, milliseconds, isAvailable: false };
  };
  
  const countdown = getCountdown();
  
  // Handle game launch
  const handleGameClick = () => {
    if (countdown.isAvailable && userProfile?.id && onLaunchGame) {
      console.log('🎮 Launching game1111 from dashboard');
      onLaunchGame(userProfile.id);
    } else if (!countdown.isAvailable) {
      console.log('⏳ Game on cooldown, cannot launch yet');
    }
  };
  
  // Force remount when location changes
  React.useEffect(() => {
    if (hasLocation) {
      setMapKey(prev => prev + 1);
    }
  }, [userLat, userLng, hasLocation]);
  
  return (
    <div className="flex flex-col flex-1" style={{ gap: DashboardSpacing.xl }}>
      {/* Quantum Sync / game1111 Timer Container */}
      <div 
        onClick={handleGameClick}
        className="flex items-center justify-between border border-solid cursor-pointer hover:opacity-90 transition-opacity"
        style={{
          backdropFilter: `blur(${DashboardBlur.medium})`,
          WebkitBackdropFilter: `blur(${DashboardBlur.medium})`,
          backgroundColor: '#000000',
          borderColor: DashboardColors.border.primary,
          borderRadius: DashboardRadius.lg,
          padding: DashboardSpacing.xl,
          height: '160px',
          cursor: countdown.isAvailable ? 'pointer' : 'not-allowed',
          opacity: countdown.isAvailable ? 1 : 0.7,
        }}
      >
        {countdown.isAvailable ? (
          // READY STATE: "QUANTUM SYNC ZO" on same line with normal mic video
          <>
            <div className="flex-1 flex items-center justify-start" style={{ gap: DashboardSpacing.md }}>
              <p style={{
                fontFamily: DashboardTypography.fontFamily.display,
                fontWeight: DashboardTypography.fontWeight.extraBold,
                fontSize: DashboardTypography.size.display.fontSize,
                lineHeight: DashboardTypography.size.display.lineHeight,
                letterSpacing: DashboardTypography.size.display.letterSpacing,
                color: DashboardColors.text.primary,
                whiteSpace: 'nowrap',
              }}>QUANTUM SYNC</p>
              
              <p style={{
                fontFamily: DashboardTypography.fontFamily.display,
                fontWeight: DashboardTypography.fontWeight.extraBold,
                fontSize: DashboardTypography.size.display.fontSize,
                lineHeight: DashboardTypography.size.display.lineHeight,
                letterSpacing: DashboardTypography.size.display.letterSpacing,
                color: DashboardColors.text.primary,
                textTransform: 'uppercase',
              }}>ZO</p>
            </div>
            <div 
              className="overflow-hidden"
              style={{
                width: '112px',
                height: '112px',
                borderRadius: DashboardRadius.md,
              }}
            >
              <video 
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
                style={{ pointerEvents: 'none' }}
              >
                <source src="/videos/mic-recording.mp4" type="video/mp4" />
              </video>
            </div>
          </>
        ) : (
          // COOLDOWN STATE: "QUANTUM SYNC" with countdown timer on same line and PULSATING mic video
          <>
            <div className="flex-1 flex items-baseline justify-start" style={{ gap: DashboardSpacing.lg }}>
              <p style={{
                fontFamily: DashboardTypography.fontFamily.display,
                fontWeight: DashboardTypography.fontWeight.extraBold,
                fontSize: DashboardTypography.size.display.fontSize,
                lineHeight: DashboardTypography.size.display.lineHeight,
                letterSpacing: DashboardTypography.size.display.letterSpacing,
                color: DashboardColors.text.primary,
                whiteSpace: 'nowrap',
              }}>QUANTUM SYNC</p>
              
              <div className="flex items-baseline" style={{ gap: '6px' }}>
                <span style={{
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  fontSize: '36px',
                  lineHeight: '42px',
                  color: DashboardColors.text.primary,
                }}>
                  {String(countdown.hours).padStart(2, '0')}
                </span>
                <span style={{
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  fontSize: '20px',
                  lineHeight: '28px',
                  color: DashboardColors.text.secondary,
                }}>:</span>
                <span style={{
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  fontSize: '36px',
                  lineHeight: '42px',
                  color: DashboardColors.text.primary,
                }}>
                  {String(countdown.minutes).padStart(2, '0')}
                </span>
                <span style={{
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  fontSize: '20px',
                  lineHeight: '28px',
                  color: DashboardColors.text.secondary,
                }}>:</span>
                <span style={{
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  fontSize: '36px',
                  lineHeight: '42px',
                  color: DashboardColors.text.primary,
                }}>
                  {String(countdown.seconds).padStart(2, '0')}
                </span>
                <span style={{
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  fontSize: '20px',
                  lineHeight: '28px',
                  color: DashboardColors.text.secondary,
                }}>:</span>
                <span style={{
                  fontFamily: 'monospace',
                  fontWeight: 500,
                  fontSize: '28px',
                  lineHeight: '36px',
                  color: 'rgba(255, 255, 255, 0.6)',
                }}>
                  {String(countdown.milliseconds).padStart(2, '0')}
                </span>
              </div>
            </div>
            <div 
              className="overflow-hidden animate-pulse"
              style={{
                width: '112px',
                height: '112px',
                borderRadius: DashboardRadius.md,
              }}
            >
              <video 
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
                style={{ pointerEvents: 'none' }}
              >
                <source src="/videos/mic-recording.mp4" type="video/mp4" />
              </video>
            </div>
          </>
        )}
      </div>

      {/* Travel Section */}
      <div 
        className="flex flex-col border border-solid"
        style={{
          backdropFilter: `blur(${DashboardBlur.medium})`,
          WebkitBackdropFilter: `blur(${DashboardBlur.medium})`,
          backgroundColor: DashboardColors.background.primary,
          borderColor: DashboardColors.border.primary,
          borderRadius: DashboardRadius.lg,
          padding: DashboardSpacing.xl,
          gap: DashboardSpacing.xl,
        }}
      >
        <p style={{
          fontFamily: DashboardTypography.fontFamily.primary,
          fontWeight: DashboardTypography.size.bodyMedium.fontWeight,
          fontSize: DashboardTypography.size.bodyMedium.fontSize,
          lineHeight: '16px',
          letterSpacing: DashboardTypography.size.bodyMedium.letterSpacing,
          color: DashboardColors.text.tertiary,
          textTransform: 'uppercase',
        }}>MAP</p>

        {/* Mini Map View */}
        <div 
          className="relative w-full"
          style={{
            height: '360px',
            borderRadius: DashboardRadius.lg,
            overflow: 'hidden',
          }}
        >
          {/* MapCanvas Component - Always render to show location button when needed */}
          <div 
            key={mapKey}
            className="absolute" 
            style={{ 
              top: '-30%',
              left: 0,
              right: 0,
              bottom: '-30%',
              borderRadius: DashboardRadius.lg, 
              overflow: 'hidden',
            }}
          >
            <MapCanvas
              events={[]}
              nodes={[]}
              flyToEvent={null}
              flyToNode={null}
              shouldAnimateFromSpace={false}
              userLocation={hasLocation ? { lat: userLat, lng: userLng } : null}
              isMiniMap={true}
              className="w-full h-full"
              userId={userProfile?.id}
              onLocationSaved={(lat, lng) => {
                console.log('✅ Location saved! Reloading to show map...');
                window.location.reload();
              }}
            />
          </div>

          {/* Overlay - Enter Map Button (only show when user has location) */}
          {hasLocation && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 1000 }}>
              <button
                onClick={onOpenMap}
                className="pointer-events-auto border border-solid hover:opacity-80 transition-all duration-200"
                style={{
                  backgroundColor: 'rgba(18, 18, 18, 0.3)',
                  backdropFilter: `blur(${DashboardBlur.light})`,
                  WebkitBackdropFilter: `blur(${DashboardBlur.light})`,
                  borderColor: 'rgba(255, 255, 255, 0.16)',
                  borderRadius: DashboardRadius.pill,
                  padding: `${DashboardSpacing.md} ${DashboardSpacing.xl}`,
                }}
              >
                <p style={{
                  fontFamily: DashboardTypography.fontFamily.primary,
                  fontWeight: DashboardTypography.fontWeight.medium,
                  fontSize: DashboardTypography.size.small.fontSize,
                  lineHeight: DashboardTypography.size.small.lineHeight,
                  letterSpacing: '0.1em',
                  color: DashboardColors.text.primary,
                  textTransform: 'uppercase',
                }}>
                  Enter Map
                </p>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Open Your Own ZO NODE CTA */}
      <div 
        className="flex items-start justify-between border border-solid"
        style={{
          backdropFilter: `blur(${DashboardBlur.medium})`,
          WebkitBackdropFilter: `blur(${DashboardBlur.medium})`,
          backgroundColor: '#000000',
          borderColor: DashboardColors.border.primary,
          borderRadius: DashboardRadius.lg,
          padding: DashboardSpacing.xl,
          height: '160px',
        }}
      >
        <div className="flex-1 flex flex-col h-full items-start justify-between">
          <p style={{
            fontFamily: DashboardTypography.fontFamily.primary,
            fontWeight: DashboardTypography.size.caption.fontWeight,
            fontSize: DashboardTypography.size.caption.fontSize,
            lineHeight: '16px',
            color: 'rgba(255, 255, 255, 0.4)',
            textTransform: 'uppercase',
          }}>Open YOUR OWN</p>
          <div className="flex flex-col" style={{ gap: DashboardSpacing.sm }}>
            <p style={{
              fontFamily: DashboardTypography.fontFamily.display,
              fontWeight: DashboardTypography.fontWeight.extraBold,
              fontSize: DashboardTypography.size.display.fontSize,
              lineHeight: DashboardTypography.size.display.lineHeight,
              letterSpacing: DashboardTypography.size.display.letterSpacing,
              color: DashboardColors.text.primary,
              marginBottom: '-8px',
            }}>ZO</p>
            <p style={{
              fontFamily: DashboardTypography.fontFamily.display,
              fontWeight: DashboardTypography.fontWeight.extraBold,
              fontSize: DashboardTypography.size.display.fontSize,
              lineHeight: DashboardTypography.size.display.lineHeight,
              letterSpacing: DashboardTypography.size.display.letterSpacing,
              color: DashboardColors.text.primary,
            }}>NODE</p>
          </div>
        </div>
        <div 
          className="overflow-hidden"
          style={{
            width: '112px',
            height: '112px',
            borderRadius: DashboardRadius.md,
          }}
        >
          <img 
            src="/Zo House Isometric latest.png" 
            alt="ZO NODE" 
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Leaderboard */}
      <DesktopLeaderboard 
        userId={userProfile?.id} 
        userBalance={balance}
      />
    </div>
  );
};

export default CenterColumn;

