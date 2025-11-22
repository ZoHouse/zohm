import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const userId = searchParams.get('userId');
        const questSlug = searchParams.get('questId');

        if (!userId || !questSlug) {
            return NextResponse.json(
                { error: 'Missing required fields: userId, questId' },
                { status: 400 }
            );
        }

        // 1. Get quest details (id and cooldown)
        const { data: quest, error: questError } = await supabase
            .from('quests')
            .select('id, cooldown_hours')
            .eq('slug', questSlug)
            .single();

        if (questError || !quest) {
            console.error('❌ Quest not found:', { questSlug, error: questError });
            return NextResponse.json(
                { error: 'Quest not found' },
                { status: 404 }
            );
        }

        // 2. Get latest completion for this user
        const { data: lastCompletion, error: completionError } = await supabase
            .from('completed_quests')
            .select('completed_at')
            .eq('user_id', userId)
            .eq('quest_id', quest.id)
            .order('completed_at', { ascending: false })
            .limit(1)
            .single();

        // If no completion found, user can play
        if (!lastCompletion) {
            return NextResponse.json({
                canComplete: true,
                nextAvailableAt: null,
                lastCompletedAt: null,
            });
        }

        // 3. Calculate cooldown
        const completedAt = new Date(lastCompletion.completed_at);
        const cooldownHours = quest.cooldown_hours || 0;
        const nextAvailableAt = new Date(completedAt.getTime() + cooldownHours * 60 * 60 * 1000);
        const now = new Date();

        const canComplete = now >= nextAvailableAt;

        return NextResponse.json({
            canComplete,
            nextAvailableAt: nextAvailableAt.toISOString(),
            lastCompletedAt: completedAt.toISOString(),
        });

    } catch (error) {
        console.error('❌ Error checking quest status:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
