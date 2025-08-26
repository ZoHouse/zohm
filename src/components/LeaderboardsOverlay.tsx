'use client';

import React, { useEffect, useState } from 'react';
import { getLeaderboards, LeaderboardEntry } from '@/lib/supabase';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black bg-opacity-20" onClick={onClose} />
      <div className="paper-overlay relative w-full max-w-sm">
        <button onClick={onClose} className="absolute top-4 right-4 text-2xl">&times;</button>
        <h2 className="text-2xl font-bold mb-4 text-center">Leaderboards</h2>
        {!entries || entries.length === 0 ? (
          <div className="text-center text-gray-600">Leaderboard loading…</div>
        ) : (
          <div className="space-y-3 overflow-y-auto">
            {entries.map((e, idx) => (
              <div key={e.id} className="paper-card flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="font-semibold">{e.username || 'Anon'}</div>
                    <div className="text-xs text-gray-600">{e.wallet.slice(0, 6)}…{e.wallet.slice(-4)}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-bold">{e.zo_points} pts</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardsOverlay;


