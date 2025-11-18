import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

/**
 * GET /api/vibe/:userId
 * 
 * Calculate Vibe Score based on Quantum Sync completion rate
 * 
 * Formula: (Completed Syncs / Expected Syncs) × 100
 * 
 * Where:
 * - Completed Syncs = Number of Game1111 quest completions
 * - Expected Syncs = Days since account creation × 2 (12hr cooldown = 2 syncs/day)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Get user creation date
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('created_at')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.error('Error fetching user:', userError);
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get all quantum sync completions (game-1111 quest)
    const { data: completions, error: completionsError } = await supabase
      .from('completed_quests')
      .select('id, completed_at, quest_id')
      .eq('user_id', userId)
      .eq('quest_id', 'game-1111')
      .order('completed_at', { ascending: false });

    if (completionsError) {
      console.error('Error fetching quest completions:', completionsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch quest data' },
        { status: 500 }
      );
    }

    const completedSyncs = completions?.length || 0;

    // Calculate expected syncs
    const accountCreatedAt = new Date(user.created_at);
    const now = new Date();
    const daysSinceCreation = Math.max(
      1,
      Math.ceil((now.getTime() - accountCreatedAt.getTime()) / (1000 * 60 * 60 * 24))
    );

    // With 12hr cooldown, user can do 2 syncs per day
    const expectedSyncs = daysSinceCreation * 2;

    // Calculate vibe score (0-100%)
    const vibeScore = Math.min(100, Math.round((completedSyncs / expectedSyncs) * 100));

    // Calculate breakdown for transparency
    const breakdown = {
      completedSyncs,
      expectedSyncs,
      missedSyncs: Math.max(0, expectedSyncs - completedSyncs),
      accountAgeDays: daysSinceCreation,
      completionRate: completedSyncs / expectedSyncs,
    };

    return NextResponse.json({
      success: true,
      data: {
        score: vibeScore,
        breakdown,
        timestamp: now.toISOString(),
        userId,
      },
    });
  } catch (error) {
    console.error('Vibe score calculation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

