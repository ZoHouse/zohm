import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { devLog } from '@/lib/logger';

const CITY_SYNC_REWARD = 200; // +200 Zo for syncing home city

export async function POST(request: NextRequest) {
  try {
    const { cityId } = await request.json();

    if (!cityId) {
      return NextResponse.json({ error: 'City ID required' }, { status: 400 });
    }

    // Get user from Privy token (simplified - use actual auth)
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if city exists
    const { data: city, error: cityError } = await supabase
      .from('cities')
      .select('*')
      .eq('id', cityId)
      .single();

    if (cityError || !city) {
      return NextResponse.json({ error: 'City not found' }, { status: 404 });
    }

    // Check if user already synced a city
    const { data: existingRep } = await supabase
      .from('user_reputations')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existingRep?.home_city_id) {
      return NextResponse.json(
        { error: 'City already synced. You can only sync once.' },
        { status: 400 }
      );
    }

    // Update user reputation with home city and award Zo
    const { error: updateError } = await supabase
      .from('user_reputations')
      .upsert({
        user_id: userId,
        home_city_id: cityId,
        zo_points: (existingRep?.zo_points || 0) + CITY_SYNC_REWARD,
        updated_at: new Date().toISOString(),
      });

    if (updateError) throw updateError;

    // Create transaction record
    await supabase.from('zo_transactions').insert({
      user_id: userId,
      amount: CITY_SYNC_REWARD,
      transaction_type: 'city_sync',
      description: `Synced home city: ${city.name}`,
      metadata: { city_id: cityId, city_name: city.name },
    });

    return NextResponse.json({
      success: true,
      city,
      reward: CITY_SYNC_REWARD,
      message: `Successfully synced ${city.name}! +${CITY_SYNC_REWARD} $Zo`,
    });
  } catch (error) {
    devLog.error('Failed to sync city:', error);
    return NextResponse.json(
      { error: 'Failed to sync city' },
      { status: 500 }
    );
  }
}


