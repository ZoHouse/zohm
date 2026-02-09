import { NextRequest, NextResponse } from 'next/server';
import { calculateDailyVibeScore, calculateWeeklyVibeScore } from '@/lib/metabase';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const nodeId = searchParams.get('nodeId');
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const period = searchParams.get('period') || 'daily'; // daily, weekly

    if (!nodeId) {
        return NextResponse.json(
            { error: 'nodeId is required' },
            { status: 400 }
        );
    }

    try {
        let vibeScore: number;

        if (period === 'weekly') {
            vibeScore = await calculateWeeklyVibeScore(nodeId);
        } else {
            vibeScore = await calculateDailyVibeScore(nodeId, date);
        }

        return NextResponse.json({
            success: true,
            data: {
                nodeId,
                date,
                period,
                vibeScore: Math.round(vibeScore),
                status: getVibeStatus(vibeScore),
                activityCount: Math.round((vibeScore / 100) * 4),
            },
        });
    } catch (error) {
        console.error('Vibe score calculation error:', error);
        return NextResponse.json(
            { error: 'Failed to calculate vibe score', details: String(error) },
            { status: 500 }
        );
    }
}

function getVibeStatus(score: number): string {
    if (score >= 100) return 'thriving';
    if (score >= 69) return 'healthy';
    if (score >= 50) return 'below-baseline';
    if (score >= 25) return 'warning';
    return 'critical';
}
