'use client';

import React, { useMemo } from 'react';
import { useZoAuth } from '@/hooks/useZoAuth';
import ZoPassportComponent from './ZoPassportComponent';

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
 * ```
 * 
 * No props needed - completely self-contained!
 */
const ZoPassport: React.FC<{ className?: string }> = ({ className }) => {
  const { userProfile, isLoading, isFounder } = useZoAuth();

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
  const profile = useMemo(() => {
    if (!userProfile) return undefined;

    return {
      avatar: userProfile.pfp || undefined,
      name: userProfile.name || undefined,
      isFounder,
    };
  }, [userProfile, isFounder]);

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
    <ZoPassportComponent
      profile={profile}
      completion={completion}
      className={className}
    />
  );
};

export default ZoPassport;
