'use client';

import { useState, useEffect, useMemo } from 'react';
import LandingPage from '@/components/LandingPage';
import OnboardingPage from '@/components/OnboardingPage';
import MobileView from '@/components/MobileView';
import DesktopView from '@/components/DesktopView';
import { pingSupabase, verifyMembersTable, PartnerNodeRecord, getQuests } from '@/lib/supabase';
import { usePrivyUser } from '@/hooks/usePrivyUser';
import { useIsMobile } from '@/hooks/useIsMobile';
import { fetchAllCalendarEventsWithGeocoding } from '@/lib/icalParser';
import { getCalendarUrls } from '@/lib/calendarConfig';
import { isWithinRadius } from '@/lib/geoUtils';
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
  const [questCount, setQuestCount] = useState(0);
  const [mapViewMode, setMapViewMode] = useState<'local' | 'global'>('global'); // Will be updated based on user location
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);
  const [shouldAnimateFromSpace, setShouldAnimateFromSpace] = useState(false);

  const [userProfileStatus, setUserProfileStatus] = useState<'loading' | 'exists' | 'not_exists' | null>(null);
  
  // Temporary location state for immediate onboarding transition
  const [onboardingLocation, setOnboardingLocation] = useState<{ lat: number; lng: number } | null>(null);
  
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
    privyReady,
    reloadProfile
  } = usePrivyUser();

  // Get user's home location for distance calculations (before any conditional returns)
  // Priority: onboarding location (immediate) > profile location (persisted)
  const userHomeLat = onboardingLocation?.lat || privyUserProfile?.lat || null;
  const userHomeLng = onboardingLocation?.lng || privyUserProfile?.lng || null;

  // Local radius in kilometers
  const LOCAL_RADIUS_KM = 100;

  // Calculate local events (always, regardless of mode) - MUST be before conditional returns
  const localEvents = useMemo(() => {
    if (!userHomeLat || !userHomeLng) return events;

    return events.filter(event => {
      const eventLat = parseFloat(event.Latitude);
      const eventLng = parseFloat(event.Longitude);
      
      if (isNaN(eventLat) || isNaN(eventLng)) return false;
      
      return isWithinRadius(userHomeLat, userHomeLng, eventLat, eventLng, LOCAL_RADIUS_KM);
    });
  }, [events, userHomeLat, userHomeLng]);

  // Calculate local nodes (always, regardless of mode) - MUST be before conditional returns
  const localNodes = useMemo(() => {
    if (!userHomeLat || !userHomeLng) return nodes;

    const extractCoords = (node: PartnerNodeRecord) => {
      const lat =
        typeof node.latitude === 'number'
          ? node.latitude
          : typeof (node as any).lat === 'number'
            ? (node as any).lat
            : null;
      const lng =
        typeof node.longitude === 'number'
          ? node.longitude
          : typeof (node as any).lng === 'number'
            ? (node as any).lng
            : null;
      return { lat, lng };
    };

    return nodes.filter(node => {
      const { lat, lng } = extractCoords(node);
      if (lat === null || lng === null) return false;
      return isWithinRadius(userHomeLat, userHomeLng, lat, lng, LOCAL_RADIUS_KM);
    });
  }, [nodes, userHomeLat, userHomeLng]);

  // Get the events and nodes to display based on current mode
  const displayedEvents = mapViewMode === 'local' ? localEvents : events;
  const displayedNodes = mapViewMode === 'local' ? localNodes : nodes;

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

    const loadQuestsCount = async () => {
      try {
        const quests = await getQuests();
        setQuestCount(Array.isArray(quests) ? quests.length : 0);
      } catch (e) {
        console.error('Error loading quests', e);
        setQuestCount(0);
      }
    };
    loadQuestsCount();
    
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

  // Set default map view mode based on whether user has location
  useEffect(() => {
    if (userProfileStatus === 'exists' && privyUserProfile) {
      const hasLocation = !!privyUserProfile.lat && !!privyUserProfile.lng;
      const defaultMode = hasLocation ? 'local' : 'global';
      
      console.log(`🗺️ Setting default map mode to ${defaultMode} (has location: ${hasLocation})`);
      setMapViewMode(defaultMode);
    }
  }, [userProfileStatus, privyUserProfile]);

  // Enable space animation when user completes onboarding or returns
  useEffect(() => {
    console.log('🎬 Animation check:', {
      privyOnboardingComplete,
      userProfileStatus,
      shouldTrigger: privyOnboardingComplete && userProfileStatus === 'exists'
    });
    
    if (privyOnboardingComplete && userProfileStatus === 'exists') {
      console.log('🚀 Enabling space-to-location animation');
      setShouldAnimateFromSpace(true);
    }
  }, [privyOnboardingComplete, userProfileStatus]);

  // Auto-save location from MapCanvas to user profile (for returning users without location)
  useEffect(() => {
    if (userProfileStatus !== 'exists' || !privyUser?.id || !privyUserProfile) return;
    
    // Only do this for returning users who don't have location yet
    if (privyUserProfile.lat && privyUserProfile.lng) return;
    
    const checkAndSaveLocation = async () => {
      if (typeof window === 'undefined') return;
      
      const windowCoords = (window as any).userLocationCoords;
      if (!windowCoords?.lat || !windowCoords?.lng) return;
      
      console.log('💾 Saving MapCanvas location for returning user...');
      try {
        const { updateUserProfile } = await import('@/lib/privyDb');
        await updateUserProfile(privyUser.id, {
          lat: windowCoords.lat,
          lng: windowCoords.lng,
        });
        
        console.log('✅ Location saved to database');
        
        // Reload profile to update derived values
        await reloadProfile();
        console.log('🔄 Profile reloaded with new location');
      } catch (error) {
        console.error('❌ Failed to save location:', error);
      }
    };
    
    const timeoutId = setTimeout(checkAndSaveLocation, 3000);
    return () => clearTimeout(timeoutId);
  }, [userProfileStatus, privyUser, privyUserProfile]);

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
    console.log('✅ Profile setup completed');
    
    // Update the profile status to indicate user now has a profile
    setUserProfileStatus('exists');
  };

  // Handle onboarding complete from new OnboardingPage
  const handleOnboardingComplete = async (
    answers: string[], 
    location?: { lat: number; lng: number }
  ) => {
    const [name, culture, city] = answers;
    
    console.log('🎉 Onboarding complete!', { name, culture, city, location });
    console.log('⏳ Staying on onboarding screen for 3 seconds while we prepare everything...');
    
    // 🎯 Store location in state IMMEDIATELY for instant access
    if (location?.lat && location?.lng) {
      setOnboardingLocation(location);
      console.log('📍 Location stored in onboarding state:', location);
      
      // Also store in window for MapCanvas
      if (typeof window !== 'undefined') {
        (window as any).userLocationCoords = {
          lat: location.lat,
          lng: location.lng
        };
      }
    }
    
    // 💾 Save profile to database (wait for it to complete)
    try {
      const { upsertUserFromPrivy } = await import('@/lib/privyDb');
      
      const profileUpdate: any = {
        name: name.trim(),
        culture,
        city: city || 'Unknown',
        onboarding_completed: true,
      };
      
      if (location?.lat && location?.lng) {
        profileUpdate.lat = location.lat;
        profileUpdate.lng = location.lng;
      }
      
      await upsertUserFromPrivy(privyUser!, profileUpdate);
      console.log('✅ Profile saved to database');
      
      await reloadProfile();
      console.log('🔄 Profile reloaded with all data');
    } catch (error) {
      console.error('❌ Error saving profile:', error);
    }
    
    // ⏱️ Wait 3 seconds on onboarding screen, then transition
    console.log('⏱️ Waiting 3 seconds before transition...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 🚀 Now transition to map with everything ready
    console.log('🎬 Transitioning to map with space animation');
    setUserProfileStatus('exists');
    
    if (location?.lat && location?.lng) {
      setShouldAnimateFromSpace(true);
    }
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

  // Wait for Privy to fully load before showing landing page
  // This prevents flickering for returning users
  if (!privyReady) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <img src="/spinner_Z_4.gif" alt="Loading" className="w-24 h-24 mx-auto" />
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // Show LandingPage only if not authenticated AND Privy is ready
  if (!privyAuthenticated && privyReady) {
    return <LandingPage onConnect={privyLogin} />;
  }

  // Show onboarding when Privy user hasn't completed profile (but only when fully loaded)
  // Must wait for privyLoading to be false (wallet creation complete)
  const shouldShowOnboarding = privyReady && !privyLoading && (privyAuthenticated && userProfileStatus === 'not_exists');
    
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

    return (
      <OnboardingPage
        onComplete={handleOnboardingComplete}
        onNavigateToHome={() => setUserProfileStatus('exists')}
        getAccessToken={async () => {
          try {
            const { usePrivy } = await import('@privy-io/react-auth');
            // Note: This is a workaround - in practice, getAccessToken will be available from the hook
            // For now, we return null and the OnboardingPage will handle it
            return null;
          } catch {
            return null;
          }
        }}
      />
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

  // Get user's city from profile
  const userCity = privyUserProfile?.city || null;

  // Handler for toggling map view mode
  const handleMapViewToggle = async (mode: 'local' | 'global') => {
    // If switching to local mode but no location, request it
    if (mode === 'local' && !userHomeLat && !userHomeLng) {
      console.log('📍 Local mode requested but no location - requesting permission...');
      setIsRequestingLocation(true);
      
      try {
        // Request location permission
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          });
        });

        const { latitude, longitude } = position.coords;
        console.log('📍 Location obtained:', { latitude, longitude });

        // Update user profile with location
        if (privyUser?.id) {
          const { updateUserProfile } = await import('@/lib/privyDb');
          await updateUserProfile(privyUser.id, {
            lat: latitude,
            lng: longitude,
          });
          console.log('✅ User location saved to profile');
          
          // Reload the profile to get the updated location
          window.location.reload();
        }
      } catch (error: any) {
        console.error('❌ Location request failed:', error);
        let errorMessage = 'Failed to get your location';
        
        // Handle GeolocationPositionError
        if (error && typeof error === 'object' && 'code' in error) {
          switch (error.code) {
            case 1: // PERMISSION_DENIED
              errorMessage = 'Location permission denied. Please enable location access in your browser settings.';
              break;
            case 2: // POSITION_UNAVAILABLE
              errorMessage = 'Location information unavailable.';
              break;
            case 3: // TIMEOUT
              errorMessage = 'Location request timed out.';
              break;
          }
        }
        
        alert(errorMessage);
        setIsRequestingLocation(false);
        return; // Don't switch to local mode if location request fails
      }
      
      setIsRequestingLocation(false);
    }
    
    setMapViewMode(mode);
    console.log(`🗺️ Map view changed to ${mode} mode`);
  };

  // Render mobile or desktop view based on screen size
  if (isMobile) {
    return (
      <>
        <MobileView
          events={displayedEvents}
          nodes={displayedNodes}
          allNodes={nodes}
          totalEventsCount={events.length}
          totalNodesCount={nodes.length}
          questCount={questCount}
          userCity={userCity}
          userLocation={userHomeLat && userHomeLng ? { lat: userHomeLat, lng: userHomeLng } : null}
          onMapReady={handleMapReadyMobile}
          flyToEvent={flyToEvent}
          flyToNode={flyToNode}
          onEventClick={handleEventClick}
          onNodeClick={handleNodeClick}
          mapViewMode={mapViewMode}
          onMapViewToggle={handleMapViewToggle}
          localCount={localEvents.length}
          globalCount={events.length}
          isRequestingLocation={isRequestingLocation}
          shouldAnimateFromSpace={shouldAnimateFromSpace}
        />
      </>
    );
  }

  return (
    <>
      <DesktopView
        events={displayedEvents}
        nodes={displayedNodes}
        allNodes={nodes}
        totalEventsCount={events.length}
        totalNodesCount={nodes.length}
        questCount={questCount}
        userCity={userCity}
        userLocation={userHomeLat && userHomeLng ? { lat: userHomeLat, lng: userHomeLng } : null}
        onMapReady={handleMapReady}
        flyToEvent={flyToEvent}
        flyToNode={flyToNode}
        onEventClick={handleEventClick}
        onNodeClick={handleNodeClick}
        mapViewMode={mapViewMode}
        onMapViewToggle={handleMapViewToggle}
        localCount={localEvents.length}
        globalCount={events.length}
        isRequestingLocation={isRequestingLocation}
        shouldAnimateFromSpace={shouldAnimateFromSpace}
      />
    </>
  );
}
