// apps/web/src/app/api/users/by-zo-id/[zoUserId]/route.ts
// API route to get user by zo_user_id

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ zoUserId: string }> }
) {
  try {
    const { zoUserId } = await params;
    console.log('🔍 [API /users/by-zo-id] Request for zo_user_id:', zoUserId);

    if (!zoUserId) {
      console.log('❌ [API /users/by-zo-id] No zoUserId provided');
      return NextResponse.json(
        { error: 'ZO user ID is required' },
        { status: 400 }
      );
    }

    // Find user by zo_user_id
    console.log('🔍 [API /users/by-zo-id] Querying database...');
    const { data: user, error } = await supabase
      .from('users')
      .select('id, zo_user_id, zo_pid, name, email, phone, onboarding_completed')
      .eq('zo_user_id', zoUserId)
      .single();

    if (error || !user) {
      console.log('❌ [API /users/by-zo-id] User not found:', error?.code, error?.message);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('✅ [API /users/by-zo-id] User found:', { id: user.id, name: user.name });
    return NextResponse.json(user);
  } catch (error: any) {
    console.error('❌ [API /users/by-zo-id] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

