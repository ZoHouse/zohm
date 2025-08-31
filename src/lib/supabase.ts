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
  reward: number;
  status: string;
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
      .order('reward', { ascending: false });

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

// Calendar management
export interface CalendarSource {
  id: string;
  name: string;
  url: string;
  type: 'luma' | 'ical' | 'google' | 'outlook';
  is_active: boolean;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export const createCalendarsTableSQL = `
create table if not exists calendars (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  url text not null unique,
  type text not null check (type in ('luma','ical','google','outlook')),
  is_active boolean not null default true,
  description text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists idx_calendars_active on calendars(is_active);
create index if not exists idx_calendars_type on calendars(type);

-- Insert default calendars
insert into calendars (name, url, type, description) values
('Zo House Bangalore', '/api/calendar?id=cal-ZVonmjVxLk7F2oM', 'luma', 'Bangalore events calendar'),
('Zo House San Francisco', '/api/calendar?id=cal-3YNnBTToy9fnnjQ', 'luma', 'San Francisco events calendar'),
('ETHGlobal Events', '/api/calendar?id=cal-4BIGfE8WhTFQj9H', 'luma', 'Global ETH events and Delhi'),
('Singapore Token Events', '/api/calendar?id=cal-WfTOVDTJaAVqK3S', 'luma', 'Singapore blockchain and token events calendar'),
('ETH Delhi Side Events', 'https://api2.luma.com/ics/get?entity=calendar&id=cal-9YHHydCy2chZBAY', 'ical', 'ETH Delhi side events - India Blockchain Month, hackathons, coworking sessions, founder meetups'),
('Mumbai Events', 'https://api2.luma.com/ics/get?entity=discover&id=discplace-Q5hkYsjZs1ZDJcU', 'ical', 'Mumbai community events - running clubs, meetups, founder events'),
('Cursor Community', 'https://api2.luma.com/ics/get?entity=calendar&id=cal-61Cv6COs4g9GKw7', 'ical', 'Global Cursor AI editor meetups, workshops, and developer community events'),
('Singapore Events', 'https://api2.luma.com/ics/get?entity=discover&id=discplace-mUbtdfNjfWaLQ72', 'ical', 'Singapore tech, AI, blockchain, and startup events - TOKEN2049, SuiFest, founder meetups'),
('Taipei Blockchain Week', 'https://api2.luma.com/ics/get?entity=calendar&id=cal-8CC17T4kHupzdLP', 'ical', 'Taipei Blockchain Week - Major Asia blockchain conference with exclusive parties, VIP events, and networking'),
('Warsaw Blockchain Week', 'https://api2.luma.com/ics/get?entity=calendar&id=cal-B6JZWMLYZHCwPVD', 'ical', 'Warsaw Blockchain Week - European blockchain conference with ETHWarsaw, hackathons, and networking events'),
('Korea Blockchain Week', 'https://api2.luma.com/ics/get?entity=calendar&id=cal-RyyePFWFxRM2ly8', 'ical', 'Korea Blockchain Week - Seoul blockchain conference with exclusive yacht parties, builder cafes, and fitness meetups')
on conflict (url) do nothing;
`;

export async function getActiveCalendars(): Promise<CalendarSource[] | null> {
  try {
    const { data, error } = await supabase
      .from('calendars')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
        console.log('ℹ️ calendars table not found. Database may need setup.');
        return [];
      }
      console.error('Error fetching calendars:', error);
      return null;
    }
    return (data as CalendarSource[]) || [];
  } catch (e) {
    console.error('Exception fetching calendars:', e);
    return null;
  }
}

export async function addCalendar(calendar: Omit<CalendarSource, 'id' | 'created_at' | 'updated_at'>): Promise<CalendarSource | null> {
  try {
    const { data, error } = await supabase
      .from('calendars')
      .insert([calendar])
      .select()
      .single();

    if (error) {
      console.error('Error adding calendar:', error);
      return null;
    }

    console.log('✅ Calendar added:', data);
    return data;
  } catch (error) {
    console.error('Exception adding calendar:', error);
    return null;
  }
}

export async function updateCalendarStatus(id: string, isActive: boolean): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('calendars')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error updating calendar status:', error);
      return false;
    }

    console.log(`✅ Calendar ${id} status updated to ${isActive ? 'active' : 'inactive'}`);
    return true;
  } catch (error) {
    console.error('Exception updating calendar status:', error);
    return false;
  }
}