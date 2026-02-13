// Server-side API route for user upsert operations
// Required because client-side code cannot access supabaseAdmin (service role key)

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { devLog } from '@/lib/logger';

export async function POST(request: NextRequest) {
    try {
        if (!supabaseAdmin) {
            devLog.error('❌ supabaseAdmin not available - SUPABASE_SERVICE_ROLE_KEY is missing');
            return NextResponse.json(
                { error: 'Server configuration error' },
                { status: 500 }
            );
        }

        const body = await request.json();
        const { userData, onConflict = 'id' } = body;

        if (!userData?.id) {
            return NextResponse.json(
                { error: 'userData with id is required' },
                { status: 400 }
            );
        }

        devLog.log('📝 [users/upsert] Upserting user:', { id: userData.id, name: userData.name });

        const { data, error } = await supabaseAdmin
            .from('users')
            .upsert(userData, { onConflict })
            .select()
            .single();

        if (error) {
            devLog.error('❌ [users/upsert] Supabase error:', error);
            return NextResponse.json(
                { error: error.message, code: error.code, details: error.details },
                { status: 400 }
            );
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        devLog.error('❌ [users/upsert] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

export async function PATCH(request: NextRequest) {
    try {
        if (!supabaseAdmin) {
            devLog.error('❌ supabaseAdmin not available - SUPABASE_SERVICE_ROLE_KEY is missing');
            return NextResponse.json(
                { error: 'Server configuration error' },
                { status: 500 }
            );
        }

        const body = await request.json();
        const { userId, updates } = body;

        if (!userId || !updates) {
            return NextResponse.json(
                { error: 'userId and updates are required' },
                { status: 400 }
            );
        }

        devLog.log('🔄 [users/upsert] Updating user:', { userId, updates });

        const { data, error } = await supabaseAdmin
            .from('users')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();

        if (error) {
            devLog.error('❌ [users/upsert] Supabase update error:', error);
            return NextResponse.json(
                { error: error.message, code: error.code, details: error.details },
                { status: 400 }
            );
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        devLog.error('❌ [users/upsert] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
