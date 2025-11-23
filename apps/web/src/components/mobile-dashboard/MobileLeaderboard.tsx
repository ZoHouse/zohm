'use client';

import React, { useState, useEffect } from 'react';

interface LeaderboardPlayer {
  rank: number;
  user_id: string;
  nickname: string;
  avatar?: string;
  zo_points: number;
}

interface MobileLeaderboardProps {
  userId?: string;
  userBalance?: number;
}

const MobileLeaderboard: React.FC<MobileLeaderboardProps> = ({ userId, userBalance = 0 }) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardPlayer[]>([]);
  const [userRank, setUserRank] = useState<number>(234);

  // Fetch leaderboard (copied from QuestComplete)
  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const { getQuestLeaderboard } = await import('@/lib/questService');
        const data = await getQuestLeaderboard(10);
        setLeaderboard(data);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      }
    }
    fetchLeaderboard();
  }, []);

  return (
    <div className="w-full px-6 mt-16">
      {/* Heading */}
      <h2 
        className="font-rubik font-medium text-white text-center mb-8"
        style={{
          fontSize: '24px',
          lineHeight: '32px',
          letterSpacing: '0.24px',
        }}
      >
        Leaderboard
      </h2>
      
      {leaderboard.length > 0 && (
        <>
          {/* Top 3 Podium (copied from QuestComplete) */}
          <div className="relative w-[305px] h-[124px] mb-6 mx-auto">
            {/* Podium SVG Background */}
            <img 
              src="/leaderboard/podium.svg" 
              alt="Leaderboard podium"
              className="w-full h-full"
            />
            
            {/* Rank 1 - Center */}
            {leaderboard.length >= 1 && (
              <div className="absolute top-[-2px] left-[50%] -translate-x-1/2 flex flex-col items-center gap-[2px]">
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
            
            {/* Rank 2 - Left */}
            {leaderboard.length >= 2 && (
              <div className="absolute top-[35px] left-[18%] -translate-x-1/2 flex flex-col items-center gap-[2px]">
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
            
            {/* Rank 3 - Right */}
            {leaderboard.length >= 3 && (
              <div className="absolute top-[55px] left-[82%] -translate-x-1/2 flex flex-col items-center gap-[2px]">
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
            className="w-[312px] h-[37px] mx-auto flex items-center border-b"
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
          <div className="w-[312px] mx-auto">
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
            {userId && !leaderboard.some(entry => entry.user_id === userId) && (
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

export default MobileLeaderboard;

