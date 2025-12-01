import { supabase } from './supabase';
import { devLog } from '@/lib/logger';

export interface Reputation {
  id: string;
  user_id: string;
  trait: 'Builder' | 'Connector' | 'Explorer' | 'Pioneer';
  score: number;
  updated_at: string;
}

export interface ReputationWithLevel extends Reputation {
  level: number; // Calculated: Math.floor(score / 100) + 1
  progress: number; // Progress to next level (0-100)
}

/**
 * Get all reputations for a user
 */
export async function getReputations(userId: string): Promise<ReputationWithLevel[]> {
  try {
    const { data, error } = await supabase
      .from('user_reputations')
      .select('*')
      .eq('user_id', userId)
      .order('score', { ascending: false });

    if (error) {
      if (error.code === 'PGRST116' || error.code === '42P01') {
        devLog.log('ℹ️ No reputations found for user.');
        return getDefaultReputations(userId);
      }
      devLog.warn('⚠️ Error fetching reputations:', error.message);
      return getDefaultReputations(userId);
    }

    if (!data || data.length === 0) {
      return getDefaultReputations(userId);
    }

    // Calculate levels and progress
    return data.map((rep: any) => ({
      ...rep,
      level: Math.floor(rep.score / 100) + 1,
      progress: rep.score % 100,
    }));
  } catch (error) {
    devLog.warn('⚠️ Exception fetching reputations:', error);
    return getDefaultReputations(userId);
  }
}

/**
 * Get top N reputations for a user
 */
export async function getTopReputations(userId: string, limit: number = 2): Promise<ReputationWithLevel[]> {
  const reputations = await getReputations(userId);
  return reputations.slice(0, limit);
}

/**
 * Get a specific reputation trait for a user
 */
export async function getReputation(
  userId: string,
  trait: 'Builder' | 'Connector' | 'Explorer' | 'Pioneer'
): Promise<ReputationWithLevel | null> {
  try {
    const { data, error } = await supabase
      .from('user_reputations')
      .select('*')
      .eq('user_id', userId)
      .eq('trait', trait)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          id: '',
          user_id: userId,
          trait,
          score: 0,
          level: 1,
          progress: 0,
          updated_at: new Date().toISOString(),
        };
      }
      devLog.warn(`⚠️ Error fetching ${trait} reputation:`, error.message);
      return null;
    }

    return {
      ...data,
      level: Math.floor(data.score / 100) + 1,
      progress: data.score % 100,
    };
  } catch (error) {
    devLog.warn(`⚠️ Exception fetching ${trait} reputation:`, error);
    return null;
  }
}

/**
 * Update reputation (usually called by quest completion trigger, but can be called manually)
 */
export async function updateReputation(
  userId: string,
  trait: 'Builder' | 'Connector' | 'Explorer' | 'Pioneer',
  delta: number
): Promise<ReputationWithLevel | null> {
  try {
    // Check if reputation already exists
    const { data: existing } = await supabase
      .from('user_reputations')
      .select('score')
      .eq('user_id', userId)
      .eq('trait', trait)
      .single();
    
    let data;
    let error;
    
    if (existing) {
      // Update existing reputation
      const result = await supabase
        .from('user_reputations')
        .update({
          score: existing.score + delta,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('trait', trait)
        .select()
        .single();
      data = result.data;
      error = result.error;
    } else {
      // Insert new reputation
      const result = await supabase
        .from('user_reputations')
        .insert({
          user_id: userId,
          trait,
          score: delta,
        })
        .select()
        .single();
      data = result.data;
      error = result.error;
    }

    if (error) {
      devLog.warn(`⚠️ Error updating ${trait} reputation:`, error.message);
      return null;
    }

    if (!data) return null;

    return {
      ...data,
      level: Math.floor(data.score / 100) + 1,
      progress: data.score % 100,
    };
  } catch (error) {
    devLog.warn(`⚠️ Exception updating ${trait} reputation:`, error);
    return null;
  }
}

/**
 * Get total reputation score across all traits
 */
export async function getTotalReputationScore(userId: string): Promise<number> {
  const reputations = await getReputations(userId);
  return reputations.reduce((total, rep) => total + rep.score, 0);
}

/**
 * Get reputation leaderboard for a specific trait
 */
export async function getReputationLeaderboard(
  trait: 'Builder' | 'Connector' | 'Explorer' | 'Pioneer',
  limit: number = 10
): Promise<ReputationWithLevel[]> {
  try {
    const { data, error } = await supabase
      .from('user_reputations')
      .select(`
        *,
        users!inner(name, pfp)
      `)
      .eq('trait', trait)
      .order('score', { ascending: false })
      .limit(limit);

    if (error) {
      devLog.error(`Error fetching ${trait} leaderboard:`, error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map((rep: any) => ({
      ...rep,
      level: Math.floor(rep.score / 100) + 1,
      progress: rep.score % 100,
    }));
  } catch (error) {
    devLog.error(`Exception fetching ${trait} leaderboard:`, error);
    return [];
  }
}

/**
 * Default reputations for new users
 */
function getDefaultReputations(userId: string): ReputationWithLevel[] {
  const traits: Array<'Builder' | 'Connector' | 'Explorer' | 'Pioneer'> = ['Builder', 'Connector', 'Explorer', 'Pioneer'];
  return traits.map(trait => ({
    id: '',
    user_id: userId,
    trait,
    score: 0,
    level: 1,
    progress: 0,
    updated_at: new Date().toISOString(),
  }));
}

/**
 * Get reputation trait description
 */
export function getReputationDescription(trait: 'Builder' | 'Connector' | 'Explorer' | 'Pioneer'): string {
  const descriptions = {
    Builder: 'Create, contribute, and ship projects that move the ecosystem forward.',
    Connector: 'Bring people together, facilitate collaboration, and grow the community.',
    Explorer: 'Discover new places, attend events, and expand the network.',
    Pioneer: 'Lead the way, establish new nodes, and blaze new trails.',
  };
  return descriptions[trait];
}

/**
 * Get reputation trait icon
 */
export function getReputationIcon(trait: 'Builder' | 'Connector' | 'Explorer' | 'Pioneer'): string {
  const icons = {
    Builder: '🔨',
    Connector: '🤝',
    Explorer: '🧭',
    Pioneer: '🚀',
  };
  return icons[trait];
}

