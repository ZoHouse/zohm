import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { devLog } from '@/lib/logger';

/**
 * GET /api/avatar/status?userId=xxx&accessToken=xxx&deviceId=xxx&deviceSecret=xxx
 * 
 * Polls ZO API to check if avatar generation is complete
 * NOTE: This endpoint is ONLY for new users during onboarding.
 * Credentials must be passed from localStorage (stored after phone login).
 * 
 * Response: { 
 *   status: 'pending' | 'ready' | 'error', 
 *   avatarUrl?: string,
 *   profile?: any 
 * }
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const accessToken = searchParams.get('accessToken');
    const deviceId = searchParams.get('deviceId');
    const deviceSecret = searchParams.get('deviceSecret');

    if (!userId) {
      return NextResponse.json(
        { status: 'error', message: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    // Get environment variables - use new ZOHM proxy API
    const ZOHM_API_BASE_URL = process.env.ZOHM_API_BASE_URL || 'https://zohm-api.up.railway.app/api/v1';
    const ZO_CLIENT_KEY = process.env.ZO_CLIENT_KEY_WEB;

    if (!ZO_CLIENT_KEY) {
      devLog.error('Missing ZO_CLIENT_KEY_WEB environment variable');
      return NextResponse.json(
        { status: 'error', message: 'Server configuration error' },
        { status: 500 }
      );
    }

    // For new users: Avatar status polling happens during onboarding
    // Credentials are in localStorage and passed via query params
    // This is the PRIMARY path for avatar status checks

    if (!accessToken || !deviceId || !deviceSecret) {
      devLog.error('❌ Missing credentials in query params. Avatar status check requires credentials from localStorage (new users only).');
      return NextResponse.json(
        {
          status: 'error',
          message: 'Device credentials required. Please ensure you are logged in and try again.'
        },
        { status: 401 }
      );
    }

    devLog.log('✅ Using credentials from query params (localStorage - new user)');
    const ZO_USER_TOKEN = accessToken;
    const finalDeviceId = deviceId;
    const finalDeviceSecret = deviceSecret;

    // Poll ZOHM proxy API for profile status with user-specific device credentials
    devLog.log('🔍 Polling ZOHM proxy API for avatar status:', `${ZOHM_API_BASE_URL}/profile/me`);
    const zoResponse = await fetch(`${ZOHM_API_BASE_URL}/profile/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'client-key': ZO_CLIENT_KEY,
        'client-device-id': finalDeviceId,
        'client-device-secret': finalDeviceSecret,
        'Authorization': `Bearer ${ZO_USER_TOKEN}`,
      },
    });

    if (!zoResponse.ok) {
      const errorText = await zoResponse.text();
      devLog.error('ZO API error:', zoResponse.status, errorText);
      return NextResponse.json(
        {
          status: 'error',
          message: `ZO API error: ${zoResponse.status}`,
          details: errorText
        },
        { status: zoResponse.status }
      );
    }

    const zoProfileData = await zoResponse.json();
    const zoProfile = zoProfileData.data;

    // Check if avatar is ready
    const avatarImage = zoProfile?.avatar?.image;
    const isAvatarReady = avatarImage && avatarImage.trim() !== '' && avatarImage !== 'null';

    if (isAvatarReady) {
      // Avatar is ready! Update Supabase cache
      const { error: updateError } = await supabase
        .from('users')
        .update({
          pfp: avatarImage,                          // Use existing pfp column
          zo_synced_at: new Date().toISOString(),    // Track sync time (correct column)
          zo_sync_status: 'synced',                  // Mark as synced
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateError) {
        devLog.error('Supabase update error:', updateError);
        // Don't fail - just log it
      }

      return NextResponse.json({
        status: 'ready',
        avatarUrl: avatarImage,
        profile: zoProfile,
      });
    } else {
      // Avatar still generating
      return NextResponse.json({
        status: 'pending',
        message: 'Avatar generation in progress',
        profile: zoProfile,
      });
    }

  } catch (error) {
    devLog.error('Avatar status check error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/avatar/status
 * 
 * Alternative method to check status (supports body params)
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { status: 'error', message: 'Missing userId' },
        { status: 400 }
      );
    }

    // Redirect to GET method by constructing URL
    const url = new URL(req.url);
    url.searchParams.set('userId', userId);

    // Create a new request with the modified URL
    const newReq = new NextRequest(url, {
      method: 'GET',
      headers: req.headers,
    });

    return GET(newReq);

  } catch (error) {
    devLog.error('Avatar status POST error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

