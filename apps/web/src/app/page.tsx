'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import LandingPage from '@/components/LandingPage';
import UnifiedOnboarding from '@/components/UnifiedOnboarding';
import QuestAudio from '@/components/QuestAudio';
import QuestComplete from '@/components/QuestComplete';
import MobileView from '@/components/MobileView';
import DesktopView from '@/components/DesktopView';
import LocationPermissionModal from '@/components/LocationPermissionModal';
import { pingSupabase, PartnerNodeRecord, getQuests } from '@/lib/supabase';
import { useZoAuth } from '@/hooks/useZoAuth';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useOnboardingTransition } from '@/hooks/useOnboardingTransition';
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
  const [animationFlagSet, setAnimationFlagSet] = useState(false); // Track if we've set the flag

  const [userProfileStatus, setUserProfileStatus] = useState<'loading' | 'exists' | 'not_exists' | null>(() => {
    // Log initial state
    console.log('🎬 [ProfileStatus] Initial state: null');
    return null;
  });

  // Onboarding flow state
  const [onboardingStep, setOnboardingStep] = useState<'profile' | 'voice' | 'complete' | null>(null);

  // Temporary location state for immediate onboarding transition
  const [onboardingLocation, setOnboardingLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Flag to ensure smooth transition from onboarding (prevents loading screen flash)
  const [isTransitioningFromOnboarding, setIsTransitioningFromOnboarding] = useState(false);

  // 🔄 CRITICAL: Track when onboarding was just completed (before profile reloads)
  // This prevents returning users from being treated as new users during the transition
  const [onboardingJustCompleted, setOnboardingJustCompleted] = useState(false);

  // Location permission modal state
  const [showLocationModal, setShowLocationModal] = useState(false);

  // 🔒 Race condition fix: Prevent multiple profile status updates during auth
  const hasSetProfileStatus = useRef(false);

  // 🔒 Race condition fix: Prevent initApp from running multiple times during auth loading
  const hasInitialized = useRef(false);

  // Hooks
  const { isMobile, isReady: isMobileReady } = useIsMobile();

  // ZO Authentication
  const {
    authenticated,
    userProfile,
    hasCompletedOnboarding: onboardingComplete,
    isLoading: isLoadingProfile,
    user,
    login,
    logout,
    ready,
    reloadProfile,
    authMethod,
    syncProfile
  } = useZoAuth();

  // 🚀 Onboarding transition coordinator (prevents race conditions)
  const {
    phase: transitionPhase,
    progress: transitionProgress,
    message: transitionMessage,
    data: transitionData,
    prepareTransition,
  } = useOnboardingTransition();

  // Get user's home location for distance calculations (before any conditional returns)
  // Priority: onboarding location (immediate) > profile location (persisted)
  const userHomeLat = onboardingLocation?.lat || userProfile?.lat || null;
  const userHomeLng = onboardingLocation?.lng || userProfile?.lng || null;

  // Local radius in kilometers
  const LOCAL_RADIUS_KM = 100;

  // Immediately set animation flag for returning users on mount
  useEffect(() => {
    if (animationFlagSet) return; // Only run once

    const hasLocation = !!(userProfile?.lat && userProfile?.lng);
    if (onboardingComplete && hasLocation && !shouldAnimateFromSpace) {
      console.log('🚀 Setting animation flag for returning user (mount)');
      setShouldAnimateFromSpace(true);
      setAnimationFlagSet(true);
    }
  }, []); // Run once on mount

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
    // 🔒 Prevent multiple initializations
    if (hasInitialized.current) {
      console.log('⏭️ Skipping initApp - already initialized');
      return;
    }

    // Initialize Supabase and check user profile
    const initApp = async () => {
      console.log('🚀 Starting initApp...');
      hasInitialized.current = true; // Mark as initialized immediately

      try {
        const basicConnection = await pingSupabase();
        if (basicConnection) {
          console.log('🚀 Supabase basic connection ready!');
          console.log('✅ Database connection verified');
        }
      } catch (error) {
        console.error('Supabase initialization error:', error);
      }
    };

    initApp();
  }, [ready, authenticated, onboardingComplete, isLoading]);
  // ⚠️ REMOVED userProfile from deps to prevent re-triggers during profile loading

  // 🔒 Keep profile status in sync - if profile exists, status is 'exists'
  // This runs whenever the profile or onboarding flag changes
  useEffect(() => {
    if (
      ready &&
      authenticated &&
      userProfile
    ) {
      // Profile exists in database → status is 'exists'
      // User routing will be handled by shouldShowOnboarding check
      const newStatus = 'exists';

      if (userProfileStatus !== newStatus) {
        console.log(`🔄 Updating profile status: ${userProfileStatus} → ${newStatus} (onboarding: ${onboardingComplete})`);
        setUserProfileStatus(newStatus);
      }
    }
  }, [ready, authenticated, userProfile, onboardingComplete, userProfileStatus]);

  // Skip loading screen when auth is ready for returning users
  useEffect(() => {
    if (ready && authenticated && userProfileStatus === 'exists' && isLoading) {
      console.log('⚡ Auth ready with existing profile, skipping loading screen');
      setIsLoading(false);
    }
  }, [ready, authenticated, userProfileStatus, isLoading]);

  // Load map data (events and nodes) only after onboarding is complete
  useEffect(() => {
    console.log('🔍 Map data loading effect triggered - userProfileStatus:', userProfileStatus);

    // Only load map data if user has completed onboarding
    if (userProfileStatus !== 'exists') {
      console.log('⏸️ Skipping map data load - onboarding not complete (status:', userProfileStatus, ')');
      return;
    }

    console.log('🗺️ ✅ Loading map data - user onboarding complete!');

    // Load live events from iCal feeds
    const loadLiveEvents = async () => {
      try {
        console.log('🔄 Starting to load events...');

        // Get calendar URLs dynamically from database
        const calendarUrls = await getCalendarUrls();
        console.log('📅 Got calendar URLs:', calendarUrls.length, 'calendars');

        console.log('🔄 Fetching live events from iCal feeds...');
        const liveEvents = await fetchAllCalendarEventsWithGeocoding(calendarUrls);

        if (liveEvents.length > 0) {
          console.log('✅ Loaded', liveEvents.length, 'live events from', calendarUrls.length, 'calendars');
          console.log('📍 Setting events state with', liveEvents.length, 'events');
          setEvents(liveEvents);
        } else {
          console.log('⚠️ No live events found');
          setEvents([]);
        }

      } catch (error) {
        console.error('❌ Error loading live events:', error);
        setEvents([]);
      } finally {
        console.log('🏁 Events loading complete - setting isLoading to false');
        setIsLoading(false);
      }
    };

    // Start loading events
    console.log('🚀 Initiating event loading...');
    loadLiveEvents();

    // Load nodes
    const loadNodes = async () => {
      try {
        console.log('🏘️ Loading partner nodes...');
        const { getNodesFromDB } = await import('@/lib/supabase');
        const data = await getNodesFromDB();
        if (data) {
          console.log('✅ Loaded', data.length, 'partner nodes');
          setNodes(data);
        }
      } catch (e) {
        console.error('❌ Error loading nodes:', e);
      }
    };
    loadNodes();

    const loadQuestsCount = async () => {
      try {
        console.log('🎯 Loading quests count...');
        const quests = await getQuests();
        const count = Array.isArray(quests) ? quests.length : 0;
        console.log('✅ Loaded', count, 'quests');
        setQuestCount(count);
      } catch (e) {
        console.error('❌ Error loading quests:', e);
        setQuestCount(0);
      }
    };
    loadQuestsCount();

    // Temporary: Set a timeout to prevent infinite loading during development
    const timeoutId = setTimeout(() => {
      console.log('⏰ Loading timeout reached (5s), proceeding anyway');
      setIsLoading(false);
    }, 5000);

    // Cleanup timeout if component unmounts
    return () => {
      console.log('🧹 Cleaning up map data loading effect');
      clearTimeout(timeoutId);
    };
  }, [userProfileStatus]);

  // 🐛 DEBUG: Log current state for debugging
  useEffect(() => {
    console.log('🎯 App State:', {
      authenticated: authenticated,
      authMethod,
      isLoadingProfile,
      isLoadingMap: isLoading,
      ready,
      onboardingStep,
      userProfileStatus,
      onboardingComplete,
      hasProfile: !!userProfile,
      profileName: userProfile?.name,
      profileId: userProfile?.id
    });
  }, [authenticated, authMethod, isLoadingProfile, isLoading, ready, onboardingStep, userProfileStatus, onboardingComplete, userProfile]);

  // Effect to check user profile when authenticated
  useEffect(() => {
    // Only run once when status is null AND profile loading is complete
    if (authenticated && !isLoadingProfile && userProfileStatus === null) {
      console.log('🔍 User authenticated, checking profile...', {
        authMethod,
        hasProfile: !!userProfile,
        onboardingComplete: onboardingComplete,
        profileName: userProfile?.name,
        profileId: userProfile?.id
      });

      // If profile is already loaded, set status immediately
      if (userProfile) {
        console.log('✅ Profile exists:', userProfile.name, '(onboarding_completed:', onboardingComplete, ')');
        setUserProfileStatus('exists');
        return;
      }

      // Set a maximum wait time of 5 seconds for profile to load
      let attempts = 0;
      const maxAttempts = 10; // 10 attempts x 500ms = 5 seconds
      let timeoutId: NodeJS.Timeout;
      let isActive = true; // Flag to prevent zombie updates

      const checkUserProfile = () => {
        if (!isActive) return; // Stop if effect was cleaned up

        attempts++;

        // Defensive check: If profile loaded during polling, stop immediately
        // (Even though effect should re-run, this prevents race conditions)
        if (userProfileStatus !== null) {
          console.log('✅ Profile status already determined, stopping poll');
          return; // Status was set by another effect, we're done
        }

        // We can't rely on the closure 'userProfile' here because it will be stale.
        // However, if userProfile updates, this effect will re-run and cleanup this loop.
        // So if we are here, it means userProfile hasn't triggered a re-render yet 
        // OR we are in a race condition.

        if (attempts >= maxAttempts) {
          // Timeout: assume profile doesn't exist after 5 seconds
          console.warn('⚠️ Profile loading timeout - assuming new user (no profile in DB)');
          if (isActive && userProfileStatus === null) {
            // Double-check status is still null before setting (prevents race condition)
            setUserProfileStatus('not_exists');
          }
        } else {
          // Keep waiting - schedule another check
          console.log(`⏳ Profile loading, waiting... (attempt ${attempts}/${maxAttempts})`);
          timeoutId = setTimeout(checkUserProfile, 500);
        }
      };

      // Start checking after 500ms
      timeoutId = setTimeout(checkUserProfile, 500);

      return () => {
        isActive = false; // Mark as inactive to stop the loop
        clearTimeout(timeoutId);
      };
    }
  }, [authenticated, isLoadingProfile, onboardingComplete, userProfile, userProfileStatus]);

  // Also check when profile loads (for ZO users)
  useEffect(() => {
    console.log('🔍 [ProfileStatus] Effect triggered:', {
      authenticated,
      authMethod,
      hasProfile: !!userProfile,
      currentStatus: userProfileStatus,
      profileName: userProfile?.name
    });

    if (authenticated && userProfile && userProfileStatus === null) {
      console.log('🔍 Profile loaded, checking status...', {
        authMethod,
        name: userProfile.name,
        id: userProfile.id,
        onboardingComplete: onboardingComplete
      });
      // If profile exists in database, status is 'exists' regardless of onboarding_completed
      // This is because user might be from another ZO app
      const newStatus = 'exists';
      console.log(`✅ Setting userProfileStatus to: ${newStatus} (onboarding_completed: ${onboardingComplete})`);
      setUserProfileStatus(newStatus);
    }
  }, [authenticated, userProfile, onboardingComplete, userProfileStatus, authMethod]);

  // Set default map view mode based on whether user has location
  useEffect(() => {
    if (userProfileStatus === 'exists' && userProfile) {
      const hasLocation = !!userProfile.lat && !!userProfile.lng;
      const defaultMode = hasLocation ? 'local' : 'global';

      console.log(`🗺️ Setting default map mode to ${defaultMode} (has location: ${hasLocation})`);
      setMapViewMode(defaultMode);
    }
  }, [userProfileStatus, userProfile]);

  // Enable space animation for NEW users after completing onboarding
  // (Returning users get the flag computed in shouldTriggerAnimation useMemo)
  useEffect(() => {
    const hasLocation = !!(userProfile?.lat && userProfile?.lng);

    console.log('🎬 Animation effect check (new users):', {
      onboardingComplete,
      userProfileStatus,
      hasUserLocation: hasLocation,
      currentAnimationFlag: shouldAnimateFromSpace,
      shouldTrigger: onboardingComplete && userProfileStatus === 'exists' && !shouldAnimateFromSpace && hasLocation
    });

    // Set flag for new users who just completed onboarding
    // Returning users get flag computed synchronously in useMemo
    if (onboardingComplete && userProfileStatus === 'exists' && !shouldAnimateFromSpace && hasLocation) {
      console.log('🚀 Enabling space-to-location animation (new user post-onboarding)');
      setShouldAnimateFromSpace(true);
      setAnimationFlagSet(true);
    } else if (!shouldAnimateFromSpace && !hasLocation) {
      console.log('⏭️ No location available for animation');
    }
  }, [onboardingComplete, userProfileStatus, shouldAnimateFromSpace]);

  // DISABLED: No longer tracking quest availability for returning users
  // Returning users always go to dashboard

  // DISABLED: No longer checking quest cooldown for returning users
  // Returning users go straight to dashboard
  // useEffect removed - no cooldown checks needed

  // Check if we should show location permission modal
  // 📍 ALWAYS ask for current location on new session (hard refresh)
  useEffect(() => {
    console.log('🔍 [LocationModal] Checking conditions:', {
      authenticated,
      authMethod,
      userProfileStatus,
      hasProfile: !!userProfile,
      hasLocation: !!(userProfile?.lat && userProfile?.lng),
      lat: userProfile?.lat,
      lng: userProfile?.lng,
      onboardingComplete: onboardingComplete,
    });

    // Only check after user is authenticated and profile exists
    if (!authenticated || userProfileStatus !== 'exists' || !userProfile) {
      console.log('⏭️ [LocationModal] Skipping - not ready yet');
      return;
    }

    // Don't ask if we've already asked this session (prevents asking on every state change)
    if (typeof window !== 'undefined' && sessionStorage.getItem('location_permission_asked')) {
      console.log('⏭️ [LocationModal] Already asked for location this session');
      return;
    }

    // Show modal after a short delay (let dashboard load first)
    // Note: This will ask EVERY new session (hard refresh) to update current location
    console.log('📍 [LocationModal] Asking for current location - showing permission modal in 2s');
    const timeoutId = setTimeout(() => {
      console.log('✅ [LocationModal] Showing location modal NOW');
      setShowLocationModal(true);
      // Mark as asked for this session
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('location_permission_asked', 'true');
      }
    }, 2000); // 2 second delay to let dashboard load

    return () => clearTimeout(timeoutId);
  }, [authenticated, userProfileStatus, userProfile, authMethod, onboardingComplete]);

  // Handle location granted from modal
  const handleLocationGranted = async (lat: number, lng: number) => {
    if (!userProfile?.id) {
      console.error('❌ No user profile ID to save location');
      return;
    }

    console.log('💾 Saving location to database:', { lat, lng });
    try {
      const { updateUserProfile } = await import('@/lib/userDb');
      await updateUserProfile(userProfile.id, {
        lat,
        lng,
      });

      console.log('✅ Location saved to database');

      // Reload profile to update derived values
      await reloadProfile();
      console.log('🔄 Profile reloaded with new location');

      // Update map view mode to local now that we have location
      setMapViewMode('local');
    } catch (error) {
      console.error('❌ Failed to save location:', error);
    }
  };

  // Auto-save location from MapCanvas to user profile (for returning users without location)
  useEffect(() => {
    if (userProfileStatus !== 'exists' || !userProfile?.id || !userProfile) return;

    // Only do this for returning users who don't have location yet
    if (userProfile.lat && userProfile.lng) return;

    const checkAndSaveLocation = async () => {
      if (typeof window === 'undefined') return;

      const windowCoords = (window as any).userLocationCoords;
      if (!windowCoords?.lat || !windowCoords?.lng) return;

      console.log('💾 Saving MapCanvas location for returning user...');
      try {
        const { updateUserProfile } = await import('@/lib/userDb');
        await updateUserProfile(userProfile.id, {
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
  }, [userProfileStatus, userProfile, reloadProfile]);

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
    handleMapReady(map, () => { });
  };


  // Handle red pill click - opens phone login
  const handleRedPillClick = async () => {
    console.log('🔴 Red pill clicked! Opening phone login...');
    login();
  };

  // Debug auth state when dashboard is opened
  useEffect(() => {
    if (isDashboardOpen) {
      console.log('🔍 Dashboard opened - Auth state:', {
        authenticated: authenticated,
        hasProfile: !!userProfile,
        onboardingComplete: onboardingComplete
      });
    }
  }, [isDashboardOpen, authenticated, userProfile, onboardingComplete]);

  // 🎯 Handle transition completion atomically (moved to useEffect to avoid render loop)
  useEffect(() => {
    console.log('🔍 Transition phase changed:', transitionPhase, { hasData: !!transitionData });

    if (transitionPhase === 'ready' && transitionData) {
      console.log('🎯 Transition ready - applying state atomically', {
        transitionData,
        currentEvents: events.length,
        currentNodes: nodes.length
      });

      // Update state atomically with transition data
      if (events.length === 0 && transitionData.events.length > 0) {
        console.log('📊 Setting events:', transitionData.events.length);
        setEvents(transitionData.events);
      }
      if (nodes.length === 0 && transitionData.nodes.length > 0) {
        console.log('📍 Setting nodes:', transitionData.nodes.length);
        setNodes(transitionData.nodes);
      }
      if (!onboardingLocation && transitionData.location) {
        console.log('🗺️ Setting location:', transitionData.location);
        setOnboardingLocation(transitionData.location);
      }

      // Apply state immediately - no delay needed since coin collection video is handling timing
      console.log('✅ Clearing onboarding state and showing map');
      setUserProfileStatus('exists');
      setOnboardingStep(null);
      setShouldAnimateFromSpace(true);
      setIsLoading(false);
      setIsTransitioningFromOnboarding(false); // Clear the transition flag
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transitionPhase, transitionData]);


  // Handle ritual completion
  const handleRitualComplete = () => {
    console.log('✅ Ritual completed! Welcome to Zo World...');
    console.log('✅ Profile setup completed');

    // Update the profile status to indicate user now has a profile
    setUserProfileStatus('exists');
  };

  // Handle Onboarding2 complete (nickname + avatar saved)
  const handleOnboardingComplete = () => {
    console.log('✅ Onboarding2 complete - moving to voice quest');
    setOnboardingStep('voice');
  };

  // State for quest results
  const [questScore, setQuestScore] = useState(0);
  const [questTokens, setQuestTokens] = useState(0);

  // Handle QuestAudio complete (voice + game done)
  const handleQuestAudioComplete = (score: number, tokensEarned: number) => {
    console.log('✅ QuestAudio complete - moving to quest complete', { score, tokensEarned });
    setQuestScore(score);
    setQuestTokens(tokensEarned);
    setOnboardingStep('complete');
  };

  // Handle QuestComplete - go to dashboard after onboarding
  // Returns a promise that resolves when the map is ready to show dashboard
  const handleQuestCompleteGoHome = async (): Promise<void> => {
    // 🚧 CRITICAL: Set transition flag FIRST to block all routing during async operations
    // This prevents race conditions where routing checks happen before state updates complete
    setIsTransitioningFromOnboarding(true);

    try {
      console.log('🎉 Quest complete! Going home...');
      // Get userId from multiple sources (fallback chain)
      const userId = userProfile?.id || user?.id || (typeof window !== 'undefined' ? localStorage.getItem('zo_user_id') : null);

      if (!userId) {
        console.error('❌ No user ID available - cannot complete quest transition');
        setIsTransitioningFromOnboarding(false);
        return;
      }

      console.log('🔍 Starting transition with:', {
        userId,
        authMethod,
        hasLocation: !!onboardingLocation,
        location: onboardingLocation,
        userProfileId: userProfile?.id,
        userObjectId: user?.id,
        localStorageId: typeof window !== 'undefined' ? localStorage.getItem('zo_user_id') : null
      });

      // ✅ Mark onboarding as complete (user now becomes Type 3: Returning User)
      // This only applies to first-time users (Type 1 & 2)
      if (userId && !onboardingComplete) {
        console.log('✅ Marking onboarding as complete for user:', userId);
        const { updateUserProfile } = await import('@/lib/userDb');
        await updateUserProfile(userId, {
          onboarding_completed: true
        });
        console.log('✅ User is now a returning user (Type 3)');

        // 🔄 CRITICAL: Set flag IMMEDIATELY so routing logic knows user is returning
        // This prevents race condition where component re-renders before profile reloads
        setOnboardingJustCompleted(true);

        // Reload profile to update state (async, but flag already set)
        await reloadProfile();
      }

      // 🔄 Quest completed - reset quest step
      console.log('🔄 Quest completed');
      setOnboardingStep(null); // Reset quest step

      // 🚀 Start transition preparation (use unified auth user ID)
      await prepareTransition(userId, onboardingLocation, reloadProfile);

      console.log('✅ prepareTransition completed, waiting for ready state...');

      // Wait for transition to reach 'ready' state AND map data to be applied
      return new Promise<void>((resolve) => {
        let attempts = 0;
        const maxAttempts = 100; // 10 seconds max

        const checkReady = () => {
          attempts++;
          console.log(`🔍 Check ${attempts}: transitionPhase=${transitionPhase}, hasData=${!!transitionData}, events=${events.length}, nodes=${nodes.length}`);

          if (transitionPhase === 'ready' && transitionData && events.length > 0 && nodes.length > 0) {
            console.log('✅ Map is ready - opening dashboard for new user');
            // Open dashboard immediately after onboarding
            setIsDashboardOpen(true);
            resolve();
          } else if (attempts >= maxAttempts) {
            console.warn('⚠️ Timeout waiting for map ready, opening dashboard anyway');
            setIsDashboardOpen(true);
            resolve();
          } else {
            // Check again in 100ms
            setTimeout(checkReady, 100);
          }
        };

        // Start checking after a small delay to let state propagate
        setTimeout(checkReady, 100);
      });
    } catch (error) {
      console.error('❌ Error during quest completion:', error);
      // Don't prevent user from proceeding - they can retry
      throw error;
    } finally {
      // 🚧 CRITICAL: Always clear transition flag (even on error)
      // This ensures user isn't stuck on loading screen if something fails
      console.log('🏁 Clearing transition flag');
      setIsTransitioningFromOnboarding(false);

      // Clear the onboardingJustCompleted flag after a delay to allow profile to reload
      // This ensures the flag is only used during the transition period
      setTimeout(() => {
        setOnboardingJustCompleted(false);
        console.log('🔄 Cleared onboardingJustCompleted flag');
      }, 2000); // 2 seconds should be enough for profile to reload
    }
  };

  // 🎯 Memoize onboarding screens BEFORE any early returns (Rules of Hooks requirement)
  // Show onboarding when:
  // 1. New user (no profile) - userProfileStatus === 'not_exists'
  // 2. Existing ZO user from another app - profile exists but onboarding_completed === false
  // BUT: Don't show onboarding if we just completed it (prevents loop for returning users)
  // AND: Don't show onboarding if profile status is still being determined (null)
  const shouldShowOnboarding = authenticated &&
    !onboardingComplete &&
    !onboardingJustCompleted &&
    userProfileStatus !== null; // Wait for profile status to be determined

  // Determine if this is a new user (no profile) or existing user from another app
  // Only determine if profile status has been checked (not null)
  const isNewUser = userProfileStatus === 'not_exists';

  // Cross-app user detection: Has profile data (name, email, avatar) but hasn't completed THIS app's onboarding
  const isExistingUserFromAnotherApp = userProfile &&
    !onboardingComplete &&
    userProfileStatus === 'exists' && // Must be 'exists' (not null, not 'not_exists')
    (userProfile.name || userProfile.email || userProfile.pfp);

  const onboardingScreen = useMemo(() => {
    // Don't make routing decisions if profile status is still being determined
    // This prevents showing "new user" when we just haven't loaded the profile yet
    if (userProfileStatus === null) {
      console.log('⏳ Waiting for profile status to be determined...', {
        isLoadingProfile,
        hasProfile: !!userProfile,
        authenticated
      });
      return null; // Show nothing while determining status
    }

    if (!shouldShowOnboarding) return null;

    // Only log and make decisions when we have a determined status
    console.log('🎯 Onboarding Screen Decision:', {
      shouldShowOnboarding,
      isNewUser,
      isExistingUserFromAnotherApp,
      onboardingStep,
      userId: userProfile?.id || user?.id,
      userProfileStatus,
      isLoadingProfile,
      onboardingComplete,
      hasProfile: !!userProfile
    });

    // Show different screens based on onboarding step
    if (onboardingStep === 'voice') {
      return (
        <QuestAudio
          onComplete={handleQuestAudioComplete}
          userId={userProfile?.id || user?.id}
        />
      );
    }

    if (onboardingStep === 'complete') {
      return (
        <QuestComplete
          onGoHome={handleQuestCompleteGoHome}
          userId={userProfile?.id || user?.id}
          score={questScore}
          tokensEarned={questTokens}
        />
      );
    }

    // 🌐 Existing user from another ZO app:
    // - Already has name, avatar, email, phone from ZO API
    // - Just needs to complete THIS app's onboarding (voice quest)
    // - Skip Onboarding2 and go straight to QuestAudio
    if (isExistingUserFromAnotherApp) {
      console.log('✅ Existing ZO user from another app - skipping to voice quest');
      console.log('📋 User already has profile:', {
        name: userProfile?.name,
        email: userProfile?.email,
        phone: userProfile?.phone
      });
      return (
        <QuestAudio
          onComplete={handleQuestAudioComplete}
          userId={userProfile?.id || user?.id}
        />
      );
    }

    // New user: Show full UnifiedOnboarding (nickname → avatar → portal)
    console.log('✅ New ZO user - showing full onboarding');
    return (
      <UnifiedOnboarding
        onComplete={handleOnboardingComplete}
        userId={userProfile?.id || user?.id}
      />
    );
  }, [shouldShowOnboarding, isNewUser, isExistingUserFromAnotherApp, onboardingStep, userProfile?.id, user?.id, questScore, questTokens, handleQuestAudioComplete, handleQuestCompleteGoHome, handleOnboardingComplete, userProfileStatus, isLoadingProfile, authenticated, onboardingComplete]);

  // 🔄 Returning User: ALWAYS show dashboard (no quest screens)
  // Returning users go straight to dashboard - no cooldown checks, no quest screens
  const returningUserQuestScreen = useMemo(() => {
    // Returning users ALWAYS see dashboard
    console.log('🏠 [ReturningUser] Going straight to dashboard');
    return null; // null = show main dashboard
  }, []);

  // 🚧 CRITICAL: Check transition flag FIRST (before any other routing)
  // This prevents race conditions during quest completion by blocking all routing
  // until database updates and state reloads are complete
  if (isTransitioningFromOnboarding) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <img src="/spinner_Z_4.gif" alt="Loading" className="w-24 h-24 mx-auto" />
          <p className="text-white text-lg">Preparing your world...</p>
        </div>
      </div>
    );
  }

  // Show loading screen while auth initializes
  if (!ready && !isTransitioningFromOnboarding) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <img src="/spinner_Z_4.gif" alt="Loading" className="w-24 h-24 mx-auto" />
          <p className="text-white text-lg">Loading Zo World...</p>
        </div>
      </div>
    );
  }

  // Show LandingPage if not authenticated
  if (!authenticated) {
    return <LandingPage onConnect={login} />;
  }

  // Show loading screen while determining profile status (ONLY when authenticated)
  // This prevents flashing during wallet setup
  // Also wait for profile to load if we're still loading
  if (authenticated && (userProfileStatus === null || isLoadingProfile) && !isTransitioningFromOnboarding) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <img src="/spinner_Z_4.gif" alt="Loading" className="w-24 h-24 mx-auto" />
          <p className="text-white text-lg">
            {isLoadingProfile ? 'Loading your profile...' : 'Setting up your profile...'}
          </p>
        </div>
      </div>
    );
  }

  // 🎬 Transition screen removed - coin collection video in QuestComplete is our only loading screen
  // The video stays visible until the map is ready (handled by Promise.all in QuestComplete)

  // 1️⃣ Show onboarding for new users (Type 1) or cross-app users (Type 2)
  if (onboardingScreen) {
    return onboardingScreen;
  }

  // 2️⃣ Show quest for returning users (Type 3) if available (cooldown expired)
  if (returningUserQuestScreen) {
    return returningUserQuestScreen;
  }

  // Only render main app if user has completed onboarding
  if (userProfileStatus !== 'exists' && !isTransitioningFromOnboarding) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <img src="/spinner_Z_4.gif" alt="Loading" className="w-24 h-24 mx-auto" />
          <p className="text-white text-lg">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Wait for mobile detection ONLY if not transitioning from onboarding
  if (!isMobileReady && !isTransitioningFromOnboarding) {
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
  const userCity = userProfile?.city || null;

  // 🔍 DEBUG: Log render decision
  console.log('🎬 Render Decision:', {
    userProfileStatus,
    isTransitioningFromOnboarding,
    isMobileReady,
    eventsCount: events.length,
    nodesCount: nodes.length,
    isLoading
  });

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
        const userId = userProfile?.id || user?.id;
        if (userId) {
          const { updateUserProfile } = await import('@/lib/userDb');
          await updateUserProfile(userId, {
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
        {/* Location Permission Modal */}
        {showLocationModal && (
          <LocationPermissionModal
            onLocationGranted={handleLocationGranted}
            onClose={() => setShowLocationModal(false)}
            userProfile={userProfile}
          />
        )}

        <MobileView
          events={displayedEvents}
          nodes={displayedNodes}
          allNodes={nodes}
          totalEventsCount={events.length}
          totalNodesCount={nodes.length}
          questCount={questCount}
          userCity={userCity}
          userLocation={userHomeLat && userHomeLng ? { lat: userHomeLat, lng: userHomeLng } : null}
          userId={userProfile?.id || user?.id}
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
      {/* Location Permission Modal */}
      {showLocationModal && (
        <LocationPermissionModal
          onLocationGranted={handleLocationGranted}
          onClose={() => setShowLocationModal(false)}
          userProfile={userProfile}
        />
      )}

      <DesktopView
        events={displayedEvents}
        nodes={displayedNodes}
        allNodes={nodes}
        totalEventsCount={events.length}
        totalNodesCount={nodes.length}
        questCount={questCount}
        userCity={userCity}
        userLocation={userHomeLat && userHomeLng ? { lat: userHomeLat, lng: userHomeLng } : null}
        userId={userProfile?.id || user?.id}
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
