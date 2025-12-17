import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabase } from '@/lib/supabase';
import { devLog } from '@/lib/logger';

// Use admin client if available, otherwise fall back to regular client
const db = supabaseAdmin || supabase;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const body = await request.json();

    devLog.log('📝 [User PATCH] Updating user:', userId, 'with:', Object.keys(body));

    // Update user in Supabase (using admin to bypass RLS)
    const { data, error } = await db
      .from('users')
      .update(body)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      devLog.error('❌ [User PATCH] Error updating user:', error);
      return NextResponse.json(
        { error: 'Failed to update user', details: error.message },
        { status: 500 }
      );
    }

    devLog.log('✅ [User PATCH] User updated successfully:', data?.id);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    devLog.error('❌ [User PATCH] Exception updating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
