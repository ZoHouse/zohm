import { NextRequest, NextResponse } from 'next/server';
import { recordQuestScore, canUserCompleteQuest } from '@/lib/questService';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      user_id,
      quest_id,
      score,
      location,
      latitude,
      longitude,
      metadata,
    } = body;

    console.log('📥 Quest completion request:', { user_id, quest_id, score, location });

    // Validate required fields
    if (!user_id || !quest_id) {
      return NextResponse.json(
        { error: 'Missing required fields: user_id, quest_id' },
        { status: 400 }
      );
    }

    // Get quest details (lookup by slug, which is the human-readable identifier)
    const { data: quest, error: questError } = await supabase
      .from('quests')
      .select('*')
      .eq('slug', quest_id)
      .single();

    if (questError || !quest) {
      console.error('❌ Quest not found:', { quest_id, error: questError });
      return NextResponse.json(
        { error: 'Quest not found' },
        { status: 404 }
      );
    }

    console.log('✅ Quest found:', { id: quest.id, slug: quest.slug, cooldown_hours: quest.cooldown_hours });

    // Ensure user exists in users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', user_id)
      .single();

    if (userError || !user) {
      console.error('❌ User not found in database:', { user_id, error: userError });
      return NextResponse.json(
        { error: 'User not found. Please complete onboarding first.' },
        { status: 404 }
      );
    }

    console.log('✅ User verified:', { user_id });

    // Check cooldown if quest has one (use the actual UUID id, not slug)
    if (quest.cooldown_hours > 0) {
      const cooldownCheck = await canUserCompleteQuest(user_id, quest.id, quest.cooldown_hours);
      
      if (!cooldownCheck.canComplete) {
        return NextResponse.json(
          {
            error: 'Quest is on cooldown',
            next_available_at: cooldownCheck.nextAvailableAt,
          },
          { status: 429 } // Too Many Requests
        );
      }
    }

    // Parse rewards from quest
    const rewards = quest.rewards_breakdown || {};
    const tokensEarned = rewards.zo_tokens || quest.reward || 0;

    // Prepare metadata with reputation and items
    const fullMetadata = {
      ...metadata,
      reputation_delta: rewards.reputation || {},
      items_awarded: rewards.items || [],
    };

    // Record quest completion (use actual UUID id for database FK)
    const completion = await recordQuestScore(
      user_id,
      quest.id,  // Use the UUID id, not the slug
      score || 0,
      location || 'Unknown',
      tokensEarned,
      latitude,
      longitude,
      fullMetadata
    );

    if (!completion) {
      return NextResponse.json(
        { error: 'Failed to record quest completion' },
        { status: 500 }
      );
    }

    // Calculate next available time if cooldown exists
    let nextAvailableAt = null;
    if (quest.cooldown_hours > 0) {
      const completedAt = new Date(completion.completed_at);
      nextAvailableAt = new Date(
        completedAt.getTime() + quest.cooldown_hours * 60 * 60 * 1000
      ).toISOString();
    }

    // Return success response with rewards
    return NextResponse.json({
      success: true,
      completion_id: completion.id,
      rewards: {
        zo_tokens: tokensEarned,
        reputation: rewards.reputation || {},
        items: rewards.items || [],
      },
      next_available_at: nextAvailableAt,
    });
  } catch (error) {
    console.error('Error completing quest:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

