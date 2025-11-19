'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePrivyUser } from '@/hooks/usePrivyUser';
import { useQuestCooldown } from '@/hooks/useQuestCooldown';
import { DashboardColors, DashboardTypography, DashboardSpacing, DashboardRadius, DashboardBlur } from '@/styles/dashboard-tokens';
import { ZoPassport } from '@/components/desktop-dashboard';
import MobileDashboardHeader from './MobileDashboardHeader';
import MobileQuantumSyncCard from './MobileQuantumSyncCard';
import MobileCooldownTimer from './MobileCooldownTimer';
import MobileStatsCard from './MobileStatsCard';
import MobileLeaderboard from './MobileLeaderboard';
import MobileMiniMap from './MobileMiniMap';

interface MobileDashboardProps {
  isVisible: boolean;
  onClose: () => void;
  onLaunchGame?: (userId: string) => void;
}

const MobileDashboard: React.FC<MobileDashboardProps> = ({ 
  isVisible, 
  onClose,
  onLaunchGame 
}) => {
  const { userProfile, isLoading } = usePrivyUser();
  const [balance, setBalance] = useState(0);
  const [stats, setStats] = useState({
    quantum_syncs: 0,
    best_score: 0,
    unique_locations: 0,
    multiplier: 1.0,
  });
  
  // Cooldown check for game1111
  // Hook signature: useQuestCooldown(questId, userId)
  const { canPlay, nextAvailableAt } = useQuestCooldown(
    'game-1111', // Quest slug
    userProfile?.id // User ID for localStorage key
  );
  
  // Calculate time remaining
  const getTimeRemaining = () => {
    if (!nextAvailableAt || canPlay) return '';
    
    const now = Date.now();
    const target = new Date(nextAvailableAt).getTime();
    const diff = Math.max(0, target - now);
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h : ${minutes}m`;
  };
  
  // Fetch user stats
  useEffect(() => {
    if (!userProfile?.id) return;
    
    async function fetchStats() {
      if (!userProfile?.id) return;
      
      try {
        const response = await fetch(`/api/users/${userProfile.id}/progress`);
        if (response.ok) {
          const data = await response.json();
          setBalance(data.quests?.zo_points || 0);
          setStats({
            quantum_syncs: data.quests?.total_completed || 0,
            best_score: 1112, // TODO: Get from API
            unique_locations: 3, // TODO: Get from API
            multiplier: 1.69, // TODO: Calculate from streak
          });
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    }
    
    fetchStats();
  }, [userProfile?.id]);

  if (!isVisible) return null;

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[10001] bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 z-[10001] bg-black overflow-y-auto scrollbar-hide"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {/* Header - Sticky at top */}
      <MobileDashboardHeader 
        userProfile={userProfile}
        onClose={onClose}
      />
      
      {/* Scrollable Content */}
      <div 
        className="w-full"
        style={{
          paddingBottom: 'calc(6rem + env(safe-area-inset-bottom))',
        }}
      >
        {/* Zo Passport Card */}
        <div className="mt-3 flex flex-col items-center justify-center" style={{ gap: DashboardSpacing.md }}>
          <ZoPassport />
          
          {/* View Passport Button */}
          <Link 
            href="/zopassport"
            className="px-6 py-2.5 rounded-lg transition-all hover:opacity-90 text-center border border-white/10"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: `blur(${DashboardBlur.medium})`,
              WebkitBackdropFilter: `blur(${DashboardBlur.medium})`,
            }}
          >
            <span style={{
              fontFamily: DashboardTypography.fontFamily.primary,
              fontSize: DashboardTypography.size.small.fontSize,
              fontWeight: DashboardTypography.fontWeight.medium,
              color: DashboardColors.text.primary,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              View Passport
            </span>
          </Link>
        </div>
        
        {/* Quantum Sync Card - Now with cooldown timer INSIDE */}
        <div className="mt-6">
          <MobileQuantumSyncCard 
            canPlay={canPlay}
            onLaunchGame={() => {
              if (userProfile?.id && onLaunchGame) {
                onLaunchGame(userProfile.id);
              }
            }}
            timeRemaining={!canPlay ? getTimeRemaining() : undefined}
          />
        </div>
        
        {/* Removed separate cooldown timer - now shown inside the card */}
        
        {/* Stats Card */}
        <div className="mt-6">
          <MobileStatsCard 
            balance={balance}
            quantumSyncs={stats.quantum_syncs}
            bestScore={stats.best_score}
            uniqueLocations={stats.unique_locations}
            multiplier={stats.multiplier}
            currentProgress={stats.quantum_syncs}
            nextMilestone={11}
            milestones={[3, 7, 11]}
          />
        </div>
        
        {/* Mini Map */}
        <MobileMiniMap onOpenMap={onClose} userProfile={userProfile} />
        
        {/* Leaderboard */}
        <MobileLeaderboard 
          userId={userProfile?.id}
          userBalance={balance}
        />
      </div>
    </div>
  );
};

export default MobileDashboard;

