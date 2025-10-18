'use client';

import { useState, useEffect } from 'react';
import ProfileSetup from '@/components/ProfileSetup';
import MacProfileSetup from '@/components/mac/MacProfileSetup';
import MobileView from '@/components/MobileView';
import DesktopView from '@/components/DesktopView';
import { pingSupabase, verifyMembersTable, PartnerNodeRecord } from '@/lib/supabase';
import { usePrivyUser } from '@/hooks/usePrivyUser';
import { useIsMobile } from '@/hooks/useIsMobile';
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
  const [nodes, setNodes] = useState<PartnerNodeRecord[]>([]);

  const [showRitual, setShowRitual] = useState(false);
  const [userProfileStatus, setUserProfileStatus] = useState<'loading' | 'exists' | 'not_exists' | null>(null);
  
  // Hooks
  const { isMobile, isReady: isMobileReady } = useIsMobile();
  
  // Privy authentication
  const { 
    authenticated: privyAuthenticated,
    userProfile: privyUserProfile,
    hasCompletedOnboarding: privyOnboardingComplete,
    isLoading: privyLoading,
    privyUser,
    login: privyLogin,
    privyReady
  } = usePrivyUser();

  useEffect(() => {
    // Initialize Supabase and check Privy user profile
    const initApp = async () => {
      try {
        const basicConnection = await pingSupabase();
        if (basicConnection) {
          console.log('🚀 Supabase basic connection ready!');
          
          // Verify table setup
          const tableVerification = await verifyMembersTable();
          if (tableVerification.exists) {
            console.log('✅ Database tables verified');
            
            // Check Privy user profile status - ONLY when Privy is fully ready and loaded
            // privyLoading false means wallet creation and profile sync are complete
            if (privyReady && privyAuthenticated && !privyLoading && privyUserProfile) {
              console.log('🦄 Privy user authenticated, ready, and profile loaded!');
              
              if (privyOnboardingComplete) {
                console.log('✅ Profile complete:', privyUserProfile.name);
                setUserProfileStatus('exists');
              } else {
                console.log('📝 Onboarding required');
                setUserProfileStatus('not_exists');
                // Skip map loading for onboarding users
                setIsLoading(false);
              }
            }
          } else {
            console.warn('⚠️ Database setup needed:', tableVerification.error);
          }
        }
      } catch (error) {
        console.error('Supabase initialization error:', error);
      }
    };

    initApp();
  }, [privyReady, privyAuthenticated, privyOnboardingComplete, privyLoading, privyUserProfile]);

  // Skip loading screen when Privy is ready for returning users
  useEffect(() => {
    if (privyReady && privyAuthenticated && userProfileStatus === 'exists' && isLoading) {
      console.log('⚡ Privy ready with existing profile, skipping loading screen');
      setIsLoading(false);
    }
  }, [privyReady, privyAuthenticated, userProfileStatus, isLoading]);

  // Load map data (events and nodes) only after onboarding is complete
  useEffect(() => {
    // Only load map data if user has completed onboarding
    if (userProfileStatus !== 'exists') {
      console.log('⏸️ Skipping map data load - onboarding not complete');
      return;
    }

    console.log('🗺️ Loading map data after onboarding complete...');

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

    // Start loading events
    loadLiveEvents();

    // Load nodes
    const loadNodes = async () => {
      try {
        const { getNodesFromDB } = await import('@/lib/supabase');
        const data = await getNodesFromDB();
        if (data) setNodes(data);
      } catch (e) {
        console.error('Error loading nodes', e);
      }
    };
    loadNodes();
    
    // Temporary: Set a timeout to prevent infinite loading during development
    const timeoutId = setTimeout(() => {
      console.log('⏰ Loading timeout reached, proceeding anyway');
      setIsLoading(false);
    }, 5000);
    
    // Cleanup timeout if component unmounts
    return () => clearTimeout(timeoutId);
  }, [userProfileStatus]);

  // Effect to check user profile when Privy authenticates
  useEffect(() => {
    if (privyAuthenticated && !privyLoading && userProfileStatus === null) {
      console.log('🔍 Privy authenticated, checking profile...');
      setUserProfileStatus('loading');
      
      const checkUserProfile = async () => {
        if (privyOnboardingComplete && privyUserProfile) {
          console.log('✅ Profile complete:', privyUserProfile.name);
          setUserProfileStatus('exists');
        } else {
          console.log('📝 Onboarding required');
          setUserProfileStatus('not_exists');
        }
      };

      checkUserProfile();
    }
  }, [privyAuthenticated, privyLoading, privyOnboardingComplete, privyUserProfile, userProfileStatus]);

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

  // Wrapper function for mobile view that matches the expected signature
  const handleMapReadyMobile = (map: mapboxgl.Map) => {
    handleMapReady(map, () => {});
  };


  // Handle red pill click - now uses Privy login
  const handleRedPillClick = async () => {
    console.log('🔴 Red pill clicked! Opening Privy login...');
    privyLogin();
  };

  // Debug Privy state when dashboard is opened
  useEffect(() => {
    if (isDashboardOpen) {
      console.log('🔍 Dashboard opened - Privy state:', {
        authenticated: privyAuthenticated,
        hasProfile: !!privyUserProfile,
        onboardingComplete: privyOnboardingComplete
      });
    }
  }, [isDashboardOpen, privyAuthenticated, privyUserProfile, privyOnboardingComplete]);


  // Handle ritual completion
  const handleRitualComplete = () => {
    console.log('✅ Ritual completed! Welcome to Zo World...');
    setShowRitual(false);
    console.log('✅ Profile setup completed');
    
    // Update the profile status to indicate user now has a profile
    setUserProfileStatus('exists');
  };

  // Show loading screen while Privy initializes
  if (!privyReady || privyLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <img src="/spinner_Z_4.gif" alt="Loading" className="w-24 h-24 mx-auto" />
          <p className="text-white text-lg">Loading Zo World...</p>
        </div>
      </div>
    );
  }

  // Show RED PILL screen if not authenticated
  if (!privyAuthenticated) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-[1000]">
        <div className="text-center text-white max-w-lg mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold mb-4">
              You are about to enter<br />
              a new world order.
            </h1>
          </div>
          
          {/* Red Pill Button - Triggers Privy Login */}
          <button 
            onClick={privyLogin}
            className="red-pill-button"
          >
            Take the Red Pill
          </button>
          
          <p className="text-gray-400 text-sm mt-6">
            Sign in with Twitter or connect wallet
          </p>
        </div>
      </div>
    );
  }

  // Show onboarding when Privy user hasn't completed profile (but only when fully loaded)
  // Must wait for privyLoading to be false (wallet creation complete)
  const shouldShowOnboarding = privyReady && !privyLoading && (showRitual || (privyAuthenticated && userProfileStatus === 'not_exists'));
    
  if (shouldShowOnboarding) {
    console.log('🎭 Showing onboarding screen', {
      privyReady,
      privyLoading,
      privyAuthenticated,
      userProfileStatus,
      hasProfile: !!privyUserProfile
    });
    
    // Wait for isMobile to be ready before deciding which onboarding to show
    if (!isMobileReady) {
      return (
        <div className="fixed inset-0 bg-black flex items-center justify-center">
          <div className="text-center space-y-4">
            <img src="/spinner_Z_4.gif" alt="Loading" className="w-24 h-24 mx-auto" />
            <p className="text-white text-lg">Loading...</p>
          </div>
        </div>
      );
    }
    
    // Use Mac-style onboarding for both mobile and desktop (now responsive)
    return (
      <div className="fixed inset-0 bg-black z-[9999]">
        <MacProfileSetup
          isVisible={true}
          onComplete={handleRitualComplete}
          onClose={() => setShowRitual(false)}
          onOpenDashboard={() => setIsDashboardOpen(true)}
        />
      </div>
    );
  }

  // Only render main app if user has completed onboarding
  if (userProfileStatus !== 'exists') {
    // Still loading profile status, show loading screen
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <img src="/spinner_Z_4.gif" alt="Loading" className="w-24 h-24 mx-auto" />
          <p className="text-white text-lg">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Wait for mobile detection to be ready before rendering main app
  if (!isMobileReady) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <img src="/spinner_Z_4.gif" alt="Loading" className="w-24 h-24 mx-auto" />
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // Render mobile or desktop view based on screen size
  if (isMobile) {
    return (
      <>
        <MobileView
          events={events}
          onMapReady={handleMapReadyMobile}
          flyToEvent={flyToEvent}
          flyToNode={flyToNode}
          onEventClick={handleEventClick}
          onNodeClick={handleNodeClick}
        />
      </>
    );
  }

  return (
    <>
      <DesktopView
        events={events}
        nodes={nodes}
        onMapReady={handleMapReady}
        flyToEvent={flyToEvent}
        flyToNode={flyToNode}
        onEventClick={handleEventClick}
        onNodeClick={handleNodeClick}
      />
    </>
  );
}
