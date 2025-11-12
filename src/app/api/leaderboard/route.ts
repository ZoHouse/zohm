import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope') || 'global'; // 'global' | 'local'
    const cityId = searchParams.get('cityId'); // Required for 'local' scope
    const limit = parseInt(searchParams.get('limit') || '10');

    let query = supabase
      .from('users')
      .select(`
        id,
        nickname,
        avatar,
        zo_points,
        total_quests_completed,
        home_city_id,
        cities!users_home_city_id_fkey (
          id,
          name,
          country
        )
      `)
      .order('zo_points', { ascending: false })
      .limit(limit);

    // Apply local filtering if requested
    if (scope === 'local' && cityId) {
      query = query.eq('home_city_id', cityId);
    }

    const { data: leaderboardData, error } = await query;

    if (error) throw error;

    // Format for frontend
    const leaderboard = leaderboardData?.map((user, index) => {
      const city = Array.isArray(user.cities) ? user.cities[0] : user.cities;
      return {
        rank: index + 1,
        user_id: user.id,
        nickname: user.nickname || 'Anon',
        avatar: user.avatar,
        zo_points: user.zo_points || 0,
        total_quests_completed: user.total_quests_completed || 0,
        home_city: city ? {
          id: city.id,
          name: city.name,
          country: city.country,
        } : null,
      };
    }) || [];

    return NextResponse.json({
      leaderboard,
      scope,
      city_id: cityId,
      total: leaderboard.length,
    });
  } catch (error) {
    console.error('Failed to fetch leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}

