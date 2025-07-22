import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://elvaqxadfewcsohrsswsi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsdmFxeGFkZmV3Y3NvaHJzd3NpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODkxMTUsImV4cCI6MjA2ODc2NTExNX0.OD_lY6X6ynXR0kj6xuZPoUApRmeRvt4wHuayCmtsN8Q';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test connection function
export async function pingSupabase() {
  try {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .limit(1);

    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
        console.log('✅ Supabase connection working! (Table "members" not found, but connection is valid)');
        console.log('💡 Create a "members" table in Supabase to test data retrieval');
        return true;
      } else {
        console.error('❌ Supabase connection error:', error);
        return false;
      }
    }

    console.log('✅ Supabase connection successful! Data:', data);
    return true;
  } catch (error) {
    console.error('❌ Failed to ping Supabase:', error);
    return false;
  }
}

// Member operations
export interface Member {
  id?: string;
  name: string;
  email: string;
  latitude?: number;
  longitude?: number;
  created_at?: string;
  last_seen?: string;
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
      .select('*');

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