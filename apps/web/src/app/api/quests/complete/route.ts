import { NextRequest, NextResponse } from 'next/server';
import { recordQuestScore, canUserCompleteQuest } from '@/lib/questService';
import { supabase } from '@/lib/supabase';
import { devLog } from '@/lib/logger';

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

    devLog.log('📥 Quest completion request:', { user_id, quest_id, score, location });

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
      devLog.error('❌ Quest not found:', { quest_id, error: questError });
      return NextResponse.json(
        { error: 'Quest not found' },
        { status: 404 }
      );
    }

    devLog.log('✅ Quest found:', { id: quest.id, slug: quest.slug, cooldown_hours: quest.cooldown_hours });

    // Ensure user exists in users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', user_id)
      .single();

    if (userError || !user) {
      devLog.error('❌ User not found in database:', { user_id, error: userError });
      return NextResponse.json(
        { error: 'User not found. Please complete onboarding first.' },
        { status: 404 }
      );
    }

    devLog.log('✅ User verified:', { user_id });

    // ============================================
    // SECURITY: Server-Side Token Calculation
    // ============================================
    // NEVER trust client-side token calculation!
    // Recalculate based on score to prevent tampering.
    
    let tokensEarned = 0;
    
    // Parse rewards from quest
    const rewards = quest.rewards_breakdown || {};
    
    // Check if this is a dynamic reward quest (game1111)
    if (rewards.dynamic === true && score !== undefined) {
      // Game1111 dynamic formula: Base 50 + proximity bonus (max 150)
      // Score range: 0-9999, target: 1111
      const distance = Math.abs(score - 1111);
      const proximityFactor = Math.max(0, 1 - (distance / 1111));
      tokensEarned = Math.round(50 + (proximityFactor * 150));
      
      devLog.log(`💰 Server token calculation: score=${score}, distance=${distance}, proximity=${proximityFactor.toFixed(4)}, tokens=${tokensEarned}`);
    } else {
      // Fixed reward quest
      tokensEarned = rewards.zo_tokens || quest.reward || 0;
    }
    
    // Validate token range for game1111
    if (quest.slug === 'game-1111') {
      if (tokensEarned < 50 || tokensEarned > 200) {
        devLog.error('❌ Invalid token calculation:', { score, tokensEarned });
        tokensEarned = Math.max(50, Math.min(200, tokensEarned)); // Clamp to valid range
      }
    }

    // Prepare metadata with reputation and items
    const fullMetadata = {
      ...metadata,
      reputation_delta: rewards.reputation || {},
      items_awarded: rewards.items || [],
      server_calculated_tokens: tokensEarned, // Audit trail
      client_submitted_tokens: metadata?.reward_zo || null, // For comparison
    };
    
    // ============================================
    // ANTI-TAMPERING: Detect token manipulation attempts
    // ============================================
    if (metadata?.reward_zo && rewards.dynamic === true) {
      const clientTokens = metadata.reward_zo;
      const difference = Math.abs(clientTokens - tokensEarned);
      
      // Allow 1 token difference due to rounding, anything more is suspicious
      if (difference > 1) {
        devLog.warn('🚨 SECURITY ALERT: Token mismatch detected!', {
          user_id,
          quest_id: quest.slug,
          score,
          client_submitted: clientTokens,
          server_calculated: tokensEarned,
          difference,
          timestamp: new Date().toISOString(),
        });
        
        // TODO: Increment abuse counter for this user
        // If abuse_count > 3, flag account for review
      }
    }

    // ============================================
    // P0-6: Atomic Quest Completion with Cooldown Check
    // ============================================
    // Use database function to atomically check cooldown and insert completion
    // This prevents race conditions where two simultaneous requests could both pass
    // the cooldown check and create duplicate completions.
    const { data: result, error: completionError } = await supabase
      .rpc('complete_quest_atomic', {
        p_user_id: user_id,
        p_quest_id: quest.id,
        p_cooldown_hours: quest.cooldown_hours || 0,
        p_score: score || 0,
        p_location: location || 'Unknown',
        p_latitude: latitude || null,
        p_longitude: longitude || null,
        p_amount: tokensEarned,
        p_metadata: fullMetadata,
      });

    if (completionError) {
      devLog.error('❌ Error in atomic quest completion:', completionError);
      return NextResponse.json(
        { error: 'Failed to complete quest' },
        { status: 500 }
      );
    }

    // Check result from atomic function
    const atomicResult = result[0];
    
    if (!atomicResult.success) {
      if (atomicResult.error_code === 'COOLDOWN_ACTIVE') {
        // Cooldown not expired, return 429
        return NextResponse.json(
          {
            error: 'Quest is on cooldown',
            next_available_at: atomicResult.next_available_at,
          },
          { status: 429 } // Too Many Requests
        );
      }
      
      // Other error
      return NextResponse.json(
        { error: 'Failed to record quest completion' },
        { status: 500 }
      );
    }

    // Success! Calculate next available time
    let nextAvailableAt = null;
    if (quest.cooldown_hours > 0) {
      const now = new Date();
      nextAvailableAt = new Date(
        now.getTime() + quest.cooldown_hours * 60 * 60 * 1000
      ).toISOString();
    }

    // Return success response with rewards
    return NextResponse.json({
      success: true,
      completion_id: atomicResult.completion_id,
      rewards: {
        zo_tokens: tokensEarned,
        reputation: rewards.reputation || {},
        items: rewards.items || [],
      },
      next_available_at: nextAvailableAt,
    });
  } catch (error) {
    devLog.error('Error completing quest:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

