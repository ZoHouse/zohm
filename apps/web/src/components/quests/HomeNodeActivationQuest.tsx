'use client';

/**
 * Home Node Activation Quest
 * 
 * STANDALONE QUEST - NOT YET WIRED TO MAIN APP
 * 
 * This quest allows users to:
 * 1. Scan their physical space using WebAR (8th Wall)
 * 2. Place a 3D \z/ beacon in their home
 * 3. Activate their home as a node on the Zo World network
 * 4. Earn 200-375 $ZO tokens
 * 
 * See: Docs/QUEST_HOME_NODE_ACTIVATION.md for full specification
 * 
 * Status: 🚧 In Development
 * Priority: P1 - Core Feature
 * 
 * TODO:
 * - [ ] Set up 8th Wall account & API keys
 * - [ ] Implement AR scanning component
 * - [ ] Create 3D \z/ beacon model
 * - [ ] Build surface detection logic
 * - [ ] Implement beacon placement UI
 * - [ ] Create node creation API endpoint
 * - [ ] Add database migration for user_nodes table
 * - [ ] Test on iOS and Android devices
 * - [ ] Wire into main quest system
 */

import React, { useState } from 'react';

interface HomeNodeActivationQuestProps {
  userId?: string;
  onComplete?: (rewards: { tokens: number; nodeId: string }) => void;
  onCancel?: () => void;
}

export const HomeNodeActivationQuest: React.FC<HomeNodeActivationQuestProps> = ({
  userId,
  onComplete,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState<
    'intro' | 'permissions' | 'scanning' | 'placement' | 'config' | 'activation' | 'complete'
  >('intro');

  // Quest not yet implemented - show placeholder
  return (
    <div className="fixed inset-0 z-[10000] bg-black flex items-center justify-center">
      <div className="max-w-md mx-auto px-6 text-center">
        <div className="text-6xl mb-6">🏠</div>
        
        <h1 className="text-2xl font-bold text-white mb-4">
          Home Node Activation Quest
        </h1>
        
        <p className="text-white/60 mb-8">
          This quest is currently in development. You'll soon be able to scan your space 
          and place a 3D beacon to activate your home as a node on the Zo World network.
        </p>

        <div className="bg-white/10 rounded-lg p-4 mb-8 text-left">
          <h3 className="text-white font-semibold mb-2">Coming Soon:</h3>
          <ul className="text-white/60 text-sm space-y-2">
            <li>✨ AR space scanning (8th Wall)</li>
            <li>🎯 Place 3D \z/ beacon in your room</li>
            <li>🗺️ Your home appears on the network map</li>
            <li>💰 Earn 200-375 $ZO tokens</li>
            <li>🎖️ Unlock Node Host badge</li>
          </ul>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => {
              if (onCancel) onCancel();
            }}
            className="w-full px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
          >
            Close
          </button>
          
          <a
            href="https://github.com/ZoHouse/zohm/blob/main/Docs/QUEST_HOME_NODE_ACTIVATION.md"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm"
          >
            📋 View Quest Specification
          </a>
        </div>

        {/* Development Status */}
        <div className="mt-8 text-xs text-white/40">
          Status: 🚧 In Development | See Docs/QUEST_HOME_NODE_ACTIVATION.md
        </div>
      </div>
    </div>
  );
};

export default HomeNodeActivationQuest;

/**
 * IMPLEMENTATION PHASES
 * 
 * Phase 1: Foundation (Days 1-3)
 * - Set up 8th Wall account
 * - Add 8th Wall SDK to project
 * - Create basic AR scanning component
 * - Test surface detection
 * - Design 3D \z/ beacon model
 * 
 * Phase 2: Core Quest (Days 4-7)
 * - Build portal placement UI
 * - Implement anchor persistence
 * - Create node creation API
 * - Add to quest system
 * - Database migration for user_nodes
 * 
 * Phase 3: Rewards & Polish (Days 8-10)
 * - Rewards calculation
 * - Success animations
 * - Map integration (show user nodes)
 * - Share functionality
 * - Testing on multiple devices
 * 
 * INTEGRATION CHECKLIST
 * 
 * Before wiring to main app:
 * - [ ] Tested on iOS 15+ (Safari)
 * - [ ] Tested on Android (Chrome 90+)
 * - [ ] Camera permissions handled gracefully
 * - [ ] Location permissions handled gracefully
 * - [ ] AR session errors handled
 * - [ ] Network failures handled (offline queue)
 * - [ ] Database migrations run successfully
 * - [ ] API endpoints secure (RLS policies)
 * - [ ] Rewards system tested
 * - [ ] Anti-spam measures in place
 * - [ ] Performance acceptable (30+ FPS)
 * - [ ] Bundle size acceptable (<500KB)
 */

