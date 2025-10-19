'use client';

import { useState } from 'react';
import MapCanvas from '@/components/MapCanvas';
import NavBar from '@/components/NavBar';
import EventsOverlay from '@/components/EventsOverlay';
import NodesOverlay from '@/components/NodesOverlay';
import QuestsOverlay from '@/components/QuestsOverlay';
import DashboardOverlay from '@/components/DashboardOverlay';
import WalletOverlay from '@/components/WalletOverlay';
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

interface DesktopViewProps {
  events: EventData[];
  nodes: PartnerNodeRecord[];
  onMapReady: (map: mapboxgl.Map, closeAllPopups: () => void) => void;
  flyToEvent: EventData | null;
  flyToNode: PartnerNodeRecord | null;
  onEventClick?: (event: EventData) => void;
  onNodeClick?: (node: PartnerNodeRecord) => void;
}

const DesktopView: React.FC<DesktopViewProps> = ({
  events,
  nodes,
  onMapReady,
  flyToEvent,
  flyToNode,
  onEventClick,
  onNodeClick,
}) => {
  const [activeSection, setActiveSection] = useState<'events' | 'nodes' | 'quests'>('events');
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [closePopupsFn, setClosePopupsFn] = useState<(() => void) | null>(null);

  const handleSectionChange = (section: 'events' | 'nodes' | 'quests') => {
    setActiveSection(section);
    if (section === 'events' && typeof window !== 'undefined') {
      try {
        (window as any).clearRoute?.();
      } catch (e) {
        console.warn('Could not clear route on section change:', e);
      }
    }
  };

  const handleMapReady = (map: mapboxgl.Map, closeAllPopups: () => void) => {
    setClosePopupsFn(() => closeAllPopups);
    onMapReady(map, closeAllPopups);
    console.log('Desktop Map is ready!');
  };

  return (
    <main className="relative w-full h-screen overflow-hidden bg-[#f4f1ea]">
      {/* Map Canvas */}
      <MapCanvas 
        className="absolute inset-0" 
        onMapReady={handleMapReady}
        flyToEvent={flyToEvent}
        flyToNode={flyToNode}
        events={events}
      />

      {/* Logo/Header */}
      <div className="absolute top-4 sm:top-10 left-1/2 transform -translate-x-1/2 z-20 text-center max-w-[500px] px-4">
        <img 
          src="/Z_to_House.gif" 
          alt="Zo House Events Calendar" 
          className="h-12 w-auto mx-auto opacity-90 drop-shadow-lg"
        />
      </div>

      {/* $Unicorn Launch Button */}
      <div className="absolute top-4 sm:top-10 right-4 z-20">
        <a
          href="https://unicornsf.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border-2 border-white"
        >
          <span className="text-lg mr-2">🦄</span>
          <span className="text-sm sm:text-base">$Unicorn</span>
        </a>
      </div>

      {/* Right-side Overlays */}
      <EventsOverlay 
        isVisible={activeSection === 'events'} 
        events={events}
        onEventClick={onEventClick}
        closeMapPopups={closePopupsFn}
      />
      <NodesOverlay 
        isVisible={activeSection === 'nodes'}
        onNodeClick={onNodeClick}
        closeMapPopups={closePopupsFn}
      />
      <QuestsOverlay isVisible={activeSection === 'quests'} />

      {/* Dashboard Overlay */}
      <DashboardOverlay 
        isVisible={isDashboardOpen}
        onClose={() => setIsDashboardOpen(false)}
        onOpenWallet={() => setIsWalletOpen(true)}
      />

      {/* Wallet Overlay - rendered at root level */}
      <WalletOverlay 
        isVisible={isWalletOpen}
        onClose={() => setIsWalletOpen(false)}
      />

      {/* Bottom Navigation - DESKTOP */}
      <div className="hidden md:block">
        <NavBar 
          onSectionChange={handleSectionChange}
          activeSection={activeSection}
          onDashboardClick={() => setIsDashboardOpen(true)}
        />
      </div>
    </main>
  );
};

export default DesktopView;

