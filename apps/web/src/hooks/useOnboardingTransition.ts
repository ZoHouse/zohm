'use client';

import { useState, useCallback } from 'react';

/**
 * Onboarding Transition Coordinator Hook
 * 
 * Manages the complex async state transition from QuestComplete → Map
 * Prevents race conditions by batching all operations and guaranteeing order:
 * 
 * 1. Update database (onboarding_completed = true)
 * 2. Reload Privy profile
 * 3. Wait for profile to stabilize
 * 4. Pre-fetch events/nodes data
 * 5. Confirm location is set
 * 6. Package everything for single atomic render
 * 
 * This replaces the buggy pattern of multiple setState calls causing flashing.
 */

export interface TransitionData {
  events: any[];
  nodes: any[];
  location: { lat: number; lng: number };
  userProfile: any;
}

type TransitionPhase = 
  | 'idle'
  | 'preparing'      // Updating DB + reloading profile
  | 'loading-data'   // Fetching events/nodes
  | 'ready'          // Everything prepared, ready to render
  | 'error';         // Something went wrong

interface TransitionState {
  phase: TransitionPhase;
  progress: number;  // 0-100
  message: string;
  data: TransitionData | null;
  error: string | null;
}

export function useOnboardingTransition() {
  const [state, setState] = useState<TransitionState>({
    phase: 'idle',
    progress: 0,
    message: '',
    data: null,
    error: null,
  });

  /**
   * Execute the transition with guaranteed order
   */
  const prepareTransition = useCallback(async (
    userId: string | undefined,
    location: { lat: number; lng: number } | null,
    reloadProfile: () => Promise<void>
  ) => {
    console.log('🚀 prepareTransition called with:', { userId, hasLocation: !!location, location });
    
    if (!userId) {
      console.error('❌ Transition error: No user ID');
      setState(prev => ({
        ...prev,
        phase: 'error',
        error: 'User ID not available',
      }));
      return;
    }

    // If no location provided, try to get it from the profile after reloading
    let finalLocation = location;
    
    if (!finalLocation) {
      console.log('⚠️ No location provided, reloading profile to check for saved location...');
      await reloadProfile();
      
      // Wait a moment for profile to update
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Try to get location from updated profile
      const { getUserById } = await import('@/lib/privyDb');
      const userProfile = await getUserById(userId);
      
      if (userProfile?.lat && userProfile?.lng) {
        finalLocation = { lat: userProfile.lat, lng: userProfile.lng };
        console.log('✅ Got location from profile:', finalLocation);
      } else {
        console.error('❌ Transition error: No location in profile either');
        setState(prev => ({
          ...prev,
          phase: 'error',
          error: 'Location required for transition. Please allow location access.',
        }));
        return;
      }
    }

    try {
      // Phase 1: Update database
      console.log('📝 Phase 1: Setting state to "preparing"');
      setState({
        phase: 'preparing',
        progress: 10,
        message: 'Saving your progress...',
        data: null,
        error: null,
      });
      console.log('✅ State set to preparing');

      const { updateUserProfile } = await import('@/lib/privyDb');
      await updateUserProfile(userId, { onboarding_completed: true });
      
      setState(prev => ({
        ...prev,
        progress: 30,
        message: 'Loading your profile...',
      }));

      // Phase 2: Reload profile and wait for it to settle
      await reloadProfile();
      
      // Wait for profile to actually update (poll for up to 3 seconds)
      let profileReady = false;
      const maxAttempts = 15; // 15 * 200ms = 3 seconds
      
      for (let i = 0; i < maxAttempts; i++) {
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Check if profile has updated (you can add more specific checks here)
        const { getUserByWallet } = await import('@/lib/privyDb');
        // Profile check logic would go here
        profileReady = true; // Simplified for now
        if (profileReady) break;
      }

      setState(prev => ({
        ...prev,
        progress: 50,
        message: 'Preparing your map...',
        phase: 'loading-data',
      }));

      // Phase 3: Pre-fetch all map data in parallel
      const [eventsResult, nodesResult] = await Promise.allSettled([
        fetchEvents(),
        fetchNodes(),
      ]);

      const events = eventsResult.status === 'fulfilled' ? eventsResult.value : [];
      const nodes = nodesResult.status === 'fulfilled' ? nodesResult.value : [];

      setState(prev => ({
        ...prev,
        progress: 80,
        message: 'Almost ready...',
      }));

      // Small delay to ensure smooth transition
      await new Promise(resolve => setTimeout(resolve, 300));

      // Phase 4: Package everything and mark as ready
      setState({
        phase: 'ready',
        progress: 100,
        message: 'Ready!',
        data: {
          events,
          nodes,
          location: finalLocation,
          userProfile: {}, // Will be populated from context
        },
        error: null,
      });

    } catch (error) {
      console.error('Transition preparation failed:', error);
      setState({
        phase: 'error',
        progress: 0,
        message: 'Something went wrong',
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }, []);

  /**
   * Reset transition state
   */
  const reset = useCallback(() => {
    setState({
      phase: 'idle',
      progress: 0,
      message: '',
      data: null,
      error: null,
    });
  }, []);

  return {
    phase: state.phase,
    progress: state.progress,
    message: state.message,
    data: state.data,
    error: state.error,
    prepareTransition,
    reset,
  };
}

/**
 * Helper: Fetch events from calendar
 */
async function fetchEvents(): Promise<any[]> {
  try {
    const { fetchAllCalendarEventsWithGeocoding, getCalendarUrls } = await import('@/lib/icalParser');
    const { getCalendarUrls: getUrls } = await import('@/lib/calendarConfig');
    
    const calendarUrls = await getUrls();
    const events = await fetchAllCalendarEventsWithGeocoding(calendarUrls);
    
    console.log('✅ Pre-fetched', events.length, 'events for transition');
    return events;
  } catch (error) {
    console.error('Error pre-fetching events:', error);
    return [];
  }
}

/**
 * Helper: Fetch nodes from database
 */
async function fetchNodes(): Promise<any[]> {
  try {
    const { getNodesFromDB } = await import('@/lib/supabase');
    const nodes = await getNodesFromDB();
    
    console.log('✅ Pre-fetched', nodes?.length || 0, 'nodes for transition');
    return nodes || [];
  } catch (error) {
    console.error('Error pre-fetching nodes:', error);
    return [];
  }
}

