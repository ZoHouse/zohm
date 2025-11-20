// apps/web/src/app/api/zo/auth/verify-otp/route.ts
// API route to verify OTP and create/link ZO identity to Supabase user

import { NextRequest, NextResponse } from 'next/server';
import { verifyOTP } from '@/lib/zo-api/auth';
import { syncZoProfileToSupabase } from '@/lib/zo-api/sync';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { countryCode, phoneNumber, otp, userId } = body;

    // Validate input
    if (!countryCode || !phoneNumber || !otp) {
      return NextResponse.json(
        { error: 'Country code, phone number, and OTP are required' },
        { status: 400 }
      );
    }

    // Verify OTP via ZO API
    const result = await verifyOTP(countryCode, phoneNumber, otp);

    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: result.error || 'Invalid OTP' },
        { status: 400 }
      );
    }

    const { user, tokens, device_id, device_secret } = result.data;

    // If userId is provided (linking existing account), sync to that user
    // Otherwise, create new user
    const supabase = await createClient();
    let targetUserId = userId;

    if (!targetUserId) {
      // Create new user with ZO identity
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          zo_user_id: user.id,
          zo_pid: user.pid,
          name: `${user.first_name} ${user.last_name}`.trim(),
          phone: user.mobile_number,
          email: user.email_address,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (createError || !newUser) {
        console.error('Failed to create user:', createError);
        return NextResponse.json(
          { error: 'Failed to create user account' },
          { status: 500 }
        );
      }

      targetUserId = newUser.id;
    }

    // Sync ZO profile to Supabase
    const syncResult = await syncZoProfileToSupabase(
      targetUserId,
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
      // Continue anyway - user is authenticated, sync can retry later
    }

    return NextResponse.json({
      success: true,
      userId: targetUserId,
      user: {
        id: user.id,
        pid: user.pid,
        name: `${user.first_name} ${user.last_name}`.trim(),
        phone: user.mobile_number,
      },
      tokens: {
        access: tokens.access,
        refresh: tokens.refresh,
        accessExpiry: tokens.access_expiry,
        refreshExpiry: tokens.refresh_expiry,
      },
    });

  } catch (error: any) {
    console.error('Error in /api/zo/auth/verify-otp:', error);
    return NextResponse.json(
      { error: 'Failed to verify OTP' },
      { status: 500 }
    );
  }
}

