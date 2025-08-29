'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { getQuests, QuestEntry, getLeaderboards, LeaderboardEntry } from '@/lib/supabase';
import LeaderboardsOverlay from './LeaderboardsOverlay';

interface QuestsOverlayProps {
  isVisible: boolean;
}

const QuestsOverlay: React.FC<QuestsOverlayProps> = ({ isVisible }) => {
  const [quests, setQuests] = useState<QuestEntry[] | null>(null);
  const [leaders, setLeaders] = useState<LeaderboardEntry[] | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  useEffect(() => {
    if (!isVisible) return;
    const load = async () => {
      const [q, lb] = await Promise.all([getQuests(), getLeaderboards()]);
      setQuests(q);
      setLeaders(lb);
    };
    load();
  }, [isVisible]);

  if (!isVisible) return null;

  const content = (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Quests</h2>
        <button className="paper-button" onClick={() => setShowLeaderboard(true)}>View Leaderboard</button>
      </div>
      {!quests || quests.length === 0 ? (
        <div className="text-center text-gray-600">No quests yet</div>
      ) : (
        <div className="space-y-3 overflow-y-auto">
          {quests.map((q) => (
            <div key={q.id} className="paper-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-lg mb-1">{q.title}</h3>
                  <p className="text-sm text-gray-700 mb-2">{q.description}</p>
                  <div className="text-xs text-gray-600">{q.points} XP</div>
                </div>
                <button className="paper-button whitespace-nowrap">Join Quest</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Desktop overlay */}
      <div className="hidden md:flex paper-overlay fixed top-10 right-5 bottom-10 w-[380px] z-10 flex-col">
        {content}
      </div>

      {/* Mobile sheet */}
      <div
        className={`md:hidden paper-overlay fixed bottom-0 left-0 right-0 z-40 transform transition-transform duration-300 ease-in-out ${isExpanded ? 'translate-y-0' : 'translate-y-[calc(100%-12rem)]'}`}
        style={{ height: 'calc(100vh - 4rem)' }}
      >
        <div className="flex-col h-full">
          <div className="text-center py-2" onClick={() => setIsExpanded(!isExpanded)}>
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto"></div>
          </div>
          {content}
        </div>
      </div>

      <LeaderboardsOverlay isVisible={showLeaderboard} onClose={() => setShowLeaderboard(false)} />
    </>
  );
};

export default QuestsOverlay;


