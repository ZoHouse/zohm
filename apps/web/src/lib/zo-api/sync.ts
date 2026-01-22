// apps/web/src/lib/zo-api/sync.ts
// Sync ZO profile data to Supabase

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getProfile } from './profile';
import type { ZoProfileResponse } from './types';
import { devLog } from '@/lib/logger';

/**
 * Sync ZO profile to Supabase users table
 * Called after successful ZO authentication
 * 
 * This is NON-DESTRUCTIVE - only updates ZO-specific fields
 * Keeps existing Privy data intact
 */
export async function syncZoProfileToSupabase(
  userId: string,  // Supabase user ID (Privy DID or ZO user ID)
  accessToken: string,
  authData?: {
    zo_user_id: string;
    zo_pid: string;
    zo_token: string;
    zo_refresh_token: string;
    zo_token_expiry: string;
    zo_refresh_token_expiry: string;
    device_id: string;
    device_secret: string;
    // Additional fields from verify-otp response
    zo_legacy_token?: string;
    zo_legacy_token_valid_till?: string;
    zo_client_key?: string;
    zo_device_info?: Record<string, any>;
    zo_roles?: string[];
    zo_membership?: string;  // 'founder' | 'citizen' | 'none'
  }
): Promise<{
  success: boolean;
  error?: string;
}> {
  // 🔒 CRITICAL: Check if we have admin access (required for database writes)
  if (!supabaseAdmin) {
    devLog.error('❌ [syncZoProfile] supabaseAdmin not available - cannot update database');
    return {
      success: false,
      error: 'Database admin access not available',
    };
  }

  try {
    devLog.log('🔄 [syncZoProfile] Starting sync for user:', userId);

    // 1. Fetch profile from ZO API
    // Use device credentials from authData if available (from verify-otp response)
    // This ensures we use the exact credentials that were validated by ZO API
    const deviceCredentials = authData?.device_id && authData?.device_secret
      ? { deviceId: authData.device_id, deviceSecret: authData.device_secret }
      : undefined;

    const { success, profile, error } = await getProfile(accessToken, userId, deviceCredentials);

    if (!success || !profile) {
      devLog.error('❌ Failed to fetch ZO profile:', error);
      return {
        success: false,
        error: error || 'Failed to fetch ZO profile',
      };
    }

    // Log avatar sync status
    const avatarUrl = profile.avatar?.image || profile.pfp_image;
    if (avatarUrl) {
      devLog.log('📸 [syncZoProfile] Avatar found in ZO API:', avatarUrl.substring(0, 50) + '...');
    }

    // 2. Transform ZO profile to Supabase format
    const updateData: any = {
      // ZO Identity (if provided)
      ...(authData && {
        zo_user_id: authData.zo_user_id,
        zo_pid: authData.zo_pid,
        zo_token: authData.zo_token,
        zo_refresh_token: authData.zo_refresh_token,
        zo_token_expiry: authData.zo_token_expiry,
        zo_refresh_token_expiry: authData.zo_refresh_token_expiry,
        zo_device_id: authData.device_id,
        zo_device_secret: authData.device_secret,
        // Additional fields from verify-otp response
        ...(authData.zo_legacy_token && {
          zo_legacy_token: authData.zo_legacy_token,
        }),
        ...(authData.zo_legacy_token_valid_till && {
          zo_legacy_token_valid_till: authData.zo_legacy_token_valid_till,
        }),
        ...(authData.zo_client_key && {
          zo_client_key: authData.zo_client_key,
        }),
        ...(authData.zo_device_info && {
          zo_device_info: authData.zo_device_info,
        }),
        ...(authData.zo_roles && {
          zo_roles: authData.zo_roles,
        }),
        ...(authData.zo_membership && {
          zo_membership: authData.zo_membership,
        }),
      }),

      // Profile fields (from ZO API)
      // Name priority: selected_nickname > custom_nickname > nickname > first_name + last_name
      name: profile.selected_nickname 
        || profile.custom_nickname 
        || profile.nickname 
        || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() 
        || null,
      bio: profile.bio,
      email: profile.email_address,
      phone: profile.mobile_number,
      birthdate: profile.date_of_birth,

      // Avatar: Sync from ZO API if available
      // Priority: avatar.image (generated avatar) > pfp_image (default profile pic)
      // Only sync if we have a valid URL (not empty string)
      // This handles:
      // - New users: Avatar generated in ZO API → sync it ✅
      // - Cross-app users: Avatar already in ZO API → sync it ✅
      // - Edge case: Avatar generated locally but not in ZO yet → preserve it ✅
      // Note: If ZO API doesn't have a valid avatar URL, pfp field is NOT included in updateData
      // This means existing pfp in Supabase is preserved (not overwritten)
      ...(() => {
        // Priority: avatar.image (generated) > pfp_image (profile pic)
        const zoAvatarUrl = profile.avatar?.image || profile.pfp_image;

        // More permissive validation - accept any truthy non-empty string
        // This prevents valid avatar URLs from being rejected due to strict protocol checks
        const isValidUrl = zoAvatarUrl &&
          typeof zoAvatarUrl === 'string' &&
          zoAvatarUrl.trim().length > 0 &&
          zoAvatarUrl !== 'null' &&
          zoAvatarUrl !== 'undefined';

        if (isValidUrl) {
          devLog.log('✅ [syncZoProfile] Using avatar from ZO API:', zoAvatarUrl);
          return { pfp: zoAvatarUrl };
        } else {
          devLog.log('⚠️ [syncZoProfile] No valid avatar URL in ZO API:', {
            avatarImage: profile.avatar?.image || 'null',
            pfpImage: profile.pfp_image || 'null',
            avatarType: typeof zoAvatarUrl,
            reason: !zoAvatarUrl ? 'no URL' :
              typeof zoAvatarUrl !== 'string' ? 'not a string' :
                zoAvatarUrl.trim().length === 0 ? 'empty string' :
                  zoAvatarUrl === 'null' || zoAvatarUrl === 'undefined' ? 'string literal null/undefined' :
                    'unknown'
          });
          return {};
        }
      })(),

      // Cultures (JSONB array)
      cultures: profile.cultures || [],

      // Body type (for avatar)
      body_type: profile.body_type,

      // Location (city only - don't override browser location)
      // Note: lat/lng should come from browser geolocation, not ZO API
      // ZO home_location is stored separately as zo_home_location for reference
      city: profile.place_name,
      ...(profile.home_location && {
        zo_home_location: profile.home_location,  // Store as JSONB: { lat: number, lng: number }
      }),

      // ZO Membership (store as-is, separate from role column)
      // Note: membership comes from profile response, not authData
      ...(profile.membership && {
        zo_membership: profile.membership,  // 'founder' | 'citizen' | 'none'
      }),
      founder_nfts_count: profile.founder_tokens?.length || 0,

      // Wallet
      primary_wallet_address: profile.wallet_address,

      // Sync metadata
      zo_synced_at: new Date().toISOString(),
      zo_sync_status: 'synced',
      updated_at: new Date().toISOString(),
    };

    devLog.log('💾 [syncZoProfile] Saving to Supabase:', {
      userId,
      name: updateData.name,
      hasPfp: 'pfp' in updateData && !!updateData.pfp,
    });

    // 3. Update Supabase (using admin client to bypass RLS)
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', userId);

    if (updateError) {
      devLog.error('❌ Failed to sync to Supabase:', {
        error: updateError,
        code: updateError.code,
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        userId,
      });
      return {
        success: false,
        error: updateError.message || 'Failed to update user profile',
      };
    }

    // 🔍 DEEP DEBUG: Verify what was actually saved to database
    // Verify what was saved
    const { data: savedProfile } = await supabaseAdmin
      .from('users')
      .select('id, name, pfp, zo_synced_at')
      .eq('id', userId)
      .single();

    if (savedProfile?.pfp) {
      devLog.log('✅ [syncZoProfile] Profile synced successfully, avatar saved');
    }

    // 4. Also update/create wallet entry
    if (profile.wallet_address) {
      await supabaseAdmin
        .from('user_wallets')
        .upsert({
          user_id: userId,
          address: profile.wallet_address,
          chain_type: 'ethereum',
          wallet_client: 'zo',
          is_verified: true,
          is_primary: true,
          verified_at: new Date().toISOString(),
          linked_at: new Date().toISOString(),
        }, {
          onConflict: 'address',
        });
    }

    devLog.log('✅ ZO profile synced to Supabase for user:', userId);

    return {
      success: true,
    };

  } catch (error: any) {
    devLog.error('Failed to sync ZO profile:', error);
    return {
      success: false,
      error: error.message || 'Unknown error during sync',
    };
  }
}

/**
 * Check if user has ZO identity linked
 */
export async function hasZoIdentity(userId: string): Promise<boolean> {
  if (!supabaseAdmin) return false;

  try {
    const { data } = await supabaseAdmin
      .from('users')
      .select('zo_user_id')
      .eq('id', userId)
      .single();

    return !!data?.zo_user_id;
  } catch {
    return false;
  }
}

/**
 * Get ZO tokens for a user (if they have ZO linked)
 */
export async function getZoTokens(userId: string): Promise<{
  accessToken?: string;
  refreshToken?: string;
  accessExpiry?: string;
} | null> {
  if (!supabaseAdmin) return null;

  try {
    const { data } = await supabaseAdmin
      .from('users')
      .select('zo_token, zo_refresh_token, zo_token_expiry')
      .eq('id', userId)
      .single();

    if (!data?.zo_token) return null;

    return {
      accessToken: data.zo_token,
      refreshToken: data.zo_refresh_token,
      accessExpiry: data.zo_token_expiry,
    };
  } catch {
    return null;
  }
}

