'use client';

import { useState, useEffect } from 'react';
import MapCanvas from '@/components/MapCanvas';
import NavBar from '@/components/NavBar';
import EventsOverlay from '@/components/EventsOverlay';
import NodesOverlay from '@/components/NodesOverlay';
import QuestsOverlay from '@/components/QuestsOverlay';
import ProfileSetup from '@/components/ProfileSetup';
import DashboardOverlay from '@/components/DashboardOverlay';
import { pingSupabase, verifyMembersTable, PartnerNodeRecord } from '@/lib/supabase';
import { useProfileGate } from '@/hooks/useProfileGate';
import { useWallet } from '@/hooks/useWallet';
import { fetchAllCalendarEventsWithGeocoding } from '@/lib/icalParser';
import { getCalendarUrls } from '@/lib/calendarConfig';
import mapboxgl from 'mapbox-gl';
import WalletConnectButton from '@/components/WalletConnectButton';

interface EventData {
  'Event Name': string;
  'Date & Time': string;
  Location: string;
  Latitude: string;
  Longitude: string;
  'Event URL'?: string;
}

export default function Home() {
  const [activeSection, setActiveSection] = useState<'events' | 'nodes' | 'quests'>('events');
  const [events, setEvents] = useState<EventData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [closePopupsFn, setClosePopupsFn] = useState<(() => void) | null>(null);
  const [flyToEvent, setFlyToEvent] = useState<EventData | null>(null);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [flyToNode, setFlyToNode] = useState<PartnerNodeRecord | null>(null);
  
  // Add profile gate and wallet hooks
  const wallet = useWallet();
  const profileGate = useProfileGate();

  useEffect(() => {
    // Initialize Supabase connection
    const initSupabase = async () => {
      try {
        const basicConnection = await pingSupabase();
        if (basicConnection) {
          console.log('🚀 Supabase basic connection ready!');
          
          // Verify table setup
          const tableVerification = await verifyMembersTable();
          if (tableVerification.exists) {
            console.log('✅ Members table verification complete');
            console.log('📊 Table status:', tableVerification);
          } else {
            console.warn('⚠️ Members table needs setup:', tableVerification.error);
          }
        }
      } catch (error) {
        console.error('Supabase initialization error:', error);
      }
    };

    initSupabase();

    // Load live events from iCal feeds
    const loadLiveEvents = async () => {
      try {
        // Get calendar URLs dynamically from database
        const calendarUrls = await getCalendarUrls();
        
        console.log('🔄 Fetching live events from iCal feeds...');
        console.log('📅 Using calendar URLs:', calendarUrls);
        const liveEvents = await fetchAllCalendarEventsWithGeocoding(calendarUrls);
        
        if (liveEvents.length > 0) {
          console.log('✅ Loaded', liveEvents.length, 'live events from', calendarUrls.length, 'calendars');
          setEvents(liveEvents);
        } else {
          console.log('⚠️ No live events found');
          setEvents([]);
        }
        
      } catch (error) {
        console.error('❌ Error loading live events:', error);
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    };

    // Start loading events immediately
    loadLiveEvents();
  }, []);

  const handleSectionChange = (section: 'events' | 'nodes' | 'quests') => {
    setActiveSection(section);
  };

  const handleEventClick = (event: EventData) => {
    console.log('Home page received event click:', event['Event Name']);
    setFlyToEvent(event);
    
    // Clear the flyToEvent after a short delay to allow for future clicks on the same event
    setTimeout(() => {
      setFlyToEvent(null);
    }, 100);
  };

  const handleNodeClick = (node: PartnerNodeRecord) => {
    console.log('Home page received node click:', node.name);
    setFlyToNode(node);

    setTimeout(() => {
      setFlyToNode(null);
    }, 100);
  };

  const handleMapReady = (map: mapboxgl.Map, closeAllPopups: () => void) => {
    setClosePopupsFn(() => closeAllPopups);
    console.log('Map is ready!');
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-[1000]">
        <div className="text-center text-white">
          <img 
            src="/spinner_Z_4.gif" 
            alt="Loading" 
            className="w-16 h-16 mx-auto mb-4"
          />
          <p className="text-lg">Tuning into Zo World</p>
          <small className="text-white/60">Fetching live events from calendars...</small>
        </div>
      </div>
    );
  }

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

      {/* All Overlays */}
      <EventsOverlay 
        isVisible={activeSection === 'events'} 
        events={events}
        onEventClick={handleEventClick}
        closeMapPopups={closePopupsFn}
      />
      {/* Members overlay removed */}
      <NodesOverlay 
        isVisible={activeSection === 'nodes'}
        onNodeClick={handleNodeClick}
        closeMapPopups={closePopupsFn}
      />
      <QuestsOverlay isVisible={activeSection === 'quests'} />

      {/* Global Overlays */}
      <DashboardOverlay 
        isVisible={isDashboardOpen}
        onClose={() => setIsDashboardOpen(false)}
      />

⁠ {/* Wallet Connect Button */}
      <WalletConnectButton 
        onProfileClick={() => setIsDashboardOpen(true)} 
        onProfileSetupClick={() => profileGate.setShowProfileSetup(true)}
      /> ⁠

      {/* Global Profile Setup Gate */}
      {profileGate.showProfileSetup && (
        <ProfileSetup
          isVisible={profileGate.showProfileSetup}
          walletAddress={wallet.address || ''}
          onComplete={profileGate.completeProfileSetup}
          onClose={() => profileGate.setShowProfileSetup(false)}
          onOpenDashboard={() => setIsDashboardOpen(true)}
        />
      )}

      {/* Bottom Navigation */}
      <NavBar 
        onSectionChange={handleSectionChange}
        activeSection={activeSection}
      />


    </main>
  );
}
