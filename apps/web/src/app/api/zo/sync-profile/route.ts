// apps/web/src/app/api/zo/sync-profile/route.ts
// Manual endpoint to sync ZO profile to Supabase (for debugging/testing)

import { NextRequest, NextResponse } from 'next/server';
import { syncZoProfileToSupabase } from '@/lib/zo-api/sync';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { refreshAccessToken } from '@/lib/zo-api/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, accessToken } = body;

    if (!userId || !accessToken) {
      return NextResponse.json(
        { success: false, error: 'userId and accessToken are required' },
        { status: 400 }
      );
    }

    // Check if we have admin access
    if (!supabaseAdmin) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'SUPABASE_SERVICE_ROLE_KEY is not set. Cannot sync profile.' 
        },
        { status: 500 }
      );
    }

    // Get user's ZO tokens from database
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('zo_user_id, zo_pid, zo_token, zo_refresh_token, zo_token_expiry, zo_refresh_token_expiry, zo_device_id, zo_device_secret, zo_membership')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { success: false, error: 'User not found or ZO identity not linked' },
        { status: 404 }
      );
    }

    if (!userData.zo_user_id) {
      return NextResponse.json(
        { success: false, error: 'User does not have ZO identity linked' },
        { status: 400 }
      );
    }

    // Get token to use (prefer database token as it might be more recent)
    let tokenToUse = userData.zo_token || accessToken;
    if (!tokenToUse) {
      return NextResponse.json(
        { success: false, error: 'No ZO access token available' },
        { status: 400 }
      );
    }

    // Check if token is expired and refresh if needed
    const tokenExpiry = userData.zo_token_expiry;
    const isTokenExpired = tokenExpiry && new Date(tokenExpiry) < new Date();
    
    if (isTokenExpired && userData.zo_refresh_token) {
      console.log('🔄 [sync-profile] Token expired, refreshing...');
      const refreshResult = await refreshAccessToken(userData.zo_refresh_token);
      
      if (refreshResult.success && refreshResult.tokens) {
        // Handle actual API response format (access_token, refresh_token, etc.)
        const tokens = refreshResult.tokens as any;
        const newAccessToken = tokens.access_token || tokens.access;
        const newRefreshToken = tokens.refresh_token || tokens.refresh;
        const newAccessExpiry = tokens.access_token_expiry || tokens.access_expiry;
        const newRefreshExpiry = tokens.refresh_token_expiry || tokens.refresh_expiry;
        
        if (newAccessToken) {
          tokenToUse = newAccessToken;
          
          // Update tokens in database
          await supabaseAdmin
            .from('users')
            .update({
              zo_token: newAccessToken,
              zo_refresh_token: newRefreshToken || userData.zo_refresh_token,
              zo_token_expiry: newAccessExpiry || null,
              zo_refresh_token_expiry: newRefreshExpiry || null,
            })
            .eq('id', userId);
          
          console.log('✅ [sync-profile] Token refreshed and updated');
        } else {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Token refresh returned invalid format'
            },
            { status: 500 }
          );
        }
      } else {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Token expired and refresh failed. Please log in again.'
          },
          { status: 401 }
        );
      }
    }

    const syncResult = await syncZoProfileToSupabase(
      userId,
      tokenToUse,
      {
        zo_user_id: userData.zo_user_id,
        zo_pid: userData.zo_pid || '',
        zo_token: userData.zo_token || tokenToUse,
        zo_refresh_token: userData.zo_refresh_token || '',
        zo_token_expiry: userData.zo_token_expiry || '',
        zo_refresh_token_expiry: userData.zo_refresh_token_expiry || '',
        device_id: userData.zo_device_id || '',
        device_secret: userData.zo_device_secret || '',
        zo_membership: userData.zo_membership || '',
      }
    );

    if (!syncResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: syncResult.error || 'Profile sync failed',
          details: 'Check server logs for more information'
        },
        { status: 500 }
      );
    }

    // Verify what was saved
    const { data: updatedUser } = await supabaseAdmin
      .from('users')
      .select('id, name, pfp, zo_synced_at')
      .eq('id', userId)
      .single();

    return NextResponse.json({
      success: true,
      message: 'Profile synced successfully',
      user: {
        id: updatedUser?.id,
        name: updatedUser?.name,
        pfp: updatedUser?.pfp,
        syncedAt: updatedUser?.zo_synced_at,
      },
    });

  } catch (error) {
    console.error('❌ Error in manual profile sync:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

