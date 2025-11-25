import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * POST /api/avatar/generate
 * 
 * Triggers avatar generation via ZO API
 * NOTE: This endpoint is ONLY for new users during onboarding.
 * Credentials must be passed from localStorage (stored after phone login).
 * 
 * Request: { 
 *   userId: string, 
 *   bodyType: 'bro' | 'bae',
 *   accessToken: string (from localStorage),
 *   deviceId: string (from localStorage),
 *   deviceSecret: string (from localStorage)
 * }
 * Response: { success: boolean, message: string, profile?: any }
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, bodyType, accessToken, deviceId, deviceSecret } = await req.json();

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

    if (!ZO_API_BASE_URL || !ZO_CLIENT_KEY) {
      console.error('Missing ZO API environment variables');
      return NextResponse.json(
        { success: false, message: 'Server configuration error' },
        { status: 500 }
      );
    }

    // For new users: Avatar generation happens immediately after login
    // Credentials are in localStorage and passed via request body
    // This is the PRIMARY path for avatar generation
    
    if (!accessToken || !deviceId || !deviceSecret) {
      console.error('❌ Missing credentials in request body. Avatar generation requires credentials from localStorage (new users only).');
      return NextResponse.json(
        { 
          success: false, 
          message: 'Device credentials required. Please ensure you are logged in and try again.' 
        },
        { status: 401 }
      );
    }

    console.log('✅ Using credentials from request body (localStorage - new user)');
    const ZO_USER_TOKEN = accessToken;
    const finalDeviceId = deviceId;
    const finalDeviceSecret = deviceSecret;

    // Call ZO API to trigger avatar generation with user-specific device credentials
    const zoResponse = await fetch(`${ZO_API_BASE_URL}/api/v1/profile/me/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'client-key': ZO_CLIENT_KEY,
        'client-device-id': finalDeviceId,
        'client-device-secret': finalDeviceSecret,
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

