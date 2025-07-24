'use client';

import { useState, useEffect } from 'react';
import MapCanvas from '@/components/MapCanvas';
import NavBar from '@/components/NavBar';
import EventsOverlay from '@/components/EventsOverlay';
import MembersOverlay from '@/components/MembersOverlay';
import CulturesOverlay from '@/components/CulturesOverlay';
import ProfileOverlay from '@/components/ProfileOverlay';
import ProfileSetup from '@/components/ProfileSetup';
import { pingSupabase, verifyMembersTable } from '@/lib/supabase';
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
  const [activeSection, setActiveSection] = useState<'members' | 'events' | 'cultures'>('events');
  const [events, setEvents] = useState<EventData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [closePopupsFn, setClosePopupsFn] = useState<(() => void) | null>(null);
  const [flyToEvent, setFlyToEvent] = useState<EventData | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
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
          console.log('⚠️ No live events found, using demo data');
          // Fallback to demo events if no live events
          const demoEvents: EventData[] = [
            {
              'Event Name': '420 Sesh with Shroo at 4:20 PM',
              'Date & Time': new Date('2025-07-23T16:20:00').toISOString(),
              Location: 'Zo House Bangalore (Koramangala), S-1, P-2, Anaa Infra\'s Signature',
              Latitude: '12.9278',
              Longitude: '77.6271',
              'Event URL': 'https://lu.ma/example1'
            },
            {
              'Event Name': 'Zo-work',
              'Date & Time': new Date('2025-07-24T09:00:00').toISOString(),
              Location: 'Zo House, 300 4th St, San Francisco, CA 94107, USA',
              Latitude: '37.7749',
              Longitude: '-122.4194',
              'Event URL': 'https://lu.ma/example2'
            }
          ];
          setEvents(demoEvents);
        }
        
      } catch (error) {
        console.error('❌ Error loading live events:', error);
        // Fallback to demo events on error
        const demoEvents: EventData[] = [
          {
            'Event Name': 'Demo Event - Calendar Loading Failed',
            'Date & Time': new Date().toISOString(),
            Location: 'Zo House Bangalore',
            Latitude: '12.9278',
            Longitude: '77.6271',
            'Event URL': 'https://lu.ma/demo'
          }
        ];
        setEvents(demoEvents);
      } finally {
        setIsLoading(false);
      }
    };

    // Start loading events immediately
    loadLiveEvents();
  }, []);

  const handleSectionChange = (section: 'members' | 'events' | 'cultures') => {
    console.log('🔄 Switching to section:', section);
    console.log('Previous section was:', activeSection);
    console.log('closePopupsFn available:', !!closePopupsFn);
    
    // For Members section, check profile gate first
    if (section === 'members' && wallet.isConnected) {
      const hasAccess = profileGate.checkProfileAccess();
      if (!hasAccess) {
        console.log('🚨 Profile setup required for Members section');
        // Still switch to members section so the profile setup shows in context
        // The MembersOverlay will handle showing the profile setup popup
      }
    }
    
    // If switching away from events, close any open popups on the map
    if (section !== 'events' && closePopupsFn) {
      console.log('📍 Calling closePopupsFn because switching away from events');
      closePopupsFn();
    }
    
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
        events={events}
      />

      {/* Logo/Header */}
      <div className="absolute top-10 left-1/2 transform -translate-x-1/2 z-20 text-center max-w-[500px]">
        <img 
          src="/Z_to_House.gif" 
          alt="Zo House Events Calendar" 
          className="h-12 w-auto mx-auto opacity-90 drop-shadow-lg"
        />
        </div>

      {/* Overlays */}
      <EventsOverlay 
        isVisible={activeSection === 'events'} 
        events={events}
        onEventClick={handleEventClick}
        closeMapPopups={closePopupsFn}
        openProfile={() => setIsProfileOpen(true)}
      />
      <MembersOverlay 
        isVisible={activeSection === 'members'}
        openProfile={() => setIsProfileOpen(true)}
      />
      <CulturesOverlay isVisible={activeSection === 'cultures'} />

      {/* Profile Popup */}
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
        }
      `}</style>
    </main>
  );
}
