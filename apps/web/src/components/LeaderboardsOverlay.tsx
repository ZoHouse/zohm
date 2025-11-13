'use client';

import React, { useEffect, useState } from 'react';
import { getLeaderboards, LeaderboardEntry } from '@/lib/supabase';
import { GlowCard, GlowChip } from '@/components/ui';

interface LeaderboardsOverlayProps {
  isVisible: boolean;
  onClose: () => void;
}

const LeaderboardsOverlay: React.FC<LeaderboardsOverlayProps> = ({ isVisible, onClose }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!isVisible) return;
    const load = async () => {
      const data = await getLeaderboards();
      setEntries(data);
    };
    load();
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-black/90 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-2xl text-white hover:opacity-70 transition-opacity z-10"
        >
          &times;
        </button>
        <h2 className="font-rubik text-[24px] font-medium text-white text-center mb-6 tracking-[0.24px]">
          Leaderboard
        </h2>
        
        {!entries || entries.length === 0 ? (
          <div className="text-center text-white/60 py-8">Leaderboard loading…</div>
        ) : (
          <div className="space-y-6">
            {/* Podium for Top 3 */}
            {entries.length >= 3 && (
              <div className="relative w-[305px] h-[124px] mx-auto">
                {/* Podium SVG Background */}
                <img 
                  src="/leaderboard/podium.svg" 
                  alt="Leaderboard podium"
                  className="w-full h-full"
                />
                
                {/* Player Info on Podiums */}
                {/* Rank 1 - Center (top: -2, left: 135) */}
                <div className="absolute top-[-2px] left-[135px] flex flex-col items-center gap-[2px]">
                  <div className="w-10 h-10 rounded-[40px] overflow-hidden border-2 border-[#cfff50]">
                    <div className="w-full h-full bg-white/10 flex items-center justify-center text-base font-bold text-[#cfff50]">
                      1
                    </div>
                  </div>
                  <p className="font-rubik text-[14px] font-medium text-white m-0 leading-[16px]">
                    {entries[0]?.username || 'Anon'}
                  </p>
                  <p className="font-rubik text-[14px] font-medium text-white/60 m-0 leading-[16px]">
                    {entries[0]?.zo_points} $Zo
                  </p>
                </div>
                {/* Rank 2 - Left (top: 35, left: 30) */}
                <div className="absolute top-[35px] left-[30px] flex flex-col items-center gap-[2px]">
                  <div className="w-10 h-10 rounded-[40px] overflow-hidden border border-white/20">
                    <div className="w-full h-full bg-white/10 flex items-center justify-center text-sm font-semibold text-white">
                      2
                    </div>
                  </div>
                  <p className="font-rubik text-[14px] font-medium text-white m-0 leading-[16px]">
                    {entries[1]?.username || 'Anon'}
                  </p>
                  <p className="font-rubik text-[14px] font-medium text-white/60 m-0 leading-[16px]">
                    {entries[1]?.zo_points} $Zo
                  </p>
                </div>
                {/* Rank 3 - Right (top: 55, left: 230) */}
                <div className="absolute top-[55px] left-[230px] flex flex-col items-center gap-[2px]">
                  <div className="w-10 h-10 rounded-[40px] overflow-hidden border border-white/20">
                    <div className="w-full h-full bg-white/10 flex items-center justify-center text-sm font-semibold text-white">
                      3
                    </div>
                  </div>
                  <p className="font-rubik text-[14px] font-medium text-white m-0 leading-[16px]">
                    {entries[2]?.username || 'Anon'}
                  </p>
                  <p className="font-rubik text-[14px] font-medium text-white/60 m-0 leading-[16px]">
                    {entries[2]?.zo_points} $Zo
                  </p>
                </div>
              </div>
            )}
            
            {/* Leaderboard Table */}
            <div className="w-full bg-transparent max-h-[40vh] overflow-y-auto">
              {/* Header Row */}
              <div className="flex justify-between items-center px-4 py-4 bg-[rgba(255,255,255,0.1)] sticky top-0">
                <p className="w-[20%] font-rubik text-[14px] font-bold text-[rgba(255,255,255,0.44)] m-0 uppercase">RANK</p>
                <p className="w-[60%] font-rubik text-[14px] font-bold text-[rgba(255,255,255,0.44)] m-0 uppercase">PLAYER</p>
                <p className="w-[20%] font-rubik text-[14px] font-bold text-[rgba(255,255,255,0.44)] m-0 text-right uppercase">$ZO</p>
              </div>
              
              {/* Data Rows */}
              {entries.map((entry, idx) => (
                <div 
                  key={entry.id} 
                  className="flex justify-between items-center px-4 py-4"
                >
                  <p className="w-[20%] font-rubik text-[16px] font-medium text-white m-0">
                    {idx + 1}
                  </p>
                  <div className="w-[60%] flex items-center gap-2">
                    <div className="w-6 h-6 rounded-[24px] overflow-hidden">
                      <div className="w-full h-full bg-white/10 flex items-center justify-center text-xs font-semibold text-white">
                        {(idx + 1).toString().substring(0, 1)}
                      </div>
                    </div>
                    <p className="font-rubik text-[16px] font-medium text-white m-0">
                      {entry.username || 'Anon'}
                    </p>
                  </div>
                  <p className="w-[20%] font-rubik text-[16px] font-medium text-white/60 m-0 text-right">
                    {entry.zo_points}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardsOverlay;


