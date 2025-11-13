import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * POST /api/ar/scan
 * 
 * Records an AR marker scan and awards tokens/XP
 * 
 * Body:
 * - userId: string
 * - nodeId: string (optional - specific node location)
 * - timestamp: string (ISO timestamp)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, nodeId, timestamp } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Calculate rewards
    const baseTokens = 50;
    const baseXP = 10;
    
    // Bonus for scanning at specific nodes
    const nodeBonus = nodeId ? 20 : 0;

    const totalTokens = baseTokens + nodeBonus;
    const totalXP = baseXP + (nodeBonus / 2);

    // Record the AR scan event
    const { data: scanRecord, error: scanError } = await supabase
      .from('completed_quests')
      .insert({
        user_id: userId,
        quest_id: 'ar_scan', // Special quest ID for AR scans
        completed_at: timestamp || new Date().toISOString(),
        score: 100,
        tokens_earned: totalTokens,
        location: nodeId || 'unknown',
      })
      .select()
      .single();

    if (scanError) {
      console.error('Error recording AR scan:', scanError);
      // Don't fail the request if logging fails
    }

    // Update user's token balance
    const { data: currentUser } = await supabase
      .from('users')
      .select('zo_points')
      .eq('id', userId)
      .single();

    if (currentUser) {
      const newBalance = (currentUser.zo_points || 0) + totalTokens;
      
      await supabase
        .from('users')
        .update({ zo_points: newBalance })
        .eq('id', userId);
    }

    return NextResponse.json({
      success: true,
      tokens: totalTokens,
      xp: totalXP,
      nodeBonus: nodeBonus > 0,
      scanId: scanRecord?.id,
      message: nodeId 
        ? `AR scan complete! Bonus for scanning at node ${nodeId}` 
        : 'AR scan complete!',
    });

  } catch (error) {
    console.error('AR scan API error:', error);
    return NextResponse.json(
      { error: 'Failed to process AR scan' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ar/scan?userId={userId}
 * 
 * Retrieves user's AR scan history
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const { data: scans, error } = await supabase
      .from('completed_quests')
      .select('*')
      .eq('user_id', userId)
      .eq('quest_id', 'ar_scan')
      .order('completed_at', { ascending: false })
      .limit(50);

    if (error) {
      throw error;
    }

    const totalTokensEarned = scans?.reduce((sum, scan) => sum + (scan.tokens_earned || 0), 0) || 0;
    const totalScans = scans?.length || 0;

    return NextResponse.json({
      scans,
      stats: {
        totalScans,
        totalTokensEarned,
        lastScan: scans?.[0]?.completed_at || null,
      },
    });

  } catch (error) {
    console.error('AR scan history API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AR scan history' },
      { status: 500 }
    );
  }
}

