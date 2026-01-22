'use client';

import { useState } from 'react';
import MapCanvas from '@/components/MapCanvas';
import MobileTileModal from '@/components/MobileTileModal';
import MobileEventsListOverlay from '@/components/MobileEventsListOverlay';
import MobileNodesListOverlay from '@/components/MobileNodesListOverlay';
import QuestsOverlay from '@/components/QuestsOverlay';
import { MobileDashboard } from '@/components/mobile-dashboard';
import WalletOverlay from '@/components/WalletOverlay';
import CityInfoCard from '@/components/CityInfoCard';
import MapViewToggle from '@/components/MapViewToggle';
import QuantumSyncHeader from '@/components/QuantumSyncHeader';
import QuestAudio from '@/components/QuestAudio';
import QuestComplete from '@/components/QuestComplete';
import { PartnerNodeRecord } from '@/lib/supabase';
import mapboxgl from 'mapbox-gl';
import { devLog } from '@/lib/logger';

interface EventData {
  'Event Name': string;
  'Date & Time': string;
  Location: string;
  Latitude: string;
  Longitude: string;
  'Event URL'?: string;
}

interface MobileViewProps {
  events: EventData[];
  nodes: PartnerNodeRecord[];
  allNodes: PartnerNodeRecord[];
  totalEventsCount: number;
  totalNodesCount: number;
  questCount: number;
  userCity?: string | null;
  userLocation?: { lat: number; lng: number } | null;
  userId?: string;
  onMapReady: (map: mapboxgl.Map) => void;
  flyToEvent: EventData | null;
  flyToNode: PartnerNodeRecord | null;
  onEventClick?: (event: EventData) => void;
  onNodeClick?: (node: PartnerNodeRecord) => void;
  mapViewMode: 'local' | 'global';
  onMapViewToggle: (mode: 'local' | 'global') => void;
  localCount: number;
  globalCount: number;
  isRequestingLocation?: boolean;
  shouldAnimateFromSpace?: boolean;
  onLocationSaved?: (lat: number, lng: number) => void;
}

const MobileView: React.FC<MobileViewProps> = ({
  events,
  nodes,
  allNodes,
  totalEventsCount,
  totalNodesCount,
  questCount,
  userCity,
  userLocation,
  userId,
  onMapReady,
  flyToEvent,
  flyToNode,
  onEventClick,
  onNodeClick,
  mapViewMode,
  onMapViewToggle,
  localCount,
  globalCount,
  isRequestingLocation = false,
  shouldAnimateFromSpace = false,
  onLocationSaved,
}) => {
  const [showTileModal, setShowTileModal] = useState(false);
  const [activeList, setActiveList] = useState<'events' | 'nodes' | 'quests' | 'dashboard' | null>('dashboard');
  const [isWalletOpen, setIsWalletOpen] = useState(false);

  // Game1111 state
  const [showGame1111, setShowGame1111] = useState(false);
  const [game1111UserId, setGame1111UserId] = useState<string | undefined>();
  const [showQuestComplete, setShowQuestComplete] = useState(false);
  const [questScore, setQuestScore] = useState(0);
  const [questTokens, setQuestTokens] = useState(0);

  const handleUnicornClick = () => {
    setShowTileModal(true);
    setActiveList(null);
  };

  const handleLaunchGame = (userId: string) => {
    devLog.log('🎮 Launching game1111 for user:', userId);
    setGame1111UserId(userId);
    setShowGame1111(true);
    // Close all overlays
    setActiveList(null);
    setShowTileModal(false);
  };

  const handleGameComplete = (score: number, tokensEarned: number) => {
    devLog.log('🎮 Game completed:', { score, tokensEarned });
    setShowGame1111(false);
    setGame1111UserId(undefined);
    setQuestScore(score);
    setQuestTokens(tokensEarned);
    // Show quest complete page with leaderboard
    setShowQuestComplete(true);
  };

  const handleQuestCompleteGoHome = async (): Promise<void> => {
    devLog.log('🏠 Going home from quest complete');
    setShowQuestComplete(false);
    // Open dashboard after viewing quest results
    setActiveList('dashboard');
  };

  const handleTileClick = (section: 'events' | 'nodes' | 'quests' | 'dashboard') => {
    setShowTileModal(false);
    setActiveList(section);
  };

  const handleCloseAll = () => {
    setShowTileModal(false);
    setActiveList(null);
  };

  const handleOpenWallet = () => {
    setIsWalletOpen(true);
  };

  const handleCloseWallet = () => {
    setIsWalletOpen(false);
  };

  const isAnyModalOpen = showTileModal || activeList !== null || isWalletOpen;

  // 🎨 Show quest complete page after finishing quest
  if (showQuestComplete) {
    return (
      <QuestComplete
        onGoHome={handleQuestCompleteGoHome}
        userId={userId}
        score={questScore}
        tokensEarned={questTokens}
      />
    );
  }

  return (
    <main className={`relative w-full h-screen overflow-hidden ${isAnyModalOpen ? 'bg-black' : 'bg-[#f4f1ea]'}`}>
      {/* Map Canvas - shrinks to top half when modal is open */}
      <div
        className={`absolute inset-0 pointer-events-none transition-all duration-300 ease-out ${isAnyModalOpen ? 'h-[50%]' : 'h-full'
          }`}
        style={{ willChange: 'height' }}
      >
        <MapCanvas
          className="absolute inset-0 pointer-events-auto"
          onMapReady={onMapReady}
          flyToEvent={flyToEvent}
          flyToNode={flyToNode}
          events={events}
          nodes={nodes}
          shouldAnimateFromSpace={shouldAnimateFromSpace}
          userLocation={userLocation}
          userId={userId}
          onLocationSaved={onLocationSaved}
        />
      </div>

      {/* User Balance and Avatar Header */}
      {userId && (
        <div className="absolute top-0 left-0 right-0 z-40 pointer-events-none">
          <div className="pointer-events-auto">
            <QuantumSyncHeader userId={userId} />
          </div>
        </div>
      )}

      {/* City Info Card or Logo/Header */}
      {userCity ? (
        <CityInfoCard city={userCity} />
      ) : (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 text-center w-full px-4">
          <img
            src="/Z_to_House.gif"
            alt="Zo House Events Calendar"
            className="h-12 w-auto mx-auto opacity-90 drop-shadow-lg"
          />
        </div>
      )}

      {/* Map View Toggle & Stats Pill - Mobile */}
      <div
        className="absolute top-24 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-auto"
        style={{ touchAction: 'auto' }}
      >
        <MapViewToggle
          viewMode={mapViewMode}
          onToggle={onMapViewToggle}
          localCount={localCount}
          globalCount={globalCount}
          isLoading={isRequestingLocation}
          className="scale-90"
        />
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-[#ff4d6d] text-[10px] md:text-xs font-semibold shadow max-w-[90vw] overflow-x-auto scrollbar-hide">
          <span className="inline-flex items-center justify-center w-2 h-2 rounded-full bg-[#ff4d6d] shadow-[0_0_8px_rgba(255,77,109,0.5)] shrink-0"></span>
          <span className="whitespace-nowrap">{totalEventsCount} Events</span>
          <span className="opacity-70">•</span>
          <span className="whitespace-nowrap">{totalNodesCount} Nodes</span>
          <span className="opacity-70">•</span>
          <span className="whitespace-nowrap">{questCount} Quests</span>
        </div>
      </div>

      {/* Unicorn Button */}
      <button
        onClick={handleUnicornClick}
        className="fixed left-1/2 -translate-x-1/2 w-20 h-20 rounded-full bg-gradient-to-br from-[#ff4d6d] to-[#ff3355] border-4 border-white shadow-2xl flex items-center justify-center z-40 p-2 transition-transform duration-200 ease-out hover:scale-110 active:scale-90"
        style={{
          bottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))',
          boxShadow: '0 8px 32px rgba(255, 77, 109, 0.4)',
        }}
      >
        <img
          src="/Cultural Stickers/FollowYourHeart.png"
          alt="Follow Your Heart"
          className="w-full h-full object-contain"
        />
      </button>

      {/* 4-Tile Modal */}
      <MobileTileModal
        isVisible={showTileModal}
        onClose={handleCloseAll}
        onTileClick={handleTileClick}
      />

      {/* Events List */}
      <MobileEventsListOverlay
        isVisible={activeList === 'events'}
        onClose={handleCloseAll}
        events={events}
        onEventClick={onEventClick}
      />

      {/* Nodes List */}
      <MobileNodesListOverlay
        isVisible={activeList === 'nodes'}
        onClose={handleCloseAll}
        nodes={nodes}
        allNodes={allNodes}
        onNodeClick={onNodeClick}
      />

      {/* Quests Overlay */}
      <QuestsOverlay
        isVisible={activeList === 'quests'}
        onClose={handleCloseAll}
        onLaunchGame={handleLaunchGame}
      />

      {/* Mobile Dashboard */}
      <MobileDashboard
        isVisible={activeList === 'dashboard'}
        onClose={handleCloseAll}
        onLaunchGame={handleLaunchGame}
      />

      {/* Wallet Overlay - rendered at root level */}
      <WalletOverlay
        isVisible={isWalletOpen}
        onClose={handleCloseWallet}
      />

      {/* Game1111 Full-Screen Experience - Independent of overlays */}
      {showGame1111 && (
        <div className="fixed inset-0 z-[10000] bg-black">
          <QuestAudio
            userId={game1111UserId}
            onComplete={handleGameComplete}
          />
        </div>
      )}
    </main>
  );
};

export default MobileView;

