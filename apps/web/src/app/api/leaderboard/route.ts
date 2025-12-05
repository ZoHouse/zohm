import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { devLog } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope') || 'global'; // 'global' | 'local'
    const cityId = searchParams.get('cityId'); // Required for 'local' scope
    const limit = parseInt(searchParams.get('limit') || '10');

    // Query from leaderboards table (automatically updated by DB triggers)
    let query = supabase
      .from('leaderboards')
      .select(`
        user_id,
        zo_points,
        total_quests_completed,
        last_quest_completed_at,
        users!inner (
          name,
          pfp,
          city
        )
      `)
      .order('zo_points', { ascending: false })
      .limit(limit);

    // Apply local filtering if requested (filter by city from users table)
    if (scope === 'local' && cityId) {
      query = query.eq('users.city', cityId);
    }

    const { data: leaderboardData, error } = await query;

    if (error) {
      // Handle case where leaderboards table doesn't exist yet
      if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
        devLog.log('ℹ️ leaderboards table not found, returning empty leaderboard');
        return NextResponse.json({
          leaderboard: [],
          scope,
          city_id: cityId,
          total: 0,
        });
      }
      throw error;
    }

    // Format for frontend
    const leaderboard = leaderboardData?.map((entry: any, index) => ({
      rank: index + 1,
      user_id: entry.user_id,
      nickname: entry.users?.name || `Player ${entry.user_id.slice(0, 6)}`,
      avatar: entry.users?.pfp,
      zo_points: entry.zo_points || 0,
      total_quests_completed: entry.total_quests_completed || 0,
      city: entry.users?.city,
      last_completed_at: entry.last_quest_completed_at,
    })) || [];

    return NextResponse.json({
      leaderboard,
      scope,
      city_id: cityId,
      total: leaderboard.length,
    });
  } catch (error) {
    devLog.error('Failed to fetch leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}

