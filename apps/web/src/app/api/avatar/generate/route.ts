import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/avatar/generate
 * 
 * Triggers avatar generation via ZO API
 * Request: { userId: string, bodyType: 'bro' | 'bae' }
 * Response: { success: boolean, message: string, profile?: any }
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, bodyType } = await req.json();

    // Validation
    if (!userId || !bodyType) {
      return NextResponse.json(
        { success: false, message: 'Missing userId or bodyType' },
        { status: 400 }
      );
    }

    if (bodyType !== 'bro' && bodyType !== 'bae') {
      return NextResponse.json(
        { success: false, message: 'Invalid bodyType. Must be "bro" or "bae"' },
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
        { success: false, message: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Get user's auth token from Supabase (or session)
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // TODO: Get actual user token from ZO auth system
    // For now, we'll need to integrate with ZO's authentication
    // This might require storing ZO tokens in Supabase user metadata
    const ZO_USER_TOKEN = user.user_metadata?.zo_token || '';

    if (!ZO_USER_TOKEN) {
      return NextResponse.json(
        { success: false, message: 'ZO authentication required. Please link your ZO account.' },
        { status: 401 }
      );
    }

    // Call ZO API to trigger avatar generation
    const zoResponse = await fetch(`${ZO_API_BASE_URL}/api/v1/profile/me/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Platform': 'web',
        'client-key': ZO_CLIENT_KEY,
        'client-device-id': ZO_DEVICE_ID,
        'client-device-secret': ZO_DEVICE_SECRET,
        'Authorization': `Bearer ${ZO_USER_TOKEN}`,
      },
      body: JSON.stringify({
        body_type: bodyType,
      }),
    });

    if (!zoResponse.ok) {
      const errorText = await zoResponse.text();
      console.error('ZO API error:', zoResponse.status, errorText);
      return NextResponse.json(
        { 
          success: false, 
          message: `ZO API error: ${zoResponse.status}`,
          details: errorText 
        },
        { status: zoResponse.status }
      );
    }

    const zoProfile = await zoResponse.json();

    // Update Supabase with body_type
    const { error: updateError } = await supabase
      .from('users')
      .update({
        body_type: bodyType,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Supabase update error:', updateError);
      // Don't fail the request - ZO API succeeded
    }

    return NextResponse.json({
      success: true,
      message: 'Avatar generation initiated',
      profile: zoProfile.data,
    });

  } catch (error) {
    console.error('Avatar generation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/avatar/generate
 * 
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/avatar/generate',
    method: 'POST',
    description: 'Triggers avatar generation via ZO API',
    requiredFields: ['userId', 'bodyType'],
    bodyTypeValues: ['bro', 'bae'],
  });
}

