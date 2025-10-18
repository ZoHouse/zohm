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
import { PartnerNodeRecord } from '@/lib/supabase';

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
  onMapReady: (map: mapboxgl.Map) => void;
  flyToEvent: EventData | null;
  flyToNode: PartnerNodeRecord | null;
  onEventClick?: (event: EventData) => void;
  onNodeClick?: (node: PartnerNodeRecord) => void;
}

const MobileView: React.FC<MobileViewProps> = ({
  events,
  onMapReady,
  flyToEvent,
  flyToNode,
  onEventClick,
  onNodeClick,
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

  const isAnyModalOpen = showTileModal || activeList !== null;

  return (
    <main className={`relative w-full h-screen overflow-hidden ${isAnyModalOpen ? 'bg-black' : 'bg-[#f4f1ea]'}`}>
      {/* Map Canvas - shrinks to top half when modal is open */}
      <motion.div
        className="absolute inset-0"
        animate={{
          height: isAnyModalOpen ? '50%' : '100%',
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        <MapCanvas 
          className="absolute inset-0" 
          onMapReady={onMapReady}
          flyToEvent={flyToEvent}
          flyToNode={flyToNode}
          events={events}
        />
      </motion.div>

      {/* Logo/Header */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 text-center max-w-[500px] px-4">
        <img 
          src="/Z_to_House.gif" 
          alt="Zo House Events Calendar" 
          className="h-12 w-auto mx-auto opacity-90 drop-shadow-lg"
        />
      </div>

      {/* Unicorn Button */}
      <motion.button
        onClick={handleUnicornClick}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 border-4 border-white shadow-2xl flex items-center justify-center text-4xl z-40"
        style={{
          boxShadow: '0 8px 32px rgba(255, 105, 180, 0.4)',
        }}
      >
        🦄
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

