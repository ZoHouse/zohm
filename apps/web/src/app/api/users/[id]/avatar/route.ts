// apps/web/src/app/api/users/[id]/avatar/route.ts
// API route to update user avatar (uses admin client to bypass RLS)

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { devLog } from '@/lib/logger';

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id: userId } = await context.params;
        const { avatarUrl } = await request.json();

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        if (!avatarUrl) {
            return NextResponse.json(
                { error: 'Avatar URL is required' },
                { status: 400 }
            );
        }

        // Validate avatarUrl is a valid URL
        if (!avatarUrl.startsWith('http')) {
            return NextResponse.json(
                { error: 'Invalid avatar URL format' },
                { status: 400 }
            );
        }

        // Check if admin client is available
        if (!supabaseAdmin) {
            devLog.error('❌ [Avatar API] supabaseAdmin not available');
            return NextResponse.json(
                { error: 'Database admin access not available' },
                { status: 500 }
            );
        }

        devLog.log('📸 [Avatar API] Updating avatar for user:', userId);
        devLog.log('📸 [Avatar API] New avatar URL:', avatarUrl.substring(0, 50) + '...');

        // Update the user's avatar using admin client (bypasses RLS)
        const { error: updateError } = await supabaseAdmin
            .from('users')
            .update({
                pfp: avatarUrl,
                zo_synced_at: new Date().toISOString(),
                zo_sync_status: 'synced',
                updated_at: new Date().toISOString(),
            })
            .eq('id', userId);

        if (updateError) {
            devLog.error('❌ [Avatar API] Failed to update avatar:', {
                error: updateError,
                code: updateError.code,
                message: updateError.message,
            });
            return NextResponse.json(
                { error: updateError.message || 'Failed to update avatar' },
                { status: 500 }
            );
        }

        devLog.log('✅ [Avatar API] Avatar updated successfully');

        return NextResponse.json({
            success: true,
            message: 'Avatar updated successfully',
        });

    } catch (error: any) {
        devLog.error('❌ [Avatar API] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
