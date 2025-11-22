'use client';

import React, { useState, useEffect } from 'react';
import { DashboardColors, DashboardTypography, DashboardSpacing, DashboardRadius, DashboardBlur } from '@/styles/dashboard-tokens';

interface LeaderboardPlayer {
  rank: number;
  user_id: string;
  nickname: string;
  avatar?: string;
  zo_points: number;
}

interface DesktopLeaderboardProps {
  userId?: string;
  userBalance?: number;
}

const DesktopLeaderboard: React.FC<DesktopLeaderboardProps> = ({ userId, userBalance = 0 }) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardPlayer[]>([]);
  const [userRank, setUserRank] = useState<number>(234);
  const [isUserInTop10, setIsUserInTop10] = useState(false);

  // Fetch leaderboard
  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const { getQuestLeaderboard } = await import('@/lib/questService');
        const data = await getQuestLeaderboard(10);
        setLeaderboard(data);
        
        // Check if user is in top 10
        if (userId) {
          const userInTop10 = data.some(entry => entry.user_id === userId);
          setIsUserInTop10(userInTop10);
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      }
    }
    fetchLeaderboard();
  }, [userId]);

  return (
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
      {/* Header */}
      <p style={{
        fontFamily: DashboardTypography.fontFamily.primary,
        fontWeight: DashboardTypography.size.bodyMedium.fontWeight,
        fontSize: DashboardTypography.size.bodyMedium.fontSize,
        lineHeight: '16px',
        letterSpacing: DashboardTypography.size.bodyMedium.letterSpacing,
        color: DashboardColors.text.tertiary,
        textTransform: 'uppercase',
      }}>LEADERBOARD</p>
      
      {leaderboard.length > 0 && (
        <>
          {/* Top 3 Podium - Centered container with fixed width */}
          <div className="relative mx-auto" style={{ width: '500px', height: '140px', marginBottom: '8px' }}>
            {/* Podium SVG Background */}
            <img 
              src="/leaderboard/podium.svg" 
              alt="Leaderboard podium"
              className="w-full h-full"
              style={{ objectFit: 'contain' }}
            />
            
            {/* Rank 1 - Center (Highest) */}
            {leaderboard.length >= 1 && (
              <div className="absolute flex flex-col items-center gap-[2px]" style={{ top: '0px', left: '50%', transform: 'translateX(-50%)' }}>
                <div className="w-10 h-10 rounded-full overflow-hidden">
                  <img 
                    src={leaderboard[0].avatar || '/images/rank1.jpeg'} 
                    alt={leaderboard[0].nickname} 
                    className="w-full h-full object-cover" 
                  />
                </div>
                <p className="font-rubik text-sm font-normal text-white m-0 leading-[16px] text-center">
                  {leaderboard[0].nickname}
                </p>
                <p className="font-rubik text-sm font-medium text-white/60 m-0 leading-[16px]">
                  {leaderboard[0].zo_points} $Zo
                </p>
              </div>
            )}
            
            {/* Rank 2 - Left (Second) */}
            {leaderboard.length >= 2 && (
              <div className="absolute flex flex-col items-center gap-[2px]" style={{ top: '38px', left: '18%', transform: 'translateX(-50%)' }}>
                <div className="w-10 h-10 rounded-full overflow-hidden">
                  <img 
                    src={leaderboard[1].avatar || '/images/rank2.jpeg'} 
                    alt={leaderboard[1].nickname} 
                    className="w-full h-full object-cover" 
                  />
                </div>
                <p className="font-rubik text-sm font-normal text-white m-0 leading-[16px] text-center">
                  {leaderboard[1].nickname}
                </p>
                <p className="font-rubik text-sm font-medium text-white/60 m-0 leading-[16px]">
                  {leaderboard[1].zo_points} $Zo
                </p>
              </div>
            )}
            
            {/* Rank 3 - Right (Third) */}
            {leaderboard.length >= 3 && (
              <div className="absolute flex flex-col items-center gap-[2px]" style={{ top: '60px', left: '82%', transform: 'translateX(-50%)' }}>
                <div className="w-10 h-10 rounded-full overflow-hidden">
                  <img 
                    src={leaderboard[2].avatar || '/images/rank3.jpeg'} 
                    alt={leaderboard[2].nickname} 
                    className="w-full h-full object-cover" 
                  />
                </div>
                <p className="font-rubik text-sm font-normal text-white m-0 leading-[16px] text-center">
                  {leaderboard[2].nickname}
                </p>
                <p className="font-rubik text-sm font-medium text-white/60 m-0 leading-[16px]">
                  {leaderboard[2].zo_points} $Zo
                </p>
              </div>
            )}
          </div>
          
          {/* Table Header */}
          <div 
            className="w-full h-[37px] flex items-center border-b"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderColor: '#121212',
            }}
          >
            <p 
              className="font-rubik font-medium uppercase flex-shrink-0 pl-4"
              style={{
                fontSize: '10px',
                lineHeight: '16px',
                letterSpacing: '0.1px',
                color: 'rgba(255, 255, 255, 0.44)',
                width: '48px',
              }}
            >
              RANK
            </p>
            <p 
              className="font-rubik font-medium uppercase flex-1"
              style={{
                fontSize: '10px',
                lineHeight: '16px',
                letterSpacing: '0.1px',
                color: 'rgba(255, 255, 255, 0.44)',
              }}
            >
              PLAYER
            </p>
            <p 
              className="font-rubik font-medium uppercase pr-4 text-right flex-shrink-0"
              style={{
                fontSize: '10px',
                lineHeight: '16px',
                letterSpacing: '0.1px',
                color: 'rgba(255, 255, 255, 0.44)',
                minWidth: '60px',
              }}
            >
              $ZO
            </p>
          </div>
          
          {/* Leaderboard Rows */}
          <div className="w-full">
            {leaderboard.map((entry) => {
              const isCurrentUser = userId && entry.user_id === userId;
              return (
                <div 
                  key={entry.user_id}
                  className="h-11 flex items-center border-b"
                  style={{
                    backgroundColor: isCurrentUser ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                    borderColor: '#121212',
                  }}
                >
                  {/* Rank */}
                  <p 
                    className="font-rubik font-normal text-white flex-shrink-0 pl-4"
                    style={{
                      fontSize: '12px',
                      lineHeight: '18px',
                      letterSpacing: '0.12px',
                      width: '48px',
                    }}
                  >
                    {entry.rank}
                  </p>
                  
                  {/* Avatar + Name Container */}
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                      <img 
                        src={entry.avatar || `/images/rank${entry.rank}.jpeg`} 
                        alt={entry.nickname} 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    
                    <p 
                      className="font-rubik font-normal text-white"
                      style={{
                        fontSize: '16px',
                        lineHeight: '24px',
                        letterSpacing: '0.16px',
                      }}
                    >
                      {isCurrentUser ? 'You' : entry.nickname}
                    </p>
                  </div>
                  
                  {/* Score */}
                  <p 
                    className="font-rubik font-medium pr-4 text-right flex-shrink-0"
                    style={{
                      fontSize: '16px',
                      lineHeight: '24px',
                      letterSpacing: '0.16px',
                      color: '#CFFF50',
                      minWidth: '60px',
                    }}
                  >
                    {entry.zo_points}
                  </p>
                </div>
              );
            })}
            
            {/* "You" Row (only show if user is NOT in top 10) */}
            {!isUserInTop10 && (
              <div 
                className="h-11 flex items-center"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                }}
              >
                <p 
                  className="font-rubik font-normal text-white flex-shrink-0 pl-4"
                  style={{
                    fontSize: '12px',
                    lineHeight: '18px',
                    letterSpacing: '0.12px',
                    width: '48px',
                  }}
                >
                  {userRank}
                </p>
                
                {/* Avatar + Name Container */}
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                    <img 
                      src={'/images/rank1.jpeg'} 
                      alt="You" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  
                  <p 
                    className="font-rubik font-normal text-white"
                    style={{
                      fontSize: '16px',
                      lineHeight: '24px',
                      letterSpacing: '0.16px',
                    }}
                  >
                    You
                  </p>
                </div>
                
                <p 
                  className="font-rubik font-medium pr-4 text-right flex-shrink-0"
                  style={{
                    fontSize: '16px',
                    lineHeight: '24px',
                    letterSpacing: '0.16px',
                    color: '#CFFF50',
                    minWidth: '60px',
                  }}
                >
                  {userBalance}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default DesktopLeaderboard;

