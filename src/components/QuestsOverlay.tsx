'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { getQuests, QuestEntry, getLeaderboards, LeaderboardEntry } from '@/lib/supabase';
import { verifyQuestRequirement } from '@/lib/questVerifier';
import LeaderboardsOverlay from './LeaderboardsOverlay';

interface QuestsOverlayProps {
  isVisible: boolean;
}

const QuestsOverlay: React.FC<QuestsOverlayProps> = ({ isVisible }) => {
  const [quests, setQuests] = useState<QuestEntry[] | null>(null);
  const [leaders, setLeaders] = useState<LeaderboardEntry[] | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showJoinPopup, setShowJoinPopup] = useState(false);
  const [selectedQuest, setSelectedQuest] = useState<QuestEntry | null>(null);
  const [joinMessage, setJoinMessage] = useState('');
  const [transactionHash, setTransactionHash] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<string>('');

  useEffect(() => {
    if (!isVisible) return;
    const load = async () => {
      const [q, lb] = await Promise.all([getQuests(), getLeaderboards()]);
      setQuests(q);
      setLeaders(lb);
    };
    load();
  }, [isVisible]);

  const handleJoinQuest = (quest: QuestEntry) => {
    setSelectedQuest(quest);
    setShowJoinPopup(true);
    setJoinMessage('');
  };

  const handleSubmitJoin = async () => {
    if (!transactionHash.trim()) {
      setVerificationResult('Please enter a transaction hash');
      return;
    }

    setIsVerifying(true);
    setVerificationResult('');

    try {
      const isValid = await verifyQuestRequirement(transactionHash);
      
      if (isValid) {
        setVerificationResult('✅ Quest requirement verified! Transaction has more than 0.5 AVAX.');
        // TODO: Implement actual join logic here
        setTimeout(() => {
          setShowJoinPopup(false);
          setSelectedQuest(null);
          setJoinMessage('');
          setTransactionHash('');
          setVerificationResult('');
        }, 2000);
      } else {
        setVerificationResult('❌ Quest requirement not met. Transaction must have more than 0.5 AVAX.');
      }
    } catch (error) {
      setVerificationResult(`❌ Error verifying transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClosePopup = () => {
    setShowJoinPopup(false);
    setSelectedQuest(null);
    setJoinMessage('');
    setTransactionHash('');
    setVerificationResult('');
  };

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
                  <div className="text-xs text-gray-600">{q.reward} XP</div>
                </div>
                <button 
                  className="paper-button whitespace-nowrap"
                  onClick={() => handleJoinQuest(q)}
                >
                  Join Quest
                </button>
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

      {/* Join Quest Popup */}
      {showJoinPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="paper-card max-w-md w-full mx-4 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Join Quest</h3>
              <button 
                onClick={handleClosePopup}
                className="text-white hover:opacity-70 text-2xl leading-none font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="mb-4">
              <h4 className="font-semibold mb-2 text-white">{selectedQuest?.title}</h4>
              <p className="text-sm mb-3 text-white">{selectedQuest?.description}</p>
              <p className="text-xs opacity-70 text-white">Reward: {selectedQuest?.reward} XP</p>
            </div>

            <div className="mb-4">
              <label htmlFor="join-message" className="block text-sm font-medium mb-2 text-white">
                Why do you want to join this quest?
              </label>
              <textarea
                id="join-message"
                value={joinMessage}
                onChange={(e) => setJoinMessage(e.target.value)}
                placeholder="Tell us why you're interested in this quest..."
                className="paper-input w-full resize-none text-white placeholder-white placeholder-opacity-70"
                rows={3}
              />
            </div>

            <div className="mb-4">
              <label htmlFor="transaction-hash" className="block text-sm font-medium mb-2 text-white">
                Transaction Hash (AVAX)
              </label>
              <input
                id="transaction-hash"
                type="text"
                value={transactionHash}
                onChange={(e) => setTransactionHash(e.target.value)}
                placeholder="Enter transaction hash to verify >0.5 AVAX..."
                className="paper-input w-full text-white placeholder-white placeholder-opacity-70"
              />
              <p className="text-xs opacity-70 text-white mt-1">
                Must be a transaction with more than 0.5 AVAX
              </p>
            </div>

            {verificationResult && (
              <div className="mb-4 p-3 rounded-lg bg-black bg-opacity-30 border border-white border-opacity-20">
                <p className="text-sm text-white">{verificationResult}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleClosePopup}
                className="flex-1 paper-button bg-transparent text-white border-2 border-white hover:bg-white hover:text-black"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitJoin}
                disabled={!joinMessage.trim() || !transactionHash.trim() || isVerifying}
                className="flex-1 paper-button bg-white text-black hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isVerifying ? 'Verifying...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      <LeaderboardsOverlay isVisible={showLeaderboard} onClose={() => setShowLeaderboard(false)} />
    </>
  );
};

export default QuestsOverlay;


