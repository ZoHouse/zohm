'use client';

import React, { useMemo } from 'react';
import { usePrivyUser } from '@/hooks/usePrivyUser';
import ZoPassportTest from './ZoPassportTest';

/**
 * ZoPassport - Fully wired Zo Passport component
 * 
 * This component automatically fetches and displays:
 * - User avatar (from profile or fallback)
 * - User name (from profile)
 * - Founder status (based on founder_nfts_count)
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
  const { userProfile, isLoading } = usePrivyUser();

  // Calculate profile completion
  const completion = useMemo(() => {
    if (!userProfile) return { done: 0, total: 10 };

    // Define which fields count toward completion
    const profileFields = [
      userProfile.name,           // Display name
      userProfile.bio,            // Bio
      userProfile.pfp,            // Avatar/Profile picture
      userProfile.body_type,      // Body type (for avatar generation)
      userProfile.culture,        // Culture/interests
      userProfile.location,       // Location
      userProfile.primary_wallet, // Has connected wallet
      userProfile.twitter,        // Twitter connected
      userProfile.telegram,       // Telegram connected
      userProfile.phone,          // Phone number
    ];

    const completedFields = profileFields.filter(field => {
      // Check if field exists and is not empty
      if (field === null || field === undefined) return false;
      if (typeof field === 'string' && field.trim() === '') return false;
      return true;
    }).length;

    return {
      done: completedFields,
      total: profileFields.length,
    };
  }, [userProfile]);

  // 🔍 AUTOMATIC FOUNDER DETECTION
  // This checks the database and automatically shows the correct passport:
  // - founder_nfts_count > 0 → FOUNDER passport (pink gradient, white text, founder badge)
  // - founder_nfts_count === 0 → CITIZEN passport (orange gradient, dark text, no badge)
  const isFounder = useMemo(() => {
    if (!userProfile) return false;
    // User is a founder if they have founder NFTs
    return (userProfile.founder_nfts_count || 0) > 0;
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
    <ZoPassportTest
      profile={profile}
      completion={completion}
      className={className}
    />
  );
};

export default ZoPassport;

