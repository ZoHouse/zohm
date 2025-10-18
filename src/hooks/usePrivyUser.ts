/**
 * 🦄 usePrivyUser Hook
 * 
 * This hook combines Privy authentication with our database,
 * providing a complete user profile with all authentication methods
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import {
  getFullUserProfile,
  upsertUserFromPrivy,
  updateUserProfile,
  getUserWallets,
  setPrimaryWallet,
  type FullUserProfile,
  type UserRecord,
  type UserWalletRecord,
} from '@/lib/privyDb';

export function usePrivyUser() {
  const { 
    ready: privyReady, 
    authenticated, 
    user: privyUser,
    login,
    logout: privyLogout,
  } = usePrivy();

  const [userProfile, setUserProfile] = useState<FullUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================
  // Load User Profile
  // ============================================

  const loadUserProfile = useCallback(async () => {
    if (!privyUser?.id) {
      setUserProfile(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Get full profile from database
      let profile = await getFullUserProfile(privyUser.id);

      // If user doesn't exist in DB yet, create them
      if (!profile) {
        console.log('🆕 New Privy user detected, creating profile...');
        await upsertUserFromPrivy(privyUser);
        profile = await getFullUserProfile(privyUser.id);
      } else {
        // Update last_seen and sync wallets/auth methods
        await upsertUserFromPrivy(privyUser);
        profile = await getFullUserProfile(privyUser.id);
      }

      setUserProfile(profile);
    } catch (err) {
      console.error('Error loading user profile:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [privyUser]);

  // Load profile when Privy user changes
  useEffect(() => {
    if (privyReady && authenticated && privyUser) {
      loadUserProfile();
    } else if (privyReady && !authenticated) {
      setUserProfile(null);
      setIsLoading(false);
    }
  }, [privyReady, authenticated, privyUser, loadUserProfile]);

  // ============================================
  // Profile Operations
  // ============================================

  const updateProfile = useCallback(async (
    updates: Partial<UserRecord>
  ): Promise<boolean> => {
    if (!userProfile?.id) return false;

    try {
      const updatedUser = await updateUserProfile(userProfile.id, updates);
      if (updatedUser) {
        setUserProfile(prev => prev ? { ...prev, ...updatedUser } : null);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error updating profile:', err);
      return false;
    }
  }, [userProfile]);

  const completeOnboarding = useCallback(async (
    profileData: Partial<UserRecord>
  ): Promise<boolean> => {
    if (!userProfile?.id) return false;

    try {
      const success = await updateProfile({
        ...profileData,
        onboarding_completed: true,
      });

      if (success) {
        await loadUserProfile();
      }

      return success;
    } catch (err) {
      console.error('Error completing onboarding:', err);
      return false;
    }
  }, [userProfile, updateProfile, loadUserProfile]);

  // ============================================
  // Wallet Operations
  // ============================================

  const refreshWallets = useCallback(async () => {
    if (!userProfile?.id) return;

    try {
      const wallets = await getUserWallets(userProfile.id);
      setUserProfile(prev => prev ? {
        ...prev,
        wallets,
        primary_wallet: wallets.find(w => w.is_primary) || null,
      } : null);
    } catch (err) {
      console.error('Error refreshing wallets:', err);
    }
  }, [userProfile]);

  const changePrimaryWallet = useCallback(async (
    walletAddress: string
  ): Promise<boolean> => {
    if (!userProfile?.id) return false;

    try {
      const success = await setPrimaryWallet(userProfile.id, walletAddress);
      if (success) {
        await refreshWallets();
      }
      return success;
    } catch (err) {
      console.error('Error changing primary wallet:', err);
      return false;
    }
  }, [userProfile, refreshWallets]);

  // ============================================
  // Logout
  // ============================================

  const logout = useCallback(async () => {
    try {
      await privyLogout();
      setUserProfile(null);
      setError(null);
    } catch (err) {
      console.error('Error logging out:', err);
    }
  }, [privyLogout]);

  // ============================================
  // Computed Values
  // ============================================

  const displayName = userProfile?.name 
    || userProfile?.email 
    || (userProfile?.primary_wallet?.address 
      ? `${userProfile.primary_wallet.address.slice(0, 6)}...${userProfile.primary_wallet.address.slice(-4)}`
      : 'Anonymous');

  const primaryWalletAddress = userProfile?.primary_wallet?.address || null;

  const hasCompletedOnboarding = userProfile?.onboarding_completed || false;

  const isFounder = userProfile?.role === 'Founder';

  const hasWallet = (userProfile?.wallets.length || 0) > 0;

  const hasEmail = !!userProfile?.email;

  // ============================================
  // Return Hook Data
  // ============================================

  return {
    // Privy state
    privyReady,
    authenticated,
    privyUser,

    // Database profile
    userProfile,
    isLoading,
    error,

    // Computed values
    displayName,
    primaryWalletAddress,
    hasCompletedOnboarding,
    isFounder,
    hasWallet,
    hasEmail,

    // Operations
    login,
    logout,
    updateProfile,
    completeOnboarding,
    refreshWallets,
    changePrimaryWallet,
    reloadProfile: loadUserProfile,
  };
}

// ============================================
// Backward Compatibility Hook
// ============================================

/**
 * Drop-in replacement for old useWallet hook
 * Maps Privy user to old wallet format
 */
export function usePrivyWallet() {
  const { 
    privyReady,
    authenticated,
    userProfile,
    primaryWalletAddress,
    isLoading,
  } = usePrivyUser();

  return {
    ready: privyReady,
    connected: authenticated && !!primaryWalletAddress,
    address: primaryWalletAddress,
    isLoading,
    // Old methods (now no-ops or use Privy)
    connect: () => console.warn('Use Privy login instead'),
    disconnect: () => console.warn('Use Privy logout instead'),
  };
}


