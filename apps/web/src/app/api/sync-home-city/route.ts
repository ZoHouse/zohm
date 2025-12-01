import { NextRequest, NextResponse } from 'next/server';
import { syncUserHomeCity, findOrCreateCity } from '@/lib/cityService';
import { devLog } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      userId, 
      cityName, 
      country, 
      latitude, 
      longitude,
      stateProvince 
    } = body;

    // Validation
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!cityName || !country || !latitude || !longitude) {
      return NextResponse.json(
        { success: false, error: 'City details are required' },
        { status: 400 }
      );
    }

    devLog.log('[Sync Home City] Request:', {
      userId,
      cityName,
      country,
      latitude,
      longitude
    });

    // Step 1: Find or create the city
    const city = await findOrCreateCity(
      cityName,
      country,
      latitude,
      longitude,
      stateProvince
    );

    if (!city) {
      return NextResponse.json(
        { success: false, error: 'Failed to find or create city' },
        { status: 500 }
      );
    }

    devLog.log('[Sync Home City] City:', city.id, city.name);

    // Step 2: Sync user's home city and award points
    const result = await syncUserHomeCity(userId, city.id);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'Failed to sync home city' },
        { status: 500 }
      );
    }

    devLog.log('[Sync Home City] Success! Awarded', result.zoEarned, 'Zo');

    // Step 3: Return success with city data
    return NextResponse.json({
      success: true,
      zoEarned: result.zoEarned,
      city: {
        id: city.id,
        name: city.name,
        country: city.country,
        stage: city.stage,
        population: city.population_total,
        latitude: city.latitude,
        longitude: city.longitude
      },
      message: `Welcome to ${city.name}! You earned ${result.zoEarned} $Zo for syncing your home city.`
    });

  } catch (error) {
    devLog.error('[Sync Home City] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}


