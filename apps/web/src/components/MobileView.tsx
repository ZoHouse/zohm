'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import MapCanvas from '@/components/MapCanvas';
import MobileTileModal from '@/components/MobileTileModal';
import MobileEventsListOverlay from '@/components/MobileEventsListOverlay';
import MobileNodesListOverlay from '@/components/MobileNodesListOverlay';
import QuestsOverlay from '@/components/QuestsOverlay';
import DashboardOverlay from '@/components/DashboardOverlay';
import WalletOverlay from '@/components/WalletOverlay';
import CityInfoCard from '@/components/CityInfoCard';
import MapViewToggle from '@/components/MapViewToggle';
import QuantumSyncHeader from '@/components/QuantumSyncHeader';
import { PartnerNodeRecord } from '@/lib/supabase';
import mapboxgl from 'mapbox-gl';

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
}) => {
  const [showTileModal, setShowTileModal] = useState(false);
  const [activeList, setActiveList] = useState<'events' | 'nodes' | 'quests' | 'dashboard' | null>(null);
  const [isWalletOpen, setIsWalletOpen] = useState(false);

  const handleUnicornClick = () => {
    setShowTileModal(true);
    setActiveList(null);
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

  return (
    <main className={`relative w-full h-screen overflow-hidden ${isAnyModalOpen ? 'bg-black' : 'bg-[#f4f1ea]'}`}>
      {/* Map Canvas - shrinks to top half when modal is open */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          height: isAnyModalOpen ? '50%' : '100%',
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
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
        />
      </motion.div>

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
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-[#ff4d6d] text-xs font-semibold shadow whitespace-nowrap">
          <span className="inline-flex items-center justify-center w-2 h-2 rounded-full bg-[#ff4d6d] shadow-[0_0_8px_rgba(255,77,109,0.5)]"></span>
          <span>{totalEventsCount} Events</span>
          <span className="opacity-70">•</span>
          <span>{totalNodesCount} Nodes</span>
          <span className="opacity-70">•</span>
          <span>{questCount} Quests</span>
        </div>
      </div>

      {/* Unicorn Button */}
      <motion.button
        onClick={handleUnicornClick}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed left-1/2 -translate-x-1/2 w-20 h-20 rounded-full bg-gradient-to-br from-[#ff4d6d] to-[#ff3355] border-4 border-white shadow-2xl flex items-center justify-center z-40 p-2"
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
      </motion.button>

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
      <QuestsOverlay isVisible={activeList === 'quests'} onClose={handleCloseAll} />

      {/* Dashboard Overlay */}
      <DashboardOverlay 
        isVisible={activeList === 'dashboard'} 
        onClose={handleCloseAll} 
        onOpenWallet={handleOpenWallet}
      />

      {/* Wallet Overlay - rendered at root level */}
      <WalletOverlay 
        isVisible={isWalletOpen} 
        onClose={handleCloseWallet} 
      />
    </main>
  );
};

export default MobileView;

