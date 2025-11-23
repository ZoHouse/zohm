/**
 * 🦄 User Database Helpers
 * 
 * This file contains all the database helpers for working with users
 * in the users/user_wallets/user_auth_methods schema.
 * 
 * Previously named privyDb.ts - renamed to reflect ZO-only authentication.
 */

import { supabase } from './supabase';
import { getUnicornForAddress } from './unicornAvatars';

// ============================================
// TypeScript Types
// ============================================

export interface UserRecord {
  id: string;  // User ID (ZO user_id for ZO-only users)
  name: string | null;
  bio: string | null;
  pfp: string | null;
  culture: string | null;  // Legacy TEXT field (deprecated, use cultures JSONB)
  city: string | null;
  email: string | null;
  phone: string | null;
  birthdate: string | null;  // Date string in ISO format
  x_handle: string | null;
  x_connected: boolean;
  lat: number | null;
  lng: number | null;
  role: 'Founder' | 'Member' | 'Citizen';
  founder_nfts_count: number;
  zo_balance: number;  // User's ZO token balance (cached)
  calendar_url: string | null;
  main_quest_url: string | null;
  side_quest_url: string | null;
  onboarding_completed: boolean;
  onboarding_step: number;
  body_type: 'bro' | 'bae' | null;  // ZO API avatar generation body type
  profile_synced_at: string | null;  // Legacy field (deprecated, use zo_synced_at)
  
  // ZO Identity fields (from migration 010)
  zo_user_id: string | null;  // ZO API user.id (unique identifier)
  zo_pid: string | null;  // ZO API user.pid (passport ID)
  
  // ZO Auth tokens
  zo_token: string | null;  // JWT access token
  zo_token_expiry: string | null;  // Access token expiry timestamp
  zo_refresh_token: string | null;  // Refresh token
  zo_refresh_token_expiry: string | null;  // Refresh token expiry timestamp
  
  // ZO Device credentials (required for API calls)
  zo_device_id: string | null;  // Device ID from ZO API response
  zo_device_secret: string | null;  // Device secret from ZO API response
  
  // Additional ZO auth fields (from verify-otp response)
  zo_legacy_token: string | null;  // Legacy token from ZO API (deprecated, use zo_token)
  zo_legacy_token_valid_till: string | null;  // Legacy token expiry timestamp
  zo_client_key: string | null;  // Client key used for ZO API authentication
  zo_device_info: Record<string, any> | null;  // Device info JSON from ZO API response
  zo_roles: string[] | null;  // Array of user roles from ZO API (e.g., ["property-manager", "housekeeping-admin"])
  zo_membership: string | null;  // ZO API membership: 'founder' | 'citizen' | 'none' (stored as-is, separate from role column)
  
  // Wallet tracking (for token balance)
  primary_wallet_address: string | null;  // Primary wallet for balance fetching
  wallet_chain_id: number | null;  // Chain ID (default: 8453 for Base)
  balance_last_synced_at: string | null;  // Last time balance was synced
  
  // Cultures (JSONB array - replaces culture TEXT field)
  cultures: Array<{
    key: string;
    name: string;
    icon?: string;
    description?: string;
  }> | null;
  
  // ZO Sync metadata
  zo_synced_at: string | null;  // Last sync timestamp from ZO API
  zo_sync_status: 'never' | 'synced' | 'stale' | 'error' | null;  // Sync status
  
  // Timestamps
  created_at: string;
  last_seen: string | null;
  updated_at: string;
}

export interface UserWalletRecord {
  id: string;
  user_id: string;
  address: string;
  chain_type: 'ethereum' | 'avalanche' | 'solana' | 'polygon' | 'base';
  wallet_client: string | null;
  wallet_client_type: string | null;
  is_embedded: boolean;
  is_primary: boolean;
  is_verified: boolean;
  verified_at: string | null;
  linked_at: string;
  last_used_at: string | null;
}

export interface UserAuthMethodRecord {
  id: string;
  user_id: string;
  auth_type: 'email' | 'google' | 'twitter' | 'discord' | 'farcaster' | 'wallet';
  identifier: string;
  display_name: string | null;
  oauth_subject: string | null;
  oauth_username: string | null;
  is_verified: boolean;
  verified_at: string | null;
  linked_at: string;
  last_used_at: string | null;
}

export interface FullUserProfile extends UserRecord {
  wallets: UserWalletRecord[];
  auth_methods: UserAuthMethodRecord[];
  primary_wallet: UserWalletRecord | null;
}

// ============================================
// User CRUD Operations
// ============================================

/**
 * Get user by ID (works for both user ID and ZO user ID)
 */
export async function getUserById(userId: string): Promise<UserRecord | null> {
  try {
    console.log('🔍 [getUserById] Looking up user by id:', userId);
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.log('🔍 [getUserById] Query by id error:', error.code, error.message);
      if (error.code === 'PGRST116') {
        console.log('🔍 [getUserById] User not found by id, trying zo_user_id...');
        // Try looking up by zo_user_id instead
        const { data: userByZoId, error: zoError } = await supabase
          .from('users')
          .select('*')
          .eq('zo_user_id', userId)
          .single();
        
        if (zoError) {
          console.log('🔍 [getUserById] Query by zo_user_id error:', zoError.code, zoError.message);
          if (zoError.code === 'PGRST116') {
            console.log('❌ [getUserById] User not found by zo_user_id either');
            return null;
          }
          throw zoError;
        }
        
        console.log('✅ [getUserById] Found user by zo_user_id:', {
          id: userByZoId?.id,
          zo_user_id: userByZoId?.zo_user_id,
          name: userByZoId?.name
        });
        return userByZoId;
      }
      throw error;
    }

    console.log('✅ [getUserById] Found user by id:', data?.id);
    return data;
  } catch (error) {
    console.error('❌ [getUserById] Error fetching user by ID:', error);
    return null;
  }
}

/**
 * Get user by wallet address
 */
export async function getUserByWallet(walletAddress: string): Promise<UserRecord | null> {
  try {
    const { data: walletData, error: walletError } = await supabase
      .from('user_wallets')
      .select('user_id')
      .eq('address', walletAddress)
      .single();

    if (walletError || !walletData) return null;

    return getUserById(walletData.user_id);
  } catch (error) {
    console.error('Error fetching user by wallet:', error);
    return null;
  }
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<UserRecord | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching user by email:', error);
    return null;
  }
}

/**
 * Get full user profile with all wallets and auth methods
 */
export async function getFullUserProfile(userId: string): Promise<FullUserProfile | null> {
  try {
    const [user, wallets, authMethods] = await Promise.all([
      getUserById(userId),
      getUserWallets(userId),
      getUserAuthMethods(userId),
    ]);

    if (!user) return null;

    const primaryWallet = wallets.find(w => w.is_primary) || null;

    return {
      ...user,
      wallets,
      auth_methods: authMethods,
      primary_wallet: primaryWallet,
    };
  } catch (error) {
    console.error('Error fetching full user profile:', error);
    return null;
  }
}

/**
 * Check if the database migration has been run
 */
export async function checkDatabaseMigrationStatus(): Promise<boolean> {
  try {
    console.log('🔍 Checking if users table exists...');
    
    // Try to query the users table
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Users table check failed - Full error:', error);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error details:', error.details);
      console.error('❌ Error hint:', error.hint);
      
      // Check if it's a "relation does not exist" error
      if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
        console.error('💡 The "users" table does not exist. Please run the migration SQL in Supabase Dashboard.');
        console.error('💡 See: migrations/README.md for instructions');
      }
      
      // Check if it's an RLS policy error
      if (error.code === '42501' || error.message?.includes('policy')) {
        console.error('💡 This might be a Row Level Security (RLS) policy issue.');
        console.error('💡 Try disabling RLS temporarily: ALTER TABLE users DISABLE ROW LEVEL SECURITY;');
      }
      
      return false;
    }
    
    console.log('✅ Users table exists - migration has been run');
    console.log('✅ Sample data:', data);
    return true;
  } catch (error) {
    console.error('❌ Exception checking migration status:', error);
    return false;
  }
}

/**
 * Create or update user (works with ZO users or any user with id/email)
 */
export async function upsertUser(
  user: { id: string; email?: string | { address?: string } | null },
  profileData?: Partial<UserRecord>
): Promise<UserRecord | null> {
  try {
    const userId = user.id;
    const userEmail = typeof user.email === 'string' 
      ? user.email 
      : (user.email as any)?.address || null;

    console.log('🔄 Upserting user:', {
      userId,
      email: userEmail
    });

    // Check if user already exists
    const existingUser = await getUserById(userId);
    const isNewUser = !existingUser;

    // Assign a default unicorn PFP for new users or existing users without a PFP
    let defaultPfp: string | null = null;
    if (isNewUser || (!existingUser?.pfp && !profileData?.pfp)) {
      defaultPfp = getUnicornForAddress(userId);
      console.log('🦄 Assigning default unicorn avatar:', defaultPfp);
    }

    const userData: Partial<UserRecord> = {
      id: userId,
      email: userEmail,
      last_seen: new Date().toISOString(),
      ...(defaultPfp && { pfp: defaultPfp }), // Only set pfp if we generated a default
      ...profileData, // profileData can override the default pfp if provided
    };

    console.log('📝 Attempting to upsert user:', userData);
    
    const { data, error } = await supabase
      .from('users')
      .upsert(userData, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('❌ Error saving user to Supabase:', error);
      console.error('❌ Error details:', { message: error.message, code: error.code, details: error.details, hint: error.hint });
      throw new Error(`Supabase error: ${error.message || 'Unknown error'}`);
    }

    if (!data) {
      console.error('❌ No data returned from upsert!');
      throw new Error('No data returned from Supabase upsert');
    }

    console.log('✅ Supabase returned data:', data);

    if (isNewUser) {
      console.log('✅ New user created with unicorn avatar:', defaultPfp);
    } else {
      console.log('✅ User updated successfully');
    }

    return data;
  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ Failed to save user:', error.message);
    } else {
      console.error('❌ Failed to save user:', error);
    }
    throw error;
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<UserRecord>
): Promise<UserRecord | null> {
  try {
    console.log('🔄 Updating user profile:', { userId, updates });
    
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw error;
    }
    
    console.log('✅ Profile updated successfully:', data);
    return data;
  } catch (error) {
    console.error('❌ Error updating user profile:', error);
    return null;
  }
}

// ============================================
// Wallet Operations
// ============================================

/**
 * Get all wallets for a user
 */
export async function getUserWallets(userId: string): Promise<UserWalletRecord[]> {
  try {
    const { data, error } = await supabase
      .from('user_wallets')
      .select('*')
      .eq('user_id', userId)
      .order('is_primary', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching user wallets:', error);
    return [];
  }
}

/**
 * Get primary wallet for a user
 */
export async function getPrimaryWallet(userId: string): Promise<UserWalletRecord | null> {
  try {
    const { data, error } = await supabase
      .from('user_wallets')
      .select('*')
      .eq('user_id', userId)
      .eq('is_primary', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching primary wallet:', error);
    return null;
  }
}

/**
 * Sync wallets from user object (legacy - not used with ZO auth)
 * @deprecated Not used with ZO authentication
 */
export async function syncUserWalletsFromPrivy(privyUser: any): Promise<void> {
  try {
    const walletAccounts = privyUser.linkedAccounts?.filter(
      (account: any) => account.type === 'wallet'
    ) || [];

    for (let i = 0; i < walletAccounts.length; i++) {
      const account = walletAccounts[i] as any; // Type assertion for wallet account
      
      await supabase
        .from('user_wallets')
        .upsert({
          user_id: privyUser.id,
          address: account.address || '',
          chain_type: account.chainType || 'ethereum',
          wallet_client: account.walletClientType || null,
          wallet_client_type: account.walletClientType || null,
          is_embedded: account.walletClientType === 'privy',
          is_primary: i === 0, // First wallet is primary
          is_verified: true, // Privy wallets are always verified
          verified_at: new Date().toISOString(),
          last_used_at: new Date().toISOString(),
        }, { 
          onConflict: 'address',
          ignoreDuplicates: false 
        });
    }
  } catch (error) {
    console.error('Error syncing wallets from Privy:', error);
  }
}

/**
 * Set primary wallet
 */
export async function setPrimaryWallet(
  userId: string,
  walletAddress: string
): Promise<boolean> {
  try {
    // Unset all primary flags
    await supabase
      .from('user_wallets')
      .update({ is_primary: false })
      .eq('user_id', userId);

    // Set new primary
    const { error } = await supabase
      .from('user_wallets')
      .update({ is_primary: true })
      .eq('user_id', userId)
      .eq('address', walletAddress);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error setting primary wallet:', error);
    return false;
  }
}

/**
 * Add wallet to user
 */
export async function addWalletToUser(
  userId: string,
  walletAddress: string,
  chainType: string = 'ethereum',
  isPrimary: boolean = false
): Promise<UserWalletRecord | null> {
  try {
    if (isPrimary) {
      await setPrimaryWallet(userId, walletAddress);
    }

    const { data, error } = await supabase
      .from('user_wallets')
      .upsert({
        user_id: userId,
        address: walletAddress,
        chain_type: chainType,
        is_primary: isPrimary,
        is_verified: true,
        verified_at: new Date().toISOString(),
        linked_at: new Date().toISOString(),
      }, { onConflict: 'address' })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding wallet to user:', error);
    return null;
  }
}

// ============================================
// Auth Methods Operations
// ============================================

/**
 * Get all auth methods for a user
 */
export async function getUserAuthMethods(userId: string): Promise<UserAuthMethodRecord[]> {
  try {
    const { data, error } = await supabase
      .from('user_auth_methods')
      .select('*')
      .eq('user_id', userId)
      .order('linked_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching user auth methods:', error);
    return [];
  }
}

/**
 * Sync auth methods from user object (legacy - not used with ZO auth)
 * @deprecated Not used with ZO authentication
 */
export async function syncUserAuthMethodsFromPrivy(privyUser: any): Promise<void> {
  try {
    const linkedAccounts = privyUser.linkedAccounts || [];

    for (const account of linkedAccounts) {
      const authType = account.type.replace('_oauth', '') as UserAuthMethodRecord['auth_type'];
      
      let identifier = '';
      let displayName = null;
      let oauthSubject = null;
      let oauthUsername = null;

      // Type guard and extract properties based on account type
      if (account.type === 'email') {
        identifier = (account as any).address || '';
      } else if (account.type === 'wallet') {
        identifier = (account as any).address || '';
      } else if (account.type.includes('oauth')) {
        // OAuth accounts (twitter, google, etc.)
        const oauthAccount = account as any;
        identifier = oauthAccount.subject || oauthAccount.email || '';
        oauthSubject = oauthAccount.subject || null;
        oauthUsername = oauthAccount.username || null;
        displayName = oauthAccount.name || oauthAccount.username || null;
      }

      await supabase
        .from('user_auth_methods')
        .upsert({
          user_id: privyUser.id,
          auth_type: authType,
          identifier,
          display_name: displayName,
          oauth_subject: oauthSubject,
          oauth_username: oauthUsername,
          is_verified: true, // Privy accounts are always verified
          verified_at: new Date().toISOString(),
          last_used_at: new Date().toISOString(),
        }, { 
          onConflict: 'user_id,auth_type,identifier',
          ignoreDuplicates: false 
        });
    }
  } catch (error) {
    console.error('Error syncing auth methods from Privy:', error);
  }
}

// ============================================
// Backward Compatibility Helpers
// ============================================

/**
 * Get user profile in old "members" format
 * This helps with backward compatibility
 */
export async function getUserInMembersFormat(userId: string) {
  try {
    const { data, error } = await supabase
      .from('members')  // This is now a VIEW
      .select('*')
      .eq('privy_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching user in members format:', error);
    return null;
  }
}

// ============================================
// Utility Functions
// ============================================

/**
 * Check if user exists by any identifier
 */
export async function userExists(
  identifier: string,
  identifierType: 'user_id' | 'email' | 'wallet' = 'user_id'
): Promise<boolean> {
  try {
    if (identifierType === 'user_id') {
      const user = await getUserById(identifier);
      return user !== null;
    } else if (identifierType === 'email') {
      const user = await getUserByEmail(identifier);
      return user !== null;
    } else if (identifierType === 'wallet') {
      const user = await getUserByWallet(identifier);
      return user !== null;
    }
    return false;
  } catch (error) {
    console.error('Error checking if user exists:', error);
    return false;
  }
}

/**
 * Get user's primary identifier (for display)
 */
export function getUserPrimaryIdentifier(user: FullUserProfile): string {
  if (user.name) return user.name;
  if (user.email) return user.email;
  if (user.primary_wallet) return `${user.primary_wallet.address.slice(0, 6)}...${user.primary_wallet.address.slice(-4)}`;
  return user.id.slice(0, 16) + '...';
}

