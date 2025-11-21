// apps/web/src/app/api/zo/auth/verify-otp/route.ts
// API route to verify OTP and create/link ZO identity to Supabase user

import { NextRequest, NextResponse } from 'next/server';
import { verifyOTP } from '@/lib/zo-api/auth';
import { syncZoProfileToSupabase } from '@/lib/zo-api/sync';
import { supabase } from '@/lib/supabase';

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
      console.error('❌ OTP verification failed:', result.error);
      return NextResponse.json(
        { error: result.error || 'Invalid OTP' },
        { status: 400 }
      );
    }

    // Log the response structure for debugging
    console.log('✅ OTP verified, response data:', JSON.stringify(result.data, null, 2));

    // Extract ALL data from ZO API response (actual structure)
    const { 
      user, 
      token,                    // Legacy token
      valid_till,              // Legacy token expiry
      access_token, 
      refresh_token, 
      access_token_expiry, 
      refresh_token_expiry, 
      client_key,              // Client key
      device_id, 
      device_secret,
      device_info,             // Device info object
    } = result.data;

    // Validate response structure
    if (!user || !access_token || !refresh_token || !device_id || !device_secret) {
      console.error('❌ Invalid response structure:', {
        hasUser: !!user,
        hasAccessToken: !!access_token,
        hasRefreshToken: !!refresh_token,
        hasDeviceId: !!device_id,
        hasDeviceSecret: !!device_secret,
        data: result.data,
      });
      return NextResponse.json(
        { error: 'Invalid response from authentication service' },
        { status: 500 }
      );
    }

    // Transform to our expected format
    const tokens = {
      access: access_token,
      refresh: refresh_token,
      access_expiry: access_token_expiry,
      refresh_expiry: refresh_token_expiry,
    };

    // IMPORTANT: Device credentials come from OTP verification response
    // These must be saved to database and used for all subsequent API calls

    // If userId is provided (linking existing account), sync to that user
    // Otherwise, check if user exists by phone or zo_user_id, or create new user
    let targetUserId = userId;

    if (!targetUserId) {
      // Step 1: Check if user exists by zo_user_id (most reliable)
      const { data: existingByZoId } = await supabase
        .from('users')
        .select('id')
        .eq('zo_user_id', user.id)
        .single();

      if (existingByZoId) {
        targetUserId = existingByZoId.id;
        console.log('✅ Found existing user by zo_user_id:', targetUserId);
      } else {
        // Step 2: Check if user exists by phone number
        const { data: existingByPhone } = await supabase
          .from('users')
          .select('id')
          .eq('phone', user.mobile_number)
          .single();

        if (existingByPhone) {
          targetUserId = existingByPhone.id;
          console.log('✅ Found existing user by phone:', targetUserId);
        } else {
          // Step 3: Create new user with ZO identity
          // For ZO users, use zo_user_id as the primary id
          const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert({
              id: user.id,  // Use zo_user_id as the primary id
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
            // If unique constraint violation (user already exists), try to find them
            if (createError?.code === '23505') {
              console.warn('⚠️ User already exists (unique constraint), trying to find...');
              
              // Try to find by zo_user_id again
              const { data: foundUser } = await supabase
                .from('users')
                .select('id')
                .eq('zo_user_id', user.id)
                .single();

              if (foundUser) {
                targetUserId = foundUser.id;
                console.log('✅ Found user after constraint violation:', targetUserId);
              } else {
                console.error('Failed to create or find user:', createError);
                return NextResponse.json(
                  { error: 'Failed to create user account. Please try again.' },
                  { status: 500 }
                );
              }
            } else {
              console.error('Failed to create user:', createError);
              return NextResponse.json(
                { error: 'Failed to create user account' },
                { status: 500 }
              );
            }
          } else {
            targetUserId = newUser.id;
            console.log('✅ Created new user:', targetUserId);
          }
        }
      }
    }

    // STEP 1: Save device credentials to database FIRST (required for all API calls)
    // This ensures getZoAuthHeaders can fetch them when needed
    const { error: deviceError } = await supabase
      .from('users')
      .update({
        zo_device_id: device_id,
        zo_device_secret: device_secret,
        updated_at: new Date().toISOString(),
      })
      .eq('id', targetUserId);

    if (deviceError) {
      console.error('⚠️ Failed to save device credentials:', deviceError);
      // Continue anyway - we'll use them from the response
    } else {
      console.log('✅ Device credentials saved to database');
    }

    // STEP 2: Save basic ZO auth data to Supabase (fast)
    // Save essential auth data immediately for faster response
    const { error: authUpdateError } = await supabase
      .from('users')
      .update({
        zo_user_id: user.id,
        zo_pid: user.pid,
        zo_token: access_token,
        zo_refresh_token: refresh_token,
        zo_token_expiry: access_token_expiry,
        zo_refresh_token_expiry: refresh_token_expiry,
        zo_legacy_token: token,
        zo_legacy_token_valid_till: valid_till,
        zo_client_key: client_key,
        zo_device_info: device_info || {},
        zo_membership: user.membership,
        name: `${user.first_name} ${user.last_name}`.trim() || user.first_name,
        updated_at: new Date().toISOString(),
      })
      .eq('id', targetUserId);

    if (authUpdateError) {
      console.warn('⚠️ Failed to save ZO auth data:', authUpdateError);
    } else {
      console.log('✅ ZO auth data saved to Supabase');
    }

    // STEP 3: Sync full profile in background (non-blocking)
    // Don't await this - let it happen in background to speed up response
    syncZoProfileToSupabase(
      targetUserId,
      access_token,
      {
        zo_user_id: user.id,
        zo_pid: user.pid,
        zo_token: access_token,
        zo_refresh_token: refresh_token,
        zo_token_expiry: access_token_expiry,
        zo_refresh_token_expiry: refresh_token_expiry,
        device_id,
        device_secret,
        zo_legacy_token: token,
        zo_legacy_token_valid_till: valid_till,
        zo_client_key: client_key,
        zo_device_info: device_info || {},
        zo_membership: user.membership,
      }
    ).then((syncResult) => {
      if (!syncResult.success) {
        console.error('❌ Background profile sync failed:', syncResult.error);
      } else {
        console.log('✅ Background profile sync completed');
      }
    }).catch((err) => {
      console.error('❌ Background profile sync error:', err);
    });

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
        access: access_token,
        refresh: refresh_token,
        accessExpiry: access_token_expiry,
        refreshExpiry: refresh_token_expiry,
      },
    });

  } catch (error: any) {
    console.error('❌ Error in /api/zo/auth/verify-otp:', {
      message: error?.message,
      stack: error?.stack,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
    });
    return NextResponse.json(
      { 
        error: 'Failed to verify OTP',
        details: error?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}

