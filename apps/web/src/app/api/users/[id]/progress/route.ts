import { NextRequest, NextResponse } from 'next/server';
import { getUserQuestStats } from '@/lib/questService';
import { getReputations, getTotalReputationScore } from '@/lib/reputationService';
import { getStreaks } from '@/lib/streakService';
import { getInventorySummary } from '@/lib/inventoryService';
import { supabase } from '@/lib/supabase';
import { devLog } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    // Fetch all user data in parallel
    const [questStats, reputations, streaks, inventorySummary, user] = await Promise.all([
      getUserQuestStats(userId),
      getReputations(userId),
      getStreaks(userId),
      getInventorySummary(userId),
      // Get user basic info
      supabase
        .from('users')
        .select('id, name, pfp, zo_balance, user_tier, email')
        .eq('id', userId)
        .single()
    ]);

    if (user.error || !user.data) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Construct full progress response
    const progress = {
      user: {
        id: user.data.id,
        name: user.data.name,
        pfp: user.data.pfp,
        email: user.data.email,
        zo_balance: user.data.zo_balance || 0,
        user_tier: user.data.user_tier || 'prospect',
      },
      quests: {
        zo_points: questStats?.zo_points || 0,
        total_completed: questStats?.total_quests_completed || 0,
        last_completed_at: questStats?.last_quest_completed_at,
      },
      reputations: reputations.map(rep => ({
        trait: rep.trait,
        score: rep.score,
        level: rep.level,
        progress: rep.progress,
      })),
      total_reputation_score: await getTotalReputationScore(userId),
      streaks: streaks.map(streak => ({
        type: streak.streak_type,
        count: streak.count,
        longest: streak.longest_streak,
        last_action_at: streak.last_action_at,
      })),
      inventory: inventorySummary,
    };

    return NextResponse.json(progress);
  } catch (error) {
    devLog.error('Error fetching user progress:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

