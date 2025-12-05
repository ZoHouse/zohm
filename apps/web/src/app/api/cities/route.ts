import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { devLog } from '@/lib/logger';

export async function GET() {
  try {
    const { data: cities, error } = await supabase
      .from('cities')
      .select('*')
      .order('stage', { ascending: false })
      .order('name');

    if (error) throw error;

    return NextResponse.json({ cities });
  } catch (error) {
    devLog.error('Failed to fetch cities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cities' },
      { status: 500 }
    );
  }
}


