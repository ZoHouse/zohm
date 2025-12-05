import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { devLog } from '@/lib/logger';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const body = await request.json();

    // Update user in Supabase
    const { data, error } = await supabase
      .from('users')
      .update(body)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      devLog.error('Error updating user:', error);
      return NextResponse.json(
        { error: 'Failed to update user', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    devLog.error('Exception updating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

