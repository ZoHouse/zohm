import { createClient } from '@supabase/supabase-js';

// Supabase configuration - Centralized configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test Supabase connection
export async function pingSupabase() {
  try {
    const { error } = await supabase
      .from('members')
      .select('count', { count: 'exact', head: true });

    if (error && error.code === 'PGRST116') {
      // Table doesn't exist, but connection is working
      console.log('✅ Supabase connection working! (Table "members" not found, but connection is valid)');
      console.log('💡 Create a "members" table in Supabase to test data retrieval');
      return true;
    } else if (error) {
      console.error('❌ Supabase connection error:', error);
      return false;
    } else {
      console.log('✅ Supabase connection successful!');
      return true;
    }
  } catch (error) {
    console.error('❌ Failed to ping Supabase:', error);
    return false;
  }
}

// Comprehensive table verification function
export async function verifyMembersTable() {
  try {
    console.log('🔍 Verifying members table setup...');
    
    // Test basic table access
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .limit(1);

    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
        console.log('❌ Members table does not exist');
        console.log('📝 Please create the members table using this SQL:');
        console.log(createMembersTableSQL);
        return { exists: false, error: 'Table does not exist' };
      } else {
        console.error('❌ Error accessing members table:', error);
        return { exists: false, error: error.message };
      }
    }

    console.log('✅ Members table exists and is accessible');
    
    // Test insert functionality with a dummy record
    const testWallet = 'test_wallet_' + Date.now();
    const { data: insertData, error: insertError } = await supabase
      .from('members')
      .insert({
        wallet: testWallet,
        role: 'Test',
        name: 'Test User',
        lat: 37.7749,
        lng: -122.4194
      })
      .select();

    if (insertError) {
      console.error('❌ Error inserting test record:', insertError);
      return { exists: true, canInsert: false, error: insertError.message };
    }

    console.log('✅ Test record inserted successfully:', insertData);

    // Clean up test record
    const { error: deleteError } = await supabase
      .from('members')
      .delete()
      .eq('wallet', testWallet);

    if (deleteError) {
      console.warn('⚠️ Could not clean up test record:', deleteError);
    } else {
      console.log('✅ Test record cleaned up');
    }

    // Get current member count
    const { count, error: countError } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true });

    if (!countError) {
      console.log(`📊 Current members count: ${count}`);
    }

    return { 
      exists: true, 
      canInsert: true, 
      canDelete: !deleteError,
      memberCount: count || 0,
      error: null 
    };

  } catch (error) {
    console.error('❌ Exception during table verification:', error);
    return { exists: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Member operations
export interface Member {
  id?: string;
  wallet: string;
  pfp?: string;                    // Profile picture URL
  name?: string;
  founder_nfts_count?: number;     // Number of Founder NFTs owned
  bio?: string;
  x_handle?: string;               // X (Twitter) handle
  x_connected?: boolean;           // Whether X is connected
  culture?: string;                // User's culture/community
  role: string;
  email?: string;
  lat?: number;
  lng?: number;
  latitude?: number;  // Legacy support
  longitude?: number; // Legacy support
  calendar_url?: string;           // Personal calendar URL
  created_at?: string;
  last_seen?: string;
}

// Wallet-based member operations for Quantum Sync
export async function upsertMemberByWallet(memberData: Omit<Member, 'id'>) {
  try {
    const { data, error } = await supabase
      .from('members')
      .upsert(memberData, { 
        onConflict: 'wallet',
        ignoreDuplicates: false 
      })
      .select();

    if (error) {
      console.error('Error upserting member:', error);
      return null;
    }

    console.log('✅ Member upserted:', data);
    return data;
  } catch (error) {
    console.error('Exception upserting member:', error);
    return null;
  }
}

export async function getMemberByWallet(wallet: string): Promise<Member | null> {
  try {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('wallet', wallet)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No member found
        return null;
      }
      console.error('Error fetching member by wallet:', error);
      return null;
    }

    console.log('✅ Member found:', data);
    return data;
  } catch (error) {
    console.error('Exception fetching member by wallet:', error);
    return null;
  }
}

export async function insertMember(memberData: Omit<Member, 'id'>) {
  try {
    const { data, error } = await supabase
      .from('members')
      .insert([memberData])
      .select();

    if (error) {
      console.error('Error inserting member:', error);
      return null;
    }

    console.log('✅ Member inserted:', data);
    return data;
  } catch (error) {
    console.error('Exception inserting member:', error);
    return null;
  }
}

export async function updateMemberLocation(memberId: string, latitude: number, longitude: number) {
  try {
    const { data, error } = await supabase
      .from('members')
      .update({ 
        latitude: latitude,
        longitude: longitude,
        lat: latitude,    // Store in both formats
        lng: longitude,   // Store in both formats
        last_seen: new Date().toISOString()
      })
      .eq('id', memberId)
      .select();

    if (error) {
      console.error('Error updating member location:', error);
      return null;
    }

    console.log('✅ Member location updated:', data);
    return data;
  } catch (error) {
    console.error('Exception updating member location:', error);
    return null;
  }
}

export async function getAllMembers(): Promise<Member[] | null> {
  try {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .order('last_seen', { ascending: false });

    if (error) {
      console.error('Error fetching members:', error);
      return null;
    }

    console.log('✅ Members fetched:', data);
    return data;
  } catch (error) {
    console.error('Exception fetching members:', error);
    return null;
  }
}

// Utility function to create members table (for setup purposes)
export const createMembersTableSQL = `
-- Add new columns to existing members table
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS pfp TEXT,
ADD COLUMN IF NOT EXISTS founder_nfts_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS x_handle TEXT,
ADD COLUMN IF NOT EXISTS x_connected BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS culture TEXT,
ADD COLUMN IF NOT EXISTS calendar_url TEXT;

-- Create additional indexes for new fields
CREATE INDEX IF NOT EXISTS idx_members_culture ON members(culture);
CREATE INDEX IF NOT EXISTS idx_members_x_handle ON members(x_handle);
CREATE INDEX IF NOT EXISTS idx_members_founder_nfts ON members(founder_nfts_count);

-- Update existing indexes
DROP INDEX IF EXISTS idx_members_wallet;
DROP INDEX IF EXISTS idx_members_location;
CREATE INDEX IF NOT EXISTS idx_members_wallet ON members(wallet);
CREATE INDEX IF NOT EXISTS idx_members_location ON members(lat, lng);
`; 

// Nodes schema and helpers
export type NodeType = 'hacker_space' | 'culture_house' | 'schelling_point' | 'flo_zone';
export type NodeStatus = 'active' | 'developing' | 'planning';

export interface PartnerNodeRecord {
  id: string;
  name: string;
  type: NodeType;
  description: string;
  city: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  website?: string | null;
  twitter?: string | null;
  features: string[]; // stored as array in Postgres
  status: NodeStatus;
  image?: string | null;
  contact_email?: string | null;
}

export const createNodesTableSQL = `
create table if not exists nodes (
  id text primary key,
  name text not null,
  type text not null check (type in ('hacker_space','culture_house','schelling_point','flo_zone')),
  description text not null,
  city text not null,
  country text not null,
  latitude double precision,
  longitude double precision,
  website text,
  twitter text,
  features text[] not null default '{}',
  status text not null check (status in ('active','developing','planning')),
  image text,
  contact_email text,
  inserted_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists idx_nodes_type on nodes(type);
create index if not exists idx_nodes_city_country on nodes(city, country);
`;

export async function getNodesFromDB(): Promise<PartnerNodeRecord[] | null> {
  try {
    const { data, error } = await supabase
      .from('nodes')
      .select('*')
      .order('name');
    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
        console.log('ℹ️ nodes table not found. Use createNodesTableSQL to set it up.');
        return [];
      }
      console.error('Error fetching nodes:', error);
      return null;
    }
    return (data as PartnerNodeRecord[]) || [];
  } catch (e) {
    console.error('Exception fetching nodes:', e);
    return null;
  }
}

// Leaderboards and Quests mock-safe helpers
export interface LeaderboardEntry {
  id: string;
  wallet: string;
  username: string;
  zo_points: number;
}

export interface QuestEntry {
  id: string;
  title: string;
  description: string;
  points: number;
}

export async function getLeaderboards(): Promise<LeaderboardEntry[] | null> {
  try {
    const { data, error } = await supabase
      .from('leaderboards')
      .select('*')
      .order('zo_points', { ascending: false });

    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
        console.log('ℹ️ leaderboards table not found. Using empty mock.');
        return [];
      }
      console.error('Error fetching leaderboards:', error);
      return null;
    }
    return (data as LeaderboardEntry[]) || [];
  } catch (e) {
    console.error('Exception fetching leaderboards:', e);
    return null;
  }
}

export async function getQuests(): Promise<QuestEntry[] | null> {
  try {
    const { data, error } = await supabase
      .from('quests')
      .select('*')
      .order('points', { ascending: false });

    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
        console.log('ℹ️ quests table not found. Using empty mock.');
        return [];
      }
      console.error('Error fetching quests:', error);
      return null;
    }
    return (data as QuestEntry[]) || [];
  } catch (e) {
    console.error('Exception fetching quests:', e);
    return null;
  }
}