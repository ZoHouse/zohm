/**
 * 🔐 useUnifiedAuth Hook
 * 
 * Unified authentication hook that supports both Privy and ZO phone authentication
 * Provides a consistent interface for user profile and authentication state
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import {
  getFullUserProfile,
  getUserById,
  type FullUserProfile,
} from '@/lib/privyDb';

export function useUnifiedAuth() {
  const { 
    ready: privyReady, 
    authenticated: privyAuthenticated, 
    user: privyUser,
    login: privyLogin,
    logout: privyLogout,
  } = usePrivy();

  const [userProfile, setUserProfile] = useState<FullUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authMethod, setAuthMethod] = useState<'privy' | 'zo' | null>(null);

  // ============================================
  // Check for ZO Authentication (from localStorage)
  // ============================================
  const getZoUserId = useCallback((): string | null => {
    if (typeof window === 'undefined') return null;
    const zoUserId = localStorage.getItem('zo_user_id');
    console.log('🔍 [UnifiedAuth] getZoUserId called:', zoUserId);
    return zoUserId;
  }, []);

  // ============================================
  // Load User Profile
  // ============================================
  const loadUserProfile = useCallback(async () => {
    console.log('🔄 [UnifiedAuth] loadUserProfile called');
    setIsLoading(true);
    setError(null);

    try {
      // Priority 1: Check ZO authentication FIRST (if ZO session exists, use it)
      const zoUserId = getZoUserId();
      console.log('🔍 [UnifiedAuth] ZO user ID from localStorage:', zoUserId);
      
      if (zoUserId) {
        console.log('🔐 [UnifiedAuth] ZO session found, loading profile:', zoUserId);
        
        // Try direct lookup by id first (zo_user_id might be the primary id)
        let profile = await getFullUserProfile(zoUserId);
        console.log('🔐 [UnifiedAuth] Direct lookup result:', profile ? 'Found' : 'Not found');
        
        // If not found, try to find user by zo_user_id
        if (!profile) {
          try {
            console.log('🔐 [UnifiedAuth] Trying API lookup by zo_user_id...');
            const response = await fetch(`/api/users/by-zo-id/${zoUserId}`);
            console.log('🔐 [UnifiedAuth] API response status:', response.status);
            
            if (response.ok) {
              const userByZoId = await response.json();
              console.log('🔐 [UnifiedAuth] API response data:', userByZoId);
              
              if (userByZoId?.id) {
                profile = await getFullUserProfile(userByZoId.id);
                console.log('🔐 [UnifiedAuth] Profile loaded via API lookup:', profile ? 'Found' : 'Not found');
              }
            } else {
              const errorText = await response.text();
              console.warn('🔐 [UnifiedAuth] API lookup failed:', response.status, errorText);
            }
          } catch (err) {
            console.error('🔐 [UnifiedAuth] API lookup error:', err);
          }
        }

        if (profile) {
          console.log('✅ [UnifiedAuth] ZO profile loaded successfully:', {
            id: profile.id,
            name: profile.name,
            email: profile.email,
            phone: profile.phone,
            onboarding_completed: profile.onboarding_completed
          });
          setUserProfile(profile);
          setAuthMethod('zo');
          setIsLoading(false);
          return;
        } else {
          console.warn('⚠️ [UnifiedAuth] ZO session exists but profile not found:', zoUserId);
        }
      }

      // Priority 2: Check Privy authentication (only if no ZO session)
      if (privyReady && privyAuthenticated && privyUser?.id) {
        console.log('🔐 Loading profile via Privy:', privyUser.id);
        const profile = await getFullUserProfile(privyUser.id);
        if (profile) {
          setUserProfile(profile);
          setAuthMethod('privy');
          setIsLoading(false);
          return;
        }
      }

      // No authentication found
      console.log('⚠️ [UnifiedAuth] No user profile found - ending load with null state');
      setUserProfile(null);
      setAuthMethod(null);
    } catch (err) {
      console.error('❌ [UnifiedAuth] Error loading user profile:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setUserProfile(null);
      setAuthMethod(null);
    } finally {
      console.log('🏁 [UnifiedAuth] loadUserProfile complete, isLoading → false');
      setIsLoading(false);
    }
  }, [privyReady, privyAuthenticated, privyUser, getZoUserId]);

  // Load profile when authentication state changes
  useEffect(() => {
    console.log('🎬 [UnifiedAuth] useEffect triggered - calling loadUserProfile');
    loadUserProfile();
  }, [loadUserProfile]);

  // Listen for ZO session changes (when user logs in via phone)
  useEffect(() => {
    console.log('🎬 [UnifiedAuth] Storage listener effect triggered');
    if (typeof window === 'undefined') return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'zo_user_id' && e.newValue) {
        console.log('🔐 [UnifiedAuth] Storage change detected, reloading profile...');
        loadUserProfile();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also check on mount if ZO session exists but profile isn't loaded
    const zoUserId = getZoUserId();
    console.log('🔍 [UnifiedAuth] Mount check:', {
      zoUserId,
      hasUserProfile: !!userProfile,
      privyAuthenticated,
      shouldLoadProfile: !!zoUserId && !userProfile && !privyAuthenticated
    });
    
    if (zoUserId && !userProfile && !privyAuthenticated) {
      console.log('🚀 [UnifiedAuth] ZO session found on mount, loading profile...');
      loadUserProfile();
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [userProfile, privyAuthenticated, loadUserProfile, getZoUserId]);

  // ============================================
  // Computed Properties
  // ============================================
  const zoUserId = getZoUserId();
  console.log('🔍 [UnifiedAuth] Computing authenticated state:', {
    privyAuthenticated,
    hasPrivyUser: !!privyUser?.id,
    zoUserId,
    willBeAuthenticated: (privyAuthenticated && !!privyUser?.id) || !!zoUserId
  });
  // Authenticated if: Privy is authenticated AND has user, OR ZO session exists
  const authenticated = (privyAuthenticated && !!privyUser?.id) || !!zoUserId;
  const hasCompletedOnboarding = userProfile?.onboarding_completed ?? false;
  const isFounder = userProfile?.role === 'Founder' || userProfile?.zo_membership === 'founder';

  // ============================================
  // Login/Logout
  // ============================================
  const login = useCallback(async () => {
    if (authMethod === 'zo') {
      // ZO login is handled by PhoneLoginModal
      // Just reload profile
      await loadUserProfile();
    } else {
      // Privy login
      await privyLogin();
    }
  }, [authMethod, privyLogin, loadUserProfile]);

  const logout = useCallback(async () => {
    if (authMethod === 'zo') {
      // Clear ZO session
      localStorage.removeItem('zo_user_id');
      localStorage.removeItem('zo_token');
      setUserProfile(null);
      setAuthMethod(null);
    } else {
      // Privy logout
      await privyLogout();
    }
  }, [authMethod, privyLogout]);

  const reloadProfile = useCallback(async () => {
    await loadUserProfile();
  }, [loadUserProfile]);

  // Log the final state being returned
  console.log('📤 [UnifiedAuth] Returning state:', {
    authenticated,
    authMethod,
    hasUserProfile: !!userProfile,
    profileName: userProfile?.name,
    isLoading,
    privyReady
  });

  return {
    // Authentication state
    authenticated,
    authMethod,
    ready: privyReady, // For now, use Privy ready state
    isLoading,
    error,

    // User data
    userProfile,
    user: privyUser, // Privy user object (null for ZO users)
    
    // Computed properties
    hasCompletedOnboarding,
    isFounder,
    
    // Methods
    login,
    logout,
    reloadProfile,
    
    // Privy-specific (for backward compatibility)
    privyAuthenticated,
    privyUser,
    privyLogin,
    privyLogout,
    privyReady,
  };
}

