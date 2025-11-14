'use client';

import { useRef, useEffect, useState } from 'react';
import QuantumSyncHeader from './QuantumSyncHeader';
import QuantumSyncLogo from './QuantumSyncLogo';

interface QuestCompleteProps {
  onGoHome: () => Promise<void>; // Now returns a promise that resolves when map is ready
  userId?: string;
  score?: number;
  tokensEarned?: number;
}

interface LeaderboardPlayer {
  rank: number;
  user_id: string;
  nickname: string;
  avatar?: string;
  zo_points: number;
  total_quests_completed: number;
}

export default function QuestComplete({ onGoHome, userId, score = 1111, tokensEarned = 100 }: QuestCompleteProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const coinVideoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userStats, setUserStats] = useState({
    zo_points: tokensEarned,
    total_quests_completed: 1,
    timeUntilNextSync: '12h : 0m'
  });
  
  const [leaderboard, setLeaderboard] = useState<LeaderboardPlayer[]>([]);

  // Get current date/time and location
  const now = new Date();
  const timeString = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const dateString = `Today ${timeString}`;
  
  const location = typeof window !== 'undefined' 
    ? localStorage.getItem('zo_city') || 'San Francisco, CA'
    : 'San Francisco, CA';

  // Pause video at 4s on load (matching mobile paused={true})
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 4.0;
      videoRef.current.pause();
    }
  }, []);

  // Fetch real data from API
  useEffect(() => {
    async function fetchData() {
      if (!userId) {
        return;
      }

      try {
        // Fetch user quest stats
        const statsResponse = await fetch(`/api/users/${userId}/progress`);
        if (statsResponse.ok) {
          const progressData = await statsResponse.json();
          
          // Calculate time until next sync (12 hours from last completion)
          let timeUntilNext = '12h : 0m';
          if (progressData.quests?.last_completed_at) {
            const lastCompleted = new Date(progressData.quests.last_completed_at);
            const nextAvailable = new Date(lastCompleted.getTime() + 12 * 60 * 60 * 1000);
            const now = new Date();
            const diffMs = nextAvailable.getTime() - now.getTime();
            
            if (diffMs > 0) {
              const hours = Math.floor(diffMs / (1000 * 60 * 60));
              const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
              timeUntilNext = `${hours}h : ${minutes}m`;
            } else {
              timeUntilNext = 'Available now';
            }
          }
          
          setUserStats({
            zo_points: progressData.quests?.zo_points || tokensEarned,
            total_quests_completed: progressData.quests?.total_completed || 1,
            timeUntilNextSync: timeUntilNext
          });
        }

        // Fetch real leaderboard data
        const { getQuestLeaderboard } = await import('@/lib/questService');
        const leaderboardData = await getQuestLeaderboard(10);
          setLeaderboard(leaderboardData);
      } catch (error) {
        console.error('Error fetching quest data:', error);
      }
    }

    fetchData();
  }, [userId, tokensEarned]);

  const handleMapYourSync = async () => {
    // Show loading overlay with Coin Collection video
    setIsLoading(true);
    
    console.log('🎬 MapYourSync clicked - starting transition flow');
    
    // Get user's location first (required for transition)
    try {
      console.log('📍 Requesting user location...');
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });
      
      const location = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      
      console.log('✅ Got location:', location);
      
      // Save location to user profile
      if (userId) {
        const { updateUserProfile } = await import('@/lib/privyDb');
        await updateUserProfile(userId, {
          lat: location.lat,
          lng: location.lng
        });
        console.log('✅ Saved location to profile');
      }
      
      // Start BOTH the video (4s minimum) AND the map preparation in PARALLEL
      console.log('⏱️ Starting video (4s) and map preparation in parallel...');
      
      const videoPromise = new Promise(resolve => setTimeout(resolve, 4000));
      const mapReadyPromise = onGoHome(); // This will prepare the map
      
      // Wait for BOTH to complete
      await Promise.all([videoPromise, mapReadyPromise]);
      
      console.log('✅ Video complete AND map ready - hiding loading screen');
      setIsLoading(false);
      
    } catch (error) {
      console.error('❌ Error in transition:', error);
      // Still wait for video, then hide loading
      await new Promise(resolve => setTimeout(resolve, 4000));
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-start bg-black w-screen h-screen overflow-hidden">
      {/* Background Video - Paused at stone ring, covers full screen */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover z-0"
        muted
        playsInline
        onLoadedMetadata={(e) => {
          const video = e.currentTarget;
          video.currentTime = 4.0;
          video.pause();
        }}
      >
        <source src="/videos/zozozo-success.mp4" type="video/mp4" />
      </video>

      {/* Centered content container */}
      <div className="relative z-10 w-full max-w-[360px] h-full flex flex-col items-center">
        
        <QuantumSyncHeader userId={userId} />

        {/* Scrollable Content */}
        <div className="w-full h-full overflow-y-auto pb-20 pt-[80px]">
          {/* Main Content */}
          <div className="flex flex-col items-center w-full px-6">
            
            <QuantumSyncLogo />
            
            <p className="font-rubik text-[16px] font-normal text-white text-center m-0 mt-2 leading-6 tracking-[0.16px]">
              completed: {dateString}
            </p>
            
            <p className="font-rubik text-[14px] font-normal text-white text-center m-0 opacity-60">
              {location}
            </p>

            <button
              onClick={handleMapYourSync}
              className="mt-6 flex flex-col items-center justify-center w-[160px] h-[56px] bg-white rounded-[100px] border-none cursor-pointer transition-all duration-200 hover:bg-zo-accent hover:shadow-[0_4px_20px_rgba(207,255,80,0.4)] active:scale-95"
            >
              <p className="font-rubik text-[16px] font-medium text-black m-0 leading-none">Map your Sync</p>
              <p className="font-rubik text-[12px] font-normal text-black/40 m-0 leading-none mt-1">Get more $Zo</p>
            </button>
            
            <p className="font-rubik text-[40px] font-bold text-white text-center m-0 mt-2 leading-normal tracking-[0.4px]">
              {userStats.zo_points} Zo
            </p>
            
            <div className="w-[144px] h-[144px] rounded-[40px] overflow-hidden mt-2">
              <video 
                autoPlay 
                loop 
                muted 
                playsInline 
                className="w-full h-full object-cover"
              >
                <source src="/videos/zo-coin-slow.mp4" type="video/mp4" />
              </video>
            </div>

            <div className="flex flex-col gap-6 w-full mt-6">
              
              <div className="flex justify-center items-center h-8 px-3 py-2 rounded-[100px] border border-white/16 mx-[45px]">
                <p className="font-rubik text-[12px] font-normal text-white text-center m-0 tracking-[0.12px]">
                  ⏳ Portal opens in {userStats.timeUntilNextSync}
                </p>
              </div>

              {/* UserStats Component */}
              <div className="flex flex-col gap-3 px-6 py-4 rounded-[20px] bg-white/10 items-center mx-9">
                <div className="flex items-center gap-[6px] px-3 py-[6px] rounded-[145px] bg-white/6">
                  <p className="font-rubik text-[14px] font-normal text-white m-0">{userStats.zo_points}</p>
                  <div className="w-6 h-6 rounded-[40px] overflow-hidden">
                    <video autoPlay loop muted playsInline className="w-full h-full object-cover">
                      <source src="/videos/zo-coin-slow.mp4" type="video/mp4" />
                    </video>
                  </div>
                </div>
                
                <div className="flex flex-col gap-1 w-full">
                  <div className="flex items-center justify-between gap-1">
                    <p className="font-rubik text-[12px] font-normal text-white/44 m-0">Quests Completed</p>
                    <p className="font-rubik text-[12px] font-normal text-white m-0">{userStats.total_quests_completed}</p>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <p className="font-rubik text-[12px] font-normal text-white/44 m-0">Total Zo Points</p>
                    <p className="font-rubik text-[12px] font-normal text-white m-0">{userStats.zo_points}</p>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <p className="font-rubik text-[12px] font-normal text-white/44 m-0">Latest Score</p>
                    <p className="font-rubik text-[12px] font-normal text-white m-0">{score}</p>
                  </div>
                </div>
                
                <div className="w-full">
                  <div className="flex justify-center mb-1">
                    <p className="font-rubik text-[12px] font-normal text-white/60 m-0">More stats coming soon...</p>
                  </div>
                </div>
              </div>

              {/* Leaderboard */}
              <div className="w-full flex flex-col items-center">
                <p className="font-rubik text-[24px] font-medium text-white text-center m-0 mb-8 tracking-[0.24px]">
                  Leaderboard
                </p>
                
                {leaderboard.length > 0 && (
                  <div className="relative w-[305px] h-[124px] mb-6">
                    {/* Podium SVG Background */}
                    <img 
                      src="/leaderboard/podium.svg" 
                      alt="Leaderboard podium"
                      className="w-full h-full"
                    />
                    
                    {/* Player Info on Podiums */}
                    {/* Rank 1 - Center (top: -2, left: 135) */}
                    {leaderboard.length >= 1 && (
                      <div className="absolute top-[-2px] left-[135px] flex flex-col items-center gap-[2px]">
                        <div className="w-10 h-10 rounded-[40px] overflow-hidden">
                          <img 
                            src={leaderboard[0].avatar || '/images/rank1.jpeg'} 
                            alt={leaderboard[0].nickname} 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                        <p className="font-rubik text-[14px] font-medium text-white m-0 leading-[16px]">
                          {leaderboard[0].nickname}
                        </p>
                        <p className="font-rubik text-[14px] font-medium text-white/60 m-0 leading-[16px]">
                          {leaderboard[0].zo_points} $Zo
                        </p>
                      </div>
                    )}
                    {/* Rank 2 - Left (top: 35, left: 30) */}
                    {leaderboard.length >= 2 && (
                      <div className="absolute top-[35px] left-[30px] flex flex-col items-center gap-[2px]">
                        <div className="w-10 h-10 rounded-[40px] overflow-hidden">
                          <img 
                            src={leaderboard[1].avatar || '/images/rank2.jpeg'} 
                            alt={leaderboard[1].nickname} 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                        <p className="font-rubik text-[14px] font-medium text-white m-0 leading-[16px]">
                          {leaderboard[1].nickname}
                        </p>
                        <p className="font-rubik text-[14px] font-medium text-white/60 m-0 leading-[16px]">
                          {leaderboard[1].zo_points} $Zo
                        </p>
                      </div>
                    )}
                    {/* Rank 3 - Right (top: 55, left: 230) */}
                    {leaderboard.length >= 3 && (
                      <div className="absolute top-[55px] left-[230px] flex flex-col items-center gap-[2px]">
                        <div className="w-10 h-10 rounded-[40px] overflow-hidden">
                          <img 
                            src={leaderboard[2].avatar || '/images/rank3.jpeg'} 
                            alt={leaderboard[2].nickname} 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                        <p className="font-rubik text-[14px] font-medium text-white m-0 leading-[16px]">
                          {leaderboard[2].nickname}
                        </p>
                        <p className="font-rubik text-[14px] font-medium text-white/60 m-0 leading-[16px]">
                          {leaderboard[2].zo_points} $Zo
                        </p>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="w-full bg-transparent mt-6">
                  {/* Header Row */}
                  <div className="flex justify-between items-center px-4 py-4 bg-[rgba(255,255,255,0.1)]">
                    <p className="w-[20%] font-rubik text-[14px] font-bold text-[rgba(255,255,255,0.44)] m-0 uppercase">RANK</p>
                    <p className="w-[60%] font-rubik text-[14px] font-bold text-[rgba(255,255,255,0.44)] m-0 uppercase">PLAYER</p>
                    <p className="w-[20%] font-rubik text-[14px] font-bold text-[rgba(255,255,255,0.44)] m-0 text-right uppercase">$ZO</p>
                  </div>
                  
                  {/* Data Rows */}
                  {leaderboard.map((entry) => (
                    <div 
                      key={entry.user_id} 
                      className="flex justify-between items-center px-4 py-4"
                    >
                      <p className="w-[20%] font-rubik text-[16px] font-medium text-white m-0">
                        {entry.rank}
                      </p>
                      <div className="w-[60%] flex items-center gap-2">
                        <div className="w-6 h-6 rounded-[24px] overflow-hidden">
                          <img 
                            src={entry.avatar || `/images/rank${entry.rank}.jpeg`} 
                            alt={entry.nickname} 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                        <p className="font-rubik text-[16px] font-medium text-white m-0">
                          {entry.nickname}
                        </p>
                      </div>
                      <p className="w-[20%] font-rubik text-[16px] font-medium text-white/60 m-0 text-right">
                        {entry.zo_points}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <p className="font-rubik text-[16px] font-normal text-white text-center leading-5 tracking-[0.16px] mt-4 px-4">
                Explore the map, complete quests and climb the leaderboard
              </p>
            </div>
          </div>
        </div>
        
        {/* Home Indicator */}
        <div className="absolute bottom-[8px] left-1/2 -translate-x-1/2 w-[134px] h-[5px] bg-white rounded-[100px] z-[110]" />
      </div>

      {/* Loading Overlay with Coin Collection Video */}
      {isLoading && (
        <div className="absolute inset-0 z-[10000]">
          {/* Coin Collection Video - User collecting 200 $Zo for location sync */}
          <video
            ref={coinVideoRef}
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            loop
            muted
            playsInline
          >
            <source src="/Coin Collection.mp4" type="video/mp4" />
          </video>

          {/* QuantumSyncHeader visible during loading */}
          <div className="relative z-[10001]">
            <QuantumSyncHeader userId={userId} />
          </div>

          {/* Minimal text overlay - collecting coins theme */}
          <div className="absolute inset-0 flex items-end justify-center pb-32">
            <div className="text-center animate-pulse">
              <p className="font-rubik text-xl font-bold text-white">
                Zo Zo Zo
              </p>
              <p className="font-rubik text-sm font-medium text-white/80 mt-2">
                Syncing your location
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
