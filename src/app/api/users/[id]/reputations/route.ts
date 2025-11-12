import { NextRequest, NextResponse } from 'next/server';
import { getReputations, getReputationDescription, getReputationIcon } from '@/lib/reputationService';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    const reputations = await getReputations(userId);

    // Enhance with descriptions and icons
    const enhancedReputations = reputations.map(rep => ({
      trait: rep.trait,
      score: rep.score,
      level: rep.level,
      progress: rep.progress,
      description: getReputationDescription(rep.trait),
      icon: getReputationIcon(rep.trait),
      updated_at: rep.updated_at,
    }));

    return NextResponse.json({
      user_id: userId,
      reputations: enhancedReputations,
      total_score: reputations.reduce((sum, rep) => sum + rep.score, 0),
    });
  } catch (error) {
    console.error('Error fetching user reputations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

