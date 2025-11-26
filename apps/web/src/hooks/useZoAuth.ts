/**
 * 🔐 useZoAuth Hook
 * 
 * Simple ZO phone authentication hook
 * Manages ZO user session and profile
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  getFullUserProfile,
  type FullUserProfile,
} from '@/lib/userDb';

export function useZoAuth() {
  const [userProfile, setUserProfile] = useState<FullUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadUserProfileRef = useRef<(() => Promise<void>) | null>(null);

  // ============================================
  // Get ZO User ID from localStorage
  // ============================================
  const getZoUserId = useCallback((): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('zo_user_id');
  }, []);

  // ============================================
  // Load User Profile
  // ============================================
  const loadUserProfile = useCallback(async () => {
    console.log('🔄 [ZoAuth] Loading user profile...');
    setIsLoading(true);
    setError(null);

    try {
      const zoUserId = getZoUserId();
      console.log('🔍 [ZoAuth] ZO user ID from localStorage:', zoUserId);

      if (!zoUserId) {
        console.log('⚠️ [ZoAuth] No ZO session found');
        setUserProfile(null);
        setIsLoading(false);
        return;
      }

      console.log('🔐 [ZoAuth] Loading profile for:', zoUserId);

      // Try direct lookup by id first
      let profile = await getFullUserProfile(zoUserId);
      console.log('🔐 [ZoAuth] Direct lookup result:', profile ? 'Found' : 'Not found');

      // If not found, try API lookup by zo_user_id
      if (!profile) {
        try {
          console.log('🔐 [ZoAuth] Trying API lookup by zo_user_id...');
          const response = await fetch(`/api/users/by-zo-id/${zoUserId}`);
          console.log('🔐 [ZoAuth] API response status:', response.status);

          if (response.ok) {
            const userByZoId = await response.json();
            console.log('🔐 [ZoAuth] API response data:', userByZoId);

            if (userByZoId?.id) {
              profile = await getFullUserProfile(userByZoId.id);
              console.log('🔐 [ZoAuth] Profile loaded via API:', profile ? 'Found' : 'Not found');
            }
          }
        } catch (err) {
          console.error('🔐 [ZoAuth] API lookup error:', err);
        }
      }

      if (profile) {
        console.log('✅ [ZoAuth] Profile loaded:', {
          id: profile.id,
          name: profile.name,
          onboarding_completed: profile.onboarding_completed,
          hasPfp: !!profile.pfp,
          zo_synced_at: profile.zo_synced_at,
        });

        // 🔄 CACHE CHECK: Use cached avatar if available and profile has default/missing PFP
        const cachedAvatar = typeof window !== 'undefined' ? localStorage.getItem('zo_avatar_url') : null;
        const isDefaultPfp = !profile.pfp || profile.pfp.includes('unicorn') || profile.pfp.includes('default');

        if (cachedAvatar && isDefaultPfp) {
          console.log('🔄 [ZoAuth] Using cached avatar:', cachedAvatar);
          profile.pfp = cachedAvatar;
        } else if (profile.pfp && !isDefaultPfp) {
          // Update cache if we have a valid new PFP
          if (typeof window !== 'undefined') {
            localStorage.setItem('zo_avatar_url', profile.pfp);
          }
        }

        setUserProfile(profile);

        // 🔄 AUTO-SYNC: If profile was never synced from ZO API, trigger sync now
        if (profile && !profile.zo_synced_at) {
          console.log('🔄 [ZoAuth] Profile never synced, triggering auto-sync...');

          // Get access token from localStorage
          const accessToken = typeof window !== 'undefined'
            ? localStorage.getItem('zo_access_token') || localStorage.getItem('zo_token')
            : null;

          if (accessToken) {
            // Trigger sync in background (don't await - let it happen async)
            fetch('/api/zo/sync-profile', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: profile.id,
                accessToken: accessToken,
              }),
            })
              .then(async (res) => {
                const text = await res.text();
                let result: any = {};
                if (text) {
                  try {
                    result = JSON.parse(text);
                  } catch {
                    result = { error: 'Invalid JSON response' };
                  }
                }

                if (res.ok) {
                  console.log('✅ [ZoAuth] Auto-sync completed');
                  // Reload profile to get updated avatar
                  if (loadUserProfileRef.current) {
                    setTimeout(() => {
                      loadUserProfileRef.current!();
                    }, 1000);
                  }
                } else {
                  console.error('❌ [ZoAuth] Auto-sync failed:', result?.error || 'Unknown error');
                }
              })
              .catch((err) => {
                console.error('❌ [ZoAuth] Auto-sync error:', err.message);
              });
          }
        }
      } else {
        console.warn('⚠️ [ZoAuth] Session exists but profile not found:', zoUserId);
        setUserProfile(null);
      }
    } catch (err) {
      console.error('❌ [ZoAuth] Error loading profile:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setUserProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, [getZoUserId]);

  // Store ref to loadUserProfile for use in auto-sync
  loadUserProfileRef.current = loadUserProfile;

  // ============================================
  // Auto-fetch avatar from ZO API if not cached
  // ============================================
  useEffect(() => {
    if (!userProfile?.id) return;

    // Check if avatar is already cached
    const cachedAvatar = typeof window !== 'undefined' ? localStorage.getItem('zo_avatar_url') : null;
    if (cachedAvatar) {
      console.log('✅ [ZoAuth] Avatar already cached, skipping auto-fetch');
      return;
    }

    // No cache -> always fetch from ZO API (source of truth)
    console.log('🔄 [ZoAuth] No cached avatar found, auto-fetching from ZO API...');

    const token = typeof window !== 'undefined'
      ? localStorage.getItem('zo_access_token') || localStorage.getItem('zo_token')
      : null;
    const deviceId = typeof window !== 'undefined' ? localStorage.getItem('zo_device_id') : null;
    const deviceSecret = typeof window !== 'undefined' ? localStorage.getItem('zo_device_secret') : null;

    if (!token || !deviceId || !deviceSecret) {
      console.log('⚠️ [ZoAuth] Missing credentials for auto-fetch, skipping');
      return;
    }

    // Auto-fetch avatar in background
    fetch('/api/zo/fetch-avatar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accessToken: token,
        userId: userProfile.id,
        deviceId: deviceId,
        deviceSecret: deviceSecret
      }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.avatarUrl) {
          console.log('✅ [ZoAuth] Auto-fetched avatar:', data.avatarUrl);
          localStorage.setItem('zo_avatar_url', data.avatarUrl);
          // Trigger a re-render by reloading profile
          loadUserProfile();
        } else {
          console.log('ℹ️ [ZoAuth] No avatar available from API');
        }
      })
      .catch(err => {
        console.error('❌ [ZoAuth] Auto-fetch failed:', err);
      });
  }, [userProfile?.id, loadUserProfile]);

  // ============================================
  // Logout
  // ============================================
  const logout = useCallback(() => {
    console.log('🚪 [ZoAuth] Logging out...');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('zo_user_id');
      localStorage.removeItem('zo_token');
      localStorage.removeItem('zo_device_credentials');
    }
    setUserProfile(null);
  }, []);

  // Load profile on mount and when ZO session changes
  useEffect(() => {
    console.log('🎬 [ZoAuth] Initial load');
    loadUserProfile();
  }, [loadUserProfile]);

  // Listen for ZO session changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'zo_user_id') {
        console.log('🔐 [ZoAuth] Session change detected, reloading...');
        loadUserProfile();
      }
    };

    const handleLoginSuccess = (e: Event) => {
      console.log('🔐 [ZoAuth] Login success event detected, reloading...');
      loadUserProfile();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('zoLoginSuccess', handleLoginSuccess);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('zoLoginSuccess', handleLoginSuccess);
    };
  }, [loadUserProfile]);

  // ============================================
  // Return Values
  // ============================================
  const zoUserId = getZoUserId();
  const authenticated = !!zoUserId;
  const hasCompletedOnboarding = userProfile?.onboarding_completed ?? false;
  const isFounder = userProfile?.role === 'Founder' || (userProfile?.founder_nfts_count ?? 0) > 0;

  return {
    // User data
    userProfile,
    userId: userProfile?.id || null,
    user: userProfile ? {
      id: userProfile.id,
      name: userProfile.name,
      email: userProfile.email,
      phone: userProfile.phone,
    } : null,

    // Auth state
    authenticated,
    ready: !isLoading, // Ready when not loading
    isLoading,
    error,
    hasCompletedOnboarding,
    isFounder,

    // Actions
    logout,
    login: () => {
      // Phone login is handled by PhoneLoginModal
      console.log('Use PhoneLoginModal to log in');
    },
    reloadProfile: loadUserProfile,
    refreshProfile: loadUserProfile,
    syncProfile: async () => {
      if (!userProfile?.id) return;
      const accessToken = typeof window !== 'undefined'
        ? localStorage.getItem('zo_access_token') || localStorage.getItem('zo_token')
        : null;

      if (!accessToken) return;

      try {
        const res = await fetch('/api/zo/sync-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userProfile.id,
            accessToken: accessToken,
          }),
        });

        if (res.ok) {
          console.log('✅ [ZoAuth] Manual sync completed');
          loadUserProfile(); // Reload to get updated data
          return true;
        }
        return false;
      } catch (err) {
        console.error('❌ [ZoAuth] Manual sync failed:', err);
        return false;
      }
    },

    // Metadata
    authMethod: authenticated ? ('zo' as const) : null,
  };
}

