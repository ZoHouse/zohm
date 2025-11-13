'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePrivyUser } from './usePrivyUser';
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
  main_quest_url?: string;
  side_quest_url?: string;
}

export function useProfileGate() {
  const { authenticated, primaryWalletAddress } = usePrivyUser();
  const [memberProfile, setMemberProfile] = useState<MemberProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);

  // Debug logging for showProfileSetup changes
  useEffect(() => {
    console.log('🔧 showProfileSetup changed to:', showProfileSetup);
  }, [showProfileSetup]);

  // Check if profile is complete (only name is mandatory for initial access)
  const isProfileComplete = memberProfile && 
    memberProfile.name && 
    memberProfile.name?.trim() !== '';
    
  // Debug logging for profile completion
  useEffect(() => {
    console.log('🔧 Profile completion check:', {
      memberProfile,
      hasName: !!(memberProfile?.name),
      nameTrimmed: memberProfile?.name?.trim(),
      isProfileComplete
    });
  }, [memberProfile, isProfileComplete]);

  // Load member profile
  const loadMemberProfile = useCallback(async () => {
    if (!primaryWalletAddress) return;
    
    console.log('🔄 Loading profile for address:', primaryWalletAddress);
    setIsLoadingProfile(true);
    
    try {
      const { data, error } = await supabase
        .from('members')
        .select('name, bio, culture, pfp, founder_nfts_count, calendar_url, created_at, lat, lng, main_quest_url, side_quest_url')
        .eq('wallet', primaryWalletAddress.toLowerCase())
        .single();
        
      console.log('🔍 Database query details:', {
        queryAddress: primaryWalletAddress.toLowerCase(),
        resultData: data,
        error: error
      });

      if (error && error.code !== 'PGRST116') {
        console.warn('⚠️ Profile query returned error (this is okay for new users):', error.message || 'Unknown error');
        return null;
      }

      console.log('📊 Profile data loaded:', data);
      setMemberProfile(data);
      
      // Return the profile data so the caller can use it immediately
      return data;
      
    } catch (error) {
      console.warn('⚠️ Exception loading profile (this is okay for new users):', error);
      return null;
    } finally {
      setIsLoadingProfile(false);
    }
  }, [primaryWalletAddress]);

  // Load profile when authenticated
  useEffect(() => {
    if (authenticated && primaryWalletAddress) {
      loadMemberProfile();
    } else {
      setMemberProfile(null);
    }
  }, [authenticated, primaryWalletAddress, loadMemberProfile]);

  // Function to check access and trigger setup if needed
  const checkProfileAccess = (): boolean => {
    if (!authenticated) {
      return false; // Need to authenticate first
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



  const completeProfileSetup = (newData: Partial<MemberProfile> = {}) => {
    console.log('✅ Completing profile setup with data:', newData);
    setShowProfileSetup(false);
    // Optimistically update the profile
    setMemberProfile(prev => {
      const updated = { ...prev, ...newData, name: newData.name || prev?.name || '' };
      console.log('🔄 Updated member profile:', updated);
      return updated;
    });
  };

  return {
    authenticated,
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