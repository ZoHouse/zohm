'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { getQuests, QuestEntry, getLeaderboards, LeaderboardEntry, isQuestCompleted, markQuestCompleted } from '@/lib/supabase';
import { verifyQuestCompletion, verifyTwitterQuestCompletion } from '@/lib/questVerifier';
import { usePrivyUser } from '@/hooks/usePrivyUser';
import LeaderboardsOverlay from './LeaderboardsOverlay';
import { GlowChip, GlowButton, GlowCard } from '@/components/ui';

interface QuestsOverlayProps {
  isVisible: boolean;
  onClose?: () => void;
}

const QuestsOverlay: React.FC<QuestsOverlayProps> = ({ isVisible, onClose }) => {
  const { primaryWalletAddress, authenticated } = usePrivyUser();
  const [quests, setQuests] = useState<QuestEntry[] | null>(null);
  const [leaders, setLeaders] = useState<LeaderboardEntry[] | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showJoinPopup, setShowJoinPopup] = useState(false);
  const [selectedQuest, setSelectedQuest] = useState<QuestEntry | null>(null);

  const [twitterUrl, setTwitterUrl] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<string>('');

  // Load quests and check completion status
  useEffect(() => {
    if (!isVisible || !primaryWalletAddress) return;
    
    const loadQuestsAndCheckCompletion = async () => {
      const [q, lb] = await Promise.all([getQuests(), getLeaderboards()]);
      
      if (q) {
        // Check completion status for each quest
        const questsWithCompletion = await Promise.all(
          q.map(async (quest) => {
            const isCompleted = await isQuestCompleted(primaryWalletAddress, quest.id);
            return {
              ...quest,
              status: isCompleted ? 'completed' : quest.status
            };
          })
        );
        setQuests(questsWithCompletion);
      }
      
      setLeaders(lb);
    };
    
    loadQuestsAndCheckCompletion();
  }, [isVisible, primaryWalletAddress]);

  const handleJoinQuest = (quest: QuestEntry) => {
    if (!authenticated || !primaryWalletAddress) {
      setVerificationResult('Please log in first');
      return;
    }
    
    setSelectedQuest(quest);
    setShowJoinPopup(true);
  };

  const handleSubmitJoin = async () => {
    if (!primaryWalletAddress) {
      setVerificationResult('Please log in first');
      return;
    }
    
    // if (!twitterUrl.trim()) {
    //   setVerificationResult('Please enter a Twitter URL');
    //   return;
    // }

    if (!selectedQuest) {
      setVerificationResult('No quest selected');
      return;
    }

    setIsVerifying(true);
    setVerificationResult('');

    try {
      // Use the new Twitter quest completion verification
      const result = await verifyTwitterQuestCompletion(twitterUrl, primaryWalletAddress, selectedQuest.id);
      
      if (result.isAlreadyCompleted) {
        setVerificationResult('❌ You have already completed this quest!');
        return;
      }
      
      if (result.success) {
        // Mark the quest as completed with Twitter URL
        const completedQuest = await markQuestCompleted(
          primaryWalletAddress, 
          selectedQuest.id, 
          undefined, // No transaction hash
          undefined, // No amount
          {
            quest_title: selectedQuest.title,
            quest_description: selectedQuest.description,
            twitter_url: twitterUrl,
            reward_zo: 420, // Fixed reward of 420 $ZO per 
            verification_timestamp: new Date().toISOString()
          }
        );
        
        if (completedQuest) {
          // Send AVAX reward
          try {
            const rewardResponse = await fetch('/api/send-avax-reward', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                walletAddress: primaryWalletAddress,
                questId: selectedQuest.id,
                questTitle: selectedQuest.title
              }),
            });

            const rewardResult = await rewardResponse.json();
            
            if (rewardResult.success) {
              setVerificationResult(`✅ Quest completed successfully! You earned 420 $ZO  reward! Welcome to the Zo World.`);
            } else {
              console.warn('Quest completed but reward failed:', rewardResult.error);
              setVerificationResult(`✅ Quest completed successfully! You earned 420 $ZO. Dollar Zo reward failed: ${rewardResult.error} Welcome to the Zo World.`);
            }
          } catch (rewardError) {
            console.warn('Quest completed but reward failed:', rewardError);
                          setVerificationResult(`✅ Quest completed successfully! You earned 420 $ZO. Dollar Zo reward failed to send. Welcome to the Zo World.`);
          }
          
          // Update the quest status locally
          setQuests(prev => prev ? prev.map(q => 
            q.id === selectedQuest.id ? { ...q, status: 'completed' } : q
          ) : null);
          
          // Close popup after delay
          setTimeout(() => {
            setShowJoinPopup(false);
            setSelectedQuest(null);
            setTwitterUrl('');
            setVerificationResult('');
          }, 5000); // Increased delay to show reward info
        } else {
          setVerificationResult('❌ Failed to mark quest as completed. Please try again.');
        }
      } else {
        setVerificationResult(`❌ ${result.error}`);
      }
    } catch (error) {
      setVerificationResult(`❌ Error verifying Twitter URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClosePopup = () => {
    setShowJoinPopup(false);
    setSelectedQuest(null);
    setTwitterUrl('');
    setVerificationResult('');
  };

  if (!isVisible) return null;

  const content = (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <img src="/Quests.png" alt="Quests" className="w-8 h-8 object-contain" />
          <h2 className="text-2xl font-bold text-black">Quests</h2>
        </div>
        <GlowButton variant="secondary" onClick={() => setShowLeaderboard(true)}>
          View Leaderboard
        </GlowButton>
      </div>
      
      {!authenticated && (
        <GlowCard className="mb-4 bg-yellow-500/20 border-yellow-500/40">
          <p className="text-sm text-yellow-900">Please log in to participate in quests</p>
        </GlowCard>
      )}
      
      {!quests || quests.length === 0 ? (
        <div className="text-center text-gray-600">No quests available</div>
      ) : (
        <div className="space-y-3 overflow-y-auto">
          {quests.map((q) => (
            <GlowCard key={q.id} hoverable>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg text-black">{q.title}</h3>
                    {q.status === 'active' && <GlowChip showDot>Active</GlowChip>}
                    {q.status === 'completed' && <GlowChip>Completed</GlowChip>}
                    {q.status === 'developing' && <GlowChip>Developing</GlowChip>}
                  </div>
                  <p className="text-sm text-gray-700 mb-3">{q.description}</p>
                  <div className="flex items-center gap-2">
                    <GlowChip>420 $ZO</GlowChip>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <GlowButton 
                  variant="primary"
                  className="w-full"
                  onClick={() => q.status !== 'completed' && authenticated && handleJoinQuest(q)}
                  disabled={q.status === 'completed' || !authenticated}
                >
                  {q.status === 'completed' ? 'Completed' : 'Join Quest'}
                </GlowButton>
              </div>
            </GlowCard>
          ))}
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Desktop Overlay */}
      {isVisible && (
        <GlowCard className="hidden md:flex fixed top-10 right-5 bottom-10 w-[380px] z-[10001] flex-col">
          {content}
        </GlowCard>
      )}

      {/* Mobile Overlay */}
      {isVisible && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-1/2 bg-white/20 backdrop-blur-md border-t border-white/40 rounded-t-3xl shadow-2xl z-[10001] overflow-hidden flex flex-col">
        {/* Mobile Header */}
        <div className="px-6 py-4 border-b border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/Quests.png" alt="Quests" className="w-8 h-8 object-contain" />
              <h2 className="text-2xl font-bold text-black">Quests</h2>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 border border-white/40 transition-colors"
            >
              <span className="text-black font-bold">✕</span>
            </button>
          </div>
        </div>

        {/* Mobile Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {!authenticated && (
            <GlowCard className="mb-4 bg-yellow-500/20 border-yellow-500/40">
              <p className="text-sm text-yellow-900">Please log in to participate in quests</p>
            </GlowCard>
          )}
          
          {!quests || quests.length === 0 ? (
            <div className="text-center text-gray-600 py-8">No quests available</div>
          ) : (
            <div className="space-y-3">
              {quests.map((q) => (
                <GlowCard key={q.id} hoverable>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-base text-black">{q.title}</h3>
                        {q.status === 'active' && <GlowChip showDot>Active</GlowChip>}
                        {q.status === 'completed' && <GlowChip>Completed</GlowChip>}
                        {q.status === 'developing' && <GlowChip>Developing</GlowChip>}
                      </div>
                      <p className="text-sm text-gray-700 mb-3">{q.description}</p>
                      <div className="flex items-center gap-2">
                        <GlowChip>420 $ZO</GlowChip>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <GlowButton 
                      variant="primary"
                      className="w-full"
                      onClick={() => q.status !== 'completed' && authenticated && handleJoinQuest(q)}
                      disabled={q.status === 'completed' || !authenticated}
                    >
                      {q.status === 'completed' ? 'Completed' : 'Join Quest'}
                    </GlowButton>
                  </div>
                </GlowCard>
              ))}
            </div>
          )}
        </div>

        {/* Mobile Footer - Leaderboard Button */}
        <div className="px-6 py-4 border-t border-white/20">
          <GlowButton 
            variant="secondary" 
            onClick={() => setShowLeaderboard(true)}
            className="w-full"
          >
            View Leaderboard
          </GlowButton>
        </div>
      </div>
      )}

      {/* Join Quest Popup */}
      {showJoinPopup && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[10001] p-4">
          <GlowCard className="max-w-md w-full mx-4">
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
              <p className="text-sm mb-3 text-gray-200">{selectedQuest?.description}</p>
              <GlowChip>420 $ZO</GlowChip>
            </div>

            <div className="mb-4">
              <label htmlFor="twitter-url" className="block text-sm font-medium mb-2 text-white">
                Enter the Zo World
              </label>
              <input
                id="twitter-url"
                type="text"
                value={twitterUrl}
                onChange={(e) => setTwitterUrl(e.target.value)}
                placeholder="Enter the Zo World..."
                className="w-full px-4 py-3 rounded-2xl bg-white/10 border border-white/30 text-white placeholder-gray-400 focus:outline-none focus:border-[#ff4d6d] focus:ring-2 focus:ring-[#ff4d6d]/50 transition-all"
              />
              <p className="text-xs text-gray-300 mt-2">
                Enter the Zo World to complete the quest
              </p>
            </div>

            {verificationResult && (
              <GlowCard className={`mb-4 ${
                verificationResult.includes('✅') 
                  ? 'bg-green-500/20 border-green-500/40' 
                  : 'bg-red-500/20 border-red-500/40'
              }`}>
                <p className="text-sm text-white font-medium">{verificationResult}</p>
              </GlowCard>
            )}

            <div className="flex gap-3">
              <GlowButton
                variant="secondary"
                onClick={handleClosePopup}
                className="flex-1"
              >
                Cancel
              </GlowButton>
              <GlowButton
                variant="primary"
                onClick={handleSubmitJoin}
                disabled={!twitterUrl.trim() || isVerifying}
                className="flex-1"
              >
                {isVerifying ? 'Verifying...' : 'Submit'}
              </GlowButton>
            </div>
          </GlowCard>
        </div>
      )}

      <LeaderboardsOverlay isVisible={showLeaderboard} onClose={() => setShowLeaderboard(false)} />
    </>
  );
};

export default QuestsOverlay;


