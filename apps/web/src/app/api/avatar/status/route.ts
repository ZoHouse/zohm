import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/avatar/status?userId=xxx
 * 
 * Polls ZO API to check if avatar generation is complete
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

    if (!userId) {
      return NextResponse.json(
        { status: 'error', message: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    // Get environment variables
    const ZO_API_BASE_URL = process.env.ZO_API_BASE_URL;
    const ZO_CLIENT_KEY = process.env.ZO_CLIENT_KEY_WEB;
    const ZO_DEVICE_ID = process.env.ZO_CLIENT_DEVICE_ID;
    const ZO_DEVICE_SECRET = process.env.ZO_CLIENT_DEVICE_SECRET;

    if (!ZO_API_BASE_URL || !ZO_CLIENT_KEY || !ZO_DEVICE_ID || !ZO_DEVICE_SECRET) {
      console.error('Missing ZO API environment variables');
      return NextResponse.json(
        { status: 'error', message: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Get user's auth token
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { status: 'error', message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const ZO_USER_TOKEN = user.user_metadata?.zo_token || '';

    if (!ZO_USER_TOKEN) {
      return NextResponse.json(
        { status: 'error', message: 'ZO authentication required' },
        { status: 401 }
      );
    }

    // Poll ZO API for profile status
    const zoResponse = await fetch(`${ZO_API_BASE_URL}/api/v1/profile/me/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Platform': 'web',
        'client-key': ZO_CLIENT_KEY,
        'client-device-id': ZO_DEVICE_ID,
        'client-device-secret': ZO_DEVICE_SECRET,
        'Authorization': `Bearer ${ZO_USER_TOKEN}`,
      },
    });

    if (!zoResponse.ok) {
      const errorText = await zoResponse.text();
      console.error('ZO API error:', zoResponse.status, errorText);
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
          profile_synced_at: new Date().toISOString(), // Track sync time
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateError) {
        console.error('Supabase update error:', updateError);
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
    console.error('Avatar status check error:', error);
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
    console.error('Avatar status POST error:', error);
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

