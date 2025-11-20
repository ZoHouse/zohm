// apps/web/src/lib/zo-api/sync.ts
// Sync ZO profile data to Supabase

import { createClient } from '@/lib/supabase/client';
import { getProfile } from './profile';
import type { ZoProfileResponse } from './types';

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
  }
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = createClient();

    // 1. Fetch profile from ZO API
    const { success, profile, error } = await getProfile(accessToken);
    
    if (!success || !profile) {
      return {
        success: false,
        error: error || 'Failed to fetch ZO profile',
      };
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
      }),

      // Profile fields (from ZO API)
      name: `${profile.first_name} ${profile.last_name || ''}`.trim(),
      bio: profile.bio,
      pfp: profile.avatar?.image || profile.pfp_image,
      email: profile.email_address,
      phone: profile.mobile_number,
      birthdate: profile.date_of_birth,
      
      // Cultures (JSONB array)
      cultures: profile.cultures || [],
      
      // Body type (for avatar)
      body_type: profile.body_type,
      
      // Location
      city: profile.place_name,
      ...(profile.home_location && {
        lat: profile.home_location.lat,
        lng: profile.home_location.lng,
      }),
      
      // Founder status
      membership: profile.membership,
      founder_nfts_count: profile.founder_tokens?.length || 0,
      
      // Wallet
      primary_wallet_address: profile.wallet_address,
      
      // Sync metadata
      zo_synced_at: new Date().toISOString(),
      zo_sync_status: 'synced',
      updated_at: new Date().toISOString(),
    };

    // 3. Update Supabase
    const { error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId);

    if (updateError) {
      console.error('Failed to sync to Supabase:', updateError);
      return {
        success: false,
        error: updateError.message,
      };
    }

    // 4. Also update/create wallet entry
    if (profile.wallet_address) {
      await supabase
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

    console.log('✅ ZO profile synced to Supabase for user:', userId);

    return {
      success: true,
    };

  } catch (error: any) {
    console.error('Failed to sync ZO profile:', error);
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
  try {
    const supabase = createClient();
    
    const { data } = await supabase
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
  try {
    const supabase = createClient();
    
    const { data } = await supabase
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

