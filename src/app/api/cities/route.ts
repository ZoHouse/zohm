import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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
    console.error('Failed to fetch cities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cities' },
      { status: 500 }
    );
  }
}

