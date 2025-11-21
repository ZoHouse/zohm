'use client';

import React, { useMemo } from 'react';
import { useZoAuth } from '@/hooks/useZoAuth';
import ZoPassportComponent from './ZoPassportComponent';

import { PrivyUserProfile } from '@/types/privy';

interface ZoPassportProps {
  className?: string;
  userProfile?: PrivyUserProfile | null;
}

/**
 * ZoPassport - Fully wired Zo Passport component
 * 
 * This component automatically fetches and displays:
 * - User avatar (from profile or fallback)
 * - User name (from profile)
 * - Founder status (based on founder_nfts_count, role, or zo_membership)
 * - Profile completion progress
 * 
 * Usage:
 * ```tsx
 * <ZoPassport />
 * // OR with pre-loaded profile
 * <ZoPassport userProfile={profile} />
 * ```
 */
const ZoPassport: React.FC<ZoPassportProps> = ({ className, userProfile: propUserProfile }) => {
  const { userProfile: authUserProfile, isLoading: authLoading } = useZoAuth();

  // Use prop profile for other fields if provided, but avatar always comes from auth (reactive)
  const userProfile = propUserProfile !== undefined ? propUserProfile : authUserProfile;
  const isLoading = propUserProfile !== undefined ? false : authLoading;

  // Calculate founder status
  const isFounder = useMemo(() => {
    if (!userProfile) return false;

    const isFounderRole = userProfile.role === 'Founder';
    const hasFounderNfts = (userProfile.founder_nfts_count ?? 0) > 0;
    const isZoFounder = userProfile.zo_membership?.toLowerCase() === 'founder';

    console.log('🔍 [ZoPassport] Founder check:', {
      role: userProfile.role,
      nfts: userProfile.founder_nfts_count,
      membership: userProfile.zo_membership,
      isFounderRole,
      hasFounderNfts,
      isZoFounder
    });

    return isFounderRole || hasFounderNfts || isZoFounder;
  }, [userProfile]);

  // Calculate profile completion
  const completion = useMemo(() => {
    if (!userProfile) return { done: 0, total: 10 };

    // Define which fields count toward completion
    const profileFields = [
      userProfile.name,             // Display name
      userProfile.bio,              // Bio
      userProfile.pfp,              // Avatar/Profile picture
      userProfile.body_type,        // Body type (for avatar generation)
      userProfile.culture,          // Culture/interests
      userProfile.city,             // Location / city
      userProfile.primary_wallet,   // Has connected wallet
      userProfile.email,            // Email connected
      userProfile.calendar_url,     // Calendar link
      userProfile.main_quest_url,   // Main quest link
    ];

    const completedFields = profileFields.filter(field => {
      // Check if field exists and is not empty
      if (field === null || field === undefined) return false;
      if (typeof field === 'string' && field.trim() === '') return false;
      if (typeof field === 'object' && Object.keys(field).length === 0) return false;
      return true;
    }).length;

    return {
      done: completedFields,
      total: profileFields.length,
    };
  }, [userProfile]);

  // Extract display data
  // 🔑 CRITICAL: Always use authUserProfile for avatar (reactive, updates automatically)
  // Use propUserProfile only for other fields if needed, but avatar must come from auth hook
  const profile = useMemo(() => {
    // Always prefer auth profile for avatar (it's reactive and updates)
    const profileForAvatar = authUserProfile || userProfile;
    const profileForName = userProfile || authUserProfile;

    if (!profileForAvatar && !profileForName) return undefined;

    // 🔍 DEEP DEBUG: Log what avatar we're using
    console.log('🎨 [ZoPassport] Rendering with avatar:', {
      pfp: profileForAvatar?.pfp || 'NULL',
      hasPfp: !!profileForAvatar?.pfp,
      willShow: profileForAvatar?.pfp || '/images/rank1.jpeg (FALLBACK)',
      source: authUserProfile ? 'authUserProfile (REACTIVE)' : 'propUserProfile (STATIC)',
      authPfp: authUserProfile?.pfp || 'NULL',
      propPfp: propUserProfile?.pfp || 'NULL',
    });

    // Get avatar from various sources, prioritizing reactive auth profile
    let avatar = authUserProfile?.pfp || profileForAvatar?.pfp;

    // Fallback to localStorage if available (matches DashboardHeader behavior)
    if (!avatar && typeof window !== 'undefined') {
      const storedAvatar = localStorage.getItem('zo_avatar');
      if (storedAvatar) {
        console.log('🎨 [ZoPassport] Using cached avatar from localStorage');
        avatar = storedAvatar;
      }
    }

    return {
      avatar: avatar || undefined,
      name: profileForName?.name || undefined,
      isFounder,
    };
  }, [authUserProfile, userProfile, isFounder, propUserProfile]);

  // Loading state
  if (isLoading) {
    return (
      <div className={`w-[234px] h-[300px] rounded-tr-[20px] rounded-br-[20px] bg-white/5 animate-pulse ${className || ''}`}>
        {/* Loading skeleton */}
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-white/40 text-sm">Loading passport...</div>
        </div>
      </div>
    );
  }

  // Render passport
  return (
    <div className="relative">
      <ZoPassportComponent
        profile={profile}
        completion={completion}
        className={className}
      />
      {/* Debug Info - Temporary */}
      <div className="absolute top-0 left-0 bg-black/80 text-white text-[10px] p-1 z-50 pointer-events-none max-w-[200px] break-words">
        R:{userProfile?.role} N:{userProfile?.founder_nfts_count} M:{userProfile?.zo_membership}
      </div>
    </div>
  );
};

export default ZoPassport;
