import { supabase } from './supabase';
import { devLog } from '@/lib/logger';

// Quest completion interface (using completed_quests table)
export interface CompletedQuestRecord {
  id: string;
  user_id: string;
  quest_id: string;
  score?: number;
  location?: string;
  latitude?: number;
  longitude?: number;
  amount: number;
  metadata?: any;
  completed_at: string;
  created_at: string;
}

// User quest stats (aggregated from leaderboards)
export interface UserQuestStats {
  user_id: string;
  zo_points: number;
  total_quests_completed: number;
  last_quest_completed_at?: string;
}

// Leaderboard Entry
export interface LeaderboardPlayer {
  rank: number;
  user_id: string;
  nickname: string;
  avatar?: string;
  zo_points: number;
  total_quests_completed: number;
}

/**
 * Get user's quest stats from leaderboards table
 */
export async function getUserQuestStats(userId: string): Promise<UserQuestStats | null> {
  try {
    const { data, error } = await supabase
      .from('leaderboards')
      .select('user_id, zo_points, total_quests_completed, last_quest_completed_at')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No stats found, return default
        devLog.log('ℹ️ No quest stats found for user. They haven\'t completed any quests yet.');
        return {
          user_id: userId,
          zo_points: 0,
          total_quests_completed: 0,
        };
      }
      devLog.warn('⚠️ Error fetching user quest stats:', error.message || error);
      return {
        user_id: userId,
        zo_points: 0,
        total_quests_completed: 0,
      };
    }

    return data;
  } catch (error) {
    devLog.warn('⚠️ Exception fetching user quest stats:', error);
    return {
      user_id: userId,
      zo_points: 0,
      total_quests_completed: 0,
    };
  }
}

/**
 * Record a completed quest
 */
export async function recordQuestScore(
  userId: string,
  questId: string,
  score: number,
  location: string,
  tokensEarned: number,
  latitude?: number,
  longitude?: number,
  metadata?: any
): Promise<CompletedQuestRecord | null> {
  try {
    devLog.log('🔄 Recording quest score:', { userId, questId, score, tokensEarned, location });
    
    const { data, error } = await supabase
      .from('completed_quests')
      .insert({
        user_id: userId,
        quest_id: questId,
        score,
        location,
        latitude: latitude ?? null,  // Convert undefined to null
        longitude: longitude ?? null,  // Convert undefined to null
        amount: tokensEarned,
        metadata: metadata || {},
      })
      .select()
      .single();

    if (error) {
      devLog.error('❌ Supabase error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        devLog.log('ℹ️ completed_quests table does not exist. Score not persisted.');
        devLog.log('💡 Run migrations/002_foundation_individual_progression.sql');
        devLog.log('📊 Score:', score, '| Tokens:', tokensEarned, '| Location:', location);
        return null;
      }
      devLog.warn('⚠️ Error recording quest score:', error.message || error);
      return null;
    }

    devLog.log('✅ Quest score recorded:', data);
    return data as CompletedQuestRecord;
  } catch (error) {
    devLog.error('⚠️ Exception recording quest score:', error);
    return null;
  }
}

/**
 * Check if user can complete a quest (cooldown check)
 */
export async function canUserCompleteQuest(
  userId: string,
  questId: string,
  cooldownHours: number
): Promise<{ canComplete: boolean; nextAvailableAt?: string; lastCompletedAt?: string }> {
  try {
    // Get last completion for this quest
    const { data, error } = await supabase
      .from('completed_quests')
      .select('completed_at')
      .eq('user_id', userId)
      .eq('quest_id', questId)
      .order('completed_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No previous completion found
        return { canComplete: true };
      }
      devLog.warn('⚠️ Error checking quest cooldown:', error.message);
      // Allow completion on error
      return { canComplete: true };
    }

    const lastCompletedAt = new Date(data.completed_at);
    const now = new Date();
    const hoursSinceLastCompletion = (now.getTime() - lastCompletedAt.getTime()) / (1000 * 60 * 60);

    if (hoursSinceLastCompletion >= cooldownHours) {
      return {
        canComplete: true,
        lastCompletedAt: lastCompletedAt.toISOString(),
      };
    }

    const nextAvailableAt = new Date(lastCompletedAt.getTime() + cooldownHours * 60 * 60 * 1000);
    return {
      canComplete: false,
      nextAvailableAt: nextAvailableAt.toISOString(),
      lastCompletedAt: lastCompletedAt.toISOString(),
    };
  } catch (error) {
    devLog.warn('⚠️ Exception checking quest cooldown:', error);
    // Allow completion on exception
    return { canComplete: true };
  }
}

/**
 * Get time until next quest availability
 */
export async function getTimeUntilNextQuest(
  userId: string,
  questId: string,
  cooldownHours: number
): Promise<string> {
  try {
    const cooldownCheck = await canUserCompleteQuest(userId, questId, cooldownHours);

    if (cooldownCheck.canComplete) {
      return 'Available now';
    }

    if (!cooldownCheck.nextAvailableAt) {
      return 'Available now';
    }

    const nextAvailable = new Date(cooldownCheck.nextAvailableAt);
    const now = new Date();
    const diffMs = nextAvailable.getTime() - now.getTime();

    if (diffMs <= 0) {
      return 'Available now';
    }

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h : ${minutes}m`;
  } catch (error) {
    devLog.error('Exception calculating time until next quest:', error);
    return 'Available now';
  }
}

/**
 * Get quest leaderboard from leaderboards table
 */
export async function getQuestLeaderboard(limit: number = 10): Promise<LeaderboardPlayer[]> {
  try {
    const { data, error } = await supabase
      .from('leaderboards')
      .select(`
        user_id,
        zo_points,
        total_quests_completed,
        users!inner(name, pfp)
      `)
      .order('zo_points', { ascending: false })
      .limit(limit);

    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
        devLog.log('ℹ️ leaderboards table not found.');
        return [];
      }
      devLog.error('Error fetching leaderboard:', error);
      return [];
    }

    if (!data || data.length === 0) {
      devLog.log('ℹ️ No leaderboard data found.');
      return [];
    }

    // Format leaderboard with ranks
    return data.map((entry: any, index: number) => ({
      rank: index + 1,
      user_id: entry.user_id,
      nickname: entry.users?.name || `Player ${entry.user_id.slice(0, 6)}`,
      avatar: entry.users?.pfp,
      zo_points: entry.zo_points,
      total_quests_completed: entry.total_quests_completed || 0,
    }));
  } catch (error) {
    devLog.error('Exception fetching leaderboard:', error);
    return [];
  }
}

/**
 * Get user's quest history
 */
export async function getUserQuestHistory(
  userId: string,
  limit: number = 10
): Promise<CompletedQuestRecord[]> {
  try {
    const { data, error } = await supabase
      .from('completed_quests')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(limit);

    if (error) {
      if (error.code === 'PGRST116') {
        return [];
      }
      devLog.error('Error fetching quest history:', error);
      return [];
    }

    return (data as CompletedQuestRecord[]) || [];
  } catch (error) {
    devLog.error('Exception fetching quest history:', error);
    return [];
  }
}

