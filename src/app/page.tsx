'use client';

import { useState, useEffect } from 'react';
import MapCanvas from '@/components/MapCanvas';
import NavBar from '@/components/NavBar';
import EventsOverlay from '@/components/EventsOverlay';
import NodesOverlay from '@/components/NodesOverlay';
import ProfileOverlay from '@/components/ProfileOverlay';
import QuestsOverlay from '@/components/QuestsOverlay';
import ProfileSetup from '@/components/ProfileSetup';
import QuantumSyncOverlay from '@/components/QuantumSyncOverlay';
import DashboardOverlay from '@/components/DashboardOverlay';
import { pingSupabase, verifyMembersTable, PartnerNodeRecord } from '@/lib/supabase';
import { useProfileGate } from '@/hooks/useProfileGate';
import { useWallet } from '@/hooks/useWallet';
import { fetchAllCalendarEventsWithGeocoding } from '@/lib/icalParser';
import { CALENDAR_URLS } from '@/lib/calendarConfig';
import mapboxgl from 'mapbox-gl';

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
  const [isProfileOpen, setIsProfileOpen] = useState(false);
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
        // Use calendar URLs from configuration
        const calendarUrls = CALENDAR_URLS;
        
        console.log('🔄 Fetching live events from iCal feeds...');
        const liveEvents = await fetchAllCalendarEventsWithGeocoding(calendarUrls);
        
        if (liveEvents.length > 0) {
          console.log('✅ Loaded', liveEvents.length, 'live events');
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
      <ProfileOverlay 
        isVisible={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      {/* Global Profile Setup Gate */}
      {profileGate.showProfileSetup && wallet.isConnected && wallet.address && (
        <ProfileSetup
          isVisible={profileGate.showProfileSetup}
          walletAddress={wallet.address}
          onComplete={profileGate.completeProfileSetup}
          onClose={() => profileGate.setShowProfileSetup(false)}
        />
      )}

      {/* Bottom Navigation */}
      <NavBar 
        onSectionChange={handleSectionChange}
        activeSection={activeSection}
      />

      {/* Custom Styles for Mapbox and Mobile Viewport */}
      <style jsx global>{`
        /* Hide any mapbox controls that might interfere with bottom nav */
        .mapboxgl-ctrl-bottom-left,
        .mapboxgl-ctrl-bottom-right {
          display: none !important;
        }

        /* CSS custom properties for viewport calculations */
        :root {
          --vh: 1vh;
          --mobile-vh: 100vh;
          --available-height: 100vh;
          --real-vh: 100vh;
          --safe-area-bottom: env(safe-area-inset-bottom, 0px);
        }

        /* Popup styles */
        .glass-popup {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          padding: 16px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }

        /* Disable default mapbox popup animations - appear directly at pin */
        .paper-card .mapboxgl-popup-content {
          animation: none !important;
          transform: none !important;
        }

        .glass-popup h3 {
          margin: 0 0 8px 0;
          color: #2a251d;
          font-size: 1rem;
          font-weight: 600;
        }

        .glass-popup p {
          margin: 4px 0;
          color: #2a251d;
          font-size: 0.85rem;
          opacity: 0.8;
        }

        .popup-register-btn {
          background: #d4a574;
          color: #f4f1ea;
          padding: 8px 16px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 500;
          font-size: 0.85rem;
          display: inline-block;
          margin-top: 8px;
          transition: all 0.3s ease;
          border: 1px solid #d4a574;
        }

        .popup-register-btn:hover {
          background: #8b5fbf;
          border-color: #8b5fbf;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(212, 165, 116, 0.3);
        }

        /* Line clamp utility */
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Mobile viewport fixes */
        @media (max-width: 768px) {
          body, html {
            height: 100vh;
            height: calc(var(--available-height, 100vh));
            height: 100dvh;
            height: -webkit-fill-available;
            overflow: hidden;
            position: relative;
          }

          /* Prevent scrolling and bounce on mobile */
          body {
            position: fixed;
            width: 100%;
            overscroll-behavior: none;
            -webkit-overflow-scrolling: touch;
          }

          /* Mobile-specific animations */
          @keyframes slideUp {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }

          @keyframes slideDown {
            from { transform: translateY(0); }
            to { transform: translateY(100%); }
          }

          .mobile-sheet-enter {
            animation: slideUp 0.3s ease-out;
          }

          .mobile-sheet-exit {
            animation: slideDown 0.3s ease-in;
          }
        }
      `}</style>
    </main>
  );
}
