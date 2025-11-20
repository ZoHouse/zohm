// apps/web/src/app/api/zo/auth/link-account/route.ts
// Link ZO phone identity to existing Supabase user (Privy or ZO)

import { NextRequest, NextResponse } from 'next/server';
import { verifyOTP } from '@/lib/zo-api/auth';
import { syncZoProfileToSupabase } from '@/lib/zo-api/sync';
import { generateAvatar } from '@/lib/zo-api/avatar';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, countryCode, phoneNumber, otp, bodyType } = body;

    // Validate input
    if (!userId || !countryCode || !phoneNumber || !otp) {
      return NextResponse.json(
        { error: 'User ID, country code, phone number, and OTP are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 1. Verify user exists in Supabase
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !existingUser) {
      console.error('User not found:', userError);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 2. Check if this phone is already linked to another account
    const { data: existingPhoneUser } = await supabase
      .from('users')
      .select('id, zo_user_id')
      .eq('phone', phoneNumber)
      .neq('id', userId)
      .single();

    if (existingPhoneUser) {
      return NextResponse.json(
        {
          error: 'PHONE_ALREADY_LINKED',
          message: 'This phone number is already linked to another account',
        },
        { status: 409 }
      );
    }

    // 3. Verify OTP with ZO API
    const { success, data, error: otpError } = await verifyOTP(
      countryCode,
      phoneNumber,
      otp
    );

    if (!success || !data) {
      return NextResponse.json(
        { error: otpError || 'Invalid OTP' },
        { status: 400 }
      );
    }

    const { user, tokens, device_id, device_secret } = data;

    // 4. Sync ZO profile to existing Supabase user
    const syncResult = await syncZoProfileToSupabase(
      userId,
      tokens.access,
      {
        zo_user_id: user.id,
        zo_pid: user.pid,
        zo_token: tokens.access,
        zo_refresh_token: tokens.refresh,
        zo_token_expiry: tokens.access_expiry,
        zo_refresh_token_expiry: tokens.refresh_expiry,
        device_id,
        device_secret,
      }
    );

    if (!syncResult.success) {
      console.error('Failed to sync ZO profile:', syncResult.error);
      // Continue anyway - can retry sync later
    }

    // 5. Trigger avatar generation (if bodyType provided)
    let avatarTaskId: string | null = null;
    if (bodyType) {
      try {
        const avatarResult = await generateAvatar(
          tokens.access,
          bodyType as 'bro' | 'bae'
        );
        avatarTaskId = avatarResult.task_id;
      } catch (avatarError: any) {
        console.error('Failed to generate avatar:', avatarError);
        // Don't fail the whole request - avatar can be generated later
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        pid: user.pid,
        name: `${user.first_name} ${user.last_name}`.trim(),
        phone: user.mobile_number,
      },
      avatarTaskId,
      message: 'Phone linked successfully',
    });

  } catch (error: any) {
    console.error('Error in /api/zo/auth/link-account:', error);
    return NextResponse.json(
      {
        error: 'Failed to link phone',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

