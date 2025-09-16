'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { getQuests, QuestEntry, getLeaderboards, LeaderboardEntry, isQuestCompleted, markQuestCompleted } from '@/lib/supabase';
import { verifyQuestCompletion, verifyTwitterQuestCompletion } from '@/lib/questVerifier';
import { useWallet } from '@/hooks/useWallet';
import LeaderboardsOverlay from './LeaderboardsOverlay';

interface QuestsOverlayProps {
  isVisible: boolean;
}

const QuestsOverlay: React.FC<QuestsOverlayProps> = ({ isVisible }) => {
  const { address: walletAddress, isConnected } = useWallet();
  const [quests, setQuests] = useState<QuestEntry[] | null>(null);
  const [leaders, setLeaders] = useState<LeaderboardEntry[] | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showJoinPopup, setShowJoinPopup] = useState(false);
  const [selectedQuest, setSelectedQuest] = useState<QuestEntry | null>(null);

  const [twitterUrl, setTwitterUrl] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<string>('');

  // Load quests and check completion status
  useEffect(() => {
    if (!isVisible || !walletAddress) return;
    
    const loadQuestsAndCheckCompletion = async () => {
      const [q, lb] = await Promise.all([getQuests(), getLeaderboards()]);
      
      if (q) {
        // Check completion status for each quest
        const questsWithCompletion = await Promise.all(
          q.map(async (quest) => {
            const isCompleted = await isQuestCompleted(walletAddress, quest.id);
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
  }, [isVisible, walletAddress]);

  const handleJoinQuest = (quest: QuestEntry) => {
    if (!isConnected || !walletAddress) {
      setVerificationResult('Please connect your wallet first');
      return;
    }
    
    setSelectedQuest(quest);
    setShowJoinPopup(true);
  };

  const handleSubmitJoin = async () => {
    if (!walletAddress) {
      setVerificationResult('Please connect your wallet first');
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
      const result = await verifyTwitterQuestCompletion(twitterUrl, walletAddress, selectedQuest.id);
      
      if (result.isAlreadyCompleted) {
        setVerificationResult('❌ You have already completed this quest!');
        return;
      }
      
      if (result.success) {
        // Mark the quest as completed with Twitter URL
        const completedQuest = await markQuestCompleted(
          walletAddress, 
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
                walletAddress: walletAddress,
                questId: selectedQuest.id,
                questTitle: selectedQuest.title
              }),
            });

            const rewardResult = await rewardResponse.json();
            
            if (rewardResult.success) {
              setVerificationResult(`✅ Quest completed successfully! You earned 420 $ZO + ${rewardResult.rewardAmount} Dollar Zo reward! Twitter post verified.`);
            } else {
              console.warn('Quest completed but reward failed:', rewardResult.error);
              setVerificationResult(`✅ Quest completed successfully! You earned 420 $ZO. Dollar Zo reward failed: ${rewardResult.error}`);
            }
          } catch (rewardError) {
            console.warn('Quest completed but reward failed:', rewardError);
                          setVerificationResult(`✅ Quest completed successfully! You earned 420 $ZO. Dollar Zo reward failed to send.`);
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
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Quests</h2>
        <button className="paper-button" onClick={() => setShowLeaderboard(true)}>View Leaderboard</button>
      </div>
      
      {!isConnected && (
        <div className="mb-4 p-3 rounded-lg bg-yellow-100 text-yellow-800 border border-yellow-300">
          <p className="text-sm">Please connect your wallet to participate in quests</p>
        </div>
      )}
      
      {!quests || quests.length === 0 ? (
        <div className="text-center text-gray-600">No quests available</div>
      ) : (
        <div className="space-y-3 overflow-y-auto">
          {quests.map((q) => (
            <div key={q.id} className="paper-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-lg mb-1">{q.title}</h3>
                  <p className="text-sm text-gray-700 mb-2">{q.description}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span>420 $ZO per submission</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      q.status === 'active' ? 'bg-green-100 text-green-800' :
                      q.status === 'completed' ? 'bg-gray-100 text-gray-600' :
                      q.status === 'developing' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {q.status === 'completed' ? 'Completed' : q.status}
                    </span>
                  </div>
                </div>
                <button 
                  className={`paper-button whitespace-nowrap ${
                    q.status === 'completed' || !isConnected ? 'opacity-50 cursor-not-allowed bg-gray-300 text-gray-500' : ''
                  }`}
                  onClick={() => q.status !== 'completed' && isConnected && handleJoinQuest(q)}
                  disabled={q.status === 'completed' || !isConnected}
                >
                  {q.status === 'completed' ? 'Completed' : 'Join Quest'}
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
              <p className="text-xs opacity-70 text-white">Reward: 420 $ZO per submission</p>
            </div>

            <div className="mb-4">
              <label htmlFor="twitter-url" className="block text-sm font-medium mb-2 text-white">
                Twitter/X Post URL
              </label>
              <input
                id="twitter-url"
                type="text"
                value={twitterUrl}
                onChange={(e) => setTwitterUrl(e.target.value)}
                placeholder="Enter Twitter/X post URL..."
                className="paper-input w-full text-white placeholder-white placeholder-opacity-70"
              />
              <p className="text-xs opacity-70 text-white mt-1">
                Share a valid Twitter/X post URL to complete the quest
              </p>
            </div>

            {verificationResult && (
              <div className={`mb-4 p-3 rounded-lg border border-white border-opacity-20 ${
                verificationResult.includes('✅') ? 'bg-green-900 bg-opacity-30' : 'bg-red-900 bg-opacity-30'
              }`}>
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
                disabled={!twitterUrl.trim() || isVerifying}
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


