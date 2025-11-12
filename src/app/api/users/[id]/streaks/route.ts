import { NextRequest, NextResponse } from 'next/server';
import { getStreaks, getStreakIcon, getStreakName, isStreakActive, getStreakStatus } from '@/lib/streakService';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    const streaks = await getStreaks(userId);

    // Enhance with display info and status
    const enhancedStreaks = streaks.map(streak => ({
      type: streak.streak_type,
      count: streak.count,
      longest: streak.longest_streak,
      last_action_at: streak.last_action_at,
      is_active: isStreakActive(streak),
      status: getStreakStatus(streak),
      icon: getStreakIcon(streak.streak_type),
      name: getStreakName(streak.streak_type),
    }));

    return NextResponse.json({
      user_id: userId,
      streaks: enhancedStreaks,
      total_active: enhancedStreaks.filter(s => s.is_active).length,
    });
  } catch (error) {
    console.error('Error fetching user streaks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

