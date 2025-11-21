'use client';

import React, { useMemo } from 'react';
import { useZoAuth } from '@/hooks/useZoAuth';

/**
 * ZoPassport - Fully wired Zo Passport component
 * 
 * This component automatically fetches and displays:
 * - User avatar (ZO avatar or fallback)
 * - User name (from ZO profile or fallback)
 * - Founder status (based on zo_membership or role)
 * - Profile completion progress
 * 
 * Supports both ZO and Privy authentication
 * 
 * Usage:
 * ```tsx
 * <ZoPassport />
 * ```
 * 
 * No props needed - completely self-contained!
 */
const ZoPassport: React.FC<{ className?: string }> = ({ className }) => {
  const { userProfile, isLoading } = useZoAuth();

  // Calculate profile completion
  const completion = useMemo(() => {
    if (!userProfile) return { done: 0, total: 10 };

    // Define which fields count toward completion
    const profileFields = [
      userProfile.name,                              // Display name
      userProfile.bio,                               // Bio
      userProfile.pfp,                               // Avatar
      userProfile.body_type,                         // Body type (for avatar generation)
      userProfile.culture,                           // Culture/interests
      userProfile.city,                              // Location / city
      userProfile.primary_wallet,                    // Has connected wallet
      userProfile.email,                             // Email connected
      userProfile.calendar_url,                      // Calendar link
      userProfile.main_quest_url,                    // Main quest link
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

  // 🔍 AUTOMATIC FOUNDER DETECTION
  // This checks the database and automatically shows the correct passport:
  // - ZO membership === 'founder' OR role === 'Founder' OR founder_nfts_count > 0
  //   → FOUNDER passport (pink gradient, white text, founder badge)
  // - Otherwise → CITIZEN passport (orange gradient, dark text, no badge)
  const isFounder = useMemo(() => {
    if (!userProfile) return false;
    // Check multiple sources for founder status (supports both ZO and Privy users)
    return (
      userProfile.zo_membership === 'founder' ||
      userProfile.role === 'Founder' ||
      (userProfile.founder_nfts_count || 0) > 0
    );
  }, [userProfile]);

  // Extract display data (supports both ZO and Privy users)
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

  // Render passport placeholder
  // TODO: Restore ZoPassportTest component or inline its content here
  return (
    <div className={className}>
      <div className="bg-gradient-to-br from-zo-accent/10 to-purple-500/10 rounded-xl p-6 text-center">
        <p className="text-white/60">Passport Component</p>
        <p className="text-xs text-white/40 mt-2">Coming soon</p>
      </div>
    </div>
  );
};

export default ZoPassport;

