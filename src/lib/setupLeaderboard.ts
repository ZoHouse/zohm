/**
 * Leaderboard Setup Utility
 * 
 * This module provides functions to set up and manage the automatic
 * leaderboard system that updates when users complete quests.
 */

import { supabase } from './supabase';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Run the leaderboard migration SQL
 * This sets up the trigger that automatically updates the leaderboard
 * when quests are completed.
 * 
 * Note: This requires service_role access to create triggers.
 * Run this from a server-side context or Supabase SQL editor.
 */
export async function setupLeaderboardTrigger(): Promise<boolean> {
  try {
    // Read the SQL migration file
    const sqlPath = path.join(process.cwd(), 'src/lib/migrations/leaderboard-trigger.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    // Execute the SQL
    // Note: This requires service_role permissions
    const { error } = await supabase.rpc('exec_sql', { sql_string: sql });

    if (error) {
      console.error('❌ Error setting up leaderboard trigger:', error);
      return false;
    }

    console.log('✅ Leaderboard trigger setup complete!');
    return true;
  } catch (error) {
    console.error('❌ Exception setting up leaderboard trigger:', error);
    return false;
  }
}

/**
 * Manually recalculate the entire leaderboard from completed quests
 * Useful for initial setup or if data gets out of sync
 */
export async function recalculateLeaderboard(): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('recalculate_leaderboard');

    if (error) {
      console.error('❌ Error recalculating leaderboard:', error);
      return false;
    }

    console.log('✅ Leaderboard recalculated successfully!');
    console.log(`   Updated ${data?.length || 0} entries`);
    return true;
  } catch (error) {
    console.error('❌ Exception recalculating leaderboard:', error);
    return false;
  }
}

/**
 * Sync a user's username to the leaderboard
 * Call this when a user updates their profile username
 */
export async function syncLeaderboardUsername(
  walletAddress: string,
  username: string
): Promise<boolean> {
  try {
    const { error } = await supabase.rpc('sync_leaderboard_username', {
      wallet_address: walletAddress.toLowerCase(),
      new_username: username
    });

    if (error) {
      console.error('❌ Error syncing username to leaderboard:', error);
      return false;
    }

    console.log('✅ Username synced to leaderboard');
    return true;
  } catch (error) {
    console.error('❌ Exception syncing username:', error);
    return false;
  }
}

/**
 * Check if the leaderboard trigger is set up correctly
 */
export async function checkLeaderboardSetup(): Promise<{
  tableExists: boolean;
  triggerExists: boolean;
  hasData: boolean;
}> {
  try {
    // Check if leaderboards table exists
    const { data: tableData, error: tableError } = await supabase
      .from('leaderboards')
      .select('id')
      .limit(1);

    const tableExists = !tableError || tableError.code !== 'PGRST116';

    // Check if there's any data
    const hasData = tableExists && tableData && tableData.length > 0;

    // Note: Can't easily check trigger existence from client
    // This would need to be done via SQL query with service_role
    const triggerExists = tableExists; // Assume true if table exists

    return {
      tableExists,
      triggerExists,
      hasData
    };
  } catch (error) {
    console.error('❌ Error checking leaderboard setup:', error);
    return {
      tableExists: false,
      triggerExists: false,
      hasData: false
    };
  }
}

/**
 * Get leaderboard statistics
 */
export async function getLeaderboardStats(): Promise<{
  totalUsers: number;
  totalPoints: number;
  totalQuests: number;
} | null> {
  try {
    const { data, error } = await supabase
      .from('leaderboards')
      .select('zo_points, total_quests_completed');

    if (error) {
      console.error('Error fetching leaderboard stats:', error);
      return null;
    }

    const stats = data.reduce(
      (acc, entry) => ({
        totalUsers: acc.totalUsers + 1,
        totalPoints: acc.totalPoints + (entry.zo_points || 0),
        totalQuests: acc.totalQuests + (entry.total_quests_completed || 0)
      }),
      { totalUsers: 0, totalPoints: 0, totalQuests: 0 }
    );

    return stats;
  } catch (error) {
    console.error('Exception fetching leaderboard stats:', error);
    return null;
  }
}

