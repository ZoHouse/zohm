'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from './useWallet';
import { supabase } from '@/lib/supabase';

interface MemberProfile {
  name?: string;
  bio?: string;
  culture?: string;
  pfp?: string;
  founder_nfts_count?: number;
  calendar_url?: string;
  created_at?: string;
  lat?: number;
  lng?: number;
}

export function useProfileGate() {
  const { isConnected, address } = useWallet();
  const [memberProfile, setMemberProfile] = useState<MemberProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);

  // Check if profile is complete (all mandatory fields)
  const isProfileComplete = memberProfile && 
    memberProfile.name && memberProfile.bio && memberProfile.culture &&
    memberProfile.lat && memberProfile.lng &&
    memberProfile.name?.trim() !== '' && 
    memberProfile.bio?.trim() !== '' && 
    memberProfile.culture?.trim() !== '' &&
    memberProfile.lat !== 0 && memberProfile.lng !== 0;

  // Load member profile
  const loadMemberProfile = useCallback(async () => {
    if (!address) return;
    
    setIsLoadingProfile(true);
    try {
      const { data, error } = await supabase
        .from('members')
        .select('name, bio, culture, pfp, founder_nfts_count, calendar_url, created_at, lat, lng')
        .eq('wallet', address)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error);
        return;
      }

      setMemberProfile(data);
      
    } catch (error) {
      console.error('Exception loading profile:', error);
    } finally {
      setIsLoadingProfile(false);
    }
  }, [address]);

  // Load profile when connected
  useEffect(() => {
    if (isConnected && address) {
      loadMemberProfile();
    } else {
      setMemberProfile(null);
    }
  }, [isConnected, address, loadMemberProfile]);

  // Function to check access and trigger setup if needed
  const checkProfileAccess = (): boolean => {
    if (!isConnected) {
      return false; // Need to connect wallet first
    }
    
    // If we have profile data but it's incomplete, show setup
    if (memberProfile !== null && !isProfileComplete) {
      setShowProfileSetup(true);
      return false;
    }
    
    // If no profile data at all and not loading, also trigger setup
    if (memberProfile === null && !isLoadingProfile) {
      setShowProfileSetup(true);
      return false;
    }
    
    if (isProfileComplete) {
      return true; // Allow access
    }

    return false; // Still loading or other state
  };



  const completeProfileSetup = async () => {
    setShowProfileSetup(false);
    // Wait a moment for state to update, then reload profile
    setTimeout(async () => {
      await loadMemberProfile();
    }, 100);
  };

  return {
    isConnected,
    memberProfile,
    isProfileComplete,
    isLoadingProfile,
    showProfileSetup,
    setShowProfileSetup,
    checkProfileAccess,
    completeProfileSetup,
    loadMemberProfile
  };
} 