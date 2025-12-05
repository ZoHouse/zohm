// apps/web/src/app/api/users/[id]/test-reset/route.ts
// API route for test page to reset user state

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { devLog } from '@/lib/logger';

/**
 * 🧪 TEST-ONLY ENDPOINT
 * 
 * Allows test page to reset user state for testing different flows
 * 
 * Reset Types:
 * - 'new-user': Not implemented (requires logout)
 * - 'cross-app': Sets onboarding_completed = false (simulates user from another ZO app)
 * - 'existing': Sets onboarding_completed = true (simulates returning user)
 */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const body = await request.json();
    const { resetType } = body;

    devLog.log(`🧪 [TEST] Reset request for user ${userId}: ${resetType}`);

    // Validate reset type
    if (!['cross-app', 'existing'].includes(resetType)) {
      return NextResponse.json(
        { error: 'Invalid reset type. Use: cross-app, existing' },
        { status: 400 }
      );
    }

    // Determine onboarding state based on reset type
    const onboardingComplete = resetType === 'existing';

    // Update user profile
    const { data, error } = await supabase
      .from('users')
      .update({
        onboarding_completed: onboardingComplete,
        onboarding_step: null, // Reset step
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select('id, onboarding_completed, onboarding_step')
      .single();

    if (error) {
      devLog.error('❌ [TEST] Failed to reset user:', error);
      return NextResponse.json(
        { error: 'Failed to reset user', details: error.message },
        { status: 500 }
      );
    }

    devLog.log('✅ [TEST] User reset successful:', data);

    return NextResponse.json({
      success: true,
      resetType,
      user: data,
    });

  } catch (error: any) {
    devLog.error('❌ [TEST] Error in test-reset:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

