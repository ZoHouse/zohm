// apps/web/src/app/api/debug/avatar-test/route.ts
// Debug API route to test avatar generation for existing user
// IMPORTANT: This is for development/testing only - remove in production

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabase } from '@/lib/supabase';
import { getProfile, updateProfile } from '@/lib/zo-api/profile';
import { devLog } from '@/lib/logger';

// Use admin client if available, otherwise fall back to regular client
const db = supabaseAdmin || supabase;

export async function GET(request: NextRequest) {
    // Get userId from query params
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    try {
        // Fetch user from database
        const { data: user, error } = await db
            .from('users')
            .select('id, name, pfp, body_type, zo_user_id, zo_token, zo_device_id, zo_device_secret, zo_synced_at')
            .eq('id', userId)
            .single();

        if (error || !user) {
            return NextResponse.json({ error: 'User not found', details: error }, { status: 404 });
        }

        // Check if we have credentials to call ZO API
        const hasCredentials = !!(user.zo_token && user.zo_device_id && user.zo_device_secret);

        // If we have credentials, fetch profile from ZO API
        let zoProfile = null;
        if (hasCredentials) {
            try {
                const result = await getProfile(user.zo_token, userId, {
                    deviceId: user.zo_device_id,
                    deviceSecret: user.zo_device_secret,
                });
                if (result.success) {
                    zoProfile = {
                        hasAvatar: !!result.profile?.avatar?.image,
                        avatarStatus: result.profile?.avatar?.status || 'unknown',
                        avatarUrl: result.profile?.avatar?.image || null,
                        bodyType: result.profile?.body_type,
                        firstName: result.profile?.first_name,
                    };
                } else {
                    zoProfile = { error: result.error };
                }
            } catch (e: any) {
                zoProfile = { error: e.message };
            }
        }

        return NextResponse.json({
            user: {
                id: user.id,
                name: user.name,
                pfp: user.pfp,
                body_type: user.body_type,
                zo_user_id: user.zo_user_id,
                zo_synced_at: user.zo_synced_at,
                hasCredentials,
            },
            zoApiProfile: zoProfile,
            diagnosis: {
                hasPfpInDatabase: !!user.pfp,
                isUnicornPfp: user.pfp?.includes('unicorn') || false,
                hasZoCredentials: hasCredentials,
                hasAvatarFromZoApi: zoProfile?.hasAvatar || false,
                avatarStatusFromZoApi: zoProfile?.avatarStatus || 'no_credentials',
            },
        });
    } catch (error: any) {
        devLog.error('❌ [Debug Avatar Test]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Trigger avatar regeneration for existing user
export async function POST(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const bodyType = searchParams.get('bodyType') as 'bro' | 'bae' | null;

    if (!userId) {
        return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    if (!bodyType || !['bro', 'bae'].includes(bodyType)) {
        return NextResponse.json({ error: 'bodyType must be "bro" or "bae"' }, { status: 400 });
    }

    try {
        // Fetch user credentials
        const { data: user, error } = await db
            .from('users')
            .select('zo_token, zo_device_id, zo_device_secret')
            .eq('id', userId)
            .single();

        if (error || !user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (!user.zo_token || !user.zo_device_id || !user.zo_device_secret) {
            return NextResponse.json({
                error: 'User missing ZO credentials',
                details: {
                    hasToken: !!user.zo_token,
                    hasDeviceId: !!user.zo_device_id,
                    hasDeviceSecret: !!user.zo_device_secret,
                }
            }, { status: 400 });
        }

        devLog.log('🧪 [Debug] Triggering avatar generation for user:', userId, 'with bodyType:', bodyType);

        // Call ZO API to trigger avatar generation
        const result = await updateProfile(
            user.zo_token,
            { body_type: bodyType },
            userId,
            { deviceId: user.zo_device_id, deviceSecret: user.zo_device_secret }
        );

        if (!result.success) {
            return NextResponse.json({
                error: 'Failed to trigger avatar generation',
                details: result.error,
            }, { status: 500 });
        }

        // Poll for avatar (simplified - just check once after 5 seconds)
        const avatarResponse = result.profile?.avatar;

        return NextResponse.json({
            success: true,
            message: 'Avatar generation triggered',
            avatarStatus: avatarResponse?.status || 'pending',
            avatarImage: avatarResponse?.image || null,
            note: 'Avatar generation takes 10-60 seconds. Poll GET /api/debug/avatar-test?userId=xxx to check status.',
        });
    } catch (error: any) {
        devLog.error('❌ [Debug Avatar Test]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
