// apps/web/src/app/api/users/[id]/location/route.ts
// API route to save user's location to their profile

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { lat, lng } = body;

    // Validate input
    if (!lat || !lng) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      );
    }

    // Validate coordinates
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return NextResponse.json(
        { error: 'Latitude and longitude must be numbers' },
        { status: 400 }
      );
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return NextResponse.json(
        { error: 'Invalid coordinates' },
        { status: 400 }
      );
    }

    console.log(`📍 Saving location for user ${id}:`, { lat, lng });

    // Update user profile with location
    const { data, error } = await supabase
      .from('users')
      .update({
        lat,
        lng,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('id, lat, lng')
      .single();

    if (error) {
      console.error('❌ Failed to save location:', error);
      return NextResponse.json(
        { error: 'Failed to save location', details: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Location saved successfully:', data);

    return NextResponse.json({
      success: true,
      location: { lat: data.lat, lng: data.lng }
    });

  } catch (error: any) {
    console.error('❌ Error in /api/users/[id]/location:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

