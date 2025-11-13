import { supabase } from './supabase';

export interface Streak {
  id: string;
  user_id: string;
  streak_type: 'login' | 'quest' | 'event' | 'checkin';
  count: number;
  last_action_at: string;
  longest_streak: number;
  created_at: string;
}

/**
 * Get all streaks for a user
 */
export async function getStreaks(userId: string): Promise<Streak[]> {
  try {
    const { data, error } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', userId)
      .order('count', { ascending: false });

    if (error) {
      if (error.code === 'PGRST116' || error.code === '42P01') {
        console.log('ℹ️ No streaks found for user.');
        return [];
      }
      console.warn('⚠️ Error fetching streaks:', error.message);
      return [];
    }

    return (data as Streak[]) || [];
  } catch (error) {
    console.warn('⚠️ Exception fetching streaks:', error);
    return [];
  }
}

/**
 * Get a specific streak for a user
 */
export async function getStreak(
  userId: string,
  type: 'login' | 'quest' | 'event' | 'checkin'
): Promise<Streak | null> {
  try {
    const { data, error } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', userId)
      .eq('streak_type', type)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          id: '',
          user_id: userId,
          streak_type: type,
          count: 0,
          last_action_at: '',
          longest_streak: 0,
          created_at: new Date().toISOString(),
        };
      }
      console.warn(`⚠️ Error fetching ${type} streak:`, error.message);
      return null;
    }

    return data as Streak;
  } catch (error) {
    console.warn(`⚠️ Exception fetching ${type} streak:`, error);
    return null;
  }
}

/**
 * Update login streak (call this when user logs in)
 */
export async function updateLoginStreak(userId: string): Promise<Streak | null> {
  return updateStreak(userId, 'login');
}

/**
 * Update any streak type
 * Note: Quest and checkin streaks are auto-updated by triggers,
 * but this function is available for manual updates if needed
 */
export async function updateStreak(
  userId: string,
  type: 'login' | 'quest' | 'event' | 'checkin'
): Promise<Streak | null> {
  try {
    const now = new Date();
    
    // Get existing streak
    const existingStreak = await getStreak(userId, type);

    if (!existingStreak || !existingStreak.last_action_at) {
      // First action - create new streak
      const { data, error } = await supabase
        .from('user_streaks')
        .insert({
          user_id: userId,
          streak_type: type,
          count: 1,
          last_action_at: now.toISOString(),
          longest_streak: 1,
        })
        .select()
        .single();

      if (error) {
        console.warn(`⚠️ Error creating ${type} streak:`, error.message);
        return null;
      }

      return data as Streak;
    }

    // Check if this is a new day
    const lastAction = new Date(existingStreak.last_action_at);
    const lastActionDate = new Date(lastAction.getFullYear(), lastAction.getMonth(), lastAction.getDate());
    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayDate = new Date(todayDate);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);

    let newCount = existingStreak.count;

    if (lastActionDate.getTime() === yesterdayDate.getTime()) {
      // Streak continues
      newCount = existingStreak.count + 1;
    } else if (lastActionDate.getTime() === todayDate.getTime()) {
      // Same day, no change
      newCount = existingStreak.count;
    } else {
      // Streak broken, reset to 1
      newCount = 1;
    }

    const newLongestStreak = Math.max(existingStreak.longest_streak, newCount);

    const { data, error } = await supabase
      .from('user_streaks')
      .update({
        count: newCount,
        last_action_at: now.toISOString(),
        longest_streak: newLongestStreak,
      })
      .eq('user_id', userId)
      .eq('streak_type', type)
      .select()
      .single();

    if (error) {
      console.warn(`⚠️ Error updating ${type} streak:`, error.message);
      return null;
    }

    return data as Streak;
  } catch (error) {
    console.warn(`⚠️ Exception updating ${type} streak:`, error);
    return null;
  }
}

/**
 * Check if streak is still active (last action was yesterday or today)
 */
export function isStreakActive(streak: Streak): boolean {
  if (!streak.last_action_at) return false;

  const lastAction = new Date(streak.last_action_at);
  const now = new Date();
  
  const lastActionDate = new Date(lastAction.getFullYear(), lastAction.getMonth(), lastAction.getDate());
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayDate = new Date(todayDate);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);

  return (
    lastActionDate.getTime() === todayDate.getTime() ||
    lastActionDate.getTime() === yesterdayDate.getTime()
  );
}

/**
 * Get streak status message
 */
export function getStreakStatus(streak: Streak): string {
  if (streak.count === 0) {
    return `Start your ${streak.streak_type} streak!`;
  }

  if (isStreakActive(streak)) {
    return `🔥 ${streak.count} day streak!`;
  }

  return `Streak ended at ${streak.count} days. Best: ${streak.longest_streak} days.`;
}

/**
 * Get streak leaderboard for a specific type
 */
export async function getStreakLeaderboard(
  type: 'login' | 'quest' | 'event' | 'checkin',
  limit: number = 10
): Promise<Streak[]> {
  try {
    const { data, error } = await supabase
      .from('user_streaks')
      .select(`
        *,
        users!inner(name, pfp)
      `)
      .eq('streak_type', type)
      .order('count', { ascending: false })
      .limit(limit);

    if (error) {
      console.error(`Error fetching ${type} streak leaderboard:`, error);
      return [];
    }

    return (data as Streak[]) || [];
  } catch (error) {
    console.error(`Exception fetching ${type} streak leaderboard:`, error);
    return [];
  }
}

/**
 * Get streak type icon
 */
export function getStreakIcon(type: 'login' | 'quest' | 'event' | 'checkin'): string {
  const icons = {
    login: '⚡',
    quest: '🎯',
    event: '🎉',
    checkin: '📍',
  };
  return icons[type];
}

/**
 * Get streak type name
 */
export function getStreakName(type: 'login' | 'quest' | 'event' | 'checkin'): string {
  const names = {
    login: 'Login Streak',
    quest: 'Quest Streak',
    event: 'Event Streak',
    checkin: 'Check-in Streak',
  };
  return names[type];
}


