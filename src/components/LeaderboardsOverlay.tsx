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
      <GlowCard className="relative w-full max-w-sm">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-2xl text-black hover:opacity-70 transition-opacity"
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold mb-6 text-center text-black">Leaderboards</h2>
        {!entries || entries.length === 0 ? (
          <div className="text-center text-gray-600 py-8">Leaderboard loading…</div>
        ) : (
          <div className="space-y-3 overflow-y-auto max-h-[60vh]">
            {entries.map((e, idx) => (
              <GlowCard key={e.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#ff4d6d] flex items-center justify-center text-sm font-semibold text-white">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-black">{e.username || 'Anon'}</div>
                    <div className="text-xs text-gray-600">{e.wallet.slice(0, 6)}…{e.wallet.slice(-4)}</div>
                  </div>
                </div>
                <GlowChip>{e.zo_points} pts</GlowChip>
              </GlowCard>
            ))}
          </div>
        )}
      </GlowCard>
    </div>
  );
};

export default LeaderboardsOverlay;


