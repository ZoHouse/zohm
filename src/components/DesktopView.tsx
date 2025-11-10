'use client';

import { useState } from 'react';
import MapCanvas from '@/components/MapCanvas';
import NavBar from '@/components/NavBar';
import EventsOverlay from '@/components/EventsOverlay';
import NodesOverlay from '@/components/NodesOverlay';
import QuestsOverlay from '@/components/QuestsOverlay';
import DashboardOverlay from '@/components/DashboardOverlay';
import WalletOverlay from '@/components/WalletOverlay';
import CityInfoCard from '@/components/CityInfoCard';
import MapViewToggle from '@/components/MapViewToggle';
import StatsPill from '@/components/StatsPill';
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
  allNodes: PartnerNodeRecord[];
  totalEventsCount: number;
  totalNodesCount: number;
  questCount: number;
  userCity?: string | null;
  onMapReady: (map: mapboxgl.Map, closeAllPopups: () => void) => void;
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

const DesktopView: React.FC<DesktopViewProps> = ({
  events,
  nodes,
  allNodes,
  totalEventsCount,
  totalNodesCount,
  questCount,
  userCity,
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
      {/* Map Canvas - shows only filtered events and nodes based on mode */}
      <MapCanvas 
        className="absolute inset-0" 
        onMapReady={handleMapReady}
        flyToEvent={flyToEvent}
        flyToNode={flyToNode}
        events={events}
        nodes={nodes}
        shouldAnimateFromSpace={shouldAnimateFromSpace}
      />

      {/* City Info Card or Logo/Header */}
      {userCity ? (
        <CityInfoCard city={userCity} />
      ) : (
        <div className="absolute top-4 sm:top-10 left-1/2 transform -translate-x-1/2 z-20 text-center max-w-[500px] px-4">
          <img 
            src="/Z_to_House.gif" 
            alt="Zo House Events Calendar" 
            className="h-12 w-auto mx-auto opacity-90 drop-shadow-lg"
          />
          <div className="mt-3 inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/20 backdrop-blur-md border border-white/40 text-[#ff4d6d] text-sm font-semibold shadow-lg">
            <span className="inline-flex items-center justify-center w-2.5 h-2.5 rounded-full bg-[#ff4d6d] shadow-[0_0_10px_rgba(255,77,109,0.6)]"></span>
            <span>{events.length} Events</span>
            <span className="opacity-70">•</span>
            <span>{nodes.length} Nodes</span>
            <span className="opacity-70">•</span>
            <span>{questCount} Quests</span>
          </div>
        </div>
      )}

      {/* Map View Toggle & Stats Pill */}
      <div className="absolute top-24 left-1/2 transform -translate-x-1/2 z-20 flex flex-col items-center gap-3">
        <MapViewToggle
          viewMode={mapViewMode}
          onToggle={onMapViewToggle}
          localCount={localCount}
          globalCount={globalCount}
          isLoading={isRequestingLocation}
        />
        <StatsPill
          eventsCount={totalEventsCount}
          nodesCount={totalNodesCount}
          questsCount={questCount}
        />
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
        nodes={nodes}
        allNodes={allNodes}
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

