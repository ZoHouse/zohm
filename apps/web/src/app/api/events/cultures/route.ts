/**
 * GET /api/events/cultures
 * 
 * Returns list of active event cultures for the culture selector.
 * These are used to categorize community events by theme/interest.
 */

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { CulturesResponse, EventCultureConfig } from '@/types/events';
import { devLog } from '@/lib/logger';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('event_cultures')
      .select('*')
      .eq('is_active', true)
      .neq('slug', 'default')  // Exclude 'default' from selector
      .order('sort_order', { ascending: true });

    if (error) {
      devLog.error('Failed to fetch cultures:', error);
      return NextResponse.json(
        { error: 'Failed to fetch cultures' },
        { status: 500 }
      );
    }

    const response: CulturesResponse = {
      cultures: (data || []) as EventCultureConfig[],
    };

    return NextResponse.json(response);
  } catch (error) {
    devLog.error('Error in cultures API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
