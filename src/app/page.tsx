'use client';

import { useState, useEffect } from 'react';
import MapCanvas from '@/components/MapCanvas';
import NavBar from '@/components/NavBar';
import EventsOverlay from '@/components/EventsOverlay';
import NodesOverlay from '@/components/NodesOverlay';
import QuestsOverlay from '@/components/QuestsOverlay';
import ProfileSetup from '@/components/ProfileSetup';
import DashboardOverlay from '@/components/DashboardOverlay';
import { pingSupabase, verifyMembersTable, PartnerNodeRecord, supabase } from '@/lib/supabase';
import { useProfileGate } from '@/hooks/useProfileGate';
import { useWallet } from '@/hooks/useWallet';
import { fetchAllCalendarEventsWithGeocoding } from '@/lib/icalParser';
import { getCalendarUrls } from '@/lib/calendarConfig';
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
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [flyToNode, setFlyToNode] = useState<PartnerNodeRecord | null>(null);

  const [showRitual, setShowRitual] = useState(false); // Simple ritual state
  const [userProfileStatus, setUserProfileStatus] = useState<'loading' | 'exists' | 'not_exists' | null>(null); // User profile status
  
  // Add profile gate and wallet hooks
  const wallet = useWallet();
  const profileGate = useProfileGate();

  useEffect(() => {
    // Initialize Supabase connection and check user profile status
    const initApp = async () => {
      try {
        const basicConnection = await pingSupabase();
        if (basicConnection) {
          console.log('🚀 Supabase basic connection ready!');
          
          // Verify table setup
          const tableVerification = await verifyMembersTable();
          if (tableVerification.exists) {
            console.log('✅ Members table verification complete');
            console.log('📊 Table status:', tableVerification);
            
            // Check if user is already connected and has a profile
            if (wallet.isConnected && wallet.address) {
              console.log('🔍 Checking if user profile exists...');
              setUserProfileStatus('loading');
              
              try {
                const { data, error } = await supabase
                  .from('members')
                  .select('name')
                  .eq('wallet', wallet.address.toLowerCase())
                  .single();
                
                if (error && error.code !== 'PGRST116') {
                  console.error('Error checking user profile:', error);
                  setUserProfileStatus('not_exists');
                } else if (data && data.name) {
                  console.log('✅ User profile already exists:', data.name);
                  setUserProfileStatus('exists');
                } else {
                  console.log('❌ User profile not found');
                  setUserProfileStatus('not_exists');
                }
              } catch (error) {
                console.error('Exception checking user profile:', error);
                setUserProfileStatus('not_exists');
              }
            }
          } else {
            console.warn('⚠️ Members table needs setup:', tableVerification.error);
          }
        }
      } catch (error) {
        console.error('Supabase initialization error:', error);
      }
    };

    initApp();

    // Load live events from iCal feeds
    const loadLiveEvents = async () => {
      try {
        console.log('🔄 Starting to load events...');
        
        // Get calendar URLs dynamically from database
        const calendarUrls = await getCalendarUrls();
        console.log('📅 Got calendar URLs:', calendarUrls);
        
        console.log('🔄 Fetching live events from iCal feeds...');
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
        console.log('🏁 Setting isLoading to false');
        setIsLoading(false);
      }
    };

    // Start loading events immediately
    loadLiveEvents();
    
    // Temporary: Set a timeout to prevent infinite loading during development
    const timeoutId = setTimeout(() => {
      console.log('⏰ Loading timeout reached, proceeding anyway');
      setIsLoading(false);
    }, 5000);
    
    // Cleanup timeout if component unmounts
    return () => clearTimeout(timeoutId);
  }, [wallet.isConnected, wallet.address]);

  // Effect to check user profile when wallet connects
  useEffect(() => {
    if (wallet.isConnected && wallet.address && userProfileStatus === null) {
      console.log('🔍 Wallet connected, checking user profile...');
      setUserProfileStatus('loading');
      
      const checkUserProfile = async () => {
        try {
          const { data, error } = await supabase
            .from('members')
            .select('name')
            .eq('wallet', wallet.address!.toLowerCase())
            .single();
          
          if (error && error.code !== 'PGRST116') {
            console.error('Error checking user profile:', error);
            setUserProfileStatus('not_exists');
          } else if (data && data.name) {
            console.log('✅ User profile already exists:', data.name);
            setUserProfileStatus('exists');
          } else {
            console.log('❌ User profile not found');
            setUserProfileStatus('not_exists');
          }
        } catch (error) {
          console.error('Exception checking user profile:', error);
          setUserProfileStatus('not_exists');
        }
      };
      
      checkUserProfile();
    }
  }, [wallet.isConnected, wallet.address, userProfileStatus]);

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

  // Handle red pill click - connect wallet
  const handleRedPillClick = async () => {
    console.log('🔴 Red pill clicked! Connecting wallet...');
    console.log('🔍 Current wallet state:', {
      isConnected: wallet.isConnected,
      address: wallet.address,
      isMetaMaskInstalled: wallet.isMetaMaskInstalled
    });
    
    // Check if MetaMask is available
    if (!wallet.isMetaMaskInstalled) {
      alert('MetaMask is not installed. Please install MetaMask to continue.');
      return;
    }
    
    // Connect wallet if not already connected
    if (!wallet.isConnected) {
      try {
        console.log('📱 Requesting wallet connection...');
        const walletAddress = await wallet.connectWallet();
        console.log('📱 Wallet connection result:', walletAddress);
        
        if (!walletAddress) {
          console.log('❌ Wallet connection returned null');
          alert('Wallet connection failed. Please try again.');
          return;
        }
      } catch (error) {
        console.error('❌ Error connecting wallet:', error);
        alert('Error connecting wallet: ' + (error as Error).message);
        return;
      }
    }
    
    console.log('💰 Wallet connected, profile check will happen automatically during loading');
    // The profile check will happen automatically in the useEffect when wallet connects
  };

  // Debug wallet state when dashboard is opened
  useEffect(() => {
    if (isDashboardOpen) {
      console.log('🔍 Dashboard opened - Wallet state:', {
        isConnected: wallet.isConnected,
        address: wallet.address,
        role: wallet.role,
        isMetaMaskInstalled: wallet.isMetaMaskInstalled
      });
    }
  }, [isDashboardOpen, wallet.isConnected, wallet.address, wallet.role, wallet.isMetaMaskInstalled]);


  // Handle ritual completion
  const handleRitualComplete = () => {
    console.log('✅ Ritual completed! Welcome to Zo World...');
    setShowRitual(false);
    console.log('🔄 Calling profileGate.completeProfileSetup()...');
    profileGate.completeProfileSetup();
    console.log('✅ Profile setup completion called');
    
    // Update the profile status to indicate user now has a profile
    setUserProfileStatus('exists');
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
          {userProfileStatus === 'loading' && (
            <p className="text-sm mt-2">Checking your profile...</p>
          )}
        </div>
      </div>
    );
  }

  // New flow: Show red pill screen if not connected
  if (!wallet.isConnected) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-[1000]">
        <div className="text-center text-white max-w-lg mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold mb-4">
              You are about to enter<br />
              a new world order.
            </h1>
          </div>
          
          {/* Red Pill Button */}
          <button 
            onClick={handleRedPillClick}
            className="red-pill-button"
          >
            Take the Red Pill
          </button>
          
          {/* Show error if wallet connection fails */}
          {wallet.error && (
            <div className="mt-4 text-red-400 text-sm">
              {wallet.error}
            </div>
          )}
        </div>
      </div>
    );
  }

  // If user is connected and already has a profile, skip ritual and go to main page
  if (wallet.isConnected && userProfileStatus === 'exists') {
    console.log('✅ User already has profile, going directly to main page');
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

        {/* Bottom Navigation */}
        <NavBar 
          onSectionChange={handleSectionChange}
          activeSection={activeSection}
          onDashboardClick={() => setIsDashboardOpen(true)}
        />
      </main>
    );
  }



  // Show ritual when user doesn't have a profile
  if (showRitual || (wallet.isConnected && userProfileStatus === 'not_exists')) {
    console.log('🎭 Showing ritual screen');
    return (
      <div className="fixed inset-0 bg-black">
        {/* The Ritual - ProfileSetup Modal */}
        <ProfileSetup
          isVisible={true}
          walletAddress={wallet.address || ''}
          onComplete={handleRitualComplete}
          onClose={() => {
            setShowRitual(false);
          }}
          onOpenDashboard={undefined}
        />
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

⁠       {/* Old wallet connect button removed - now using red pill flow */} ⁠



      {/* Bottom Navigation */}
      <NavBar 
        onSectionChange={handleSectionChange}
        activeSection={activeSection}
        onDashboardClick={() => setIsDashboardOpen(true)}
      />


    </main>
  );
}
